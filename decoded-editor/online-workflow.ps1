function Get-AccountWire([byte[]]$Bytes){
    if($Bytes.Length -lt 20 -or [BitConverter]::ToUInt32($Bytes,0) -ne 0x46535000){throw 'Invalid original SFO'}
    $keys=[BitConverter]::ToUInt32($Bytes,8);$data=[BitConverter]::ToUInt32($Bytes,12);$count=[BitConverter]::ToUInt32($Bytes,16)
    if($count -gt 1024 -or 20+16*$count -gt $Bytes.Length){throw 'Invalid SFO index'}
    $found=$null
    for($i=0;$i -lt $count;$i++){$at=20+16*$i;$k=$keys+[BitConverter]::ToUInt16($Bytes,$at);$end=$k;while($end -lt $Bytes.Length -and $Bytes[$end] -ne 0){$end++};if($end -ge $data){throw 'Invalid SFO key'};$name=[Text.Encoding]::UTF8.GetString($Bytes,$k,$end-$k);if($name -eq 'ACCOUNT_ID'){$start=$data+[BitConverter]::ToUInt32($Bytes,$at+12);if($found -or [BitConverter]::ToUInt32($Bytes,$at+4) -ne 8 -or $start+8 -gt $Bytes.Length){throw 'Ambiguous account metadata'};$found=[BitConverter]::ToString($Bytes,$start,8).Replace('-','').ToLowerInvariant()}}
    if(-not $found){throw 'Original account metadata missing'};return $found
}
function Read-EntryBytes($Entry,[long]$Maximum){if(-not $Entry -or $Entry.Length -gt $Maximum){throw 'Missing/oversized archive entry'};$source=$Entry.Open();$memory=New-Object IO.MemoryStream;try{$buffer=New-Object byte[] 65536;while(($n=$source.Read($buffer,0,$buffer.Length)) -gt 0){if($memory.Length+$n -gt $Maximum){throw 'Archive entry exceeds limit'};$memory.Write($buffer,0,$n)};return ,$memory.ToArray()}finally{$source.Dispose();$memory.Dispose()}}
function Entry-Hash($Entry){$s=$Entry.Open();$h=[Security.Cryptography.SHA256]::Create();try{return [BitConverter]::ToString($h.ComputeHash($s)).Replace('-','').ToLowerInvariant()}finally{$s.Dispose();$h.Dispose()}}
function Invoke-RemoteStep($Config){
    $info=New-Object Diagnostics.ProcessStartInfo;$info.FileName=$node;$info.Arguments='"'+(Join-Path $PSScriptRoot 'remote-processor.cjs')+'"';$info.UseShellExecute=$false;$info.CreateNoWindow=$true;$info.RedirectStandardInput=$true;$info.RedirectStandardOutput=$true;$info.RedirectStandardError=$true
    $p=New-Object Diagnostics.Process;$p.StartInfo=$info
    try{[void]$p.Start();$stdout=$p.StandardOutput.ReadToEndAsync();$stderr=$p.StandardError.ReadToEndAsync();$p.StandardInput.WriteLine(($Config|ConvertTo-Json -Compress));$p.StandardInput.Close();while(-not $p.HasExited){[Windows.Forms.Application]::DoEvents();Start-Sleep -Milliseconds 100};$text=$stdout.GetAwaiter().GetResult();$errorText=$stderr.GetAwaiter().GetResult();if($p.ExitCode -ne 0){throw 'Online job failed. Check the service/key; no returned file is approved.'};$result=$text|ConvertFrom-Json;if(-not $result.ok){throw 'Online processing was not confirmed'};return $result.output}finally{$p.Dispose()}
}
function Invoke-OnlineVerified([string]$Package,[string]$OutputDirectory,[string]$WorkerKey,[bool]$Consent){
    if(-not $Consent){throw 'Explicit upload consent is required'}
    if($script:entryName -notmatch '^sdimg_SAVEDATA(SARC[0-9]{4})/(SARC[0-9]{4})$' -or $matches[1] -ne $matches[2]){throw 'Online processing requires a complete original single-slot GarlicSaves export'}
    $slot=$matches[1];$prefix='sdimg_SAVEDATA'+$slot+'/'
    $manifest=Get-Content -LiteralPath (Join-Path $OutputDirectory 'manifest.json') -Raw|ConvertFrom-Json
    $archive=[IO.Compression.ZipFile]::OpenRead($Package)
    try{
        if(@($archive.Entries|Where-Object {$_.FullName -match '/SARC[0-9]{4}$'}).Count -ne 1){throw 'For online processing use a single-slot export, not the full multi-save ZIP'}
        if((Entry-Hash $archive.GetEntry($script:entryName)) -ne $manifest.outputHash){throw 'Prepared ZIP does not match the edited output'}
        $sfo=Read-EntryBytes $archive.GetEntry($prefix+'sce_sys/param.sfo') 65536;$accountWire=Get-AccountWire $sfo
        $metadata=@{};foreach($name in @('param.sfo','keystone','icon0.png')){$metadata[$name]=Entry-Hash $archive.GetEntry($prefix+'sce_sys/'+$name)}
    }finally{$archive.Dispose()}
    $status.Text='Uploading your approved copy for online encryption. No console restoration...'
    $encryptedZip=Invoke-RemoteStep @{operation='encrypt';input=$Package;fileName='workspace.zip';workerKey=$WorkerKey;accountIdWireHex=$accountWire;consent=$true}
    $transfer=Join-Path $OutputDirectory ('verified-online-'+[Guid]::NewGuid().ToString('N'));[void][IO.Directory]::CreateDirectory($transfer)
    $raw=Join-Path $transfer ('sdimg_SAVEDATA'+$slot)
    $archive=[IO.Compression.ZipFile]::OpenRead($encryptedZip)
    try{$files=@($archive.Entries|Where-Object {-not $_.FullName.EndsWith('/')});if($files.Count -ne 1){throw 'Expected one encrypted container'};$bytes=Read-EntryBytes $files[0] 134217728;if($bytes.Length -lt 16 -or [BitConverter]::ToUInt64($bytes,0) -ne 2 -or [BitConverter]::ToUInt64($bytes,8) -ne 20130315){throw 'Service did not return a recognized encrypted PS5 image'};[IO.File]::WriteAllBytes($raw,$bytes)}finally{$archive.Dispose()}
    $status.Text='Re-decrypting a copy to verify exact edited data and original account metadata...'
    $decodedZip=Invoke-RemoteStep @{operation='decrypt';input=$raw;fileName=('sdimg_SAVEDATA'+$slot);workerKey=$WorkerKey;consent=$true}
    $archive=[IO.Compression.ZipFile]::OpenRead($decodedZip)
    try{
        if((Entry-Hash $archive.GetEntry($script:entryName)) -ne $manifest.outputHash){throw 'Returned game data differs from the intended decoded edit. DO NOT RESTORE.'}
        foreach($name in $metadata.Keys){if((Entry-Hash $archive.GetEntry($prefix+'sce_sys/'+$name)) -ne $metadata[$name]){throw 'Returned account/support metadata differs. DO NOT RESTORE.'}}
    }finally{$archive.Dispose()}
    $record=@{verified=$true;balances=$manifest.after;containerHash=(Get-FileHash -LiteralPath $raw).Hash.ToLowerInvariant();restorationPerformed=$false;service='GarlicSaves';userConsent=$true}
    $record|ConvertTo-Json -Depth 6|Set-Content -LiteralPath (Join-Path $transfer 'VERIFIED.json') -Encoding UTF8
    return @{Path=$raw;Folder=$transfer;Balances=$manifest.after;Hash=$record.containerHash}
}

function Test-BrowserReturn([string]$ExpectedZip,[string]$ReturnedZip,[string]$OutputDirectory){
    $expected=[IO.Compression.ZipFile]::OpenRead($ExpectedZip);$returned=[IO.Compression.ZipFile]::OpenRead($ReturnedZip)
    try{
        foreach($archive in @($expected,$returned)){
            if($archive.Entries.Count -gt 512){throw 'Too many entries'}
            $names=@{};$total=0L;foreach($e in $archive.Entries){if($names.ContainsKey($e.FullName)){throw 'Duplicate archive path'};$names[$e.FullName]=$true;$total+=$e.Length;if($e.Length -gt 64MB -or $total -gt 128MB){throw 'Archive too large'}}
        }
        $a=@($expected.Entries|Where-Object {-not $_.FullName.EndsWith('/')});$b=@($returned.Entries|Where-Object {-not $_.FullName.EndsWith('/')})
        if($a.Count -ne $b.Count){throw 'Return ZIP entry count differs'}
        foreach($e in $a){$other=$returned.GetEntry($e.FullName);if(-not $other -or $e.Length -ne $other.Length -or (Entry-Hash $e) -ne (Entry-Hash $other)){throw 'Returned content differs from the intended package'}}
        $record=@{decodedReturnMatches=$true;encryptedContainerBindingVerified=$false;restorationPerformed=$false;returnedZipHash=(Get-FileHash -LiteralPath $ReturnedZip).Hash.ToLowerInvariant()}
        $record|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $OutputDirectory 'BROWSER-RETURN-CHECK.json') -Encoding UTF8
        return $record
    }finally{$expected.Dispose();$returned.Dispose()}
}

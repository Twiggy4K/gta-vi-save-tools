function Copy-VerifiedFile([string]$Source,[string]$Target) {
    $before = (Get-FileHash -LiteralPath $Source -Algorithm SHA256).Hash
    if (Test-Path -LiteralPath $Target) { throw 'Destination already exists; refusing to overwrite.' }
    [IO.File]::Copy($Source,$Target,$false)
    if ((Get-FileHash -LiteralPath $Target).Hash -ne $before -or (Get-FileHash -LiteralPath $Source).Hash -ne $before) { throw 'Backup verification failed.' }
}
function Assert-LocalManager([string]$Address) {
    $uri = $null
    if (-not [Uri]::TryCreate($Address,[UriKind]::Absolute,[ref]$uri) -or $uri.Scheme -ne 'http' -or $uri.UserInfo -or $uri.AbsolutePath -ne '/' -or $uri.Query -or $uri.Fragment) { throw 'Use a local HTTP address, for example http://<local-PS5-IP>:8082' }
    $ip = $null
    if (-not [Net.IPAddress]::TryParse($uri.Host,[ref]$ip) -or $ip.AddressFamily -ne [Net.Sockets.AddressFamily]::InterNetwork) { throw 'Use the PS5 local IPv4 address.' }
    $b=$ip.GetAddressBytes()
    if (-not ($b[0] -eq 10 -or ($b[0] -eq 172 -and $b[1] -ge 16 -and $b[1] -le 31) -or ($b[0] -eq 192 -and $b[1] -eq 168))) { throw 'Only private local-network addresses are accepted. No cloud upload is supported.' }
    return $uri.GetLeftPart([UriPartial]::Authority)
}
function Get-ZipHash($Entry) {
    $s=$Entry.Open(); $sha=[Security.Cryptography.SHA256]::Create()
    try { return [BitConverter]::ToString($sha.ComputeHash($s)).Replace('-','').ToLowerInvariant() } finally { $s.Dispose();$sha.Dispose() }
}
function Write-ZipEntry($Entry,[string]$Target,[long]$MaxSize) {
    if (-not $Entry -or $Entry.Length -le 0 -or $Entry.Length -gt $MaxSize) { throw 'Missing or unsupported archive entry.' }
    $s=$Entry.Open();$d=[IO.File]::Open($Target,[IO.FileMode]::CreateNew)
    try {$s.CopyTo($d)} finally {$s.Dispose();$d.Dispose()}
}
function Invoke-ManagerRequest([string]$Url,[string]$Method='GET',[string]$InFile,[string]$OutFile) {
    $params=@{Uri=$Url;Method=$Method;UseBasicParsing=$true;TimeoutSec=120;MaximumRedirection=0;ErrorAction='Stop'}
    if($InFile){$params.InFile=$InFile;$params.ContentType='application/octet-stream'}
    if($OutFile){$params.OutFile=$OutFile}
    return Invoke-WebRequest @params
}
function Invoke-LocalEncryption([string]$OutputFolder,[string]$Address) {
    $base=Assert-LocalManager $Address
    $manifestPath=Join-Path $OutputFolder 'manifest.json'
    $manifest=Get-Content -LiteralPath $manifestPath -Raw|ConvertFrom-Json
    $package=Join-Path $OutputFolder 'SARC0010-local-encrypt-with-original-image.zip'
    $transfer=Join-Path $OutputFolder ('transfer-'+[Guid]::NewGuid().ToString('N'))
    [void][IO.Directory]::CreateDirectory($transfer)
    $expectedHash=(Get-FileHash -LiteralPath (Join-Path $OutputFolder 'SARC0010.test-only.asav')).Hash.ToLowerInvariant()
    if($expectedHash -ne $manifest.outputHashes.asav){throw 'Edited output changed after packaging.'}
    $z=[IO.Compression.ZipFile]::OpenRead($package)
    try{if((Get-ZipHash $z.GetEntry('sdimg_SAVEDATASARC0010/SARC0010')) -ne $expectedHash){throw 'Package does not match edited output.'}}finally{$z.Dispose()}
    $status.Text='Encrypting a temporary copy on your local modded PS5...';[Windows.Forms.Application]::DoEvents()
    # Deliberately omit aid: retain the original account. No import/restore API is called.
    $r=Invoke-ManagerRequest -Url ($base+'/api/encrypt_upload') -Method 'POST' -InFile $package
    $response=$r.Content|ConvertFrom-Json
    if(-not $response.ok -or $response.error){throw ('Local encryption failed: '+$response.error)}
    $name=$response.encrypted_name
    if(-not $name){$name='sdimg_SAVEDATASARC0010'}
    if($name -ne 'sdimg_SAVEDATASARC0010'){throw 'Unexpected encrypted save name; no transfer file prepared.'}
    $encryptedZip=Join-Path $transfer 'encrypted-result.zip'
    [void](Invoke-ManagerRequest -Url ($base+'/api/encrypt_download?name='+[Uri]::EscapeDataString($name)) -OutFile $encryptedZip)
    $raw=Join-Path $transfer 'sdimg_SAVEDATASARC0010'
    $z=[IO.Compression.ZipFile]::OpenRead($encryptedZip)
    try{if($z.Entries.Count -ne 1 -or $z.Entries[0].FullName -ne 'sdimg_SAVEDATASARC0010'){throw 'Unexpected encrypted archive layout.'};Write-ZipEntry $z.Entries[0] $raw 67108864}finally{$z.Dispose()}
    $status.Text='Checking the encrypted result by decrypting a copy...';[Windows.Forms.Application]::DoEvents()
    $r=Invoke-ManagerRequest -Url ($base+'/api/decrypt_upload?name=sdimg_SAVEDATASARC0010') -Method 'POST' -InFile $raw
    $response=$r.Content|ConvertFrom-Json
    if(-not $response.ok -or $response.error){throw ('Round-trip decryption failed: '+$response.error)}
    $decoded=Join-Path $transfer 'roundtrip-decrypted.zip'
    [void](Invoke-ManagerRequest -Url ($base+'/api/download') -OutFile $decoded)
    $z=[IO.Compression.ZipFile]::OpenRead($decoded);$original=[IO.Compression.ZipFile]::OpenRead($script:sourceExportPath)
    try{
        Write-ZipEntry $z.GetEntry('sdimg_SAVEDATASARC0010/SARC0010') (Join-Path $transfer 'recovered.asav') 67108864
        foreach($fileName in @('param.sfo','keystone','icon0.png')){
            $entryName='sdimg_SAVEDATASARC0010/sce_sys/'+$fileName
            if((Get-ZipHash $z.GetEntry($entryName)) -ne (Get-ZipHash $original.GetEntry($entryName))){throw ('Original supporting file changed: '+$fileName)}
        }
    }finally{$z.Dispose();$original.Dispose()}
    $response=& $node (Join-Path $PSScriptRoot 'verify-transfer.cjs') (Join-Path $transfer 'recovered.asav') $manifestPath 2>&1
    $exitCode=$LASTEXITCODE
    try{$verified=($response -join "`n")|ConvertFrom-Json}catch{throw 'Could not validate recovered game file.'}
    if($exitCode -ne 0 -or -not $verified.ok){throw ('Encrypted result not verified: '+$verified.error)}
    $verified|Add-Member -NotePropertyName encryptedContainerHash -NotePropertyValue (Get-FileHash -LiteralPath $raw).Hash.ToLowerInvariant()
    $verified|ConvertTo-Json -Depth 6|Set-Content -LiteralPath (Join-Path $transfer 'VERIFIED.json') -Encoding UTF8
    @('VERIFIED TRANSFER FILE: sdimg_SAVEDATASARC0010 (no extension).','Use GarlicTransfer Library > slot 10 > Replace with another save.','Select the extensionless file, NOT either ZIP.','Verify active Library, Upload and metadata paths use your working profile.','This does not perform restoration or validate gameplay.','Manually load slot 10 rather than autosave, then check spending, saving and reloading.','Keep original backups and cloud recovery copies.')|Set-Content -LiteralPath (Join-Path $transfer 'READ-ME-FIRST.txt')
    return @{Folder=$transfer;Raw=$raw;Balances=$verified.balances}
}

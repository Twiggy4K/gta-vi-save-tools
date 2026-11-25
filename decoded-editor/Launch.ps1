param([switch]$NoShow,[string]$TestInput)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.IO.Compression.FileSystem
[Windows.Forms.Application]::EnableVisualStyles()
$bundled=Join-Path $PSScriptRoot 'runtime\node.exe';$node=if(Test-Path -LiteralPath $bundled){$bundled}else{$null}
if(-not $node){$found=Get-Command node.exe -ErrorAction SilentlyContinue;if($found){$node=$found.Source}}
$local=Join-Path $PSScriptRoot 'runtime.local.json';if(-not $node -and (Test-Path -LiteralPath $local)){$node=(Get-Content -LiteralPath $local -Raw|ConvertFrom-Json).nodePath}
if(-not $node -or -not(Test-Path -LiteralPath $node)){[void][Windows.Forms.MessageBox]::Show('Install Node.js 22 or newer, then reopen. No save was opened.','Node.js required');exit 1}
$nodeVersion=& $node --version 2>$null;if($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^v(\d+)\.' -or [int]$Matches[1] -lt 22){[void][Windows.Forms.MessageBox]::Show('Use the portable Windows download or install Node.js 22 or newer.','Compatible runtime required');exit 1}
$script:inputFile=$null;$script:sourceZip=$null;$script:entryName=$null;$script:zipHash=$null;$script:selection=$null;$script:outputDirectory=$null;$script:outputPackage=$null;$script:verifiedOnline=$null;$script:loading=$false;$script:busy=$false
$form=New-Object Windows.Forms.Form;$form.Text='GTA VI | Experimental Decoded Save Editor';$form.Size=New-Object Drawing.Size(980,710);$form.StartPosition='CenterScreen';$form.FormBorderStyle='FixedDialog';$form.MaximizeBox=$false;$form.Font=New-Object Drawing.Font('Segoe UI',10);$form.BackColor=[Drawing.Color]::FromArgb(17,21,32);$form.ForeColor=[Drawing.Color]::White
function Label-Control([string]$Text,[int]$X,[int]$Y,[int]$W,[int]$H){$c=New-Object Windows.Forms.Label;$c.Text=$Text;$c.SetBounds($X,$Y,$W,$H);$form.Controls.Add($c);return $c}
function Button-Control([string]$Text,[int]$X,[int]$Y,[int]$W){$c=New-Object Windows.Forms.Button;$c.Text=$Text;$c.SetBounds($X,$Y,$W,37);$c.FlatStyle='Flat';$c.BackColor=[Drawing.Color]::FromArgb(73,64,150);$c.ForeColor=[Drawing.Color]::White;$form.Controls.Add($c);return $c}
$title=Label-Control 'DECODED SAVE EDITOR' 25 20 900 38;$title.Font=New-Object Drawing.Font('Segoe UI Semibold',21)
$note=Label-Control 'Local edits, no bundled game inputs. Exported JSAV/ZIP still needs game encoding and PS5 container encryption.' 27 72 910 48
$open=Button-Control '1  Open decoded save / ZIP' 27 128 300
$wallet=New-Object Windows.Forms.ComboBox;$wallet.DropDownStyle='DropDownList';$wallet.SetBounds(350,133,580,30);$wallet.DisplayMember='Label';$form.Controls.Add($wallet)
$original=Label-Control 'Choose an already decoded JSAV file or a decoded SARC export.' 27 182 905 48
$numbers=@{};$i=0
foreach($pair in @(@('cash','Selected wallet cash',20000),@('checking','Shared checking',2000000),@('savings','Shared Family Savings',1000000))){[void](Label-Control $pair[1] 40 (250+48*$i) 250 30);$n=New-Object Windows.Forms.NumericUpDown;$n.Minimum=0;$n.Maximum=$pair[2];$n.ThousandsSeparator=$true;$n.Enabled=$false;$n.SetBounds(320,(245+48*$i),240,32);$n.BackColor=[Drawing.Color]::FromArgb(27,34,49);$n.ForeColor=[Drawing.Color]::White;$form.Controls.Add($n);$numbers[$pair[0]]=$n;[void](Label-Control ('Policy cap: '+('{0:N0}' -f $pair[2])) 595 (250+48*$i) 300 30);$i++}
$policy=Label-Control 'Unknown capacities are not guessed. Ambiguous ownership or mirrors block editing. These rules are experimental.' 27 410 900 42
$build=Button-Control '2  Review + export decoded edit' 27 467 335;$build.Enabled=$false
$folder=Button-Control 'Open output folder' 385 467 240;$folder.Enabled=$false
$online=Button-Control '3  Open GarlicSaves' 648 467 284;$online.Enabled=$false
$copy=Button-Control '4  Check decrypted return ZIP' 27 610 350;$copy.Enabled=$false
$status=Label-Control 'No console is contacted. No file is uploaded automatically. Keep original backups.' 27 532 900 68
function Invoke-Editor([string[]]$Arguments){$response=& $node (Join-Path $PSScriptRoot 'editor.cjs') @Arguments 2>&1;$exitCode=$LASTEXITCODE;try{$r=($response -join "`n")|ConvertFrom-Json}catch{throw 'Editor could not read its response.'};if($exitCode -ne 0 -or -not $r.ok){throw $r.error};return $r}
function Update-Selection {
    if($script:loading -or -not $script:inputFile -or -not $wallet.SelectedItem){return}
    $build.Enabled=$false;$script:selection=$null;$online.Enabled=$false;$copy.Enabled=$false;$script:verifiedOnline=$null
    $r=Invoke-Editor @('inspect','--input',$script:inputFile,'--wallet',$wallet.SelectedItem.Id)
    $original.Text='Original checking '+('{0:N0}' -f $r.balances.checking)+' | savings '+('{0:N0}' -f $r.balances.savings)
    if(-not $r.mappingReady){$status.Text=$r.reason;return}
    $script:selection=$r.selection
    foreach($key in @('cash','checking','savings')){$numbers[$key].Enabled=$true;$numbers[$key].Value=[decimal][Math]::Min([double]$r.balances.$key,[double]$r.limits.$key)}
    $original.Text+=' | selected wallet '+('{0:N0}' -f $r.balances.cash)+' | character code '+$r.selection.characterCode
    $status.Text='Mapping corroborated from this document. Review amounts; protagonist identity is not inferred from inventory order.';$build.Enabled=$true
}
function Open-Decoded([string]$Path){
    $build.Enabled=$false;$folder.Enabled=$false;$online.Enabled=$false;$copy.Enabled=$false;$script:verifiedOnline=$null;$script:outputPackage=$null;$script:inputFile=$null;$script:sourceZip=$null;$script:entryName=$null;$script:outputDirectory=$null
    foreach($n in $numbers.Values){$n.Enabled=$false}
    $dir=Join-Path (Join-Path $PSScriptRoot 'private-inputs') ([Guid]::NewGuid().ToString('N'));[void][IO.Directory]::CreateDirectory($dir)
    if([IO.Path]::GetExtension($Path).ToLowerInvariant() -eq '.zip'){
        $originalHash=(Get-FileHash -LiteralPath $Path).Hash;$script:sourceZip=Join-Path $dir 'original-export.zip';Copy-Item -LiteralPath $Path -Destination $script:sourceZip
        if((Get-FileHash -LiteralPath $script:sourceZip).Hash -ne $originalHash -or (Get-FileHash -LiteralPath $Path).Hash -ne $originalHash){throw 'Archive changed while backing up'}
        $script:zipHash=$originalHash;$archive=[IO.Compression.ZipFile]::OpenRead($script:sourceZip)
        try{
            if($archive.Entries.Count -gt 512){throw 'Too many archive entries'}
            $entries=@($archive.Entries|Where-Object {$_.FullName -match '^(?:[^/]+/)?SARC[0-9]{4}$'})
            if(-not $entries.Count -or $entries.Count -gt 32){throw 'Choose a ZIP containing one or more decoded SARC files'}
            if($entries.Count -eq 1){$entry=$entries[0]}else{
                $pick=New-Object Windows.Forms.Form;$pick.Text='Choose the save slot to edit';$pick.Size=New-Object Drawing.Size(650,220);$list=New-Object Windows.Forms.ComboBox;$list.DropDownStyle='DropDownList';$list.SetBounds(20,20,590,30);foreach($e in $entries){[void]$list.Items.Add($e.FullName)};$list.SelectedIndex=0;$ok=New-Object Windows.Forms.Button;$ok.Text='Choose slot';$ok.SetBounds(20,80,200,35);$ok.DialogResult='OK';$pick.Controls.AddRange(@($list,$ok));if($pick.ShowDialog() -ne 'OK'){throw 'Slot selection cancelled'};$entry=$archive.GetEntry([string]$list.SelectedItem)
            }
            if($entry.Length -gt 8MB){throw 'Decoded slot exceeds 8 MiB limit'}
            $script:entryName=$entry.FullName;$s=$entry.Open();$m=New-Object IO.MemoryStream
            try{$buffer=New-Object byte[] 65536;while(($count=$s.Read($buffer,0,$buffer.Length)) -gt 0){if($m.Length+$count -gt 8MB){throw 'Decoded slot exceeds limit'};$m.Write($buffer,0,$count)};[IO.File]::WriteAllBytes((Join-Path $dir 'source.jsav'),$m.ToArray())}finally{$s.Dispose();$m.Dispose()}
        }finally{$archive.Dispose()}
    }else{if((Get-Item -LiteralPath $Path).Length -gt 8MB){throw 'Decoded input exceeds limit'};Copy-Item -LiteralPath $Path -Destination (Join-Path $dir 'source.jsav')}
    $script:inputFile=Join-Path $dir 'source.jsav';$r=Invoke-Editor @('inspect','--input',$script:inputFile)
    $script:loading=$true;try{$wallet.Items.Clear();foreach($w in $r.wallets){[void]$wallet.Items.Add([pscustomobject]@{Id=$w.id;Label=($w.id+' | current cash '+$w.quantity+' | corroborated character codes: '+($w.characterCandidates -join ', '))})};if($wallet.Items.Count){$chosen=0;for($i=0;$i -lt $r.wallets.Count;$i++){if($r.wallets[$i].id -eq $r.selection.walletId){$chosen=$i}};$wallet.SelectedIndex=$chosen}}finally{$script:loading=$false}
    Update-Selection
}
function New-DecodedZip([string]$OutputDirectory,[string]$EditedFile){
    if(-not $script:sourceZip){return $null}
    if((Get-FileHash -LiteralPath $script:sourceZip).Hash -ne $script:zipHash){throw 'Source archive changed; reopen it'}
    $source=[IO.Compression.ZipFile]::OpenRead($script:sourceZip);$stream=[IO.File]::Open((Join-Path $OutputDirectory 'edited-decoded-save.zip'),[IO.FileMode]::CreateNew);$zip=New-Object IO.Compression.ZipArchive($stream,[IO.Compression.ZipArchiveMode]::Create)
    try{$total=0L;$names=@{};foreach($e in $source.Entries){$name=$e.FullName.Replace('\','/');if($name.StartsWith('/') -or $name.Contains(':') -or ($name -split '/') -contains '..' -or $names.ContainsKey($name)){throw 'Unsafe or duplicate archive path'};$names[$name]=$true;$total+=$e.Length;if($total -gt 128MB -or $e.Length -gt 64MB){throw 'Export archive exceeds packaging limit'};$dest=$zip.CreateEntry($name,[IO.Compression.CompressionLevel]::Optimal).Open();if($e.FullName -eq $script:entryName){$s=[IO.File]::OpenRead($EditedFile)}else{$s=$e.Open()};try{$s.CopyTo($dest)}finally{$s.Dispose();$dest.Dispose()}}}finally{$zip.Dispose();$stream.Dispose();$source.Dispose()}
    return (Join-Path $OutputDirectory 'edited-decoded-save.zip')
}
$wallet.Add_SelectedIndexChanged({try{Update-Selection}catch{$status.Text=$_.Exception.Message}})
$open.Add_Click({$dialog=New-Object Windows.Forms.OpenFileDialog;$dialog.Filter='Decoded saves and ZIP exports|*.zip;*.jsav;SARC*|All files|*.*';if($dialog.ShowDialog() -eq 'OK'){$open.Enabled=$false;try{Open-Decoded $dialog.FileName}catch{$build.Enabled=$false;$status.Text=$_.Exception.Message}finally{$open.Enabled=$true}}})
$build.Add_Click({if(-not $script:selection){return};$preview=(@('cash','checking','savings')|ForEach-Object {$_+': '+('{0:N0}' -f $numbers[$_].Value)}) -join "`n";if([Windows.Forms.MessageBox]::Show("Export a separate decoded edit?`n`n$preview`n`nThe result still requires game encoding and container encryption.",'Review edit','OKCancel','Information') -ne 'OK'){return};$build.Enabled=$false;$open.Enabled=$false;$copy.Enabled=$false;$online.Enabled=$false;$script:verifiedOnline=$null;try{$argsList=@('edit','--input',$script:inputFile,'--wallet',$script:selection.walletId,'--character-code',([string]$script:selection.characterCode));foreach($key in @('cash','checking','savings')){$argsList+=('--'+$key);$argsList+=([int64]$numbers[$key].Value).ToString([Globalization.CultureInfo]::InvariantCulture)};$r=Invoke-Editor $argsList;$script:outputDirectory=$r.outputDirectory;$script:outputPackage=New-DecodedZip $r.outputDirectory $r.outputFile;$folder.Enabled=$true;$online.Enabled=([bool]$script:outputPackage);$status.Text='Decoded edit verified and backed up. '+$(if($script:outputPackage){'ZIP prepared; optional online encryption is available.'}else{'Raw JSAV exported; original metadata is not available.'})+' NOT ready for direct console restoration.'}catch{$status.Text=$_.Exception.Message}finally{$build.Enabled=$true;$open.Enabled=$true}})
$folder.Add_Click({if($script:outputDirectory){Start-Process -FilePath explorer.exe -ArgumentList ('"'+$script:outputDirectory+'"')}})
. (Join-Path $PSScriptRoot 'online-workflow.ps1')
foreach($n in $numbers.Values){$n.Add_ValueChanged({$online.Enabled=$false;$copy.Enabled=$false;$script:verifiedOnline=$null})}
$copy.Add_Click({
    if(-not $script:outputPackage){return}
    $pick=New-Object Windows.Forms.OpenFileDialog;$pick.Filter='Decrypted return ZIP|*.zip'
    if($pick.ShowDialog() -ne 'OK'){return}
    try{
        $result=Test-BrowserReturn $script:outputPackage $pick.FileName $script:outputDirectory
        $status.Text='MATCHED: decrypted return game data and support files equal the intended package. This does not verify which encrypted container was transferred.'
        [Windows.Forms.MessageBox]::Show('Decrypted return matches. Keep the encrypted download paired with this return ZIP. No console restoration has been performed.','Return comparison passed')|Out-Null
    }catch{$status.Text='NOT VERIFIED: '+$_.Exception.Message}
})
$online.Add_Click({
    if(-not $script:outputPackage){return}
    $message="Open GarlicSaves in your browser and sign in there. No API key or PSN password belongs in this editor.

1. Upload edited-decoded-save.zip on the Encrypt page only if the website supports this decoded export. Keep the original account/profile.
2. Download the encrypted result.
3. Decrypt a copy through the website, then use Check decrypted return ZIP here.

The website route has not yet been verified end to end. Do not restore an unchecked result. Uploading on the website shares the save and account metadata with GarlicSaves. Opening this page does not upload anything."
    if([Windows.Forms.MessageBox]::Show($message,'Manual website processing','OKCancel','Information') -ne 'OK'){return}
    Start-Process 'https://garlicsaves.com/encrypt';Start-Process explorer.exe -ArgumentList ('/select,"'+$script:outputPackage+'"');$copy.Enabled=$true
    $status.Text='Website handoff opened. Sign in and upload manually; then compare a decrypted return. Browser encryption compatibility is not yet verified.'
})
$form.Add_FormClosing({param($sender,$eventArgs) if($script:busy){$eventArgs.Cancel=$true;$status.Text='Online processing is active. Please wait for verification or timeout.'}})
if($TestInput){Open-Decoded $TestInput;Write-Output ('Mapping ready: '+$build.Enabled)}
if(-not $NoShow){[void]$form.ShowDialog()}

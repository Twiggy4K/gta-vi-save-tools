param([switch]$NoShow,[string]$SmokeZip,[string]$PreviewPath)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.Windows.Forms.Application]::EnableVisualStyles()
$script:preparedFolder = $null
$script:lastOutput = $null
$script:verifiedTransfer = $null
$script:sourceExportPath = $null
$config = Join-Path $PSScriptRoot 'node-runtime.json'
$node = $null
if (Test-Path -LiteralPath $config) { $node = (Get-Content -LiteralPath $config -Raw | ConvertFrom-Json).nodePath }
if (-not $node -or -not (Test-Path -LiteralPath $node)) { $found = Get-Command node.exe -ErrorAction SilentlyContinue; if ($found) { $node = $found.Source } }
if (-not $node) { throw 'Node runtime missing. Configure node-runtime.json; no saves were changed.' }
$form = New-Object System.Windows.Forms.Form
$form.Text = 'GTA VI | Local Save Workshop'
$form.Size = New-Object System.Drawing.Size(760,475)
$form.StartPosition = 'CenterScreen'
$form.Font = New-Object System.Drawing.Font('Segoe UI',10)
$form.FormBorderStyle = 'FixedDialog'; $form.MaximizeBox = $false
$heading = New-Object System.Windows.Forms.Label
$heading.Text = 'Local test copies only - no console transfer - not yet tested in game'
$heading.SetBounds(20,18,710,25)
$file = New-Object System.Windows.Forms.TextBox
$file.ReadOnly = $true; $file.SetBounds(20,55,545,28)
$open = New-Object System.Windows.Forms.Button
$open.Text = 'Open ZIP...'; $open.SetBounds(580,53,140,32)
$current = New-Object System.Windows.Forms.Label
$current.Text = 'Choose your decrypted GarlicSaves ZIP containing SARC0010 and chives.dat.'
$current.SetBounds(20,100,705,40)
$controls = @{}
$i = 0
foreach ($entry in @(@('cash','Jason cash on hand'),@('checking','Shared checking'),@('savings','Shared Family Savings'))) {
    $label = New-Object System.Windows.Forms.Label
    $label.Text = $entry[1]; $label.SetBounds(20,(153+45*$i),185,28)
    $number = New-Object System.Windows.Forms.NumericUpDown
    $number.Minimum = 0; $number.Maximum = 0; $number.ThousandsSeparator = $true
    $number.Enabled = $false; $number.SetBounds(215,(150+45*$i),175,30)
    $range = New-Object System.Windows.Forms.Label
    $range.Text = ''; $range.SetBounds(410,(153+45*$i),310,28)
    $controls[$entry[0]] = @{Number=$number; Range=$range; Label=$label}
    $form.Controls.AddRange(@($label,$number,$range)); $i++
}
$policy = New-Object System.Windows.Forms.Label
$policy.Text = 'Experimental increases: cash 20,000; shared checking 2,000,000; savings 1,000,000 (editor cap). Added money containers need gameplay testing; progression perks are not edited.'
$policy.SetBounds(20,290,705,45)
$write = New-Object System.Windows.Forms.Button
$write.Text = 'Create test copies'; $write.Enabled = $false; $write.SetBounds(20,345,185,35)
$folder = New-Object System.Windows.Forms.Button
$folder.Text = 'Output folder'; $folder.SetBounds(225,345,145,35)
$status = New-Object System.Windows.Forms.Label
$status.Text = 'The original ZIP is never overwritten.'; $status.SetBounds(20,393,705,40)
$form.Controls.AddRange(@($heading,$file,$open,$current,$policy,$write,$folder,$status))
function Invoke-Engine([string[]]$EditorArgs) {
    $response = & $node (Join-Path $PSScriptRoot 'editor.cjs') @EditorArgs 2>&1
    $code = $LASTEXITCODE
    try { $result = ($response -join "`n") | ConvertFrom-Json } catch { throw 'Local engine could not complete validation. Check the research runtime dependencies.' }
    if ($code -ne 0 -or -not $result.ok) { throw $result.error }
    return $result
}
function New-EditArguments {
    $editArgs = @('edit','--folder',$script:preparedFolder)
    foreach ($key in @('cash','checking','savings')) {
        $editArgs += ('--'+$key)
        $editArgs += ([int64]$controls[$key].Number.Value).ToString([Globalization.CultureInfo]::InvariantCulture)
    }
    return $editArgs
}
function New-LocalEncryptPackage([string]$OutputFolder) {
    $sourcePath = $script:sourceExportPath
    if (-not (Test-Path -LiteralPath $sourcePath)) { throw 'Test files created, but the complete local export is missing. No package created.' }
    $backupPath=Join-Path $script:preparedFolder 'original-local-export.zip'
    if(-not(Test-Path -LiteralPath $backupPath) -or (Get-FileHash -LiteralPath $sourcePath).Hash -ne (Get-FileHash -LiteralPath $backupPath).Hash){throw 'Supporting export changed or was not backed up. Reopen the source save.'}
    $archive = [IO.Compression.ZipFile]::OpenRead($sourcePath)
    try {
        $originalEntry = $archive.GetEntry('sdimg_SAVEDATASARC0010/SARC0010')
        if (-not $originalEntry -or -not $script:preparedFolder) { throw 'Original profile not available for package verification' }
        $sidecar = [IO.File]::ReadAllBytes((Join-Path $script:preparedFolder 'chives.dat'))
        if ($sidecar.Length -le 32) { throw 'Invalid original sidecar' }
        $embedded = New-Object byte[] ($sidecar.Length-32)
        [Array]::Copy($sidecar,32,$embedded,0,$embedded.Length)
        $originalStream = $originalEntry.Open(); $sha = [Security.Cryptography.SHA256]::Create()
        try {
            $localHash = [BitConverter]::ToString($sha.ComputeHash($originalStream))
            $inputHash = [BitConverter]::ToString($sha.ComputeHash($embedded))
            if ($localHash -ne $inputHash) { throw 'Local image export belongs to a different original save. Refusing to package.' }
        } finally { $originalStream.Dispose(); $sha.Dispose() }
    } catch { $archive.Dispose(); throw }
    $target = Join-Path $OutputFolder 'SARC0010-local-encrypt-with-original-image.zip'
    $stream = [IO.File]::Open($target,[IO.FileMode]::CreateNew)
    $zip = New-Object IO.Compression.ZipArchive($stream,[IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($name in @('PS5IMAGE','PS5KEY','PS5PARAM_SIZE','chives.json')) { if (-not $archive.GetEntry($name)) { throw 'Local export is incomplete' } }
        foreach ($entry in $archive.Entries) {
            $new = $zip.CreateEntry($entry.FullName,[IO.Compression.CompressionLevel]::Optimal)
            $dest = $new.Open()
            if ($entry.FullName -eq 'sdimg_SAVEDATASARC0010/SARC0010') { $source = [IO.File]::OpenRead((Join-Path $OutputFolder 'SARC0010.test-only.asav')) } else { $source = $entry.Open() }
            try { $source.CopyTo($dest) } finally { $source.Dispose(); $dest.Dispose() }
        }
    } finally { $zip.Dispose(); $stream.Dispose(); $archive.Dispose() }
    return $target
}
function Open-Archive([string]$zipPath) {
    if(-not $script:sourceExportPath -or -not(Test-Path -LiteralPath $script:sourceExportPath)){throw 'First choose the matching complete local decrypted export, then open your decoded save ZIP.'}
    $script:lastOutput=$null;$script:verifiedTransfer=$null
    if($encrypt){$encrypt.Enabled=$false};if($copyTransfer){$copyTransfer.Enabled=$false}
    $script:preparedFolder = $null; $write.Enabled = $false
    foreach ($c in $controls.Values) { $c.Number.Enabled = $false }
    $archive = [IO.Compression.ZipFile]::OpenRead($zipPath)
    try {
        $games = @($archive.Entries | Where-Object { $_.FullName -match '^[^/]+/SARC0010$' })
        if ($games.Count -ne 1) { throw 'This development build requires one SARC0010 slot in the decrypted ZIP.' }
        $game = $games[0]; $prefix = $game.FullName.Substring(0,$game.FullName.LastIndexOf('/')+1)
        $sidecar = $archive.GetEntry($prefix+'chives.dat')
        if (-not $sidecar) { throw 'The ZIP must include the original chives.dat sidecar.' }
        if ($game.Length -gt 64MB -or $sidecar.Length -gt 64MB) { throw 'Unsupported save size.' }
        $dir = Join-Path (Join-Path $PSScriptRoot 'private-inputs') ([Guid]::NewGuid().ToString('N'))
        [void][IO.Directory]::CreateDirectory($dir)
        Copy-VerifiedFile $zipPath (Join-Path $dir 'original-web-export.zip')
        Copy-VerifiedFile $script:sourceExportPath (Join-Path $dir 'original-local-export.zip')
        foreach ($pair in @(@($game,'SARC0010'),@($sidecar,'chives.dat'))) {
            $source = $pair[0].Open(); $dest = [IO.File]::Open((Join-Path $dir $pair[1]),[IO.FileMode]::CreateNew)
            try { $source.CopyTo($dest) } finally { $source.Dispose(); $dest.Dispose() }
        }
    } finally { $archive.Dispose() }
    $result = Invoke-Engine -EditorArgs @('inspect','--folder',$dir)
    foreach ($key in @('cash','checking','savings')) {
        $controls[$key].Number.Maximum = [decimal]$result.limits.$key
        $controls[$key].Number.Value = [decimal]$result.balances.$key
        $controls[$key].Number.Enabled = $true
        $controls[$key].Range.Text = 'Current test range: 0 - '+('{0:N0}' -f $result.limits.$key)
    }
    $script:preparedFolder = $dir; $file.Text = $zipPath
    foreach($key in @('cash','checking','savings')){$controls[$key].Range.Text='Original: '+('{0:N0}' -f $result.balances.$key)+'  |  Cap: '+('{0:N0}' -f $result.limits.$key)}
    $current.Text = 'SARC0010 | 82 indexed blocks | Original header/trailer and linked balances verified locally'
    $status.Text = 'Ready. Output is an inner ASAV game file plus decoded JSAV; neither is a PS5 save container.'
    $write.Enabled = $true
}
$open.Add_Click({
    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $dialog.Title = 'Open a decrypted GarlicSaves ZIP'; $dialog.Filter = 'Decrypted ZIP|*.zip'
    $dialog.InitialDirectory = [Environment]::GetFolderPath('MyDocuments')
    if ($dialog.ShowDialog() -ne 'OK') { return }
    $open.Enabled = $false; $status.Text = 'Validating original sidecar, inventory, statistics and ledgers...'
    [System.Windows.Forms.Application]::DoEvents()
    try { Open-Archive $dialog.FileName } catch { $script:preparedFolder = $null; $file.Text = ''; $write.Enabled = $false; $status.Text = $_.Exception.Message }
    finally { $open.Enabled = $true }
})
$write.Add_Click({
    if (-not $script:preparedFolder) { return }
    $open.Enabled = $false; $write.Enabled = $false; $status.Text = 'Rebuilding and verifying separate test copies...'
    [System.Windows.Forms.Application]::DoEvents()
    try {
        $preview=(@('cash','checking','savings')|ForEach-Object { $_+': '+('{0:N0}' -f $controls[$_].Number.Value) }) -join "`n"
        if([Windows.Forms.MessageBox]::Show("Build a separate test copy with these balances?`n`n$preview`n`nNo retail save will be restored.",'Review changes','OKCancel','Information') -ne 'OK'){return}
        $argsList = New-EditArguments
        $result = Invoke-Engine -EditorArgs $argsList
        $package = New-LocalEncryptPackage $result.outputFolder
        $script:lastOutput=$result.outputFolder;$script:verifiedTransfer=$null;$encrypt.Enabled=$true;$copyTransfer.Enabled=$false
        $status.Text = 'Package built. Step 3 encrypts locally and checks the downloaded result. No restoration performed.'
        $stage.Text='PACKAGE READY  /  Encryption and return-file verification pending'
    } catch { $status.Text = $_.Exception.Message }
    finally { $open.Enabled = $true; $write.Enabled = $true }
})
$folder.Add_Click({
    $out = if($script:verifiedTransfer){$script:verifiedTransfer.Folder}elseif($script:lastOutput){$script:lastOutput}else{Join-Path $PSScriptRoot 'private-outputs'}; [void][IO.Directory]::CreateDirectory($out)
    Start-Process -FilePath explorer.exe -ArgumentList ('"'+$out+'"')
})
. (Join-Path $PSScriptRoot 'workflow-functions.ps1')

# A single fixed layout keeps every step and its output state visible.
$form.Size=New-Object Drawing.Size(1080,790)
$form.BackColor=[Drawing.Color]::FromArgb(17,21,32)
$form.ForeColor=[Drawing.Color]::FromArgb(231,235,245)
$form.Font=New-Object Drawing.Font('Segoe UI',10)
$heading.Text='LOCAL SAVE WORKSHOP';$heading.SetBounds(28,22,990,36)
$heading.Font=New-Object Drawing.Font('Segoe UI Semibold',21)
$subtitle=New-Object Windows.Forms.Label
$subtitle.Text='GTA VI  /  Slot 10 profile  /  Private processing  /  Deliberate restoration'
$subtitle.SetBounds(30,65,990,25);$subtitle.ForeColor=[Drawing.Color]::FromArgb(155,167,193)
$form.Controls.Add($subtitle)
$stage=New-Object Windows.Forms.Label
$stage.Text='START  /  Open the original decrypted ZIP; verified backups are automatic'
$stage.SetBounds(28,108,1005,34);$stage.BackColor=[Drawing.Color]::FromArgb(32,41,59);$stage.Padding=New-Object Windows.Forms.Padding(10,7,0,0)
$form.Controls.Add($stage)
$file.SetBounds(28,168,800,29);$open.Text='1  Open save ZIP';$open.SetBounds(844,165,190,35)
$current.SetBounds(28,209,1005,44)
$i=0
foreach($key in @('cash','checking','savings')){
    $controls[$key].Label.SetBounds(40,(269+53*$i),230,30)
    $controls[$key].Number.SetBounds(285,(265+53*$i),240,34)
    $controls[$key].Number.Font=New-Object Drawing.Font('Segoe UI Semibold',13)
    $controls[$key].Range.SetBounds(555,(271+53*$i),455,30)
    $i++
}
$policy.SetBounds(28,433,1005,46)
$policy.Text='Shared checking and savings; Jason cash only. Reductions passed the retail save/reload test. Added money containers and larger amounts remain experimental.'
$policy.ForeColor=[Drawing.Color]::FromArgb(208,185,124)
$write.Text='2  Review + build package';$write.SetBounds(28,492,290,42)
$manager=New-Object Windows.Forms.TextBox
$manager.Text='';$manager.SetBounds(345,500,310,30)
$form.Controls.Add($manager)
$encrypt=New-Object Windows.Forms.Button
$encrypt.Text='3  Encrypt locally + verify';$encrypt.Enabled=$false;$encrypt.SetBounds(680,492,354,42)
$form.Controls.Add($encrypt)
$sourceButton=New-Object Windows.Forms.Button
$sourceButton.Text='Choose matching local export';$sourceButton.SetBounds(28,550,290,35)
$sourceLabel=New-Object Windows.Forms.Label
$sourceLabel.Text='Choose a complete local decrypted export before opening the save ZIP';$sourceLabel.SetBounds(345,558,680,30)
$form.Controls.AddRange(@($sourceButton,$sourceLabel))
$folder.Text='Open latest output';$folder.SetBounds(28,610,290,40)
$copyTransfer=New-Object Windows.Forms.Button
$copyTransfer.Text='Copy verified container path';$copyTransfer.Enabled=$false;$copyTransfer.SetBounds(345,610,310,40)
$form.Controls.Add($copyTransfer)
$transferNote=New-Object Windows.Forms.Label
$transferNote.Text='4  GarlicTransfer: replace slot 10 with the verified file (not a ZIP). Confirm working-profile paths before upload.'
$transferNote.SetBounds(680,602,354,65);$form.Controls.Add($transferNote)
$status.SetBounds(28,683,1005,53);$status.BackColor=[Drawing.Color]::FromArgb(32,41,59);$status.Padding=New-Object Windows.Forms.Padding(10,8,10,4)
$status.Text='Original files stay untouched. Each edit has its own backup, manifest and output folder.'
foreach($c in $form.Controls){
    if($c -is [Windows.Forms.Button]){$c.FlatStyle='Flat';$c.FlatAppearance.BorderColor=[Drawing.Color]::FromArgb(79,94,125);$c.BackColor=[Drawing.Color]::FromArgb(38,50,73);$c.ForeColor=[Drawing.Color]::White;$c.UseVisualStyleBackColor=$false}
    elseif($c -is [Windows.Forms.TextBox] -or $c -is [Windows.Forms.NumericUpDown]){$c.BackColor=[Drawing.Color]::FromArgb(27,34,49);$c.ForeColor=[Drawing.Color]::White}
}
foreach($c in @($write,$encrypt)){$c.BackColor=[Drawing.Color]::FromArgb(73,64,150)}
$sourceButton.Add_Click({
    $dialog=New-Object Windows.Forms.OpenFileDialog;$dialog.Filter='Complete local decrypted export|*.zip'
    if($dialog.ShowDialog() -eq 'OK'){$script:sourceExportPath=$dialog.FileName;$sourceLabel.Text='Local export: '+[IO.Path]::GetFileName($dialog.FileName);$script:lastOutput=$null;$encrypt.Enabled=$false;$copyTransfer.Enabled=$false;$script:verifiedTransfer=$null;$status.Text='Supporting export changed. Reopen your save ZIP to back up and validate this source.';$write.Enabled=$false}
})
foreach($key in @('cash','checking','savings')){$controls[$key].Number.Add_ValueChanged({$script:lastOutput=$null;$script:verifiedTransfer=$null;$encrypt.Enabled=$false;$copyTransfer.Enabled=$false;$stage.Text='EDITING  /  Build a new package after changing any amount'})}
$copyTransfer.Add_Click({if($script:verifiedTransfer){try{$record=Get-Content -LiteralPath (Join-Path $script:verifiedTransfer.Folder 'VERIFIED.json') -Raw|ConvertFrom-Json;if((Get-FileHash -LiteralPath $script:verifiedTransfer.Raw).Hash.ToLowerInvariant() -ne $record.encryptedContainerHash){throw 'Transfer file changed since verification. Encrypt and verify again.'};[Windows.Forms.Clipboard]::SetText($script:verifiedTransfer.Raw);$status.Text='Copied the verified extensionless container path. Select that file in GarlicTransfer, not a ZIP.'}catch{$copyTransfer.Enabled=$false;$status.Text=$_.Exception.Message}}})
$encrypt.Add_Click({
    if(-not $script:lastOutput){return}
    $address=$manager.Text.Trim()
    try{[void](Assert-LocalManager $address)}catch{$status.Text=$_.Exception.Message;return}
    if([Windows.Forms.MessageBox]::Show("Send a copy to LOCAL GarlicMgr at $address for encryption and a return-file check?`n`nThis uses temporary files on the modded PS5. It does not restore saves or change your retail PS5.",'Local processing','OKCancel','Information') -ne 'OK'){return}
    $script:verifiedTransfer=$null;$copyTransfer.Enabled=$false
    foreach($c in @($open,$write,$sourceButton,$encrypt,$manager)){$c.Enabled=$false};foreach($c in $controls.Values){$c.Number.Enabled=$false}
    try{
        $script:verifiedTransfer=Invoke-LocalEncryption $script:lastOutput $address
        $copyTransfer.Enabled=$true;$stage.Text='VERIFIED  /  Encrypted container checked; retail restoration has NOT been performed'
        $status.Text='Verified cash '+('{0:N0}' -f $script:verifiedTransfer.Balances.cash)+', checking '+('{0:N0}' -f $script:verifiedTransfer.Balances.checking)+', savings '+('{0:N0}' -f $script:verifiedTransfer.Balances.savings)+'. Copy the verified file path for GarlicTransfer.'
    }catch{$stage.Text='NOT VERIFIED  /  Do not upload this result';$status.Text=$_.Exception.Message}
    finally{foreach($c in @($open,$write,$sourceButton,$encrypt,$manager)){$c.Enabled=$true};foreach($c in $controls.Values){$c.Number.Enabled=$true}}
})
if ($SmokeZip) {
    Open-Archive $SmokeZip
    if ($controls.cash.Number.Value -ne 10000 -or $controls.checking.Number.Value -ne 17860 -or $controls.savings.Number.Value -ne 354800 -or -not $write.Enabled) { throw 'UI balance smoke test failed' }
    Write-Output 'UI loaded cash 10000, checking 17860 and savings 354800; test-copy control enabled.'
}
if($PreviewPath){$form.Show();[Windows.Forms.Application]::DoEvents();$form.PerformLayout();$bitmap=New-Object Drawing.Bitmap($form.Width,$form.Height);try{$form.DrawToBitmap($bitmap,(New-Object Drawing.Rectangle(0,0,$form.Width,$form.Height)));$bitmap.Save($PreviewPath,[Drawing.Imaging.ImageFormat]::Png)}finally{$bitmap.Dispose();$form.Hide()}}
if (-not $NoShow) { [void]$form.ShowDialog() }

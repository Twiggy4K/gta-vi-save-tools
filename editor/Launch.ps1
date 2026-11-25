param([switch]$NoShow)
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()
$editorScript = Join-Path $PSScriptRoot 'editor.cjs'
$runtimeConfig = Join-Path $PSScriptRoot 'node-runtime.json'
function Resolve-EditorNode {
    $candidates = @()
    $command = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue
    if ($command) { $candidates += $command.Source }
    if (Test-Path -LiteralPath $runtimeConfig) {
        try { $candidates += (Get-Content -LiteralPath $runtimeConfig -Raw | ConvertFrom-Json).nodePath } catch { }
    }
    $candidates += @((Join-Path $env:ProgramFiles 'nodejs\node.exe'), (Join-Path $env:LOCALAPPDATA 'Programs\nodejs\node.exe'))
    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path -LiteralPath $candidate -PathType Leaf)) { return $candidate }
    }
    # A runtime package update may retire the saved path. Discovery is optional;
    # some Windows environments do not permit Appx inventory queries.
    try {
        foreach ($package in (Get-AppxPackage -Name '*CodexPrimaryRuntime*' -ErrorAction Stop)) {
            $candidate = Join-Path $package.InstallLocation 'dependencies\node\bin\node.exe'
            if (Test-Path -LiteralPath $candidate -PathType Leaf) { return $candidate }
        }
    } catch { }
    throw 'The editor cannot find its Node runtime. The save has not been read. Update node-runtime.json with an installed node.exe path.'
}
$form = New-Object System.Windows.Forms.Form
$form.Text = 'GTA VI - Local Cash Prototype'
$form.Size = New-Object System.Drawing.Size(660,350)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.Font = New-Object System.Drawing.Font('Segoe UI',10)
$label = New-Object System.Windows.Forms.Label
$label.Text = 'Historical statistic-only prototype | Not recommended for restoration'
$label.SetBounds(22,20,600,25)
$file = New-Object System.Windows.Forms.TextBox
$file.ReadOnly = $true
$file.SetBounds(22,60,470,28)
$open = New-Object System.Windows.Forms.Button
$open.Text = 'Open save...'
$open.SetBounds(505,58,125,31)
$current = New-Object System.Windows.Forms.Label
$current.Text = 'Choose a decrypted-container ASAV story file (SARC000x or memory.dat).'
$current.SetBounds(22,110,605,45)
$cashLabel = New-Object System.Windows.Forms.Label
$cashLabel.Text = 'New cash on hand'
$cashLabel.SetBounds(22,170,175,28)
$cash = New-Object System.Windows.Forms.NumericUpDown
$cash.Minimum = 0
$cash.Maximum = 20000
$cash.ThousandsSeparator = $true
$cash.Enabled = $false
$cash.SetBounds(205,167,130,30)
$write = New-Object System.Windows.Forms.Button
$write.Text = 'Create test copy'
$write.Enabled = $false
$write.SetBounds(365,165,150,33)
$folder = New-Object System.Windows.Forms.Button
$folder.Text = 'Output folder'
$folder.SetBounds(22,223,130,33)
$status = New-Object System.Windows.Forms.Label
$status.Text = 'Bank editing needs additional controlled samples. Originals are never overwritten.'
$status.SetBounds(22,270,605,45)
$form.Controls.AddRange(@($label,$file,$open,$current,$cashLabel,$cash,$write,$folder,$status))
function Invoke-Editor([string[]]$EditorArgs) {
    $nodeExecutable = Resolve-EditorNode
    $response = & $nodeExecutable $editorScript @EditorArgs 2>&1
    if ($LASTEXITCODE -ne 0) { throw 'The file did not pass validation, or the local research dependencies are unavailable.' }
    return (($response -join "`n") | ConvertFrom-Json)
}
$open.Add_Click({
    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $dialog.Title = 'Choose an ASAV story save - not the encrypted console container'
    $dialog.Filter = 'Story saves|SARC*;memory.dat;*.asav|All files|*.*'
    $dialog.InitialDirectory = [Environment]::GetFolderPath('MyDocuments')
    if ($dialog.ShowDialog() -ne 'OK') { return }
    $open.Enabled = $false; $write.Enabled = $false; $cash.Enabled = $false
    $status.Text = 'Checking the save and its integrity trailer...'
    [System.Windows.Forms.Application]::DoEvents()
    try {
        $result = Invoke-Editor -EditorArgs @('inspect','--input',$dialog.FileName)
        $file.Text = $dialog.FileName
        $cash.Value = $result.cash
        $current.Text = "Cash candidate: $($result.cash) | Header and trailer valid | $($result.indexedBlocks) indexed blocks"
        $cash.Enabled = $true; $write.Enabled = $true
        $status.Text = 'Ready to create a separate experimental copy. No console transfer is performed.'
    } catch {
        $file.Text = ''; $current.Text = 'Unable to open this save.'; $status.Text = $_.Exception.Message
    } finally { $open.Enabled = $true }
})
$write.Add_Click({
    $open.Enabled = $false; $write.Enabled = $false
    $status.Text = 'Rebuilding and checking the test copy...'
    [System.Windows.Forms.Application]::DoEvents()
    try {
        $result = Invoke-Editor -EditorArgs @('edit','--input',$file.Text,'--cash',([int]$cash.Value).ToString())
        $status.Text = "Test copy created: $($result.before) -> $($result.after). Original unchanged."
        [System.Windows.Forms.MessageBox]::Show("Created and locally verified a separate test copy.`n`n$($result.outputPath)`n`nThis prototype has not been tested by loading an edited save in the game.",'Test copy ready','OK','Information') | Out-Null
    } catch { $status.Text = $_.Exception.Message }
    finally { $open.Enabled = $true; $write.Enabled = $true }
})
$folder.Add_Click({
    $outputDir = Join-Path $PSScriptRoot 'private-outputs'
    if (-not (Test-Path -LiteralPath $outputDir)) { New-Item -ItemType Directory -Path $outputDir | Out-Null }
    Start-Process -FilePath explorer.exe -ArgumentList ('"' + $outputDir + '"')
})
if (-not $NoShow) { [void]$form.ShowDialog() }

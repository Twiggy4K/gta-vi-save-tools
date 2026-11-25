param([switch]$NoShow,[string]$TestInput)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.IO.Compression.FileSystem
[Windows.Forms.Application]::EnableVisualStyles()
$node=$null;$found=Get-Command node.exe -ErrorAction SilentlyContinue
if($found){$node=$found.Source}
$runtime=Join-Path $PSScriptRoot 'runtime.local.json'
if(-not $node -and (Test-Path -LiteralPath $runtime)){$node=(Get-Content -LiteralPath $runtime -Raw|ConvertFrom-Json).nodePath}
if(-not $node -or -not(Test-Path -LiteralPath $node)){[void][Windows.Forms.MessageBox]::Show('Install Node.js 18 or newer, then reopen this checker. No save was opened.','Runtime required');exit 1}
$script:report=$null
$script:inputPath=$null
$form=New-Object Windows.Forms.Form
$form.Text='GTA VI | Read-only Compatibility Check';$form.Size=New-Object Drawing.Size(930,710);$form.StartPosition='CenterScreen';$form.Font=New-Object Drawing.Font('Segoe UI',10)
$form.BackColor=[Drawing.Color]::FromArgb(17,21,32);$form.ForeColor=[Drawing.Color]::White;$form.FormBorderStyle='FixedDialog';$form.MaximizeBox=$false
$title=New-Object Windows.Forms.Label;$title.Text='PUBLIC TEST  /  READ-ONLY CHECKER';$title.Font=New-Object Drawing.Font('Segoe UI Semibold',19);$title.SetBounds(25,23,870,38)
$note=New-Object Windows.Forms.Label;$note.Text='Checks decoded saves only. No editing, encryption, uploads or console access.';$note.SetBounds(27,75,870,30)
$open=New-Object Windows.Forms.Button;$open.Text='Open decoded save or ZIP';$open.SetBounds(27,122,300,40)
$save=New-Object Windows.Forms.Button;$save.Text='Save shareable report';$save.Enabled=$false;$save.SetBounds(350,122,270,40)
$status=New-Object Windows.Forms.Label;$status.Text='A readable report is not approval to restore an edited save.';$status.SetBounds(27,181,870,45)
$details=New-Object Windows.Forms.TextBox;$details.Multiline=$true;$details.ReadOnly=$true;$details.ScrollBars='Both';$details.WordWrap=$false;$details.Font=New-Object Drawing.Font('Consolas',10);$details.BackColor=[Drawing.Color]::FromArgb(27,34,49);$details.ForeColor=[Drawing.Color]::White;$details.SetBounds(27,240,865,375)
$privacy=New-Object Windows.Forms.Label;$privacy.Text='Reports omit names, paths, account IDs, GUIDs and file contents. They include gameplay balances and structure counts. Review before sharing.';$privacy.SetBounds(27,630,865,44)
$form.Controls.AddRange(@($title,$note,$open,$save,$status,$details,$privacy))
foreach($b in @($open,$save)){$b.FlatStyle='Flat';$b.BackColor=[Drawing.Color]::FromArgb(73,64,150);$b.ForeColor=[Drawing.Color]::White}
function Read-Report([string]$File){
    $response=& $node (Join-Path $PSScriptRoot 'checker.cjs') $File 2>&1
    try{return ($response -join "`n")|ConvertFrom-Json}catch{throw 'Checker could not complete. No save was changed.'}
}
function Inspect-Input([string]$Path){
    $script:report=$null;$script:inputPath=[IO.Path]::GetFullPath($Path);$save.Enabled=$false;$results=New-Object Collections.Generic.List[object]
    if([IO.Path]::GetExtension($Path).ToLowerInvariant() -eq '.zip'){
        $archive=[IO.Compression.ZipFile]::OpenRead($Path)
        try{
            if($archive.Entries.Count -gt 512){throw 'Archive has too many entries. Export one game save set.'}
            $entries=@($archive.Entries|Where-Object {$_.FullName -match '^(?:[^/]+/)?(?:SARC[0-9]{4}|memory\.dat)$'})
            if($entries.Count -eq 0){throw 'No decoded SARC or memory.dat entries found. Encrypted containers and ASAV bodies need decoding first.'}
            if($entries.Count -gt 32){throw 'Too many save slots in one test.'}
            $total=0L;foreach($e in $entries){$total+=$e.Length;if($e.Length -gt 8MB -or $total -gt 128MB){throw 'Archive exceeds the public-test size limits.'}}
            $slotNames=@{};foreach($e in $entries){$slot=($e.FullName -split '/')[-1];if($slotNames.ContainsKey($slot)){throw 'Duplicate slot names; select one unambiguous export.'};$slotNames[$slot]=$true
                $temp=Join-Path ([IO.Path]::GetTempPath()) ('gta6-check-'+[Guid]::NewGuid().ToString('N')+'.bin')
                try{
                    $source=$e.Open();$dest=[IO.File]::Open($temp,[IO.FileMode]::CreateNew)
                    try{$buffer=New-Object byte[] 65536;$written=0L;while(($read=$source.Read($buffer,0,$buffer.Length)) -gt 0){$written+=$read;if($written -gt 8MB){throw 'Decompressed entry exceeds limit.'};$dest.Write($buffer,0,$read)};if($written -ne $e.Length){throw 'Archive length mismatch.'}}finally{$source.Dispose();$dest.Dispose()}
                    $results.Add(@{slot=$slot;inspection=(Read-Report $temp)})
                }finally{if(Test-Path -LiteralPath $temp){Remove-Item -LiteralPath $temp}}
            }
        }finally{$archive.Dispose()}
    }else{
        if((Get-Item -LiteralPath $Path).Length -gt 8MB){throw 'Input exceeds 8 MiB public-test limit.'}
        $results.Add(@{slot='selected-file';inspection=(Read-Report $Path)})
    }
    $script:report=@{reportType='GTA6-read-only-compatibility';version='0.1.1';restorationApproved=$false;reports=$results.ToArray()}
    $overview=New-Object Collections.Generic.List[string]
    foreach($r in $results){$overview.Add(($r.slot+'  |  '+$r.inspection.status+'  |  '+$r.inspection.format));foreach($a in $r.inspection.accounts){$overview.Add(('  '+$a.kind+': '+$a.balance+' ('+$a.inventory+')'))};foreach($w in $r.inspection.walletCandidates){$overview.Add(('  Unassigned wallet candidate: '+$w.quantity+' ('+$w.inventory+')'))}}
    $details.Text=($overview -join "`r`n")+"`r`n`r`n--- Shareable report preview ---`r`n"+($script:report|ConvertTo-Json -Depth 20)
    $status.Text='Inspection complete. '+$results.Count+' file(s). Read-only discovery only; editing is not approved.'
    $save.Enabled=$true
    return $script:report
}
$open.Add_Click({$dialog=New-Object Windows.Forms.OpenFileDialog;$dialog.Filter='Decoded saves and ZIP exports|*.zip;SARC*;*.jsav;*.dat|All files|*.*';if($dialog.ShowDialog() -ne 'OK'){return};$open.Enabled=$false;$status.Text='Inspecting locally. Nothing is uploaded...';[Windows.Forms.Application]::DoEvents();try{[void](Inspect-Input $dialog.FileName)}catch{$status.Text=$_.Exception.Message;$details.Text='No report created. No source files changed.'}finally{$open.Enabled=$true}})
function Save-ShareableReport([string]$Path){
    if(-not $script:report){throw 'Inspect a save first.'}
    $target=[IO.Path]::GetFullPath($Path)
    if([string]::Equals($target,$script:inputPath,[StringComparison]::OrdinalIgnoreCase)){throw 'Choose a different report filename. The input save will not be overwritten.'}
    if(Test-Path -LiteralPath $target){throw 'Report destination already exists. Choose a new filename.'}
    $stream=[IO.File]::Open($target,[IO.FileMode]::CreateNew)
    $writer=New-Object IO.StreamWriter($stream,(New-Object Text.UTF8Encoding($false)))
    try{$writer.Write(($script:report|ConvertTo-Json -Depth 20))}finally{$writer.Dispose();$stream.Dispose()}
}
$save.Add_Click({if(-not $script:report){return};$dialog=New-Object Windows.Forms.SaveFileDialog;$dialog.Filter='Shareable JSON report|*.json';$dialog.FileName='GTA6-compatibility-report.json';if($dialog.ShowDialog() -eq 'OK'){try{Save-ShareableReport $dialog.FileName;$status.Text='Report saved. Review the gameplay balances before sharing.'}catch{$status.Text=$_.Exception.Message}}})
if($TestInput){[void](Inspect-Input $TestInput);Write-Output ('Inspected '+$script:report.reports.Count+' file(s).')}
if(-not $NoShow){[void]$form.ShowDialog()}

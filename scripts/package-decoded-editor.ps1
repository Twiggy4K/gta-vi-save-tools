param([Parameter(Mandatory=$true)][string]$OutputDirectory)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root=Split-Path $PSScriptRoot -Parent;$out=[IO.Path]::GetFullPath($OutputDirectory)
if($out.StartsWith($root.TrimEnd('\')+'\',[StringComparison]::OrdinalIgnoreCase) -or $out -eq $root){throw 'Artifacts must be outside the source tree'}
[void][IO.Directory]::CreateDirectory($out)
$target=Join-Path $out 'GTA6-Decoded-Editor-0.3.0-alpha.1-Windows.zip'
$stream=[IO.File]::Open($target,[IO.FileMode]::CreateNew);$zip=New-Object IO.Compression.ZipArchive($stream,[IO.Compression.ZipArchiveMode]::Create)
try{
    $files=@('LICENSE','CREDITS.md','THIRD-PARTY-NOTICES.md','SECURITY.md','checker/inventory-model.cjs','research/jsav-document.cjs','research/lz4-encode.cjs','header/header-codec.cjs','workshop/inventory-profile.cjs','workshop/money-core.cjs','workshop/expand-inventory.cjs','workshop/hash.cjs')
    $files+=Get-ChildItem -LiteralPath (Join-Path $root 'decoded-editor') -File|Where-Object {$_.Extension -in @('.ps1','.cmd','.cjs','.md')}|ForEach-Object {'decoded-editor/'+$_.Name}
    $files+=Get-ChildItem -LiteralPath (Join-Path $root 'docs') -File -Filter '*.md'|ForEach-Object {'docs/'+$_.Name}
    foreach($name in $files){$entry=$zip.CreateEntry($name,[IO.Compression.CompressionLevel]::Optimal);$source=[IO.File]::OpenRead((Join-Path $root $name));$dest=$entry.Open();try{$source.CopyTo($dest)}finally{$source.Dispose();$dest.Dispose()}}
    foreach($extra in @(@('Start-Editor.cmd',"@echo off`r`ncall `"%~dp0decoded-editor\Start-Editor.cmd`"`r`n"),@('README.txt',@'
GTA VI DECODED SAVE EDITOR — EXPERIMENTAL 0.3.0-alpha.1

Extract All, install Node.js 22+, then open Start-Editor.cmd.
Open your OWN already decoded JSAV or decoded SARC export ZIP.
Review wallet selection and balances, then export a separate decoded edit.

Caps: cash 20,000; checking 2M; Family Savings 1M.
No personal original balance, fixed inventory position or maintainer save is needed.
Unsupported/ambiguous layouts refuse editing. Not every save is supported.

IMPORTANT: OUTPUT IS NOT READY TO RESTORE.
Game encoding and PS5 container encryption are separate. Optional online encryption needs consent and your own service key. A live
encrypt/decrypt comparison passed; no new restoration test was performed.
No private codec inputs, game files, saves or keys are bundled or downloaded.
No automatic upload or console restoration occurs.

Read docs/DECODED-EDITOR-GUIDE.md before using output files.
MIT license and credits are included. Keep original backups untouched.
'@))){$dest=$zip.CreateEntry($extra[0]).Open();$writer=New-Object IO.StreamWriter($dest,(New-Object Text.UTF8Encoding($false)));try{$writer.Write($extra[1])}finally{$writer.Dispose()}}
}finally{$zip.Dispose();$stream.Dispose()}
$digest=(Get-FileHash -LiteralPath $target).Hash.ToLowerInvariant();[IO.File]::WriteAllText((Join-Path $out 'SHA256SUMS.txt'),($digest+'  '+[IO.Path]::GetFileName($target)+"`n"),(New-Object Text.UTF8Encoding($false)))
Write-Output $target

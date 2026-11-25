param([Parameter(Mandatory=$true)][string]$OutputDirectory,[string]$NodeDirectory)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root=Split-Path $PSScriptRoot -Parent;$out=[IO.Path]::GetFullPath($OutputDirectory)
if($out.StartsWith($root.TrimEnd('\')+'\',[StringComparison]::OrdinalIgnoreCase) -or $out -eq $root){throw 'Artifacts must be outside the source tree'}
[void][IO.Directory]::CreateDirectory($out)
$portable=-not [string]::IsNullOrWhiteSpace($NodeDirectory)
if($portable){foreach($required in @('node.exe','LICENSE')){if(-not(Test-Path -LiteralPath (Join-Path $NodeDirectory $required))){throw 'Official Node directory must contain node.exe and LICENSE'}}}
$name=if($portable){'GTA6-Decoded-Editor-0.3.3-alpha.1-Windows-x64-Portable.zip'}else{'GTA6-Decoded-Editor-0.3.3-alpha.1-Windows-Source.zip'}
$target=Join-Path $out $name
$stream=[IO.File]::Open($target,[IO.FileMode]::CreateNew);$zip=New-Object IO.Compression.ZipArchive($stream,[IO.Compression.ZipArchiveMode]::Create)
try{
    $files=@('LICENSE','CREDITS.md','THIRD-PARTY-NOTICES.md','SECURITY.md','checker/inventory-model.cjs','research/jsav-document.cjs','research/lz4-encode.cjs','header/header-codec.cjs','workshop/inventory-profile.cjs','workshop/money-core.cjs','workshop/expand-inventory.cjs','workshop/hash.cjs')
    $files+=Get-ChildItem -LiteralPath (Join-Path $root 'decoded-editor') -File|Where-Object {$_.Extension -in @('.ps1','.cmd','.cjs','.md')}|ForEach-Object {'decoded-editor/'+$_.Name}
    $files+=Get-ChildItem -LiteralPath (Join-Path $root 'docs') -File -Filter '*.md'|ForEach-Object {'docs/'+$_.Name}
    foreach($name in $files){$entry=$zip.CreateEntry($name,[IO.Compression.CompressionLevel]::Optimal);$source=[IO.File]::OpenRead((Join-Path $root $name));$dest=$entry.Open();try{$source.CopyTo($dest)}finally{$source.Dispose();$dest.Dispose()}}
    if($portable){foreach($pair in @(@('node.exe','decoded-editor/runtime/node.exe'),@('LICENSE','decoded-editor/runtime/LICENSE'))){[IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,(Join-Path $NodeDirectory $pair[0]),$pair[1],[IO.Compression.CompressionLevel]::Optimal)|Out-Null}}
    foreach($extra in @(@('Start-Editor.cmd',"@echo off`r`ncall `"%~dp0decoded-editor\Start-Editor.cmd`"`r`n"),@('README.txt',@'
GTA VI DECODED SAVE EDITOR — EXPERIMENTAL 0.3.3-alpha.1

Extract All, then open Start-Editor.cmd.
The Windows-x64-Portable download includes Node.js; no separate install needed.
The Source download requires Node.js 22+ already installed.
Open your OWN already decoded JSAV or decoded SARC export ZIP.
Review wallet selection and balances, then export a separate decoded edit.

Caps: cash 20,000; checking 2M; Family Savings 1M.
No personal original balance, fixed inventory position or maintainer save is needed.
Unsupported/ambiguous layouts refuse editing. Not every save is supported.

IMPORTANT: OUTPUT IS NOT READY TO RESTORE.
Game encoding and PS5 container encryption are separate. Browser sign-in and upload are manual; no worker key is required by the editor.
Website compatibility is not yet verified; no new restoration test was performed.
No private codec inputs, game files, saves or keys are bundled or downloaded.
No automatic upload or console restoration occurs.

Read docs/DECODED-EDITOR-GUIDE.md before using output files.
MIT license and credits are included. Keep original backups untouched.
'@))){$dest=$zip.CreateEntry($extra[0]).Open();$writer=New-Object IO.StreamWriter($dest,(New-Object Text.UTF8Encoding($false)));try{$writer.Write($extra[1])}finally{$writer.Dispose()}}
}finally{$zip.Dispose();$stream.Dispose()}
$digest=(Get-FileHash -LiteralPath $target).Hash.ToLowerInvariant();[IO.File]::WriteAllText((Join-Path $out 'SHA256SUMS.txt'),($digest+'  '+[IO.Path]::GetFileName($target)+"`n"),(New-Object Text.UTF8Encoding($false)))
Write-Output $target

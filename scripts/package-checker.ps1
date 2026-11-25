param([Parameter(Mandatory=$true)][string]$OutputDirectory)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root=Split-Path $PSScriptRoot -Parent
$out=[IO.Path]::GetFullPath($OutputDirectory)
if($out.StartsWith($root.TrimEnd('\')+'\',[StringComparison]::OrdinalIgnoreCase) -or $out -eq $root){throw 'Build artifacts must be outside the source tree.'}
[void][IO.Directory]::CreateDirectory($out)
$target=Join-Path $out 'GTA6-ReadOnly-Checker-0.1.1-Windows.zip'
$file=[IO.File]::Open($target,[IO.FileMode]::CreateNew)
$zip=New-Object IO.Compression.ZipArchive($file,[IO.Compression.ZipArchiveMode]::Create)
try{
    $files=@('LICENSE','CREDITS.md','THIRD-PARTY-NOTICES.md','SECURITY.md')
    $files+=@('Launch.ps1','Start-Checker.cmd','checker.cjs','jsav-document.cjs','inventory-model.cjs','README.md','check-tests.cjs')|ForEach-Object {'checker/'+$_}
    $files+=Get-ChildItem -LiteralPath (Join-Path $root 'docs') -File -Filter '*.md'|ForEach-Object {'docs/'+$_.Name}
    foreach($relative in $files){$entry=$zip.CreateEntry($relative,[IO.Compression.CompressionLevel]::Optimal);$source=[IO.File]::OpenRead((Join-Path $root $relative));$dest=$entry.Open();try{$source.CopyTo($dest)}finally{$source.Dispose();$dest.Dispose()}}
    $entry=$zip.CreateEntry('Start-Checker.cmd');$dest=$entry.Open();$writer=New-Object IO.StreamWriter($dest,(New-Object Text.UTF8Encoding($false)));try{$writer.Write("@echo off`r`ncall `"%~dp0checker\Start-Checker.cmd`"`r`n")}finally{$writer.Dispose()}
    $entry=$zip.CreateEntry('README.txt');$dest=$entry.Open();$writer=New-Object IO.StreamWriter($dest,(New-Object Text.UTF8Encoding($false)));try{$writer.Write(@'
GTA VI READ-ONLY CHECKER 0.1.1 — PUBLIC PRERELEASE

1. Use Windows Extract All on this ZIP. Keep every file together.
2. Install Node.js 22 or newer from https://nodejs.org/ if needed.
3. Open Start-Checker.cmd at the top of this extracted folder.
4. Choose an already decoded JSAV save or supported decrypted ZIP.
5. Review and save the shareable report. It includes gameplay balances.

This tool cannot decrypt protected ASAV bodies or PS5 containers. It does not
edit, upload or restore saves. Inspectable does not mean safe to edit.
No game files, saves, keys or Node.js runtime are bundled. No npm packages needed.

Full instructions: docs/USER-GUIDE.md, Part A.
MIT license: LICENSE. Credits: CREDITS.md.
Source and experimental editor limitations:
https://github.com/Twiggy4K/gta-vi-save-tools
'@)}finally{$writer.Dispose()}
}finally{$zip.Dispose();$file.Dispose()}
$hash=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant()
[IO.File]::WriteAllText((Join-Path $out 'SHA256SUMS.txt'),($hash+'  '+[IO.Path]::GetFileName($target)+"`n"),(New-Object Text.UTF8Encoding($false)))
Write-Output $target

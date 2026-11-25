param([switch]$WithoutNodeOnPath, [string]$InputFile, [int]$ExpectedCash = 338)
$ErrorActionPreference = 'Stop'
$originalPath = $env:Path
if ($WithoutNodeOnPath) { $env:Path = "$env:SystemRoot\System32;$env:SystemRoot\System32\WindowsPowerShell\v1.0" }
try {
    . (Join-Path $PSScriptRoot 'Launch.ps1') -NoShow
    if ($form.Controls.Count -ne 9 -or $write.Enabled -or $cash.Enabled) { throw 'Unexpected initial control state' }
    $testInput = if ($InputFile) { $InputFile } else { Join-Path $PSScriptRoot '..\private-fixtures\payloads\SARC0001' }
    $result = Invoke-Editor -EditorArgs @('inspect','--input',$testInput)
    if (-not $result.ok -or $result.cash -ne $ExpectedCash -or -not $result.trailerValid) { throw 'UI engine bridge failed' }
    Write-Output 'Hidden Windows form initialized; engine bridge verified; no window displayed.'
} finally { if ($form) { $form.Dispose() }; $env:Path = $originalPath }

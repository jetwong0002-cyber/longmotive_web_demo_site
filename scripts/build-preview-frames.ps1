param(
    [string]$SourceDirectory = (Join-Path $PSScriptRoot '..\assets\frames'),

    [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\assets\frames-preview'),

    [ValidateRange(160, 3840)]
    [int]$Width = 1920,

    [ValidateRange(2, 31)]
    [int]$Quality = 5,

    [ValidateRange(1, 9999)]
    [int]$ExpectedFrameCount = 136
)

$ErrorActionPreference = 'Stop'

foreach ($command in @('ffmpeg', 'ffprobe')) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
        throw "$command is required but was not found on PATH."
    }
}

$resolvedSource = [IO.Path]::GetFullPath($SourceDirectory)
if (-not (Test-Path -LiteralPath $resolvedSource -PathType Container)) {
    throw "SourceDirectory does not exist: $resolvedSource"
}

$sourceFrames = @(Get-ChildItem -LiteralPath $resolvedSource -Filter 'frame-*.jpg' -File | Sort-Object Name)
if ($sourceFrames.Count -ne $ExpectedFrameCount) {
    throw "Expected $ExpectedFrameCount source frames, found $($sourceFrames.Count)."
}
for ($index = 1; $index -le $ExpectedFrameCount; $index += 1) {
    $expectedName = 'frame-{0:D4}.jpg' -f $index
    if ($sourceFrames[$index - 1].Name -ne $expectedName) {
        throw "Source sequence has a gap: expected $expectedName, found $($sourceFrames[$index - 1].Name)."
    }
}

$resolvedOutput = [IO.Path]::GetFullPath($OutputDirectory)
if ($resolvedOutput -eq [IO.Path]::GetPathRoot($resolvedOutput)) {
    throw 'OutputDirectory cannot be a drive root.'
}
New-Item -ItemType Directory -Force -Path $resolvedOutput | Out-Null
Get-ChildItem -LiteralPath $resolvedOutput -Filter 'frame-*.jpg' -File -ErrorAction SilentlyContinue |
    ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }

$inputPattern = Join-Path $resolvedSource 'frame-%04d.jpg'
$outputPattern = Join-Path $resolvedOutput 'frame-%04d.jpg'
& ffmpeg -hide_banner -loglevel error -y `
    -start_number 1 -i $inputPattern `
    -vf "scale=${Width}:-2:flags=lanczos" `
    -q:v $Quality -qmin $Quality -qmax $Quality `
    -start_number 1 $outputPattern
if ($LASTEXITCODE -ne 0) {
    throw "Preview generation failed with exit code $LASTEXITCODE."
}

$previewFrames = @(Get-ChildItem -LiteralPath $resolvedOutput -Filter 'frame-*.jpg' -File | Sort-Object Name)
if ($previewFrames.Count -ne $ExpectedFrameCount) {
    throw "Expected $ExpectedFrameCount preview frames, found $($previewFrames.Count)."
}

$dimensions = (& ffprobe -v error -select_streams v:0 `
    -show_entries stream=width,height -of 'csv=s=x:p=0' $previewFrames[0].FullName).Trim()
if ($LASTEXITCODE -ne 0 -or -not $dimensions.StartsWith("${Width}x")) {
    throw "Preview dimensions are $dimensions; expected width $Width."
}

$totalBytes = ($previewFrames | Measure-Object -Property Length -Sum).Sum
$totalMiB = [Math]::Round($totalBytes / 1MB, 2)
Write-Host "Generated $($previewFrames.Count) preview JPEGs at $dimensions ($totalMiB MiB total)."

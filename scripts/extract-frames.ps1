param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\assets\frames'),

    [ValidateRange(1, 9999)]
    [int]$ExpectedFrameCount = 136
)

$ErrorActionPreference = 'Stop'

foreach ($command in @('ffmpeg', 'ffprobe')) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
        throw "$command is required but was not found on PATH."
    }
}

$resolvedSource = [IO.Path]::GetFullPath($Source)
if (-not (Test-Path -LiteralPath $resolvedSource -PathType Leaf)) {
    throw "Source video does not exist: $resolvedSource"
}

$resolvedOutput = [IO.Path]::GetFullPath($OutputDirectory)
$outputRoot = [IO.Path]::GetPathRoot($resolvedOutput)
if ($resolvedOutput -eq $outputRoot) {
    throw 'OutputDirectory cannot be a drive root.'
}

New-Item -ItemType Directory -Force -Path $resolvedOutput | Out-Null

Get-ChildItem -LiteralPath $resolvedOutput -Filter 'frame-*.jpg' -File -ErrorAction SilentlyContinue |
    ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }

$pattern = Join-Path $resolvedOutput 'frame-%04d.jpg'
& ffmpeg -hide_banner -loglevel error -y `
    -i $resolvedSource `
    -fps_mode passthrough `
    -q:v 2 -qmin 2 -qmax 2 `
    -start_number 1 `
    $pattern

if ($LASTEXITCODE -ne 0) {
    throw "FFmpeg extraction failed with exit code $LASTEXITCODE."
}

$frames = @(Get-ChildItem -LiteralPath $resolvedOutput -Filter 'frame-*.jpg' -File | Sort-Object Name)
if ($frames.Count -ne $ExpectedFrameCount) {
    throw "Expected $ExpectedFrameCount frames, found $($frames.Count)."
}

for ($index = 1; $index -le $ExpectedFrameCount; $index += 1) {
    $expectedName = 'frame-{0:D4}.jpg' -f $index
    if ($frames[$index - 1].Name -ne $expectedName) {
        throw "Frame sequence has a gap: expected $expectedName, found $($frames[$index - 1].Name)."
    }
}

function Get-Dimensions([string]$Path) {
    $value = (& ffprobe -v error -select_streams v:0 `
        -show_entries stream=width,height -of 'csv=s=x:p=0' $Path).Trim()
    if ($LASTEXITCODE -ne 0 -or -not $value) {
        throw "Unable to inspect dimensions for $Path."
    }
    return $value
}

$sourceDimensions = Get-Dimensions $resolvedSource
foreach ($frame in @($frames[0], $frames[-1])) {
    $frameDimensions = Get-Dimensions $frame.FullName
    if ($frameDimensions -ne $sourceDimensions) {
        throw "$($frame.Name) is $frameDimensions; expected native source size $sourceDimensions."
    }
}

$totalBytes = ($frames | Measure-Object -Property Length -Sum).Sum
$totalMiB = [Math]::Round($totalBytes / 1MB, 2)
Write-Host "Extracted $($frames.Count) JPEG frames at $sourceDimensions ($totalMiB MiB total)."

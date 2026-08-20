$ErrorActionPreference = 'Stop'

$tempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$testRoot = Join-Path $tempRoot ("longmotive-frame-test-" + [Guid]::NewGuid().ToString('N'))
$source = Join-Path $testRoot 'source.mp4'
$output = Join-Path $testRoot 'frames'
$script = Join-Path $PSScriptRoot '..\scripts\extract-frames.ps1'

try {
    New-Item -ItemType Directory -Path $testRoot | Out-Null

    & ffmpeg -hide_banner -loglevel error -y `
        -f lavfi -i 'testsrc2=size=320x180:rate=4' `
        -t 1 -pix_fmt yuv420p $source
    if ($LASTEXITCODE -ne 0) {
        throw 'Fixture video generation failed.'
    }

    & $script -Source $source -OutputDirectory $output -ExpectedFrameCount 4
    if ($LASTEXITCODE -ne 0) {
        throw "Extraction script exited with $LASTEXITCODE."
    }

    $frames = @(Get-ChildItem -LiteralPath $output -Filter 'frame-*.jpg' -File | Sort-Object Name)
    if ($frames.Count -ne 4) {
        throw "Expected 4 frames, found $($frames.Count)."
    }

    $expectedNames = @('frame-0001.jpg', 'frame-0002.jpg', 'frame-0003.jpg', 'frame-0004.jpg')
    if ((Compare-Object $expectedNames $frames.Name).Count -ne 0) {
        throw "Frame names were not sequential: $($frames.Name -join ', ')"
    }

    foreach ($frame in @($frames[0], $frames[-1])) {
        $dimensions = (& ffprobe -v error -select_streams v:0 `
            -show_entries stream=width,height -of 'csv=s=x:p=0' $frame.FullName).Trim()
        if ($dimensions -ne '320x180') {
            throw "$($frame.Name) reported $dimensions instead of 320x180."
        }
    }

    Write-Host 'PASS: extraction preserves all frames, naming, and native dimensions.'
}
finally {
    $resolvedTestRoot = [IO.Path]::GetFullPath($testRoot)
    if ($resolvedTestRoot.StartsWith($tempRoot, [StringComparison]::OrdinalIgnoreCase) -and
        $resolvedTestRoot -ne $tempRoot -and
        (Test-Path -LiteralPath $resolvedTestRoot)) {
        Remove-Item -LiteralPath $resolvedTestRoot -Recurse -Force
    }
}

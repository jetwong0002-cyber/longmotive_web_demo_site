$ErrorActionPreference = 'Stop'

$tempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$testRoot = Join-Path $tempRoot ("longmotive-preview-test-" + [Guid]::NewGuid().ToString('N'))
$source = Join-Path $testRoot 'source'
$output = Join-Path $testRoot 'preview'
$script = Join-Path $PSScriptRoot '..\scripts\build-preview-frames.ps1'

try {
    if (-not (Test-Path -LiteralPath $script -PathType Leaf)) {
        throw 'build-preview-frames.ps1 should exist'
    }

    New-Item -ItemType Directory -Path $source | Out-Null
    & ffmpeg -hide_banner -loglevel error -y `
        -f lavfi -i 'testsrc2=size=640x360:rate=4' `
        -t 1 -q:v 2 -start_number 1 (Join-Path $source 'frame-%04d.jpg')
    if ($LASTEXITCODE -ne 0) { throw 'Fixture frame generation failed.' }

    & $script -SourceDirectory $source -OutputDirectory $output -ExpectedFrameCount 4
    if ($LASTEXITCODE -ne 0) { throw "Preview builder exited with $LASTEXITCODE." }

    $frames = @(Get-ChildItem -LiteralPath $output -Filter 'frame-*.jpg' -File | Sort-Object Name)
    if ($frames.Count -ne 4) { throw "Expected 4 preview frames, found $($frames.Count)." }

    $expectedNames = @('frame-0001.jpg', 'frame-0002.jpg', 'frame-0003.jpg', 'frame-0004.jpg')
    if ((Compare-Object $expectedNames $frames.Name).Count -ne 0) {
        throw "Preview names were not sequential: $($frames.Name -join ', ')"
    }

    foreach ($frame in @($frames[0], $frames[-1])) {
        $dimensions = (& ffprobe -v error -select_streams v:0 `
            -show_entries stream=width,height -of 'csv=s=x:p=0' $frame.FullName).Trim()
        if ($dimensions -ne '1920x1080') {
            throw "$($frame.Name) reported $dimensions instead of the 1920x1080 autoplay baseline."
        }
    }

    Write-Host 'PASS: base-frame builder preserves cadence and defaults to a 1920x1080 autoplay baseline.'
}
finally {
    $resolvedTestRoot = [IO.Path]::GetFullPath($testRoot)
    if ($resolvedTestRoot.StartsWith($tempRoot, [StringComparison]::OrdinalIgnoreCase) -and
        $resolvedTestRoot -ne $tempRoot -and
        (Test-Path -LiteralPath $resolvedTestRoot)) {
        Remove-Item -LiteralPath $resolvedTestRoot -Recurse -Force
    }
}

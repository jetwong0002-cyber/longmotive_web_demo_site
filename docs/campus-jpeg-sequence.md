# Campus progressive 1080p JPEG hero

The desktop homepage hero uses two aligned 1920x1080 JPEG sequences extracted from `campus-v2-merged16.mp4`. A web-compressed base sequence provides sharp cold autoplay; master-quality frames are requested around the current position only after the user takes manual control.

## Runtime assets

| Tier | Directory | Resolution | Size | Purpose |
|---|---|---:|---:|---|
| Base | `assets/frames-preview/` | 1920x1080 | 40.17 MiB | First autoplay and rolling buffer |
| Master | `assets/frames/` | 1920x1080 | 70.33 MiB | On-demand quality-2 manual scrubbing |

Both tiers contain `frame-0001.jpg` through `frame-0136.jpg`, preserving the supplied 24 fps edit one-for-one.

## Cold-start behavior

- The existing poster is preloaded and displayed immediately.
- `<head>` warms only the first four 1080p base frames, approximately 1.29 MiB.
- Autoplay begins after 12 consecutive base frames decode, approximately 3.86 MiB.
- Six prioritized workers fill the startup buffer; concurrency drops to three for autoplay while keeping 20 frames ahead and three behind.
- Autoplay eases between 35% and 100% speed based on the contiguous decoded look-ahead buffer, avoiding abrupt buffer stops.
- Master JPEGs remain completely off during autoplay. Wheel, touch, navigation-key, or scrollbar takeover enables one master worker around the current position.
- Completing the base tier never triggers a global master download/decode pass.
- A newly decoded image repaints the canvas only when it changes the visible source frame.
- Failed base frames fall back individually to the corresponding master JPEG.

Mobile, reduced-motion, data-saving, 2G, and 3G paths retain the existing compact video/static fallback and download neither JPEG tier.

## Rebuild assets

FFmpeg and FFprobe must be on `PATH`.

```powershell
./scripts/extract-frames.ps1 `
  -Source 'C:\Users\TUF\Pictures\longmotive\animation\campus-scrub-v2\campus-v2-merged16.mp4'

./scripts/build-preview-frames.ps1
```

The master extraction defaults to 136 JPEGs at source resolution and FFmpeg quality 2. The base builder defaults to 1920px wide, Lanczos scaling, and FFmpeg JPEG quality 5.

## Verify

```powershell
./tests/extract-frames.test.ps1
./tests/build-preview-frames.test.ps1
node ./tests/sequence-priority.test.cjs
node ./tests/adaptive-buffer.test.cjs
node ./tests/repaint-decision.test.cjs
node ./tests/progressive-loader.integration.test.cjs
node ./tests/native-upgrade-deferral.integration.test.cjs
```

The relevant runtime constants are in `index.html`: `SEQ_STARTUP=12`, `SEQ_AHEAD=20`, and `SEQ_BEHIND=3`. The tested scheduler is `sequence-priority.js`.

# Campus progressive JPEG hero

The desktop homepage hero uses two aligned JPEG sequences extracted from `campus-v2-merged16.mp4`. A lightweight sequence provides uninterrupted cold autoplay; native frames are requested around the current position only after the user takes manual control.

## Runtime assets

| Tier | Directory | Resolution | Size | Purpose |
|---|---|---:|---:|---|
| Preview | `assets/frames-preview/` | 960x540 | 14.81 MiB | First autoplay and rolling buffer |
| Native | `assets/frames/` | 1920x1080 | 70.33 MiB | On-demand high-quality manual scrubbing |

Both tiers contain `frame-0001.jpg` through `frame-0136.jpg`, preserving the supplied 24 fps edit one-for-one.

## Cold-start behavior

- The existing poster is preloaded and displayed immediately.
- `<head>` warms only the first four preview frames, approximately 0.46 MiB.
- Autoplay begins after 12 consecutive preview frames decode, approximately 1.38 MiB.
- Six prioritized preview workers keep 20 frames ahead and three behind the current frame.
- Autoplay eases between 35% and 100% speed based on the contiguous decoded look-ahead buffer, avoiding abrupt buffer stops.
- Native JPEGs remain completely off during autoplay. Wheel, touch, navigation-key, or scrollbar takeover enables one native worker around the current position.
- Completing the preview tier never triggers a global native download/decode pass.
- A newly decoded image repaints the canvas only when it changes the visible source frame.
- Failed preview frames fall back individually to the corresponding native JPEG.

Mobile, reduced-motion, data-saving, 2G, and 3G paths retain the existing compact video/static fallback and download neither JPEG tier.

## Rebuild assets

FFmpeg and FFprobe must be on `PATH`.

```powershell
./scripts/extract-frames.ps1 `
  -Source 'C:\Users\TUF\Pictures\longmotive\animation\campus-scrub-v2\campus-v2-merged16.mp4'

./scripts/build-preview-frames.ps1
```

The native extraction defaults to 136 JPEGs at source resolution and FFmpeg quality 2. The preview builder defaults to 960px wide, Lanczos scaling, and FFmpeg JPEG quality 5.

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

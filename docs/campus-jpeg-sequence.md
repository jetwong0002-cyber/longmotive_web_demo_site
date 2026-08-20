# Campus master-quality JPEG hero

The desktop homepage hero autoplays the exact 1920x1080, FFmpeg quality-2 JPEG masters extracted from `campus-v2-merged16.mp4`. The same versioned source serves manual scrubbing, so there is no recompressed first-use tier or redundant quality upgrade.

## Runtime assets

| Tier | Directory | Resolution | Size | Purpose |
|---|---|---:|---:|---|
| Master (active) | `assets/frames/` | 1920x1080 | 70.33 MiB | Autoplay and manual scrubbing |
| Recompressed (inactive) | `assets/frames-preview/` | 1920x1080 | 40.17 MiB | Retained for comparison; never requested by production |

Both stored tiers contain `frame-0001.jpg` through `frame-0136.jpg`, preserving the supplied 24 fps edit one-for-one. Production requests only the master directory.

## Cold-start behavior

- The existing poster is preloaded and displayed immediately.
- `<head>` warms only the first four quality-2 master frames, approximately 2.32 MiB.
- Autoplay begins after 20 consecutive master frames decode, approximately 11.27 MiB.
- Six prioritized workers fill the startup buffer; concurrency drops to two for autoplay while keeping 28 frames ahead and three behind.
- Autoplay eases between 35% and 100% speed based on the contiguous decoded look-ahead buffer, avoiding abrupt buffer stops.
- Every master URL carries `?v=q2-20260820`, bypassing the previous one-year immutable cache entries for 960px files.
- Manual input does not start a second decode tier because autoplay already uses the master source.
- A newly decoded image repaints the canvas only when it changes the visible source frame.
- Failed master requests retry once through the fallback queue.

Mobile, reduced-motion, data-saving, 2G, and 3G paths retain the existing compact video/static fallback and download neither JPEG tier.

## Rebuild assets

FFmpeg and FFprobe must be on `PATH`.

```powershell
./scripts/extract-frames.ps1 `
  -Source 'C:\Users\TUF\Pictures\longmotive\animation\campus-scrub-v2\campus-v2-merged16.mp4'

./scripts/build-preview-frames.ps1
```

The master extraction defaults to 136 JPEGs at source resolution and FFmpeg quality 2. The recompressed builder remains available for experiments but its output is not used by production.

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

The relevant runtime constants are in `index.html`: `SEQ_STARTUP=20`, `SEQ_AHEAD=28`, and `SEQ_BEHIND=3`. The tested scheduler is `sequence-priority.js`.

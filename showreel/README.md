# 2026 — showreel

A 15-second motion piece about the year 2026: 1920×1080, 60 fps, 128 BPM, eight bars with one scene per bar.

The picture and the sound are both generated from code. Nothing was keyframed by hand.

| File | What it does |
| --- | --- |
| `index.html` | The whole animation. Every frame is a pure function of time. Open it in a browser to watch it live, and click to play it with sound. |
| `audio.js` | Synthesizes `soundtrack.wav` (kick, bass, pads, arps, risers, impacts, reverb) on the same beat grid. |
| `render.js` | Drives headless Chromium frame by frame and pipes the frames to ffmpeg to make `showreel-2026.mp4`. |

Rebuild:

```sh
node audio.js
FFMPEG=/path/to/ffmpeg node render.js   # needs playwright
node render.js --stills 2.1 12.9        # PNG stills for checking
```

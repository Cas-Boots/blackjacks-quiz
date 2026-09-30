# Jaaroverzicht 2026: de openingsfilm

A motion piece of almost four minutes that opens the quiz night: 1920×1080, 60 fps, 100 BPM.

1. **A fast intro.** 2025 rolls over to 2026, then 365 days, one lap around the sun and the year in numbers. It takes 12 seconds.
2. **"Het jaar in beeld".** The news told the way a news network does it, as the fictional *BJ Journaal*. Each month opens with a short sting. Every headline gets a full-screen picture, a chyron and a ticker, with a swoosh between shots. The news slides show no figures. Dutch news comes first, then the world.
3. **In memoriam**, a **secret dossier** ("de rest hoor je vanavond") and a countdown into the quiz.

Everything is generated from code. The picture and the soundtrack both read their timing from `reel-data.js`, so they stay in sync.

## No spoilers

The film is meant to be shown **before** the quiz, so it must not answer or hint at any question in `app/src/lib/content/packs.ts`. That is why these subjects are left out:

- the new cabinet and prime minister
- the Winter Games
- the moon flight
- the World Cup
- the Songfestival winner
- the Tour
- Formula 1
- the big films
- the New Year's Eve damage figures
- the January snow

Before adding news, check it against the quiz.

## Pictures: drawn, photo or video

Every headline has a drawn scene (`beeld`). To use real material instead, put the file in `media/` and add `media` to the item in `reel-data.js`.

A **photo** fills the frame with a slow zoom:

```js
media: { foto: 'darts.jpg', bron: 'ANP' }
```

A **video clip** is a folder of numbered frames, so the render stays frame-exact. Make one with ffmpeg:

```sh
ffmpeg -ss 12 -t 7.2 -i clip.mp4 -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30" -q:v 3 media/darts/%04d.jpg
```

Then point the item at it:

```js
media: { video: 'darts', frames: 216, fps: 30, bron: 'NOS' }
```

- `bron` is the credit shown in the corner.
- `x` and `y` (from -1 to 1) shift a photo's crop.
- A missing file falls back to the drawing.

## Files

| File | What it does |
| --- | --- |
| `reel-data.js` | The headlines, the in-memoriam list and the scene order. **Edit this to change the content.** |
| `index.html` | Draws every frame. Open it in a browser to watch it live; click it to play it with sound. |
| `audio.js` | Synthesizes `soundtrack.wav` on the same beat grid. |
| `render.js` | Renders `jaaroverzicht-2026.mp4` in parallel with headless Chromium and ffmpeg. |
| `geo.js` | Outline of the Netherlands and a dot map of the world (Natural Earth, public domain). |
| `fonts/` | Anton, Space Grotesk and JetBrains Mono (SIL Open Font License). |

## October to December

The news is researched up to 30 September 2026. December currently has only tonight's fireworks ban.

Add items with `m: 9`, `10` or `11`. A month appears as soon as it has an item.

- Each month adds 2.4 seconds.
- Each headline adds 7.2 seconds.
- A new headline needs an existing `beeld` or a `media` file.

Then rebuild:

```sh
node audio.js                          # new soundtrack
FFMPEG=/path/to/ffmpeg node render.js  # about 45 minutes on four cores
node render.js --stills 20 42.5        # or check a few frames first
```

The finished video is larger than GitHub's 100 MB limit, so it is not committed. Render it locally.

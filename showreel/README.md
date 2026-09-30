# Jaaroverzicht 2026: de openingsfilm

A four-minute motion piece that opens the quiz night: 1920×1080, 60 fps, 120 BPM. It covers the year, then the news month by month (Dutch news first, then the world), an in-memoriam card, a "secret dossier" teaser and a countdown into the quiz.

Everything is generated from code. The picture and the soundtrack both read their timing from `reel-data.js`, so they stay in sync.

## No spoilers

The reel is meant to be shown **before** the quiz, so it must not answer or hint at any question in `app/src/lib/content/packs.ts`. That is why these subjects are left out:

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

The news items are ones the quiz does not ask about. Before adding news, check it against the quiz.

## Files

| File | What it does |
| --- | --- |
| `reel-data.js` | The news items, the in-memoriam list and the order of the scenes. **Edit this to change the content.** |
| `index.html` | Draws every frame. Open it in a browser to watch it live; click it to play it with sound. |
| `audio.js` | Synthesizes `soundtrack.wav` on the same beat grid. |
| `render.js` | Renders the video in parallel with headless Chromium and ffmpeg. |
| `geo.js` | Outline of the Netherlands and a dot map of the world (Natural Earth, public domain). |
| `fonts/` | Anton, Space Grotesk and JetBrains Mono (SIL Open Font License). |

## October to December

The news is researched up to 30 September 2026. December currently has only tonight's fireworks ban.

To fill in the autumn, add items to `NIEUWS` in `reel-data.js` with `m: 9`, `10` or `11`. A month appears as soon as it has an item. Each month adds 2 seconds, and each item adds 6.

Then rebuild:

```sh
node audio.js                          # new soundtrack
FFMPEG=/path/to/ffmpeg node render.js  # about an hour on four cores
node render.js --stills 60.5 124       # or check a few frames first
```

An item looks like this:

```js
{ m: 9, tag: 'NL', datum: '14 OKTOBER', vorm: 'kop', icon: 'trofee', kop: 'Short headline', sub: 'One or two sentences of context.' }
```

- `vorm` is the layout:
  - `kop`: headline with an icon
  - `nl`: map of the Netherlands with a pin
  - `wereld`: world map with a pin
  - `getal`: a counter
  - `zon`: the eclipse
- `icon` is one of: `stembus`, `kroon`, `thermometer`, `zon`, `trein`, `chip`, `microfoon`, `trofee`, `hart`, `dart`, `mol`, `trekker`, `vuurpijl`.
- `plek` places the pin: `{ lat, lon, naam }`.
- `getal` sets the counter: `{ n, dec, voor, eenheid }`.

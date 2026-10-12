# Jaaroverzicht 2026: de openingsfilm

A goofy, fast motion piece of about two minutes that opens the quiz night: 1920×1080, 60 fps. It is hosted by the *maatjes*, the quiz's own pixel animals, and it runs on the beat of the year's hits.

1. **A cold open and a fast intro.** The penguin anchor taps the microphone ("staat dit aan?"). The year loads to 99% and gets stuck until the hippo bumps it to 2026, and every maatje jumps into the frame. Then 365 days, one lap around the sun (in a hamster ball, the sun in sunglasses) and the year in numbers (including how much of it the sloth slept). One bar per scene.
2. **"Het jaar in beeld".** The news as the *BJ Journaal*, hosted by the penguin. Every month opens with its own two-beat trick: a calendar page ripped off, a neon sign flickering on, a rubber stamp, a train whose windows spell the month, letters that drop, a plane with a banner, balloon letters or a typewriter. Then every headline is its own little cartoon, acted out by the maatjes, with the headline built into the joke. A few examples:
   - Greenland is the prize in a claw machine.
   - *Cheerio* is sung by one frog, then four, nine, sixteen and finally 36 maatjes in a split screen that multiplies on every word.
   - At the pump the camera crash-zooms on the price and on the camel's face, and the camel carries its car home.
   - The Schiphol queue is a time-lapse ("16 UUR LATER…") in which beards grow and the sloth at security stamps one passport.
   - In the hottest summer ever the fan flies off by itself.

   A sketch lasts two or three seconds, cut on the beat with a snap, a whip pan, a cartoon iris or a giant animal running across. Serious news gets no gag at all.
3. **In memoriam** (quiet, no gags), a **secret dossier** that the raccoon steals ("de rest hoor je vanavond"), and a **finale**: 2026 from a cloud of sparks, a conga line, a kick line and a countdown into the quiz.

Everything is generated from code. The picture and the sound both read their timing from `reel-data.js`, so every gag sound lands on its frame.

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

Before adding news, check it against the quiz. The jokes count too: a gag or a speech bubble must not give anything away either.

## The news and its sketches

Each headline in `NIEUWS` in `reel-data.js` names the sketch that tells it and the maatje that plays the lead:

```js
{ m: 3, tag: 'NL', datum: '5 april', beeld: 'kampioen', maatje: 'zeehond',
  kop: 'PSV kampioen, vroeger dan ooit', sub: 'De derde titel op rij is al in april binnen.' }
```

- `beeld` is the sketch: `SCHETSEN[beeld]` in `film/schetsen.js`, `schetsen2.js` or `schetsen3.js` (by month). It draws one frame for a time `u` into the shot.
- `maatje` is any animal from the quiz (`maatjes.js`).
- `zegt` is a speech bubble, only where it is the punchline.
- `overgang` is how the shot comes in: `snede` (a snap on the beat, the default), `zweep` (whip pan), `iris` or `wis` (a giant animal runs across).
- `ernstig: true` is for serious news: no animal, no gag, no bouncing, plain type and a quiet push-in, and the music drops to a pad.

Each sketch also has a line in `SCHETS` in `reel-data.js`, which the picture and the sound both read:

```js
groenland: { tel: 6, m: { zak: 0.25, grijp: 1.25, op: 1.5, glip: 3, plons: 3.5 },
  klank: [['zak', 'zoem'], ['grijp', 'klak', 1.2], ['op', 'zoem'], ['glip', 'fluit-neer'], ['plons', 'plons']] },
```

- `tel` is how many beats the sketch needs.
- `rek: true` lets it take the spare beats when a month is rounded up to whole bars.
- `m` holds its moments, in beats.
- `klank` lists the sound effects on those moments: a moment or a beat, a sound from `GELUID` in `audio.js`, and an optional level.

Because both read the same moments, every *klak* and *plons* lands on its frame, at any tempo.

**A new headline** needs either a new sketch (a function in `film/schetsen*.js` plus a line in `SCHETS`), or a photo or clip (below). A headline with a photo or clip is shown with the simple template: the picture, a sticker headline that pops in word by word, and its `maatje` doing `doet` (`juich`, `val`, `paniek`, `slaap`, `dans`, `kijk`, `ren`, `klap`, `spring`, `graaf`, `huil`, `zweet`, `schud`, `poets`, `zwaai`, `salueer`, `hang` or `vlieg`) and saying `zegt`. Its options:

- `held: true` gives it a longer slot and shows its `sub`.
- `vorm` sets the layout: `vol` (full screen, the default), `tv`, `krant` (a spinning newspaper) or `breaking`.

The animals come straight from the app: `node maatjes-bouw.js` reads `app/src/lib/shared/pixeldieren.ts` and writes `maatjes.js`. Run it again after an animal is redrawn there.

## Photos and video clips

To use real material for a headline, put the file in `media/` and add `media` to the item in `reel-data.js`.

A **photo** fills the frame with a slow zoom:

```js
media: { foto: 'darts.jpg', bron: 'ANP' }
```

A **video clip** is a folder of numbered frames, so the render stays frame-exact. Make one with ffmpeg:

```sh
ffmpeg -ss 12 -t 4 -i clip.mp4 -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30" -q:v 3 media/darts/%04d.jpg
```

Then point the item at it:

```js
media: { video: 'darts', frames: 120, fps: 30, bron: 'NOS' }
```

- `bron` is the credit.
- `x` and `y` (from -1 to 1) shift a photo's crop.
- A missing file falls back to a plain globe.

## Music: the year's hits

Put the songs in `muziek/`. The file names and the plan are in `muziek/LEESMIJ.md`. The default plan uses the year's Dutch Top 40 number ones, with *Cheerio* under the dossier and the finale.

`npm run audio` does three things:

1. `node muziek.js tempo` measures each song's tempo and finds its **hook**: the loudest stretch of the song that starts with a jump in energy, which is nearly always the chorus. The song starts there, on a downbeat, to the millisecond. No intros, no first verses.
2. `node audio.js` synthesizes the score and the effects on the film's beat grid.
3. `node muziek.js mix` mixes everything into `soundtrack.wav`.

**The film follows the song.** Each chapter runs at its song's tempo, so every cut lands on the beat and the songs play at their real speed and pitch. A slow song counts in double time, so the picture keeps moving, and a headline always lasts long enough to read.

**The mix**

- A song can run in early, muffled as if from the tv, and then drop. The first song does this under the cold open and drops on 2026.
- Each song leaves on a DJ trick on its last beat: an echo-out, a backspin, a tape stop (into in memoriam) or a fade. The last one stops dead on START. Two songs never play over each other.
- Every song is levelled to the same loudness on the stretch that plays, with a fixed gain, so nothing pumps.
- The music ducks a few dB under the effects.
- The master gets a gentle glue compressor and a true-peak limiter. It ends at -14 LUFS with peaks under -1 dBTP.

A chapter without a song plays the synthesized score: a bouncy chiptune-pop theme that follows the same beat grid.

**Not the right bit of a song?** Run `npm run luister`. It puts every chapter change in a row in `muziek/overgangen.wav`, and `npm run audio` prints where each song starts. To start a song somewhere else, set `vanaf` in `MUZIEK` in `reel-data.js`: the song then starts on the first downbeat after that time. To change how a song leaves, set `uit`.

## October to December

The news is researched up to 30 September 2026. October, November and December hold **placeholders**. As long as a month has only placeholders, it folds into one short "nog in de maak" gag: the calendar pages fly by, and the goldfish forgets where it was. December also has tonight's fireworks ban.

To fill in a month, replace one of the generated placeholder items at the bottom of `NIEUWS` in `reel-data.js` with a real one, with a photo or clip:

```js
{ m: 9, tag: 'NL', datum: '14 oktober', kop: 'Short headline', sub: 'One sentence of context.',
  media: { foto: 'oktober.jpg', bron: 'ANP' }, maatje: 'kip', doet: 'juich', zegt: 'JAAA!' }
```

Or write it its own sketch, as above. A filled month gets its own opening trick and adds about eight seconds.

## Rendering it yourself

You need Node.js 18 or newer (and 22.18 or newer for `npm run maatjes`, which reads the app's TypeScript). From this folder:

```sh
npm install          # installs Playwright, its Chromium and its own ffmpeg
npm run render       # soundtrack (with your songs, if any) + jaaroverzicht-2026.mp4
npm run stills 20 42.5   # optional: check a few frames first (they land in stills/)
```

- It works on Windows, macOS and Linux.
- It uses all but one CPU core. Four cores take about 25 minutes.
- If Playwright cannot download its browser, point `CHROMIUM` at an installed Chrome or Chromium.
- To watch it live instead, open `index.html` in a browser and click it to play it with sound. Your browser may block local files; if so, run `npx serve` in this folder and open the address it gives you.

The finished video is larger than GitHub's 100 MB limit, so it is not committed.

## Files

| File | What it does |
| --- | --- |
| `reel-data.js` | The headlines, their sketches' moments and sounds, the in-memoriam list, the songs and the scene order in beats. **Edit this to change the content.** |
| `index.html` | Loads the film. Open it in a browser to watch it live; click it to play it with sound. |
| `film/` | The film itself: `kern.js` (drawing, beat clock), `dieren.js` (the maatjes and their actions), `intro.js`, `nieuws.js` (the ident, the month, transitions, the photo template), `stings.js` (how each month opens), `schetsen.js`, `schetsen2.js` and `schetsen3.js` (the sketches, by month), `beelden.js` (shared backdrops), `einde.js` (memoriam, dossier, finale), `main.js` (sequencing and rendering). |
| `maatjes.js` | The pixel animals, generated from the app by `maatjes-bouw.js`. |
| `audio.js` | Synthesizes the score (`score.wav`) and the effects (`sfx.wav`) on the film's beat grid. |
| `muziek.js` | Finds each song's tempo and hook, and mixes and masters `soundtrack.wav`. |
| `render.js` | Renders `jaaroverzicht-2026.mp4` in parallel with headless Chromium and ffmpeg. |
| `geo.js` | A dot map of the world, for the globe (Natural Earth, public domain). |
| `fonts/` | Anton, Space Grotesk and JetBrains Mono (SIL Open Font License), and Luckiest Guy (Apache License 2.0). |

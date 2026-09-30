# Muziek

Only songs released in 2026. Put them here as mp3 (m4a and wav work too). They stay on your computer: git ignores them.

| File | Song | Under |
| --- | --- | --- |
| `mr-know-it-all.mp3` | Teddy Swims – Mr. Know It All | the intro and the ident |
| `i-just-might.mp3` | Bruno Mars – I Just Might | January to April |
| `dai-dai.mp3` | Shakira & Burna Boy – Dai Dai | May to August |
| `fever-dream.mp3` | Alex Warren – Fever Dream | September to December |
| `cheerio.mp3` | Justen de Wildt – Cheerio | in memoriam (muffled), then the dossier and the countdown |

Other songs work too: change the file names in `MUZIEK` in `../reel-data.js`.

Then run `npm run audio` (or `npm run render` for the whole film):

- It measures each song's tempo.
- It lets that chapter of the film run at that tempo.
- It mixes the songs under the film.

Set `vanaf` in `reel-data.js` to where the good part of a song starts, for example the chorus. If a chapter starts on the wrong beat of the bar, set `tel` to the time of a downbeat. A missing file means that chapter keeps the synthesized score.

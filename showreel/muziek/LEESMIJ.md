# Muziek

Only songs released in 2026. Put them here as mp3 (m4a and wav work too). They stay on your computer: git ignores them.

| File | Song | Under |
| --- | --- | --- |
| `mr-know-it-all.mp3` | Teddy Swims – Mr. Know It All | the cold open (muffled, from the tv), then 2026 and the ident |
| `i-just-might.mp3` | Bruno Mars – I Just Might | January to April |
| `dai-dai.mp3` | Shakira & Burna Boy – Dai Dai | May to August |
| `fever-dream.mp3` | Alex Warren – Fever Dream | September to December, and its quiet opening under the in memoriam |
| `cheerio.mp3` | Justen de Wildt – Cheerio | the dossier and the finale |

Other songs work too: change the file names in `MUZIEK` in `../reel-data.js`.

Then run `npm run audio` (or `npm run render` for the whole film). For each song it:

- measures the tempo;
- finds the hook (nearly always the chorus) and starts the song there, on a downbeat, so there is no long intro;
- lets that chapter of the film run at the song's tempo;
- mixes it in, levelled to the same loudness as the others, with a DJ trick on its way out.

It prints where each song starts, for example `start op 1:01.3`. Not the bit you wanted? Set `vanaf` in `reel-data.js` to a time just before it, in seconds. The song then starts on the first downbeat after that.

To hear every change between chapters in a row, run `npm run luister` and open `overgangen.wav` in this folder.

A missing file means that chapter plays the synthesized score.

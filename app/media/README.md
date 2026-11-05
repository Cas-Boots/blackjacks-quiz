# Media bij vragen

Zet hier de foto's, filmpjes en muziekfragmenten die bij vragen horen. Een vraag
verwijst met `media.bron` naar een bestandsnaam in deze map:

```js
{v:"Waar is dit?", a:"Lissabon", media:{soort:"beeld",  bron:"2026-01.jpg"}}
{v:"Welk nummer?", a:"…",        media:{soort:"muziek", bron:"intro-01.mp3"}}
{v:"Welke film?",  a:"…",        media:{soort:"video",  bron:"clip-01.mp4"}}
```

Verklapt het filmpje het antwoord, zet het dan in `naOnthulling` in plaats van
`media`: dan verschijnt het pas bij de onthulling.

```js
{v:"Zweden won het Songfestival.", goed:false, naOnthulling:{soort:"video", bron:"songfestival-2026-winnaar.mp4"}}
```

Ondersteund: jpg, png, gif, webp, avif, svg · mp4, webm, mov · mp3, m4a, aac, ogg, wav, flac.

De bestanden worden op het moment zelf gelezen; herstarten is niet nodig. Ze
horen niet in git thuis en staan daarom in `.gitignore`. In Docker koppelt
`docker-compose.yml` deze map aan de container. Wil je ze ergens anders
neerzetten, zet dan `MEDIA_DIR`.

Ontbreekt een bestand, dan toont de televisie een nette melding en loopt de
quiz gewoon door.

## Draaiboek De Hitparade

Twee muziekrondes, negen fragmenten, allemaal mp3. Knippen kan met elke
audio-app, of met `ffmpeg` (voorbeelden hieronder: pas de begintijd `-ss` en
de lengte `-t` aan). Het bronbestand van het nummer heb je zelf; de quiz
levert alleen de vraag.

**Hitparade 1: Wat hoor je?**

| Bestand | Wat | Hoe lang |
|---|---|---|
| `hitparade-intro-1.mp3` | *Pijnstiller* — Suzan & Freek, vanaf de allereerste seconde | 3 s |
| `hitparade-carnaval.mp3` | *Dikke Pens* — De Kapotte Kachels (staat niet meer op Spotify; een live-opname mag wel). Het refrein, waar ABBA in doorklinkt | ± 20 s |
| `hitparade-artiest-1.mp3` | Een albumnummer van Olivia Rodrigo, van *you seem pretty sad for a girl so in love* (juni). Niet de single *Drop Dead*, en zónder de titel in de tekst | ± 20 s |
| `hitparade-mashup.mp3` | *The Fate of Ophelia* (Taylor Swift) en *Mi Chico* (DJ Goja, Jason Derulo) tegelijk, elk vanaf het refrein | ± 20 s |

**Hitparade 2: Wie, wat en wanneer?**

| Bestand | Wat | Hoe lang |
|---|---|---|
| `hitparade-tiktok.mp3` | De saxofoon uit *Boyz n the Hood* (1991): het TikTok-geluid "the saxophones are getting louder" | ± 10 s |
| `hitparade-origineel.mp3` | *Billie Jean* — Michael Jackson, de bekende baslijn aan het begin | ± 12 s |
| `hitparade-achterstevoren.mp3` | *100 Tranen* — Qlas, Antoon & Boef, het refrein **achterstevoren** | ± 15 s |
| `hitparade-achterstevoren-goed.mp3` | Hetzelfde stuk de goede kant op, voor na de onthulling | ± 15 s |
| `hitparade-ai.mp3` | Het AI-lied hieronder | ± 30 s |

```bash
ffmpeg -ss 0 -t 3 -i pijnstiller.mp3 hitparade-intro-1.mp3
ffmpeg -ss 40 -t 15 -i 100-tranen.mp3 hitparade-achterstevoren-goed.mp3
ffmpeg -i hitparade-achterstevoren-goed.mp3 -af areverse hitparade-achterstevoren.mp3
ffmpeg -ss 60 -t 20 -i olivia-rodrigo-albumnummer.mp3 hitparade-artiest-1.mp3
ffmpeg -ss 0 -t 12 -i billie-jean.mp3 hitparade-origineel.mp3
ffmpeg -ss 50 -t 20 -i fate-of-ophelia.mp3 -ss 45 -t 20 -i mi-chico.mp3 \
  -filter_complex "amix=inputs=2:duration=shortest" hitparade-mashup.mp3
```

Reserve, mocht er een fragment niet lukken: *Schijn Je Licht Op Mij* van
Ronnie Flex en ADF Samski zonder zang (`hitparade-zonder-zang.mp3`).

### Het AI-lied

Laat een AI-muziekgenerator dit inzingen, bijvoorbeeld met de stijl
*vrolijke Nederlandstalige pop, mannenstem, 30 seconden*. Het woord
"sneeuw" staat er bewust niet in: dat is het antwoord.

> Het bord op het perron zei: vervallen,
> op Schiphol bleef elk vliegtuig aan de grond.
> Ik keek naar buiten, alles werd wit,
> en heel Nederland viel stil in het rond.
>
> Geen trein, geen vlucht, geen bus die nog rijdt,
> heel Nederland binnen, de agenda kwijt.
> Januari kleurde ons land helemaal wit,
> en ik bleef lekker liggen, daar waar ik zit.

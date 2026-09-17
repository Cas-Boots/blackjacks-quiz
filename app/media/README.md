# Media bij vragen

Zet hier de foto's, filmpjes en muziekfragmenten die bij vragen horen. Een vraag
verwijst met `media.bron` naar een bestandsnaam in deze map:

```js
{v:"Waar is dit?", a:"Lissabon", media:{soort:"beeld",  bron:"2026-01.jpg"}}
{v:"Welk nummer?", a:"…",        media:{soort:"muziek", bron:"intro-01.mp3"}}
{v:"Welke film?",  a:"…",        media:{soort:"video",  bron:"clip-01.mp4"}}
```

Ondersteund: jpg, png, gif, webp, avif, svg · mp4, webm, mov · mp3, m4a, aac, ogg, wav, flac.

De bestanden worden op het moment zelf gelezen; herstarten is niet nodig. Ze
horen niet in git thuis en staan daarom in `.gitignore`. In Docker koppelt
`docker-compose.yml` deze map aan de container. Wil je ze ergens anders
neerzetten, zet dan `MEDIA_DIR`.

Ontbreekt een bestand, dan toont de televisie een nette melding en loopt de
quiz gewoon door.

# Blackjacks Quiz — afspraken bij het aanpassen

Lees dit voordat je vragen, rondes of teams verandert. De vragen staan op één
plek: `app/src/lib/content/packs.ts`. Draai daarna `npm run content:sync` (in
`app/`), zodat de losse `index.html` gelijk loopt, en `npx vitest run` en
`npm run check`.

## Wie er speelt

- **Cas is quizmaster en speelt niet mee.** Cas komt wel voor in de cijfers
  (sport, taart, landen) en in de voorspellingen, als deelnemer van het jaar.
- **De spelers zijn Joris, Rik, Eva, Liz en Bastiaan.** Vijf man, dus bij
  twee teams altijd drie tegen twee.

## Wie wat weet

- **Nieuws:** Joris volgt het het best, Rik bijna net zo goed, Eva zit ertussen,
  Liz en Bastiaan volgen het nauwelijks. In de code: `NIEUWS` bovenaan
  `packs.ts` (Joris 4, Rik 3, Eva 2, Liz 1, Bastiaan 1).
- **Muziek en sport:** alleen Joris en Rik zijn er echt goed in (`MUZIEK`).

## Teams: willekeurig voelen, eerlijk zijn

Dit is een bewuste keuze. Het moet niet opvallen dat er gestuurd wordt.

- Een teamronde over het nieuws of muziek krijgt `kennis`. De app husselt tot
  de teams even sterk zijn en kiest elke ronde een andere eerlijke indeling,
  zodat het als toeval voelt.
- **In precies één ronde spelen Joris en Rik samen** (`samen`): de ronde waar
  kennis het minst uitmaakt, nu *Dichtstbij Wint* (iedereen gokt een getal).
  Zo zie je ze één keer als duo en lijkt de rest niet gestuurd. Verhuist of
  verdwijnt die ronde, geef `samen` dan aan de nieuwe ronde met de minste
  invloed van kennis, niet aan een kennisronde.
- Een nieuwe teamronde over het nieuws of muziek krijgt dus altijd `kennis`.
  Rondes over onszelf (sport, taart, voorspellingen) zijn individueel en
  hebben het niet nodig.

## Vragen

- **Alles gaat over 2026, of over wat 2027 brengt.** Een leuk idee zonder band
  met dat jaar past alleen met een andere invalshoek, of niet.
- **Elk onderwerp uit het nieuws komt één keer voor**, en niets wat de
  openingsfilm (`showreel/`) al liet zien. Een bewuste verwijzing naar de
  film mag, zoals de Hitparade-vraag over het nummer onder januari tot april.
- **Iedereen moet kunnen scoren.** Een kennisvraag krijgt een aanwijzing waar
  je zonder het nieuws te volgen op kunt redeneren (meerkeuze met
  onmogelijke opties, "de titel telt vier woorden", "een Italiaan").
  Echte kennersvragen zijn uitzondering, en dan met extra punten.
- **Muziek is er voor iedereen**: emoji's, meezingen, vragen over onszelf
  (Spotify Wrapped). Niet alleen herkennen voor kenners.
- **Feiten worden nagezocht**, niet gegokt. Kan iets nog niet (de rest van
  het jaar, eigen foto's), zet er dan `teVullen: true` bij.

## Lengte

De avond is bewust kort: dertig seconden per vraag, een minuut in teamrondes.
Reken per vraag de klok plus ongeveer 45 seconden voor voorlezen en
onthullen. Wat er bij komt, moet er meestal ergens anders af. Werk de
aantallen in `README.md` bij als je rondes of vragen toevoegt.

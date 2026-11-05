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
- **Warmdraaien gaat over het grote nieuws van 2026**: wat iedereen heeft
  meegekregen, ook wie het nieuws nauwelijks volgt (de premier, de Winterspelen,
  het Songfestival, de maanvlucht, de opvouwbare iPhone). Geen obscure weetjes of een losse grabbelton
  van rariteiten. Formuleer kort en ondubbelzinnig, rond de tien woorden; het
  verhaal eromheen gaat in een korte toelichting.
  Elke stelling moet aan beide kanten geloofwaardig zijn: niet zo gesteld
  dat de formulering het antwoord verraadt (een bizarre, specifieke claim
  is meestal waar). Geen instinkers op een detail (€ 14,99 tegen 15 euro),
  en geen onderwerp dat elders in de quiz al staat.
  Ook niet zo simpel dat slimme spelers het meteen zien (dat er geen mensen
  op de maan landden, weet iedereen). Zet er ook specifieke stellingen in die
  níet kloppen, zodat "klinkt specifiek, dus waar" niet werkt.
  Een drempel werkt vaak beter dan een losse bewering: "duurde langer dan
  twee weken", "kost meer dan 2.500 euro", "in de top 3". Dan klinken waar en
  niet waar allebei logisch. Houd wel ruimte tussen drempel en antwoord.
- **GTA VI moet erin**, in welke ronde of vorm dan ook. De vorm kiezen we na
  de release (19 november 2026), waarschijnlijk "hoeveel spelers op de eerste
  dag"; tot dan staat hij als schatvraag in *Dichtstbij Wint* als `teVullen`.
  Haal hem niet weg bij het inkorten.
- **Feiten worden nagezocht**, niet gegokt. Kan iets nog niet (de rest van
  het jaar, eigen foto's), zet er dan `teVullen: true` bij.

## Lengte

De klok is kort (dertig seconden per vraag, een minuut in teamrondes), maar de
tijd gaat zitten in alles eromheen: onthullen, uitleggen, discussiëren. Reken
daarom met praattijd, niet alleen met de klok:

| Wat | Bovenop de klok |
|---|---|
| Snelle nieuwsvraag (waar of niet waar, meerkeuze) | 1 min per vraag |
| Open nieuwsvraag, schatting, emoji of muziek | 1½ min per vraag |
| Vraag over onszelf (sport, taart, voorspellingen, stemmen) | 2 min per vraag |
| Elke ronde (inleiden, teams, tussenstand) | 2 min |
| Begin (telefoons, trailer) en einde (uitslag, prijzen, film) | 10 min elk |

**Het doel: ± 2 uur, en vóór middernacht klaar.** De quiz is op
oudejaarsavond; we beginnen om 20:30, maar de quiz zelf rond 21:30. Met 9
rondes en 36 vragen eindigt hij volgens het model hierboven om ± 23:35, ruim
voor het aftellen. `app/tests/keuze.test.ts` rekent dat na en faalt boven de
125 minuten.

Wat er bij komt, moet er dus ergens anders af. De rondes over onszelf kosten
de meeste tijd maar maken de quiz uniek: inkorten doe je eerst bij de
nieuwsvragen, en liever een hele ronde (die kost 2 minuten aan zichzelf) dan
overal één vraag. Gooi een nagezochte vraag niet weg: zet er
`reserve: true` bij (standaard uitgevinkt), of `optioneel: true` op de ronde.
Werk de aantallen in `README.md` bij als je rondes of vragen verandert.

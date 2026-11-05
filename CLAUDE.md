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
- **Muziek krijgt twee rondes, met muziek die je hoort**: *Hitparade 1: Wat
  hoor je?* (vroeg op de avond) en *Hitparade 2: Wie, wat en wanneer?*
  (later). Ronde 1: een intro, een carnavalscover, een
  onbekend nummer van een wereldster en een mash-up. Ronde 2: het TikTok-geluid
  van het jaar, een oud nummer dat terugkwam, een hit achterstevoren en een
  AI-lied. Elke vorm komt één keer voor. Nooit twee keer dezelfde vorm
  achter elkaar. Geen meezingen (past niet bij de
  telefoons) en geen "wiens Wrapped" (de eigenaar weet het meteen).
- **Warmdraaien gaat over het grote nieuws van 2026**: wat iedereen heeft
  meegekregen, ook wie het nieuws nauwelijks volgt (de premier, de Winterspelen,
  het Songfestival, de Super Bowl, de opvouwbare iPhone). Geen obscure weetjes of een losse grabbelton
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
  Een filmpje dat het antwoord verklapt (de Songfestivalwinnaar) hoort in
  `naOnthulling`: dat verschijnt pas bij de onthulling.
- **GTA VI moet erin**, in welke ronde of vorm dan ook. De vorm kiezen we na
  de release (19 november 2026), waarschijnlijk "hoeveel spelers op de eerste
  dag"; tot dan staat hij als schatvraag in *Dichtstbij Wint* als `teVullen`.
  Haal hem niet weg bij het inkorten.
- **Taart hoort bij de sport**: dezelfde tellers uit resolution-recap, hetzelfde
  idee, dus één ronde (*Onze Sportcompetitie*). De taart is dit jaar niet
  serieus bijgehouden (in 2024 wel): vergelijk dus vooral het totaal met 2024. **De landen zijn alleen
  bijgehouden voor de voorspellingen**; geen eigen landenvragen. Vorige
  seizoenen (sport 2025, taart 2024) staan in `app/src/lib/server/recap/vorigjaar.ts`:
  een terugblik daarop valt goed. Ververs de cijfers met
  `npm run recap:snapshot -- --backup <db-….db.gz>` uit resolution-recap/backups.
- **Open vragen: denk aan hoe ze het intypen.** Stuur het antwoord met de
  vraag ("In één woord", "Wie werd er opgepakt?"), houd `a` kort, en zet
  andere goede antwoorden in `ookGoed`: die keurt de app automatisch goed,
  zonder dat ze op het scherm komen. De rest beoordeelt de quizmaster.
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
rondes en 36 vragen eindigt hij volgens het model hierboven om ± 23:33, ruim
voor het aftellen. `app/tests/keuze.test.ts` rekent dat na en faalt boven de
125 minuten.

Wat er bij komt, moet er dus ergens anders af. De rondes over onszelf kosten
de meeste tijd maar maken de quiz uniek: inkorten doe je eerst bij de
nieuwsvragen, en liever een hele ronde (die kost 2 minuten aan zichzelf) dan
overal één vraag. Gooi een nagezochte vraag niet weg: zet er
`reserve: true` bij (standaard uitgevinkt), of `optioneel: true` op de ronde.
Werk de aantallen in `README.md` bij als je rondes of vragen verandert.

## Spanning: de telling en de simulatie

Het doel van de telling is dat het **zo lang mogelijk spannend blijft wie er
wint**. Wat er nu staat, en waarom:

- Ieder voor zich telt snelheid (meteen goed is alles, op de valreep 50%);
  in teamrondes is goed altijd evenveel waard, zodat overleggen nooit punten
  kost. Geen reeksbonus: met wisselende teams niet eerlijk te belonen.
- Het laatste kwart tot derde van de avond blijft de stand geheim
  (`eersteGeheimeRonde` in `app/src/lib/shared/bonus.ts`): op de televisie
  alleen goed of fout, op de telefoon wel je eigen winst maar geen totaal.
- Gouden kaart en dubbele slotrondes blijven.

Toets een idee voor de telling eerst met de simulatie: `npm run spanning`
(in `app/`, `scripts/spanning.ts`). Die speelt de standaardavond duizenden
keren na met de echte teams en telling, op basis van de kennisprofielen
bovenaan het script (aannames, bij te stellen). Uitkomst in november 2026:
Joris en Rik winnen elk ± 30%, de anderen elk 12–14%; de koploper vlak
voor de geheime stand wint maar de helft van de avonden; de ondergrens van
de snelheid (50% of 75%) maakt geen verschil, en zonder snelheid eindigt het
minder vaak nek aan nek. Hiermee willen we later verder kijken of het nog
spannender kan: breid het script uit met een nieuwe regel als variant naast
de huidige, en vergelijk. Het model (de profielen en hoe een ronde uitpakt)
staat in `scripts/spanning-model.ts` en is gedeeld.

`npm run volgorde` rekent alle 5.040 volgordes van de rondes door (Warmdraaien
blijft voorop). De volgorde bepaalt welke twee rondes als slotronde dubbel
tellen. Uitkomst in november 2026: de huidige volgorde staat rond plek 1.200;
de koploper na ronde 6 wint dan 49%. Het spannendst (40%) zijn de rondes met
veel toeval als dubbele slotrondes (*Dichtstbij Wint* en *Wie van de
Blackjacks?*), met de kennisrondes en de voorspellingen ervoor. Kennisrondes
als slotronde maken het juist minder spannend: daar loopt wie al voorstaat
verder uit. Let op: meer toeval aan het eind is ook meer loterij.

## Nog te doen in december

Wat nu nog niet kan, en vóór oudejaarsavond moet gebeuren:

- **GTA VI** (release 19 november): het getal voor de schatvraag in
  *Dichtstbij Wint*, en de regel in de film.
- **De Voorspellingen** (`app/src/lib/content/voorspellingen.ts`): de
  uitkomsten van 1 (nieuwe banen), 4 (kabinet het jaar uit), 8 (AI),
  11 (Spotify Wrapped), 12 (sportieve voornemens) en 13 (grote
  gebeurtenis; een paar zijn al uitgekomen). Daarna samen kijken hoe we
  de ronde het leukst maken. 2 en 3 zijn ingevuld; 7, 9, 10 en 14 rekent
  de app zelf uit.
- **De twee Hitparades**: negen muziekfragmenten in `app/media/`. Wat er in elk fragment moet, en de
  tekst voor het AI-lied, staat in `app/media/README.md`.
- **Warmdraaien**: een fragment van de Songfestivalwinnaar
  (`songfestival-2026-winnaar.mp4`) in `app/media/`.
- **De cijfers verversen** met de laatste back-up van resolution-recap
  (`npm run recap:snapshot`), en de achtervangteksten nalopen.

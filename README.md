# Blackjacks Kwis

Een complete quizavond in één HTML-bestand. Geen server, geen internet, geen
installatie, geen PowerPoint. Je opent `index.html` in een browser en je kunt
beginnen.

Alle vragen gaan over 2026 of over wat 2027 gaat brengen. De avond opent met
een trailer van het jaar, zonder één antwoord van vanavond; na de uitslag
draait de hele film.

## Snel starten

1. Download `index.html` (of open de gepubliceerde link).
2. Dubbelklik het bestand — het opent in je browser.
3. Vul je naam als quizmaster in, pas de spelersnamen aan, kies de vragen.
4. Zet je scherm op volledig scherm (`F11`, of `ctrl`+`cmd`+`F` op een Mac).
5. Begin met de trailer, of ga met *Meteen naar ronde 1* de quiz in.

Sluit je laptop met een HDMI-kabel op de tv aan, of cast het tabblad. Oogt de
tekst vanaf de bank te klein, zet de tekstgrootte dan hoger in het menu.

## De twee pakketten

| Pakket | Rondes | Vragen |
|---|---|---|
| Blackjacks 2026 — Het Jaaroverzicht | 14 | 105 |
| Familie Proefronde 2026 | 7 | 50 |

De familieversie is de generale repetitie: hetzelfde jaar, makkelijkere vragen.
Met de vragenkiezer stel je hem anders samen dan de avond met de Blackjacks.

### Rondes over de groep zelf

Twee rondes zijn **al gevuld** met de echte cijfers uit
[`resolution-recap`](https://github.com/Cas-Boots/resolution-recap), overgenomen
uit de dagelijkse back-up van 18 september. In de meespeelversie in `app/`
worden deze vragen op de avond zelf live uitgerekend (zie
[`app/README.md`](app/README.md)); in dit losse bestand staan ze als
momentopname:

- **Onze Sportcompetitie** — wie het vaakst sportte, wie nooit in de sportschool
  kwam, welke sport iedereen precies één keer deed, wie zijn jaardoel al haalde.
- **Taart & Verre Landen** — de taartteller, de landenteller, de drukste
  taartdag van het jaar.

Nog twee rondes over de groep:

- **De Voorspellingen** — de veertien voorspellingen van januari. In de
  meespeelversie leven ze in `app/src/lib/content/voorspellingen.ts`, met de
  uitkomsten; hier wachten ze op handwerk.
- **De WK-poule** — wacht op een export uit `blackjacks-cup`; die bestaat nog niet.

Daarnaast is er een lege ronde **Oktober tot december**, want die maanden hadden
bij het schrijven nog niet plaatsgevonden.

Werk je de cijfers bij? Draai dan de analyse opnieuw tegen de nieuwste back-up in
`resolution-recap/backups/` en pas de antwoorden aan.

De openstaande vragen dragen de markering `teVullen`. Je ziet ze terug als een rood
label in de vragenkiezer, en de controle vooraf telt hoeveel gekozen vragen
nog een antwoord missen — zodat je niet per ongeluk met een onbeantwoordbare
vraag de avond in gaat.

## De avond begint met een trailer, en eindigt met de film

De quiz gaat over het jaar, dus een overzicht van het jaar vóór de eerste
vraag verklapt al snel de antwoorden. Daarom zijn het er twee:

- **De trailer**, vóór ronde 1. Alleen wat de quiz *niet* vraagt: momenten
  van onszelf, en per maand hoe vaak er gesport is. Geen wereldnieuws, geen
  maandkoppen (die noemen de onderwerpen), geen taarten of landen (die
  vragen de rondes over onszelf).
- **De film**, na de uitslag. Het hele jaar maand voor maand: wat er in de
  wereld gebeurde, onze sporten, taarten, landen en wie er het vaakst ging,
  en de stand van het jaar. Wat er die avond gevraagd werd, staat
  onderstreept, zodat je in één oogopslag ziet waar de quiz over ging.

Beide lopen vanzelf door; met **Pauze** (`P`) zet je ze stil, met `spatie`
ga je sneller, met `←` een stap terug, en *De trailer overslaan* brengt je
meteen naar ronde 1. De knop voor de film staat bij de eindstand.

De trailer is zo lang als wat erin mag staan. Nu zijn dat nog maar een paar
regels; die schrijf je zelf bij, zie hieronder. Een maand zonder regel voor
de trailer slaat hij over.

## Hoe de avond verloopt

De quizmaster bedient het scherm en speelt zelf niet mee. Spelers schrijven hun
antwoord op. Per vraag: de vraag verschijnt met een aftelklok → tijd om →
**Toon het antwoord** → je tikt aan wie het goed had → volgende vraag.

Na elke ronde zie je de tussenstand, aan het eind het podium.

## Wisselende teams

Teams wisselen per ronde, maar **punten gaan altijd naar de persoon**. Zo blijft
het klassement eerlijk, hoe vaak je ook herverdeelt. Bij een teamronde krijgt
elk lid van een winnend team de punten.

Op het ronde-scherm kun je **Herverdeel** gebruiken voor een nieuwe willekeurige
verdeling, of op een naam tikken om die speler naar het volgende team te
schuiven. Teams heten naar de kaartkleuren: Schoppen, Harten, Ruiten, Klaveren.

## Portretten

Tik op het rondje naast een spelersnaam om een foto van je apparaat te kiezen.
De afbeelding wordt vierkant bijgesneden tot 256 bij 256 en verkleind, zodat vijf
portretten ruim binnen de browseropslag passen. Zonder foto tonen we initialen.

Portretten verschijnen bij de teamindeling, bij het toekennen van punten, in het
klassement en op het podium.

## Foto's, video's en muziek bij vragen

Een vraag kan een afbeelding, een videofragment of een muziekfragment tonen.

1. Klik op het startscherm op **Bestanden inladen** en kies je bestanden.
2. Heet een bestand precies zoals de vraag verwacht, dan koppelt hij vanzelf.
3. Zo niet, kies het dan in de keuzelijst achter de ontbrekende regel.

De bestanden gaan in IndexedDB. Dat overleeft een herlaadbeurt en kent geen
krappe groottelimiet, in tegenstelling tot gewone browseropslag. Ze blijven op
dit apparaat en gaan nergens heen.

Ontbreekt een bestand, dan toont de vraag een nette melding en loopt de quiz
gewoon door.

> **Let op:** in de online versie werken alleen bestanden die je zelf inlaadt.
> Externe adressen (een link naar YouTube of een afbeelding elders) worden daar
> geblokkeerd. In het losse bestand op je eigen laptop werken ze wel.

## Waarom dit betrouwbaar is

- **Werkt offline.** Alles zit in het bestand. Wifi eruit? Quiz loopt door.
- **Slaat zichzelf op.** Na elke handeling gaat de stand naar de browseropslag.
  Laptop dichtgeklapt, tabblad gesloten, browser gecrasht — je krijgt bij het
  openen de vraag *Verdergaan?* en pakt de draad op waar je was.
- **Eén plek waar punten veranderen.** Elke toekenning wordt per vraag
  vastgelegd en is omkeerbaar, dus de stand kan niet stilletjes scheef lopen.
- **Ongedaan maken.** Elke scoringsactie is terug te draaien (`Z`).
- **Pauze voor middernacht.** Het laatste uur voor twaalf staat onderin hoe
  lang het nog is (Nederlandse tijd), de laatste tien minuten in het rood.
  Eén klik pauzeert de quiz en telt in het groot af naar het nieuwe jaar;
  daarna hervat je waar je was, met de klok op dezelfde seconde. **☕ Pauze**
  doet hetzelfde zonder aftellen. Oefenen: open het bestand met
  `?nieuwjaar=+5` voor een middernacht over vijf minuten.
- **Noodknoppen.** Klok stilzetten, 30 seconden erbij, terug naar een vorige
  vraag, naar een willekeurige ronde springen, punten handmatig bijstellen.
- **Geen afhankelijkheden.** Geen accounts, geen externe diensten. Alleen de
  lettertypes komen van Google Fonts; vallen die weg, dan kiest de browser een
  alternatief en werkt verder alles gewoon.

Neem het bestand mee op een usb-stick als extra back-up.

## Sneltoetsen

| Toets | Doet |
|---|---|
| `spatie` | volgende stap (in het jaaroverzicht: volgende dia) |
| `←` | een stap terug |
| `P` | klok stilzetten of laten doorlopen |
| `T` | 30 seconden erbij |
| `M` | muziek of video afspelen of pauzeren |
| `Z` | laatste actie ongedaan |
| `Esc` | venster sluiten |

## Eigen vragen toevoegen

De vragen staan op één plek: `app/src/lib/content/packs.ts`. Pas ze daar aan
en draai in `app/` `npm run content:sync`; dat schrijft hetzelfde blok naar
`index.html`. (Zonder Node kun je ook rechtstreeks in `index.html` werken, bij
`const PAKKETTEN`, maar dan lopen de twee versies uit elkaar tot je synct.)
Elke ronde ziet er zo uit:

```js
{
  naam: "Mijn ronde",
  suit: "♠",                  // ♠ ♥ ♦ ♣
  thema: "Korte ondertitel",
  type: "open",               // waarnietwaar | meerkeuze | open | dichtstbij | stem
  tijd: 30,                   // seconden per vraag
  punten: 2,                  // punten per goed antwoord
  teamModus: "teams",         // individueel | teams | samen
  aantalTeams: 2,
  optioneel: true,            // standaard uitgevinkt in de vragenkiezer
  uitleg: "Wat je voorleest bij de start van de ronde.",
  vragen: [ /* zie hieronder */ ]
}
```

En per vraagtype:

```js
// waarnietwaar
{v:"De stelling.", goed:true, toelichting:"Optionele uitleg."}

// meerkeuze — goed is de index, dus 0 = A
{v:"De vraag?", opties:["A","B","C","D"], goed:2}

// open
{v:"De vraag?", a:"Het antwoord"}

// open met beeld of songtekst
{emoji:"🦁 👑", v:"Welke film?", a:"The Lion King"}
{lyric:"Een regel uit het nummer", v:"Welk nummer?", a:"Titel — Artiest"}

// dichtstbij — dichtstbij wint, precies goed geeft bonuspunten
{v:"Hoeveel...?", getal:206, eenheid:"botten"}

// stem — iedereen kiest een medespeler; in de meespeelversie beslist de
// meerderheid vanzelf, in dit bestand beslist de groep aan tafel
{v:"Wie kwam het vaakst te laat?", a:"De groep beslist"}

// met een eigen bestand erbij
{v:"Wie zie je hier?", a:"...", media:{soort:"beeld", bron:"2026-01.jpg"}}
{v:"Welk nummer?",     a:"...", media:{soort:"muziek", bron:"intro-01.mp3"}}
{v:"Welke film?",      a:"...", media:{soort:"video", bron:"clip-01.mp4"}}

// nog geen antwoord: markeer hem, dan telt de controle vooraf hem mee
{v:"Wie won de taartcompetitie?", a:"— nog invullen —", teVullen:true}
```

Optioneel per vraag: `tijd` en `punten` overschrijven die van de ronde.

## Het jaaroverzicht bijschrijven

De tijdlijn staat bij de vragen, in `app/src/lib/content/jaaroverzicht.ts`,
en gaat met dezelfde `npm run content:sync` mee naar dit bestand (zonder Node
kun je hier rechtstreeks bij `const JAAROVERZICHT` werken). Een maand ziet er
zo uit:

```js
{
  nr: 7,
  kop: "De maand waarin alles tegelijk gebeurt",
  momenten: [
    {emoji:"😞", tekst:"Oranje gaat eruit tegen [[Marokko]], [[na strafschoppen, bij 1-1]]."},
    {emoji:"🎂", tekst:"Een regel over onszelf, zonder haken: die komt ook in de trailer."},
    {emoji:"📚", tekst:"Daarmee evenaart hij het record van Merckx en Hinault.", pasNaAfloop:true},
    {emoji:"📰", tekst:"Wat gebeurde er nog meer?", teVullen:true}
  ]
}
```

De afspraken:

- **Wat de quiz vraagt, gaat tussen dubbele haken.** Zo'n regel komt alleen
  in de film, met het antwoord onderstreept. Elke bewering met haken staat
  ook ergens in de vragen: de film voegt geen feiten toe.
- **Een regel zonder haken is ook voor de trailer.** Iets wat de quiz niet
  vraagt, vaak iets van onszelf. Er mag geen antwoord van de quiz in staan,
  ook niet via het emoji: ❄️ zegt sneeuw.
- **Raakt een regel zonder haken toch de quiz**, zoals een zin die in z'n
  geheel een waar-of-niet-waar beantwoordt, zet er dan `pasNaAfloop: true`
  bij. Dan blijft hij uit de trailer.
- **De kop van een maand** staat alleen in de film.
- Een regel die nog op invulling wacht krijgt `teVullen: true`; die slaat
  alles over.

In de meespeelversie tellen `npm run verify` en de tests hoeveel regels de
trailer heeft, en of er een antwoord van de quiz letterlijk in staat. Of een
zin iets *verraadt*, blijft mensenwerk.

Onze eigen cijfers per maand hoef je niet bij te houden: `npm run content:sync`
schrijft ze in `const ONS_JAAR`, uitgerekend op dezelfde momentopname uit
`resolution-recap` als de rondes over onszelf. De meespeelversie rekent ze op
de avond zelf uit, dus daar kloppen ze tot op de dag.

## Bronnen voor de vragen over 2026

De algemene vragen zijn nagezocht, niet uit het hoofd geschreven:

- [Spanje wint het WK van 2026](https://www.cbsnews.com/news/2026-fifa-world-cup-final-spain-argentina-sunday/) en [het verslag bij NPR](https://www.npr.org/2026/07/19/nx-s1-5899071/2026-world-cup-fifa-argentina-spain-final-championship)
- [Het medailleklassement van Milaan-Cortina](https://www.olympics.com/en/milano-cortina-2026/medals)
- [Bulgarije wint het Songfestival](https://eurovisionworld.com/esc/bulgaria-wins-the-eurovision-song-contest-2026)
- [De eindstand van de Tour de France 2026](https://www.domestiquecycling.com/en/news/tour-de-france-2026-standings/)
- [Het kabinet-Jetten](https://www.rijksoverheid.nl/regering/over-de-regering/kabinetten-sinds-1945/kabinet-jetten)
- [De Formule 1 van 2026](https://www.motorsportweek.com/2026/08/16/max-verstappen-explains-frustrations-behind-major-f1-2026-regulatory-shift/)

## De meespeelversie: televisie plus telefoons

In de map [`app/`](app/) staat dezelfde quiz als live meespeelversie: de vragen
op de grote televisie, iedereen op zijn eigen telefoon, en een hostscherm voor
de quizmaster. De televisie toont een QR-code om mee te doen, een gast schuift
aan met alleen zijn naam, bij de onthulling zie je wat iedereen had ingetikt,
je telefoon zegt of je het goed had, de slotronde is een echte stemronde, en
aan het eind staan er portretten op het podium met prijzen eronder. Elke avond
blijft bewaard op een uitslagpagina die je kunt delen. Buiten de avond om is
er een beheerscherm voor de spelers, de oude spellen, de telefoons en de
controle of de bestanden bij de vragen er echt staan. Zie
[`app/README.md`](app/README.md) voor het starten en het draaiboek.

Thuis proefdraaien met de echte televisie en de echte telefoons: `npm run
lokaal` in `app/` (op Windows: dubbelklik `app/lokaal.cmd`) start de quiz op
het thuisnetwerk en zegt welk adres je op de televisie tikt, met een QR-code
voor de telefoons erbij. Zie [Op je eigen
pc](app/README.md#op-je-eigen-pc-voor-de-televisie-en-de-telefoons). Daarna
loopt `npm run verify` elke vraag na op telefoon en televisie, zodat je weet
dat ze goed doorkomen — zie [Komen de vragen goed
door?](app/README.md#komen-de-vragen-goed-door).

Beide versies draaien dezelfde vragen: ze staan in
`app/src/lib/content/packs.ts`, en `npm run content:sync` in `app/` schrijft ze
naar dit `index.html`. Dit losse bestand blijft de achtervang die zonder
netwerk werkt.

Wil je de meespeelversie op een echte server in plaats van op een laptop, dan
staat de uitrol klaar: de `docker-compose.yml` in deze map is gemaakt voor
Dokploy, en [`app/README.md`](app/README.md#naar-productie) beschrijft stap voor
stap wat de server nodig heeft. Zet in elk geval je eigen `HOST_PIN` — zonder
eigen pincode weigert de container gezond te worden, zodat er nooit een
hostscherm online staat dat voor iedereen openstaat.

## Wat er nog aan komt

- **Antwoordbriefjes zonder server.** Dezelfde quiz, op elke telefoon te openen
  in spelersmodus: genummerde antwoordvelden per ronde, lokaal opgeslagen, zonder
  netwerk. Voor als er geen laptop met server in de buurt is.

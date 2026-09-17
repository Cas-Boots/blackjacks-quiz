# Blackjacks Kwis

Een complete quizavond in één HTML-bestand. Geen server, geen internet, geen
installatie, geen PowerPoint. Je opent `index.html` in een browser en je kunt
beginnen.

Alle vragen gaan over 2026 of over wat 2027 gaat brengen.

## Snel starten

1. Download `index.html` (of open de gepubliceerde link).
2. Dubbelklik het bestand — het opent in je browser.
3. Vul je naam als quizmaster in, pas de spelersnamen aan, kies de vragen.
4. Zet je scherm op volledig scherm (`F11`, of `ctrl`+`cmd`+`F` op een Mac).

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
uit de dagelijkse back-up van 16 september:

- **Onze Sportcompetitie** — wie het vaakst sportte, wie nooit in de sportschool
  kwam, welke sport iedereen precies één keer deed, wie zijn jaardoel al haalde.
- **Taart & Verre Landen** — de taartteller, de landenteller, de drukste
  taartdag van het jaar.

Twee rondes wachten nog op gegevens:

- **De Voorspellingen** — de elf à twaalf voorspellingen van januari.
- **De WK-poule** — te vullen met de export uit `blackjacks-cup` (`/api/quiz-export`).

Daarnaast is er een lege ronde **Oktober tot december**, want die maanden hadden
bij het schrijven nog niet plaatsgevonden.

Werk je de cijfers bij? Draai dan de analyse opnieuw tegen de nieuwste back-up in
`resolution-recap/backups/` en pas de antwoorden aan.

De openstaande vragen dragen de markering `teVullen`. Je ziet ze terug als een rood
label in de vragenkiezer, en de controle vooraf telt hoeveel gekozen vragen
nog een antwoord missen — zodat je niet per ongeluk met een onbeantwoordbare
vraag de avond in gaat.

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
- **Noodknoppen.** Klok pauzeren, 30 seconden erbij, terug naar een vorige
  vraag, naar een willekeurige ronde springen, punten handmatig bijstellen.
- **Geen afhankelijkheden.** Geen accounts, geen externe diensten. Alleen de
  lettertypes komen van Google Fonts; vallen die weg, dan kiest de browser een
  alternatief en werkt verder alles gewoon.

Neem het bestand mee op een usb-stick als extra back-up.

## Sneltoetsen

| Toets | Doet |
|---|---|
| `spatie` | volgende stap |
| `←` | een stap terug |
| `P` | klok pauzeren of hervatten |
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
blijft bewaard op een uitslagpagina die je kunt delen. Zie
[`app/README.md`](app/README.md) voor het starten en het draaiboek.

Beide versies draaien dezelfde vragen: ze staan in
`app/src/lib/content/packs.ts`, en `npm run content:sync` in `app/` schrijft ze
naar dit `index.html`. Dit losse bestand blijft de achtervang die zonder
netwerk werkt.

## Wat er nog aan komt

- **Antwoordbriefjes zonder server.** Dezelfde quiz, op elke telefoon te openen
  in spelersmodus: genummerde antwoordvelden per ronde, lokaal opgeslagen, zonder
  netwerk. Voor als er geen laptop met server in de buurt is.

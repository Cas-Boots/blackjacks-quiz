# Blackjacks Kwis

Een complete quizavond in één HTML-bestand. Geen server, geen internet, geen
installatie, geen PowerPoint. Je opent `index.html` in een browser en je kunt
beginnen.

## Snel starten

1. Download `index.html` (of open de gepubliceerde link).
2. Dubbelklik het bestand — het opent in je browser.
3. Kies een quizpakket, pas de namen aan, druk op **Start de quiz**.
4. Zet je scherm op volledig scherm (`F11`, of `ctrl`+`cmd`+`F` op een Mac).

Sluit je laptop aan op de tv met een HDMI-kabel, of cast het tabblad. Je kunt
het ook gewoon op een telefoon of tablet draaien en die laten rondgaan.

## Hoe de avond verloopt

De quizmaster bedient het scherm. Spelers schrijven hun antwoord op papier.
Per vraag: de vraag verschijnt met een aftelklok → tijd om → **Toon het
antwoord** → je tikt aan wie het goed had → volgende vraag.

Na elke ronde zie je de tussenstand, aan het eind het podium.

## Wisselende teams

Teams wisselen per ronde, maar **punten gaan altijd naar de persoon**. Zo blijft
het klassement eerlijk, hoe vaak je ook herverdeelt. Bij een teamronde krijgt
elk lid van een winnend team de punten.

Op het ronde-scherm kun je:

- op **Herverdeel** drukken voor een nieuwe willekeurige verdeling;
- op een naam tikken om die speler naar het volgende team te schuiven.

Teams heten naar de kaartkleuren: Schoppen, Harten, Ruiten, Klaveren.

## Twee pakketten

| Pakket | Rondes | Vragen | Duur |
|---|---|---|---|
| Blackjacks — Oud & Nieuw | 8 | 59 | ~75 min |
| Familie Proefronde | 5 | 32 | ~35 min |

De familieversie is de generale repetitie: dezelfde motor, makkelijkere vragen,
geschikt voor alle leeftijden.

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
| `Z` | laatste actie ongedaan |
| `Esc` | venster sluiten |

## Eigen vragen toevoegen

Open `index.html` in een teksteditor en zoek `const PAKKETTEN`. Elke ronde ziet
er zo uit:

```js
{
  naam: "Mijn ronde",
  suit: "♠",                  // ♠ ♥ ♦ ♣
  thema: "Korte ondertitel",
  type: "open",               // waarnietwaar | meerkeuze | open | dichtstbij
  tijd: 30,                   // seconden per vraag
  punten: 2,                  // punten per goed antwoord
  teamModus: "teams",         // individueel | teams | samen
  aantalTeams: 2,
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
```

Optioneel per vraag: `tijd` en `punten` overschrijven die van de ronde.

De ronde **Wie van de Blackjacks?** is bewust open gelaten: daar stemt de groep
en deel jij de punten uit met de knoppen. Vervang die vragen gerust door
insidegrappen.

## Wat dit (nog) niet doet

Meespelen op de telefoons van de spelers, live gesynchroniseerd, zit er niet in.
Dat vraagt een server, en daarmee een internetverbinding die op de avond zelf
kan wegvallen — precies het risico dat we wilden vermijden. Papier en pen zijn
hier de betrouwbare keuze.

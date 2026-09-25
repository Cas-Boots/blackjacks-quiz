/**
 * DE VRAGEN — dit is de enige plek waar je ze aanpast.
 *
 * Dit bestand is getypt (zie types.ts), dus een vergeten antwoord of een
 * verkeerd vraagtype valt bij `npm run check` al om. De losse HTML-quiz in
 * ../../../index.html krijgt hetzelfde blok via `npm run content:sync`;
 * CI controleert dat de twee gelijk lopen.
 *
 * Vraagtypes: "waarnietwaar" | "meerkeuze" | "open" | "dichtstbij" | "stem"
 * Bij "stem" kiest iedereen op zijn telefoon een medespeler; wie met de
 * meerderheid meestemt krijgt de punten. Zet er toch een `a` bij: dat is
 * wat de losse quiz laat zien, waar de groep het met de hand beslist.
 */
import type { Pakketten } from './types';

const DEMO_BEELD = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 480 300'%3E%3Crect width='480' height='300' fill='rgb(13,30,24)'/%3E%3Ctext x='240' y='128' font-family='Georgia,serif' font-size='110' fill='rgb(201,162,39)' text-anchor='middle'%3E%E2%99%A0%3C/text%3E%3Ctext x='240' y='210' font-family='Helvetica,Arial,sans-serif' font-size='24' fill='rgb(216,210,194)' text-anchor='middle'%3EVoorbeeldafbeelding%3C/text%3E%3Ctext x='240' y='245' font-family='Helvetica,Arial,sans-serif' font-size='16' fill='rgb(138,160,150)' text-anchor='middle'%3EZo verschijnt een beeldvraag op het scherm%3C/text%3E%3C/svg%3E";

export const PAKKETTEN: Pakketten = {
  jaar2026: {
    naam: "Blackjacks 2026 — Het Jaaroverzicht",
    beschrijving: "De hoofdquiz, strak in een uur: negen korte rondes die om en om wisselen tussen het jaar en onszelf, tussen ieder voor zich en in teams. Elk feit komt precies één keer voor. De uitgevinkte rondes zijn extra's.",
    rondes: [
      {
        naam: "Warmdraaien",
        suit: "♠", thema: "Waar of niet waar", sfeer: "vilt",
        type: "waarnietwaar", tijd: 15, punten: 1, teamModus: "individueel",
        uitleg: "Zes stellingen, vijftien seconden elk. Niet te lang over nadenken.",
        vragen: [
          {v:"De WK-finale werd pas in de verlenging beslist.", goed:true,
           toelichting:"Na negentig minuten stond het nog 0-0."},
          {v:"Pogačar brak in 2026 het record voor de meeste Tourzeges.", goed:false,
           toelichting:"Hij evenaarde het. Vijf zeges, net als Merckx, Hinault, Anquetil en Indurain."},
          {v:"Het kabinet-Jetten heeft een meerderheid in de Tweede Kamer.", goed:false,
           toelichting:"Een minderheidskabinet — samen 66 van de 150 zetels."},
          {v:"In 2026 vlogen er voor het eerst sinds de jaren zeventig weer mensen om de maan heen.", goed:true,
           toelichting:"Artemis II bracht vier astronauten om de maan; de capsule landde op 10 april in zee."},
          {v:"Op 1 juli 2026 ging de AOW omlaag.", goed:false,
           toelichting:"Omhoog, zoals elk half jaar."},
          {v:"Nederland won op de Winterspelen van 2026 meer dan tien keer goud.", goed:false,
           toelichting:"Precies tien keer. Wie ‘waar’ zei: net niet."}
        ]
      },
      {
        naam: "Onze Sportcompetitie",
        suit: "♥", thema: "Resolution Recap — echte cijfers", sfeer: "gras",
        type: "open", tijd: 20, punten: 2, teamModus: "individueel",
        cijfers: "sport",
        uitleg: "Het hele jaar bijgehouden, tot op de dag nauwkeurig. Nu gaat het over jullie.",
        // `live` koppelt een vraag aan de cijfers uit resolution-recap. De
        // meespeelversie rekent vraag en antwoord dan op de avond zelf uit;
        // de tekst hier is de achtervang voor de losse HTML-quiz (stand van 18 september).
        vragen: [
          {v:"Wie van ons sportte er dit jaar verreweg het vaakst?", a:"Cas — 105 keer", live:"sport.meeste",
           toelichting:"Daarna Liz met 91, Eva met 84, Bastiaan met 78, Joris met 59 en Rik met 45."},
          {v:"Wie is de enige van ons die het hele jaar geen enkele keer in de sportschool stond?", a:"Rik", live:"sport.geenGym"},
          {v:"Eén sport staat bij alle zes precies één keer genoteerd. Duidelijk één gezamenlijk uitje. Welke?", a:"Klimmen", live:"sport.gezamenlijk"},
          {v:"Wie is de enige die pilates heeft bijgehouden?", a:"Liz", live:"sport.enige:pilates"},
          {v:"Wie hadden hun jaardoel in september al binnen?", a:"Eva, Liz en Bastiaan", live:"sport.doelBinnen",
           toelichting:"Eva 84 van 60, Liz 91 van 80, Bastiaan 78 van 70. Cas, Joris en Rik zaten er nog onder."}
        ]
      },
      {
        naam: "Dichtstbij Wint",
        suit: "♦", thema: "2026 in cijfers", sfeer: "staal",
        type: "dichtstbij", tijd: 25, punten: 3, teamModus: "teams", aantalTeams: 2,
        uitleg: "In teams. Eén getal per team: het dichtstbij pakt 3 punten, precies goed levert er 5 op.",
        vragen: [
          {v:"Hoeveel landen deden er mee aan het WK voetbal van 2026?", getal:48, eenheid:"landen",
           toelichting:"Voor het eerst 48 in plaats van 32."},
          {v:"Hoeveel autobranden telde Nederland tijdens de jaarwisseling naar 2026?", getal:361, eenheid:"autobranden",
           toelichting:"Diezelfde nacht waren er ook 228 woningbranden."},
          {v:"Hoeveel punten haalde de winnaar van het Songfestival in totaal?", getal:516, eenheid:"punten"},
          {v:"Hoeveel medailles won Noorwegen in totaal op de Winterspelen?", getal:41, eenheid:"medailles"},
          {v:"Hoeveel dagen was de bemanning van Artemis II onderweg?", getal:10, eenheid:"dagen"}
        ]
      },
      {
        naam: "Sport: de Marges",
        suit: "♣", thema: "Voor de echte kenners", sfeer: "gras",
        type: "open", tijd: 20, punten: 2, teamModus: "teams", aantalTeams: 2,
        optioneel: true,
        uitleg: "In teams. Wie er wonnen weten jullie wel. Dit gaat over de details eromheen.",
        vragen: [
          {v:"In welk stadion werd de WK-finale gespeeld?", a:"MetLife Stadium, in New Jersey"},
          {v:"Hoeveel stond Evenepoel in Parijs achter op Pogačar?", a:"6 minuten en 26 seconden"},
          {v:"Welke debutant werd derde in de Tour én won de witte trui?", a:"Isaac del Toro"},
          {v:"Wie reed de groene trui naar Parijs?", a:"Mads Pedersen"},
          {v:"Op welke klim greep Carapaz in etappe 20 de bolletjestrui?", a:"Alpe d’Huez"}
        ]
      },
      {
        naam: "Vier Kaarten",
        suit: "♣", thema: "Het jaar in meerkeuze", sfeer: "oranje",
        type: "meerkeuze", tijd: 20, punten: 2, teamModus: "teams", aantalTeams: 2,
        uitleg: "Nieuwe teams. Vier antwoorden, één goed — overleg snel.",
        vragen: [
          {v:"Wie werd in februari 2026 minister-president?",
           opties:["Henri Bontenbal","Rob Jetten","Dilan Yeşilgöz","Frans Timmermans"], goed:1,
           toelichting:"Met D66, VVD en CDA, beëdigd op 23 februari."},
          {v:"Waardoor lagen het openbaar vervoer en het vliegverkeer begin 2026 grotendeels stil?",
           opties:["Een landelijke staking","Overvloedige sneeuwval","Een computerstoring","Dichte mist"], goed:1},
          {v:"Wie kwam er als invaller in en besliste de WK-finale?",
           opties:["Lamine Yamal","Ferran Torres","Álvaro Morata","Dani Olmo"], goed:1},
          {v:"Tegen welk land ging Oranje eruit op het WK?",
           opties:["Marokko","Japan","Argentinië","Brazilië"], goed:0,
           toelichting:"Na strafschoppen, bij 1-1."},
          {v:"Met welk nummer won Bulgarije het Songfestival?",
           opties:["Bangaranga","Tattoo","Espresso Macchiato","Europapa"], goed:0,
           toelichting:"Bangaranga van Dara, op het zeventigste Songfestival. Tattoo won in 2023, Europapa won helaas nooit."},
          {v:"Wie werd in Italië de succesvolste winterolympiër ooit?",
           opties:["Johannes Høsflot Klæbo","Marit Bjørgen","Ole Einar Bjørndalen","Sven Kramer"], goed:0,
           toelichting:"De Noorse langlaufer brak het record voor de meeste olympische gouden medailles."},
          {v:"Welke negentienjarige voerde lange tijd het Formule 1-kampioenschap aan?",
           opties:["Oliver Bearman","Isack Hadjar","Kimi Antonelli","Gabriel Bortoleto"], goed:2,
           toelichting:"Na de Grand Prix van Spanje had hij 292 punten. Verstappen stond zesde: Red Bull kreeg de compleet nieuwe regels niet aan de praat."}
        ]
      },
      {
        naam: "De WK-poule",
        suit: "♠", thema: "Blackjacks Cup", sfeer: "poule",
        type: "open", tijd: 20, punten: 2, teamModus: "individueel",
        optioneel: true, teVullen: true,
        uitleg: "Onze eigen poule. Vul deze ronde met de export uit blackjacks-cup en vink hem dan aan.",
        vragen: [
          {v:"Wie won uiteindelijk de poule, en met hoeveel punten?", a:"— nog invullen —", teVullen:true},
          {v:"Wie eindigde er onderaan?", a:"— nog invullen —", teVullen:true},
          {v:"Wie had Spanje vooraf als wereldkampioen aangewezen?", a:"— nog invullen —", teVullen:true},
          {v:"Wie verspilde een joker aan een wedstrijd die niets opleverde?", a:"— nog invullen —", teVullen:true},
          {v:"Welke wedstrijd voorspelde niemand van ons goed?", a:"— nog invullen —", teVullen:true}
        ]
      },
      {
        naam: "Taart & Verre Landen",
        suit: "♠", thema: "Resolution Recap — de rest", sfeer: "suiker",
        type: "open", tijd: 20, punten: 2, teamModus: "individueel",
        cijfers: "taart",
        uitleg: "Terug naar onszelf. De taartteller en de landenteller.",
        vragen: [
          {v:"Hoeveel taarten hebben we dit jaar samen weggewerkt?", a:"46", live:"taart.totaal"},
          {v:"Wie at daar in zijn eentje precies de helft van?", a:"Cas — 23 taarten", live:"taart.meeste"},
          {v:"Wie kwam het hele jaar niet verder dan één enkele taart?", a:"Bastiaan", live:"taart.minste"},
          {v:"Cas deed op één dag in augustus drie landen aan. Welke?", a:"Saoedi-Arabië, de Verenigde Arabische Emiraten en Kroatië", live:"landen.opEenDag"},
          {v:"Wie van ons kwamen het hele jaar niet buiten Nederland?", a:"Liz en Bastiaan", live:"landen.thuisblijvers"}
        ]
      },
      {
        naam: "Jullie Jaar in Beeld",
        suit: "♥", thema: "Eigen foto’s, video’s en muziek", sfeer: "bioscoop",
        type: "open", tijd: 25, punten: 2, teamModus: "teams", aantalTeams: 2,
        optioneel: true,
        uitleg: "Foto’s en filmpjes uit 2026. Laad ze in op het startscherm en vervang deze vragen door je eigen tekst.",
        vragen: [
          {v:"Zo ziet een beeldvraag eruit op het scherm.", a:"Dit is de ingebouwde voorbeeldafbeelding",
           media:{soort:"beeld", bron:DEMO_BEELD, bijschrift:"Ingebouwd voorbeeld — vervang door je eigen foto"},
           toelichting:"Deze vraag heeft geen eigen bestand nodig; de afbeelding zit in de quiz zelf."},
          {v:"Waar en wanneer is deze foto genomen?", a:"— nog invullen —", teVullen:true, media:{soort:"beeld", bron:"2026-01.jpg"}},
          {v:"Wie staat er op deze foto, en wat gebeurde er die dag?", a:"— nog invullen —", teVullen:true, media:{soort:"beeld", bron:"2026-02.jpg"}},
          {v:"Welk moment uit 2026 zie je hier?", a:"— nog invullen —", teVullen:true, media:{soort:"beeld", bron:"2026-03.jpg"}},
          {v:"Wat gebeurt er in dit filmpje?", a:"— nog invullen —", teVullen:true, media:{soort:"video", bron:"2026-video-01.mp4"}},
          {v:"Welk nummer uit 2026 is dit?", a:"— nog invullen —", teVullen:true, media:{soort:"muziek", bron:"2026-muziek-01.mp3"}},
          {v:"En dit nummer?", a:"— nog invullen —", teVullen:true, media:{soort:"muziek", bron:"2026-muziek-02.mp3"}}
        ]
      },
      {
        naam: "Bliksemronde",
        suit: "♥", thema: "Tien seconden per vraag", sfeer: "bliksem",
        type: "open", tijd: 10, punten: 1, teamModus: "individueel",
        uitleg: "Acht vragen, tien seconden elk. Eerste ingeving, meteen intikken. Tempo!",
        vragen: [
          {v:"Hoeveel wereldtitels heeft Spanje nu?", a:"Twee — 2010 en 2026"},
          {v:"Wat was de uitslag van de WK-finale?", a:"1-0"},
          {v:"Hoeveel landen organiseerden samen het WK?", a:"Drie",
           toelichting:"De Verenigde Staten, Canada en Mexico."},
          {v:"Tegen wie speelde Oranje de openingswedstrijd?", a:"Japan"},
          {v:"Tegen welk Afrikaans land won Oranje in de groepsfase?", a:"Tunesië"},
          {v:"In welke maand waren de Winterspelen?", a:"Februari",
           toelichting:"In Milaan en Cortina d’Ampezzo."},
          {v:"Welke verfilming van een Grieks epos was in 2026 een van de grootste kaskrakers?", a:"The Odyssey",
           toelichting:"Alleen Spider-Man: Brand New Day bracht in Amerika nog meer op."},
          {v:"Van welke Pixar-film verscheen in 2026 het vijfde deel?", a:"Toy Story"}
        ]
      },
      {
        naam: "De Voorspellingen",
        suit: "♦", thema: "Wat jullie in januari dachten", sfeer: "violet",
        type: "open", tijd: 20, punten: 2, teamModus: "individueel",
        teVullen: true, cijfers: "voorspellingen",
        uitleg: "Aan het begin van 2026 deed iedereen veertien voorspellingen — Cas incluis. Nu de afrekening.",
        // In de meespeelversie komen vraag en antwoord uit voorspellingen.ts;
        // vul daar de uitkomsten in. De losse HTML-quiz wacht op handwerk.
        vragen: [
          {v:"Wiens voorspellingen kwamen dit jaar het vaakst uit?", a:"— nog invullen —", teVullen:true, live:"voorspellingen.meesteGoed"},
          {v:"En wie zat er het vaakst volledig naast?", a:"— nog invullen —", teVullen:true, live:"voorspellingen.meesteFout"},
          {v:"Welke voorspelling kwam uit terwijl niemand erin geloofde?", a:"— nog invullen —", teVullen:true, live:"voorspellingen.tegenDeStroom"},
          {v:"Welke voorspelling deed bijna iedereen, en kwam toch niet uit?", a:"— nog invullen —", teVullen:true, live:"voorspellingen.bijnaIedereen"},
          {v:"Welke voorspelling is het pijnlijkst verkeerd afgelopen?", a:"— nog invullen —", teVullen:true, live:"voorspellingen.pijnlijkst"}
        ]
      },
      {
        naam: "Oktober tot december",
        suit: "♣", thema: "De staart van het jaar — zelf aanvullen", sfeer: "vuurwerk",
        type: "open", tijd: 20, punten: 2, teamModus: "individueel",
        optioneel: true, teVullen: true,
        uitleg: "Deze maanden waren er nog niet toen de quiz werd gemaakt. Vul ze in december aan.",
        vragen: [
          {v:"Wie werd wereldkampioen Formule 1 in 2026?", a:"— nog invullen —", teVullen:true},
          {v:"Wat was het grootste nieuws van het najaar?", a:"— nog invullen —", teVullen:true},
          {v:"Wat stond er dit jaar op nummer één in de Top 2000?", a:"— nog invullen —", teVullen:true},
          {v:"Welk woord werd gekozen tot woord van het jaar?", a:"— nog invullen —", teVullen:true}
        ]
      },
      {
        naam: "2027",
        suit: "♣", thema: "Vooruitkijken", sfeer: "vuurwerk",
        type: "open", tijd: 20, punten: 2, teamModus: "teams", aantalTeams: 2,
        uitleg: "In teams. Genoeg teruggekeken: wat staat er volgend jaar op de rol?",
        vragen: [
          {v:"In welk land wordt in 2027 het WK voetbal voor vrouwen gespeeld?", a:"Brazilië",
           toelichting:"De eerste keer dat dat toernooi naar Zuid-Amerika komt."},
          {v:"Wat is er op 2 augustus 2027 aan de hemel te zien?", a:"Een totale zonsverduistering",
           toelichting:"Ruim zes minuten totaliteit, onder meer boven Noord-Afrika en Egypte — een van de langste van deze eeuw."},
          {v:"Welk land organiseert het WK rugby?", a:"Australië"},
          {v:"In welke maand kiest Frankrijk een nieuwe president?", a:"April"}
        ]
      },
      {
        naam: "Wie van de Blackjacks?",
        suit: "♥", thema: "Slotronde", sfeer: "vilt",
        type: "stem", tijd: 20, punten: 3, teamModus: "individueel",
        uitleg: "Iedereen kiest een naam. De meerderheid beslist: wie meestemt met de groep krijgt de punten.",
        vragen: [
          {v:"Wie kwam dit jaar het vaakst te laat?", a:"De groep beslist"},
          {v:"Wie heeft het meeste geld uitgegeven aan iets volstrekt nutteloos?", a:"De groep beslist"},
          {v:"Wie verbreekt zijn goede voornemen het snelst?", a:"De groep beslist"},
          {v:"Wie wint volgend jaar deze quiz?", a:"De groep beslist"}
        ]
      }
    ]
  },

  familie: {
    naam: "Familie Proefronde 2026",
    beschrijving: "De generale repetitie. Zelfde jaar, makkelijkere vragen, geschikt voor alle leeftijden — in drie kwartier gespeeld. Vink hieronder aan wat je gebruikt.",
    rondes: [
      {
        naam: "Waar of Niet Waar",
        suit: "♠", thema: "Om warm te draaien", sfeer: "vilt",
        type: "waarnietwaar", tijd: 15, punten: 1, teamModus: "individueel",
        uitleg: "Ieder voor zich. Waar of niet waar — één punt per goed antwoord.",
        vragen: [
          {v:"Spanje won in 2026 het WK voetbal.", goed:true},
          {v:"Een struisvogel steekt bij gevaar zijn kop in het zand.", goed:false,
           toelichting:"Ze gaan plat op de grond liggen. Of ze rennen — tot 70 km per uur."},
          {v:"In 2026 vlogen er weer mensen om de maan heen.", goed:true,
           toelichting:"Vier astronauten, met de missie Artemis II."},
          {v:"Honing kan na een paar jaar bederven.", goed:false,
           toelichting:"In Egyptische graven is honing gevonden die na 3000 jaar nog eetbaar was."},
          {v:"Een spin is een insect.", goed:false,
           toelichting:"Spinnen hebben acht poten en twee lichaamsdelen; insecten zes en drie."},
          {v:"De zon is een ster.", goed:true}
        ]
      },
      {
        naam: "Emoji Raden",
        suit: "♥", thema: "Films en sprookjes", sfeer: "bioscoop",
        type: "open", tijd: 25, punten: 2, teamModus: "teams", aantalTeams: 2,
        uitleg: "In teams. Welk verhaal of welke film staat hier?",
        vragen: [
          {emoji:"❄️ 👭 ⛄", v:"Welke film?", a:"Frozen"},
          {emoji:"🐷 🐷 🐷 🏠 🐺", v:"Welk sprookje?", a:"De drie biggetjes"},
          {emoji:"🤖 🌱 🚀", v:"Welke film?", a:"WALL·E"},
          {emoji:"🚗 ⚡ 🏁", v:"Welke film?", a:"Cars"},
          {emoji:"🦁 👑 🌅", v:"Welke film?", a:"The Lion King"},
          {emoji:"🐘 👂 🎪", v:"Welke film?", a:"Dumbo"}
        ]
      },
      {
        naam: "Sport van het Jaar",
        suit: "♦", thema: "Voor iedereen te doen", sfeer: "gras",
        type: "meerkeuze", tijd: 20, punten: 2, teamModus: "individueel",
        uitleg: "Ieder voor zich. Kies A, B, C of D.",
        vragen: [
          {v:"In welk land waren de Olympische Winterspelen van 2026?",
           opties:["Noorwegen","Italië","Frankrijk","Zwitserland"], goed:1},
          {v:"Wie won in 2026 de Tour de France?",
           opties:["Remco Evenepoel","Mathieu van der Poel","Tadej Pogačar","Jonas Vingegaard"], goed:2},
          {v:"Hoeveel landen organiseerden samen het WK voetbal?",
           opties:["Eén","Twee","Drie","Vier"], goed:2},
          {v:"In welke sport haalt Nederland op de Winterspelen zijn medailles vooral?",
           opties:["Schaatsen","Skiën","Bobsleeën","Curling"], goed:0},
          {v:"Tegen welk land werd Oranje op het WK uitgeschakeld?",
           opties:["Japan","Marokko","Spanje","Argentinië"], goed:1}
        ]
      },
      {
        naam: "Dichtstbij Wint",
        suit: "♣", thema: "Cijferronde", sfeer: "staal",
        type: "dichtstbij", tijd: 30, punten: 3, teamModus: "teams", aantalTeams: 2,
        uitleg: "Eén getal per team. Het dichtstbij pakt 3 punten, precies goed levert er 5 op.",
        vragen: [
          {v:"Hoeveel gouden medailles won Nederland op de Winterspelen van 2026?", getal:10, eenheid:"keer goud"},
          {v:"Hoeveel treden telt de Domtoren in Utrecht?", getal:465, eenheid:"treden"},
          {v:"Hoeveel botten heeft een volwassen mens?", getal:206, eenheid:"botten"},
          {v:"Hoeveel provincies heeft Nederland?", getal:12, eenheid:"provincies"}
        ]
      },
      {
        naam: "Nederland & de Wereld",
        suit: "♠", thema: "Meerkeuze", sfeer: "oranje",
        type: "meerkeuze", tijd: 20, punten: 2, teamModus: "teams", aantalTeams: 2,
        uitleg: "Nieuwe teams. Kies A, B, C of D.",
        vragen: [
          {v:"Wie werd in 2026 minister-president van Nederland?",
           opties:["Rob Jetten","Henri Bontenbal","Dilan Yeşilgöz","Caroline van der Plas"], goed:0},
          {v:"Welk land won in 2026 het Eurovisie Songfestival?",
           opties:["Zweden","Bulgarije","Italië","Nederland"], goed:1},
          {v:"Welk dier is het grootste ter wereld?",
           opties:["De olifant","De blauwe vinvis","De giraf","De witte haai"], goed:1},
          {v:"Welke planeet staat het dichtst bij de zon?",
           opties:["Venus","Mars","Aarde","Mercurius"], goed:3},
          {v:"Wie schilderde De Nachtwacht?",
           opties:["Vincent van Gogh","Rembrandt van Rijn","Johannes Vermeer","Piet Mondriaan"], goed:1},
          {v:"Wat eet een reuzenpanda vooral?",
           opties:["Bamboe","Vis","Insecten","Vlees"], goed:0}
        ]
      },
      {
        naam: "Ons Jaar in Beeld",
        suit: "♥", thema: "Eigen familiefoto’s", sfeer: "bioscoop",
        type: "open", tijd: 30, punten: 2, teamModus: "teams", aantalTeams: 2,
        optioneel: true, teVullen: true,
        uitleg: "Oude familiefoto’s doen het hier altijd goed. Laad ze in op het startscherm.",
        vragen: [
          {v:"Wie zie je op deze foto?", a:"— nog invullen —", teVullen:true, media:{soort:"beeld", bron:"familie-01.jpg"}},
          {v:"En wie staat hierop?", a:"— nog invullen —", teVullen:true, media:{soort:"beeld", bron:"familie-02.jpg"}},
          {v:"Waar is deze foto genomen?", a:"— nog invullen —", teVullen:true, media:{soort:"beeld", bron:"familie-03.jpg"}},
          {v:"Welk nummer is dit?", a:"— nog invullen —", teVullen:true, media:{soort:"muziek", bron:"familie-muziek-01.mp3"}},
          {v:"Wat gebeurt er in dit filmpje?", a:"— nog invullen —", teVullen:true, media:{soort:"video", bron:"familie-video-01.mp4"}}
        ]
      },
      {
        naam: "Bliksemronde",
        suit: "♦", thema: "Tien seconden per vraag", sfeer: "bliksem",
        type: "open", tijd: 10, punten: 1, teamModus: "individueel",
        uitleg: "Korte vragen, tien seconden elk. Ieder voor zich, één punt per stuk. Tempo!",
        vragen: [
          {v:"Welk land verloor de WK-finale?", a:"Argentinië"},
          {v:"Hoeveel poten heeft een spin?", a:"Acht"},
          {v:"Wat is de hoofdstad van België?", a:"Brussel"},
          {v:"Hoeveel is 7 × 8?", a:"56"},
          {v:"Wat is het grootste meer van Nederland?", a:"Het IJsselmeer"},
          {v:"Hoeveel dagen telt een schrikkeljaar?", a:"366"},
          {v:"In welk werelddeel ligt Egypte?", a:"Afrika"},
          {v:"Welke kleuren heeft de Nederlandse vlag?", a:"Rood, wit en blauw"}
        ]
      }
    ]
  }
} as Pakketten;

export const PAKKET_IDS = Object.keys(PAKKETTEN);

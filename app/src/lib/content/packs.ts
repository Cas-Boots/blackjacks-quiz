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
    beschrijving: "De hoofdquiz. Elk feit komt precies één keer voor, de sportvragen gaan over de marges, en twee rondes komen rechtstreeks uit onze eigen cijfers.",
    rondes: [
      {
        naam: "Warmdraaien",
        suit: "♠", thema: "Waar of niet waar", sfeer: "vilt",
        type: "waarnietwaar", tijd: 20, punten: 1, teamModus: "individueel",
        uitleg: "Iedereen voor zich. Let op: de makkelijke helft is niet altijd de ware.",
        vragen: [
          {v:"De WK-finale werd pas in de verlenging beslist.", goed:true,
           toelichting:"Na negentig minuten stond het nog 0-0."},
          {v:"Engeland eindigde als derde op het WK.", goed:true,
           toelichting:"Frankrijk werd vierde."},
          {v:"Pogačar brak in 2026 het record voor de meeste Tourzeges.", goed:false,
           toelichting:"Hij evenaarde het. Vijf zeges, net als Merckx, Hinault, Anquetil en Indurain."},
          {v:"De Formule 1 reed in 2026 met vrijwel ongewijzigde reglementen.", goed:false,
           toelichting:"Compleet nieuwe motor-, chassis-, banden- en brandstofregels. Coureurs moesten opeens hun accu-inzet over de ronde verdelen."},
          {v:"Het kabinet-Jetten heeft een meerderheid in de Tweede Kamer.", goed:false,
           toelichting:"Een minderheidskabinet — samen 66 van de 150 zetels."},
          {v:"Max Verstappen stond halverwege 2026 in de top drie van het Formule 1-kampioenschap.", goed:false,
           toelichting:"Zesde, op ruim honderd punten van de koploper. Red Bull kreeg de nieuwe regels niet aan de praat."},
          {v:"In 2026 vlogen er voor het eerst sinds de jaren zeventig weer mensen om de maan heen.", goed:true,
           toelichting:"Artemis II bracht vier astronauten om de maan; de capsule landde op 10 april in zee."},
          {v:"Nederland won op de Winterspelen van 2026 meer dan tien keer goud.", goed:false,
           toelichting:"Precies tien keer."}
        ]
      },
      {
        naam: "Sport: de Marges",
        suit: "♥", thema: "Niet wie er won, maar hoe", sfeer: "gras",
        type: "open", tijd: 25, punten: 2, teamModus: "teams", aantalTeams: 2,
        uitleg: "In teams. Wie er wonnen weten jullie wel. Dit gaat over de details eromheen.",
        vragen: [
          {v:"Wie kwam er als invaller in en besliste daarmee de WK-finale?", a:"Ferran Torres"},
          {v:"In welk stadion werd die finale gespeeld?", a:"MetLife Stadium, in New Jersey"},
          {v:"Tegen welk land ging Oranje eruit, en op welke manier?", a:"Marokko — na strafschoppen, bij 1-1"},
          {v:"Hoeveel stond Evenepoel in Parijs achter op Pogačar?", a:"6 minuten en 26 seconden"},
          {v:"Welke debutant werd derde in de Tour én won de witte trui?", a:"Isaac del Toro"},
          {v:"Wie reed de groene trui naar Parijs?", a:"Mads Pedersen"},
          {v:"Op welke klim greep Carapaz in etappe 20 de bolletjestrui?", a:"Alpe d’Huez"},
          {v:"Welke ploeg won het ploegenklassement in de Tour?", a:"Lidl-Trek"}
        ]
      },
      {
        naam: "Dichtstbij Wint",
        suit: "♦", thema: "2026 in cijfers", sfeer: "staal",
        type: "dichtstbij", tijd: 30, punten: 3, teamModus: "teams", aantalTeams: 2,
        uitleg: "Elk team noemt één getal. Het dichtstbij pakt 3 punten, precies goed levert er 5 op.",
        vragen: [
          {v:"Hoeveel autobranden telde Nederland tijdens de jaarwisseling naar 2026?", getal:361, eenheid:"autobranden"},
          {v:"En hoeveel woningbranden waren dat diezelfde nacht?", getal:228, eenheid:"woningbranden"},
          {v:"Hoeveel punten haalde de winnaar van het Songfestival in totaal?", getal:516, eenheid:"punten"},
          {v:"Hoeveel medailles won Noorwegen in totaal op de Winterspelen?", getal:41, eenheid:"medailles"},
          {v:"Hoeveel dagen was de bemanning van Artemis II onderweg?", getal:10, eenheid:"dagen"},
          {v:"Op welke dag in juli werd de WK-finale gespeeld?", getal:19, eenheid:"juli"},
          {v:"Hoeveel punten had de koploper van het Formule 1-kampioenschap na de Grand Prix van Spanje?", getal:292, eenheid:"punten"}
        ]
      },
      {
        naam: "Nederland in 2026",
        suit: "♣", thema: "Meerkeuze", sfeer: "oranje",
        type: "meerkeuze", tijd: 25, punten: 2, teamModus: "individueel",
        uitleg: "Weer ieder voor zich. Schrijf A, B, C of D op.",
        vragen: [
          {v:"Wie werd in februari 2026 minister-president?",
           opties:["Henri Bontenbal","Rob Jetten","Dilan Yeşilgöz","Frans Timmermans"], goed:1},
          {v:"Uit welke partijen bestaat dat kabinet?",
           opties:["D66, VVD en CDA","D66, GroenLinks-PvdA en CDA","VVD, CDA en BBB","D66, VVD en JA21"], goed:0},
          {v:"Op welke datum werd het beëdigd?",
           opties:["30 januari 2026","3 februari 2026","23 februari 2026","1 maart 2026"], goed:2},
          {v:"Wanneer waren de verkiezingen die tot dit kabinet leidden?",
           opties:["29 oktober 2025","22 november 2025","18 maart 2026","6 juni 2025"], goed:0},
          {v:"Wie werd er in november 2025 als verkenner aangesteld?",
           opties:["Ronald Plasterk","Wouter Koolmees","Kim Putters","Herman Tjeenk Willink"], goed:1},
          {v:"Wanneer presenteerden de drie partijen hun regeerakkoord?",
           opties:["30 januari 2026","25 februari 2026","4 november 2025","12 december 2025"], goed:0},
          {v:"Waardoor lagen het openbaar vervoer en het vliegverkeer begin 2026 grotendeels stil?",
           opties:["Een landelijke staking","Overvloedige sneeuwval","Een computerstoring","Dichte mist"], goed:1},
          {v:"Wat gebeurde er op 1 juli 2026 met de AOW?",
           opties:["Die ging omhoog","Die ging omlaag","Die werd bevroren","De leeftijd ging omhoog"], goed:0}
        ]
      },
      {
        naam: "De Rest van de Wereld",
        suit: "♠", thema: "Buiten de sport om", sfeer: "nacht",
        type: "open", tijd: 25, punten: 2, teamModus: "teams", aantalTeams: 2,
        uitleg: "Nieuwe teams, nieuwe kansen.",
        vragen: [
          {v:"Welk land won het Songfestival, en met welk nummer?", a:"Bulgarije, met Bangaranga van Dara"},
          {v:"De hoeveelste editie van het Songfestival was dat?", a:"De zeventigste"},
          {v:"Welke Noorse langlaufer brak het record voor de meeste olympische gouden medailles?", a:"Johannes Høsflot Klæbo"},
          {v:"In welke twee Italiaanse plaatsen waren de Winterspelen?", a:"Milaan en Cortina d’Ampezzo"},
          {v:"Hoe heette de missie die in april vier astronauten om de maan bracht?", a:"Artemis II"},
          {v:"Welke negentienjarige coureur voerde lange tijd het Formule 1-kampioenschap aan?", a:"Kimi Antonelli"},
          {v:"Welke film was in 2026 de grootste kaskraker in de Amerikaanse bioscopen?", a:"Spider-Man: Brand New Day"}
        ]
      },
      {
        naam: "Onze Sportcompetitie",
        suit: "♥", thema: "Resolution Recap — echte cijfers", sfeer: "gras",
        type: "open", tijd: 30, punten: 3, teamModus: "individueel",
        uitleg: "Het hele jaar bijgehouden, tot op de dag nauwkeurig. Ieder voor zich.",
        vragen: [
          {v:"Wie van ons sportte er dit jaar verreweg het vaakst?", a:"Cas — 104 keer",
           toelichting:"Daarna Liz met 90, Eva met 83, Bastiaan met 76, Joris met 58 en Rik met 45."},
          {v:"Wie is de enige van ons die het hele jaar geen enkele keer in de sportschool stond?", a:"Rik"},
          {v:"Welke sport deed Rik dan wel, vaker dan wie ook?", a:"Padel — 27 keer"},
          {v:"Eén sport staat bij alle zes precies één keer genoteerd. Duidelijk één gezamenlijk uitje. Welke?", a:"Klimmen"},
          {v:"Wie is de enige die pilates heeft bijgehouden?", a:"Liz"},
          {v:"Wie noteerde er twaalf keer fysio?", a:"Eva"},
          {v:"Wie legde zichzelf in januari het hoogste doel op?", a:"Cas — 162 keer sporten"},
          {v:"Wie hadden hun jaardoel in september al binnen?", a:"Eva, Liz en Bastiaan",
           toelichting:"Eva 83 van 60, Liz 90 van 80, Bastiaan 76 van 70. Cas, Joris en Rik zaten er nog onder."}
        ]
      },
      {
        naam: "Taart & Verre Landen",
        suit: "♦", thema: "Resolution Recap — de rest", sfeer: "suiker",
        type: "open", tijd: 30, punten: 3, teamModus: "individueel",
        uitleg: "Dezelfde telling, andere categorieën. Ieder voor zich.",
        vragen: [
          {v:"Hoeveel taarten hebben we dit jaar samen weggewerkt?", a:"46"},
          {v:"Wie at daar in zijn eentje precies de helft van?", a:"Cas — 23 taarten"},
          {v:"Wie kwam het hele jaar niet verder dan één enkele taart?", a:"Bastiaan"},
          {v:"Op welke dag gingen er vijf taarten doorheen — de drukste taartdag van het jaar?", a:"30 januari"},
          {v:"Wie bezocht de meeste landen?", a:"Cas — twaalf stuks"},
          {v:"Hoeveel verschillende landen bezochten we samen?", a:"Dertien"},
          {v:"Cas deed op één dag in augustus drie landen aan. Welke?", a:"Saoedi-Arabië, de Verenigde Arabische Emiraten en Kroatië"},
          {v:"Wie van ons kwamen het hele jaar niet buiten Nederland?", a:"Liz en Bastiaan"}
        ]
      },
      {
        naam: "De Voorspellingen",
        suit: "♣", thema: "Wat jullie in januari dachten", sfeer: "violet",
        type: "open", tijd: 30, punten: 3, teamModus: "individueel",
        teVullen: true,
        uitleg: "Aan het begin van 2026 deed iedereen elf à twaalf voorspellingen — Cas incluis. Nu de afrekening.",
        vragen: [
          {v:"Wiens voorspellingen kwamen dit jaar het vaakst uit?", a:"— nog invullen —", teVullen:true},
          {v:"En wie zat er het vaakst volledig naast?", a:"— nog invullen —", teVullen:true},
          {v:"Welke voorspelling kwam uit terwijl niemand erin geloofde?", a:"— nog invullen —", teVullen:true},
          {v:"Welke voorspelling deed bijna iedereen, en kwam toch niet uit?", a:"— nog invullen —", teVullen:true},
          {v:"Hoeveel van alle voorspellingen zijn er samen uitgekomen?", a:"— nog invullen —", teVullen:true},
          {v:"Welke voorspelling is het pijnlijkst verkeerd afgelopen?", a:"— nog invullen —", teVullen:true},
          {v:"Wiens voorspelling verdient de prijs voor beste vooruitziende blik?", a:"— nog invullen —", teVullen:true},
          {v:"Welke voorspelling kan nog net uitkomen in de laatste dagen van het jaar?", a:"— nog invullen —", teVullen:true}
        ]
      },
      {
        naam: "De WK-poule",
        suit: "♠", thema: "Blackjacks Cup", sfeer: "poule",
        type: "open", tijd: 30, punten: 3, teamModus: "individueel",
        teVullen: true,
        uitleg: "Onze eigen poule. Vul deze ronde met de export uit blackjacks-cup.",
        vragen: [
          {v:"Wie won uiteindelijk de poule, en met hoeveel punten?", a:"— nog invullen —", teVullen:true},
          {v:"Wie eindigde er onderaan?", a:"— nog invullen —", teVullen:true},
          {v:"Wie had Spanje vooraf als wereldkampioen aangewezen?", a:"— nog invullen —", teVullen:true},
          {v:"Bij welke vooraf-vraag was één van ons de enige met het goede antwoord?", a:"— nog invullen —", teVullen:true},
          {v:"Wie haalde de meeste punten uit een joker, en op welke wedstrijd?", a:"— nog invullen —", teVullen:true},
          {v:"Wie verspilde een joker aan een wedstrijd die niets opleverde?", a:"— nog invullen —", teVullen:true},
          {v:"Welke wedstrijd voorspelde niemand van ons goed?", a:"— nog invullen —", teVullen:true},
          {v:"Wie pakte de meeste punten uit één enkele wedstrijd?", a:"— nog invullen —", teVullen:true}
        ]
      },
      {
        naam: "Jullie Jaar in Beeld",
        suit: "♥", thema: "Eigen foto’s, video’s en muziek", sfeer: "bioscoop",
        type: "open", tijd: 35, punten: 2, teamModus: "teams", aantalTeams: 2,
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
        naam: "2027",
        suit: "♦", thema: "Vooruitkijken", sfeer: "vuurwerk",
        type: "open", tijd: 25, punten: 2, teamModus: "teams", aantalTeams: 2,
        uitleg: "Genoeg teruggekeken. Wat staat er volgend jaar op de rol?",
        vragen: [
          {v:"In welk land wordt in 2027 het WK voetbal voor vrouwen gespeeld?", a:"Brazilië",
           toelichting:"De eerste keer dat dat toernooi naar Zuid-Amerika komt."},
          {v:"Welk land organiseert het WK rugby?", a:"Australië"},
          {v:"Wat is er op 2 augustus 2027 aan de hemel te zien?", a:"Een totale zonsverduistering",
           toelichting:"Ruim zes minuten totaliteit, onder meer boven Noord-Afrika en Egypte — een van de langste van deze eeuw."},
          {v:"In welke maand zijn de Franse presidentsverkiezingen?", a:"April"},
          {v:"Welke drie landen organiseren samen het WK cricket?", a:"Zuid-Afrika, Zimbabwe en Namibië"},
          {v:"Welke twee Europese landen houden landelijke verkiezingen?", a:"Italië en Polen"}
        ]
      },
      {
        naam: "Bliksemronde",
        suit: "♣", thema: "Tien seconden per vraag", sfeer: "bliksem",
        type: "open", tijd: 10, punten: 1, teamModus: "individueel",
        uitleg: "Tien vragen, tien seconden elk. Ieder voor zich, één punt per stuk. Tempo!",
        vragen: [
          {v:"Hoeveel wereldtitels heeft Spanje nu?", a:"Twee — 2010 en 2026"},
          {v:"Wat was de uitslag van de WK-finale?", a:"1-0"},
          {v:"Welk land eindigde vierde op het WK?", a:"Frankrijk"},
          {v:"Hoeveel landen organiseerden samen het WK?", a:"Drie"},
          {v:"Tegen wie speelde Oranje de openingswedstrijd?", a:"Japan"},
          {v:"In welke maand waren de Winterspelen?", a:"Februari"},
          {v:"Tegen welk Afrikaans land won Oranje in de groepsfase?", a:"Tunesië"},
          {v:"De hoeveelste Tourzege was dit voor Pogačar?", a:"De vijfde"},
          {v:"Welke verfilming van een Grieks epos was in 2026 een van de grootste kaskrakers?", a:"The Odyssey"},
          {v:"Van welke Pixar-film verscheen in 2026 het vijfde deel?", a:"Toy Story"}
        ]
      },
      {
        naam: "Oktober tot december",
        suit: "♠", thema: "De staart van het jaar — zelf aanvullen", sfeer: "vuurwerk",
        type: "open", tijd: 25, punten: 2, teamModus: "individueel",
        optioneel: true, teVullen: true,
        uitleg: "Deze maanden waren er nog niet toen de quiz werd gemaakt. Vul ze in december aan.",
        vragen: [
          {v:"Wie werd wereldkampioen Formule 1 in 2026?", a:"— nog invullen —", teVullen:true},
          {v:"Wat was het grootste nieuws van het najaar?", a:"— nog invullen —", teVullen:true},
          {v:"Wat stond er dit jaar op nummer één in de Top 2000?", a:"— nog invullen —", teVullen:true},
          {v:"Wat gebeurde er in december dat niemand zag aankomen?", a:"— nog invullen —", teVullen:true},
          {v:"Welke film moest je dit najaar gezien hebben?", a:"— nog invullen —", teVullen:true},
          {v:"Welk woord werd gekozen tot woord van het jaar?", a:"— nog invullen —", teVullen:true}
        ]
      },
      {
        naam: "Wie van de Blackjacks?",
        suit: "♥", thema: "Slotronde", sfeer: "vilt",
        type: "stem", tijd: 30, punten: 3, teamModus: "individueel",
        uitleg: "Iedereen kiest een naam. De meerderheid beslist: wie meestemt met de groep krijgt de punten.",
        vragen: [
          {v:"Wie van de vijf heeft 2026 het best gebruikt?", a:"De groep beslist"},
          {v:"Wie kwam dit jaar het vaakst te laat?", a:"De groep beslist"},
          {v:"Wie heeft het meeste geld uitgegeven aan iets volstrekt nutteloos?", a:"De groep beslist"},
          {v:"Wie belt er in 2027 als eerste met groot nieuws?", a:"De groep beslist"},
          {v:"Wie verbreekt zijn goede voornemen het snelst?", a:"De groep beslist"},
          {v:"Wie wint volgend jaar deze quiz?", a:"De groep beslist"}
        ]
      }
    ]
  },

  familie: {
    naam: "Familie Proefronde 2026",
    beschrijving: "De generale repetitie. Zelfde jaar, makkelijkere vragen, geschikt voor alle leeftijden. Vink hieronder aan wat je gebruikt.",
    rondes: [
      {
        naam: "Waar of Niet Waar",
        suit: "♠", thema: "Om warm te draaien", sfeer: "vilt",
        type: "waarnietwaar", tijd: 25, punten: 1, teamModus: "individueel",
        uitleg: "Ieder voor zich. Waar of niet waar — één punt per goed antwoord.",
        vragen: [
          {v:"Spanje won in 2026 het WK voetbal.", goed:true},
          {v:"Het WK voetbal van 2026 werd in Europa gespeeld.", goed:false,
           toelichting:"In de Verenigde Staten, Canada en Mexico."},
          {v:"Een struisvogel steekt bij gevaar zijn kop in het zand.", goed:false,
           toelichting:"Ze gaan plat op de grond liggen. Of ze rennen — tot 70 km per uur."},
          {v:"In 2026 vlogen er weer mensen om de maan heen.", goed:true,
           toelichting:"Vier astronauten, met de missie Artemis II."},
          {v:"Een olifant is het enige dier dat niet kan springen.", goed:true},
          {v:"Honing kan na een paar jaar bederven.", goed:false,
           toelichting:"In Egyptische graven is honing gevonden die na 3000 jaar nog eetbaar was."},
          {v:"Een spin is een insect.", goed:false,
           toelichting:"Spinnen hebben acht poten en twee lichaamsdelen; insecten zes en drie."},
          {v:"De zon is een ster.", goed:true}
        ]
      },
      {
        naam: "Sport van het Jaar",
        suit: "♥", thema: "Voor iedereen te doen", sfeer: "gras",
        type: "meerkeuze", tijd: 30, punten: 2, teamModus: "teams", aantalTeams: 2,
        uitleg: "In teams. Schrijf A, B, C of D op.",
        vragen: [
          {v:"In welk land waren de Olympische Winterspelen van 2026?",
           opties:["Noorwegen","Italië","Frankrijk","Zwitserland"], goed:1},
          {v:"Wie won in 2026 de Tour de France?",
           opties:["Remco Evenepoel","Mathieu van der Poel","Tadej Pogačar","Jonas Vingegaard"], goed:2},
          {v:"Hoeveel landen organiseerden samen het WK voetbal?",
           opties:["Eén","Twee","Drie","Vier"], goed:2},
          {v:"Welk land won de meeste medailles op de Winterspelen?",
           opties:["Noorwegen","Nederland","Italië","De Verenigde Staten"], goed:0},
          {v:"In welke sport haalt Nederland op de Winterspelen zijn medailles vooral?",
           opties:["Schaatsen","Skiën","Bobsleeën","Curling"], goed:0},
          {v:"Tegen welk land werd Oranje op het WK uitgeschakeld?",
           opties:["Japan","Marokko","Spanje","Argentinië"], goed:1}
        ]
      },
      {
        naam: "Dichtstbij Wint",
        suit: "♦", thema: "Cijferronde", sfeer: "staal",
        type: "dichtstbij", tijd: 40, punten: 3, teamModus: "teams", aantalTeams: 2,
        uitleg: "Eén getal per team. Het dichtstbij pakt 3 punten, precies goed levert er 5 op.",
        vragen: [
          {v:"Hoeveel gouden medailles won Nederland op de Winterspelen van 2026?", getal:10, eenheid:"keer goud"},
          {v:"Hoeveel dagen telt een schrikkeljaar?", getal:366, eenheid:"dagen"},
          {v:"Hoeveel provincies heeft Nederland?", getal:12, eenheid:"provincies"},
          {v:"Hoeveel treden telt de Domtoren in Utrecht?", getal:465, eenheid:"treden"},
          {v:"Hoeveel botten heeft een volwassen mens?", getal:206, eenheid:"botten"}
        ]
      },
      {
        naam: "Nederland & de Wereld",
        suit: "♣", thema: "Meerkeuze", sfeer: "oranje",
        type: "meerkeuze", tijd: 30, punten: 2, teamModus: "individueel",
        uitleg: "Ieder voor zich. Schrijf A, B, C of D op.",
        vragen: [
          {v:"Wie werd in 2026 minister-president van Nederland?",
           opties:["Rob Jetten","Henri Bontenbal","Dilan Yeşilgöz","Caroline van der Plas"], goed:0},
          {v:"Welk land won in 2026 het Eurovisie Songfestival?",
           opties:["Zweden","Bulgarije","Italië","Nederland"], goed:1},
          {v:"Wat is de hoofdstad van Nederland?",
           opties:["Den Haag","Rotterdam","Amsterdam","Utrecht"], goed:2},
          {v:"Welk dier is het grootste ter wereld?",
           opties:["De olifant","De blauwe vinvis","De giraf","De witte haai"], goed:1},
          {v:"Welke planeet staat het dichtst bij de zon?",
           opties:["Venus","Mars","Aarde","Mercurius"], goed:3},
          {v:"Wie schilderde De Nachtwacht?",
           opties:["Vincent van Gogh","Rembrandt van Rijn","Johannes Vermeer","Piet Mondriaan"], goed:1},
          {v:"Wat eet een reuzenpanda vooral?",
           opties:["Bamboe","Vis","Insecten","Vlees"], goed:0},
          {v:"In welk werelddeel ligt Egypte?",
           opties:["Azië","Afrika","Europa","Zuid-Amerika"], goed:1}
        ]
      },
      {
        naam: "Emoji Raden",
        suit: "♥", thema: "Films en sprookjes", sfeer: "bioscoop",
        type: "open", tijd: 40, punten: 2, teamModus: "teams", aantalTeams: 2,
        uitleg: "In teams. Welk verhaal of welke film staat hier?",
        vragen: [
          {emoji:"❄️ 👭 ⛄", v:"Welke film?", a:"Frozen"},
          {emoji:"🐷 🐷 🐷 🏠 🐺", v:"Welk sprookje?", a:"De drie biggetjes"},
          {emoji:"👧 🔴 🧺 🐺", v:"Welk sprookje?", a:"Roodkapje"},
          {emoji:"🤖 🌱 🚀", v:"Welke film?", a:"WALL·E"},
          {emoji:"🧸 🍯 🐝", v:"Welk verhaal?", a:"Winnie de Poeh"},
          {emoji:"🚗 ⚡ 🏁", v:"Welke film?", a:"Cars"},
          {emoji:"🦁 👑 🌅", v:"Welke film?", a:"The Lion King"},
          {emoji:"🐘 👂 🎪", v:"Welke film?", a:"Dumbo"}
        ]
      },
      {
        naam: "Ons Jaar in Beeld",
        suit: "♦", thema: "Eigen familiefoto’s", sfeer: "bioscoop",
        type: "open", tijd: 40, punten: 2, teamModus: "teams", aantalTeams: 2,
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
        suit: "♠", thema: "Vijftien seconden per vraag", sfeer: "bliksem",
        type: "open", tijd: 15, punten: 1, teamModus: "individueel",
        uitleg: "Korte vragen. Ieder voor zich, één punt per stuk.",
        vragen: [
          {v:"Welk land verloor de WK-finale?", a:"Argentinië"},
          {v:"In welke maand was die finale?", a:"Juli"},
          {v:"Hoeveel poten heeft een spin?", a:"Acht"},
          {v:"Wat is het grootste meer van Nederland?", a:"Het IJsselmeer"},
          {v:"Wat is de hoofdstad van België?", a:"Brussel"},
          {v:"Hoeveel is 7 × 8?", a:"56"},
          {v:"In welk seizoen vallen de blaadjes van de bomen?", a:"De herfst"},
          {v:"Hoeveel maanden heeft een jaar?", a:"Twaalf"},
          {v:"Welke kleuren heeft de Nederlandse vlag?", a:"Rood, wit en blauw"},
          {v:"Hoeveel dagen zitten er in een week?", a:"Zeven"}
        ]
      }
    ]
  }
} as Pakketten;

export const PAKKET_IDS = Object.keys(PAKKETTEN);

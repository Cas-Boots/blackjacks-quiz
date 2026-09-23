/**
 * HET JAAROVERZICHT — de film waarmee de avond begint.
 *
 * Een paar jaar geleden was het een gemonteerd filmpje van de hoogtepunten.
 * Dit is dezelfde gedachte, maar dan zo dat hij de quiz niet verklapt: het
 * jaar loopt maand voor maand langs, en over elk antwoord dat vanavond nog
 * gevraagd wordt ligt een zwarte balk. Je ziet dus precies dát het gebeurde,
 * niet wie of wat. De kamer roept er vanzelf doorheen.
 *
 * Aan het eind van de avond draait dezelfde film nog een keer — dan zonder
 * balken, want dan is alles gevraagd. Dat gebeurt vanzelf zodra de uitslag
 * geweest is; je hoeft hier niets voor om te zetten.
 *
 * Regels bij het schrijven:
 *
 * 1. **Elke bewering hier staat ook in `packs.ts`.** De vragen zijn
 *    nagezocht (zie de bronnen in de README); deze tijdlijn voegt er geen
 *    nieuwe feiten aan toe, hij zet ze op volgorde.
 * 2. **Wat de quiz vraagt, gaat in dubbele haken.** Vergeet je dat, dan
 *    geeft de film het antwoord weg. `npm run verify` telt mee hoeveel
 *    balken er per maand liggen, zodat een maand zonder balken opvalt.
 *    Alle balken zijn even breed: de lengte van het woord zegt niets.
 * 3. **De kop van een maand verraadt niets.** Hij staat pal boven de balken
 *    en mag er dus niet onder door praten — ook niet over het antwoord van
 *    een andere vraag. "Het WK begint, in drie landen tegelijk" is precies
 *    wat er niet moet staan: het aantal is een vraag van vanavond.
 * 4. **Ook de open tekst verraadt niets.** De zin rond een balk mag hem niet
 *    invullen ("bij 1-1, ■■■" is strafschoppen), en mag geen waar-of-niet-
 *    waar beantwoorden: "pas in de verlenging" staat onder een balk omdat
 *    de quiz vraagt óf de finale in de verlenging beslist werd. Pas op met
 *    het emoji ervoor, dat praat ook (❄️ voor sneeuw).
 * 5. **Soms is de plek zelf het antwoord.** De Winterspelen horen in
 *    februari, maar "In welke maand waren de Winterspelen?" is een vraag.
 *    Zo'n regel krijgt `pasNaAfloop`: hij komt alleen in de herhaling.
 *    Dat geldt ook voor een zin die in z'n geheel een waar-of-niet-waar
 *    beantwoordt, zoals dat er weer mensen om de maan vlogen.
 *
 * De test in `tests/jaaroverzicht.test.ts` vangt een kop of open tekst
 * waarin een antwoord van de quiz letterlijk staat; de rest is mensenwerk.
 *
 * De eigen cijfers — sport, taart en landen per maand — staan hier niet in.
 * Die rekent de meespeelversie op de avond zelf uit op de cijfers van
 * resolution-recap, zodat ze tot op de dag kloppen; de losse HTML-quiz
 * krijgt ze als momentopname mee via `npm run content:sync`. Wat de
 * recap-rondes daarvan vragen — taarten, landen, wie het vaakst ging —
 * ligt vanzelf onder een balk tot na de uitslag.
 */
import type { Jaaroverzicht } from './types';

export const JAAROVERZICHT: Jaaroverzicht = {
  jaar: 2026,
  titel: "Het jaar in twee minuten",
  inleiding: "Het hele jaar, zo snel als het voorbijging. Alles wat zwart blijft, is een vraag van vanavond.",
  slot: "En dat was het jaar. Nu de balken eraf — één voor één, en jullie doen het werk.",
  slotNaAfloop: "Zelfde film, zelfde jaar. Nu zonder balken: alles is gevraagd, alles is gezegd.",

  maanden: [
    {
      nr: 1,
      kop: "Het begint zoals het eindigt: met vuurwerk",
      momenten: [
        {emoji:"🎆", tekst:"De jaarwisseling levert [[361]] autobranden en [[228]] woningbranden op.",
         bij:"Het jaar is elf uur oud en de teller staat al vol."},
        {emoji:"🚆", tekst:"[[Sneeuw]] legt het openbaar vervoer en het vliegverkeer grotendeels plat."},
        {emoji:"🤝", tekst:"Eind januari presenteren [[D66, VVD en CDA]] hun regeerakkoord."},
        {emoji:"🔮", tekst:"En wij doen veertien voorspellingen over dit jaar.",
         bij:"Opgeschreven, ondertekend, niet meer weg te praten."}
      ]
    },
    {
      nr: 2,
      kop: "Op het bordes",
      momenten: [
        {emoji:"🏔️", tekst:"De Winterspelen beginnen in [[Milaan en Cortina d’Ampezzo]].", pasNaAfloop:true},
        {emoji:"🥇", tekst:"Nederland wint [[tien]] keer goud; [[Noorwegen]] gaat met [[41]] medailles aan kop.",
         bij:"Schaatsen, en nog eens schaatsen.", pasNaAfloop:true},
        {emoji:"⛷️", tekst:"Langlaufer [[Johannes Høsflot Klæbo]] breekt het record voor de meeste olympische titels.", pasNaAfloop:true},
        {emoji:"🏛️", tekst:"Het kabinet-[[Jetten]] wordt beëdigd."},
        {emoji:"🧮", tekst:"Een [[minderheids]]kabinet: samen 66 van de 150 zetels.", pasNaAfloop:true}
      ]
    },
    {
      nr: 3,
      kop: "De motoren slaan aan",
      momenten: [
        {emoji:"🏎️", tekst:"Het seizoen start met [[compleet nieuwe]] motor-, chassis-, banden- en brandstofregels.", pasNaAfloop:true},
        {emoji:"🔋", tekst:"Coureurs moeten opeens hun accu-inzet over de hele ronde verdelen.",
         bij:"Wie te vroeg vol gaat, staat op het rechte stuk stil.", pasNaAfloop:true}
      ]
    },
    {
      nr: 4,
      kop: "Terug op aarde",
      momenten: [
        {emoji:"🚀", tekst:"[[Artemis II]] brengt vier astronauten om de maan — de eerste sinds de jaren zeventig.", pasNaAfloop:true},
        {emoji:"🌊", tekst:"Een capsule plonst in zee, na [[tien]] dagen onderweg."}
      ]
    },
    {
      nr: 5,
      kop: "Het Songfestival strijkt neer",
      momenten: [
        {emoji:"🎤", tekst:"[[Bulgarije]] wint, met [[Bangaranga van Dara]]."},
        {emoji:"📣", tekst:"Goed voor [[516]] punten, in de [[zeventigste]] editie."}
      ]
    },
    {
      nr: 6,
      kop: "Het WK begint",
      momenten: [
        {emoji:"⚽", tekst:"Het toernooi opent in [[de Verenigde Staten, Canada en Mexico]]."},
        {emoji:"🇳🇱", tekst:"Oranje begint tegen [[Japan]] en wint in de groepsfase van [[Tunesië]]."},
        {emoji:"🏎️", tekst:"Na de Grand Prix van Spanje leidt [[Kimi Antonelli]] met [[292]] punten; Verstappen staat [[zesde]]."}
      ]
    },
    {
      nr: 7,
      kop: "De maand waarin alles tegelijk gebeurt",
      momenten: [
        {emoji:"💶", tekst:"De AOW gaat [[omhoog]]."},
        {emoji:"😞", tekst:"Oranje gaat eruit tegen [[Marokko]], [[na strafschoppen, bij 1-1]]."},
        {emoji:"🏆", tekst:"Op [[19]] juli wint [[Spanje]] de finale in het [[MetLife Stadium]], [[pas in de verlenging]].",
         bij:"Invaller [[Ferran Torres]] beslist hem: [[1-0]].", pasNaAfloop:true},
        {emoji:"🚴", tekst:"In Parijs wint [[Pogačar]] zijn [[vijfde]] Tour."},
        {emoji:"📚", tekst:"Daarmee evenaart hij het record van Merckx, Hinault, Anquetil en Indurain.", pasNaAfloop:true},
        {emoji:"⛰️", tekst:"[[Carapaz]] grijpt de bolletjestrui op [[Alpe d’Huez]], in etappe 20."}
      ]
    },
    {
      nr: 8,
      kop: "Zomer, en de zalen zitten vol",
      momenten: [
        {emoji:"🎬", tekst:"[[Spider-Man: Brand New Day]] wordt de grootste kaskraker in de Amerikaanse bioscopen."},
        {emoji:"🍿", tekst:"Ook vol: de verfilming van [[The Odyssey]], en een nieuw deel van [[Toy Story]]."}
      ]
    },
    {
      nr: 9,
      kop: "Nog honderd dagen te gaan",
      momenten: [
        {emoji:"🗓️", tekst:"De voorspellingen van januari beginnen erom te spannen.",
         bij:"Sommige staan er goed voor. Sommige echt niet."}
      ]
    },
    {
      nr: 10,
      kop: "De staart van het jaar",
      momenten: [
        {emoji:"📰", tekst:"Wat gebeurde er in oktober?", teVullen:true}
      ]
    },
    {
      nr: 11,
      kop: "De donkere maanden",
      momenten: [
        {emoji:"📰", tekst:"Wat gebeurde er in november?", teVullen:true}
      ]
    },
    {
      nr: 12,
      kop: "En toen was het oud en nieuw",
      momenten: [
        {emoji:"📰", tekst:"Wat gebeurde er in december?", teVullen:true},
        {emoji:"🥂", tekst:"En dan is het oud en nieuw, en zitten we hier."}
      ]
    }
  ]
};

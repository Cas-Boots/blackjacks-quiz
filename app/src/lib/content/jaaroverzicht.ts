/**
 * HET JAAROVERZICHT — een trailer vóór de quiz, de film erna.
 *
 * Een paar jaar geleden was het een gemonteerd filmpje van de hoogtepunten.
 * Dit is dezelfde gedachte, maar zo dat het de quiz niet verklapt:
 *
 * - **De trailer** opent de avond. Daarin staat alleen wat de quiz níet
 *   vraagt: de regels hieronder zonder dubbele haken, en van onze eigen
 *   cijfers alleen hoe vaak er gesport is. Geen maandkoppen, want die
 *   noemen de onderwerpen van vanavond.
 * - **De film** draait na de uitslag: alles, maand voor maand, met de
 *   antwoorden van vanavond onderstreept. Dat gebeurt vanzelf zodra de
 *   uitslag geweest is; je hoeft hier niets voor om te zetten.
 *
 * Regels bij het schrijven:
 *
 * 1. **Wat de quiz vraagt, gaat in dubbele haken.** Zo'n regel komt nooit in
 *    de trailer, alleen in de film. En elke bewering met haken staat ook in
 *    `packs.ts`: die feiten zijn nagezocht, de film zet ze op volgorde.
 * 2. **Een regel zonder haken is voor de trailer.** Iets wat de quiz niet
 *    vraagt — vaak iets van onszelf. Die feiten sta je zelf voor. Zo'n regel
 *    mag geen antwoord van de quiz bevatten, ook niet via het emoji (❄️
 *    zegt sneeuw); `tests/jaaroverzicht.test.ts` vangt een antwoord dat er
 *    letterlijk in staat.
 * 3. **Raakt een regel zonder haken toch de quiz, zet er `pasNaAfloop` bij.**
 *    "Daarmee evenaart hij het record" heeft geen haken, maar beantwoordt
 *    een waar-of-niet-waar. Met `pasNaAfloop` blijft hij uit de trailer.
 * 4. **De kop van een maand staat alleen in de film.** Daar mag hij dus
 *    alles zeggen.
 *
 * `npm run verify` telt hoeveel regels de trailer heeft; staat er bij een
 * maand niets zonder haken, dan slaat de trailer die maand over.
 *
 * De eigen cijfers — sport, taart en landen per maand — staan hier niet in.
 * Die rekent de meespeelversie op de avond zelf uit op de cijfers van
 * resolution-recap, zodat ze tot op de dag kloppen; de losse HTML-quiz
 * krijgt ze als momentopname mee via `npm run content:sync`.
 */
import type { Jaaroverzicht } from './types';

export const JAAROVERZICHT: Jaaroverzicht = {
  jaar: 2026,
  // De trailer, vóór de quiz.
  titel: "De trailer",
  inleiding: "Alvast een voorproefje van ons jaar. Wat er in de wereld gebeurde, laten we nog even weg: dat vragen we jullie zo.",
  slot: "De rest is een vraag van vanavond. Na de uitslag draait de hele film.",
  // De film, na de uitslag.
  titelNaAfloop: "Het jaar in twee minuten",
  inleidingNaAfloop: "Het hele jaar, zo snel als het voorbijging. Wat onderstreept staat, werd vanavond gevraagd.",
  slotNaAfloop: "Dat was het jaar, en dat was de quiz. Alles is gevraagd, alles is gezegd.",

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
        {emoji:"🏔️", tekst:"De Winterspelen beginnen in [[Milaan en Cortina d’Ampezzo]]."},
        {emoji:"🥇", tekst:"Nederland wint [[tien]] keer goud; [[Noorwegen]] gaat met [[41]] medailles aan kop.",
         bij:"Schaatsen, en nog eens schaatsen."},
        {emoji:"⛷️", tekst:"Langlaufer [[Johannes Høsflot Klæbo]] breekt het record voor de meeste olympische titels."},
        {emoji:"🏛️", tekst:"Het kabinet-[[Jetten]] wordt beëdigd."},
        {emoji:"🧮", tekst:"Een [[minderheids]]kabinet: samen 66 van de 150 zetels."}
      ]
    },
    {
      nr: 3,
      kop: "De motoren slaan aan",
      momenten: [
        {emoji:"🏎️", tekst:"Het seizoen start met [[compleet nieuwe]] motor-, chassis-, banden- en brandstofregels."},
        {emoji:"🔋", tekst:"Coureurs moeten opeens hun accu-inzet over de hele ronde verdelen.",
         bij:"Wie te vroeg vol gaat, staat op het rechte stuk stil.", pasNaAfloop:true}
      ]
    },
    {
      nr: 4,
      kop: "Terug op aarde",
      momenten: [
        {emoji:"🚀", tekst:"[[Artemis II]] brengt vier astronauten om de maan — de eerste sinds de jaren zeventig."},
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
         bij:"Invaller [[Ferran Torres]] beslist hem: [[1-0]]."},
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

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
 * Twee regels bij het schrijven:
 *
 * 1. **Elke bewering hier staat ook in `packs.ts`.** De vragen zijn
 *    nagezocht (zie de bronnen in de README); deze tijdlijn voegt er geen
 *    nieuwe feiten aan toe, hij zet ze op volgorde.
 * 2. **Wat de quiz vraagt, gaat in dubbele haken.** Vergeet je dat, dan
 *    geeft de film het antwoord weg. `npm run verify` telt mee hoeveel
 *    balken er per maand liggen, zodat een maand zonder balken opvalt.
 * 3. **De kop van een maand verraadt niets.** Hij staat pal boven de balken
 *    en mag er dus niet onder door praten — ook niet over het antwoord van
 *    een andere vraag. "Het WK begint, in drie landen tegelijk" is precies
 *    wat er niet moet staan: het aantal is een vraag van vanavond. De test
 *    in `tests/jaaroverzicht.test.ts` vangt het als een kop een antwoord uit
 *    diezelfde maand bevat; de rest is mensenwerk.
 *
 * De eigen cijfers — sport, taart en landen per maand — staan hier niet in.
 * Die rekent de meespeelversie op de avond zelf uit op de cijfers van
 * resolution-recap, zodat ze tot op de dag kloppen; de losse HTML-quiz
 * krijgt ze als momentopname mee via `npm run content:sync`.
 */
import type { Jaaroverzicht } from './types';

export const JAAROVERZICHT: Jaaroverzicht = {
  jaar: 2026,
  titel: "Het jaar in twee minuten",
  inleiding: "Twaalf maanden, zo snel als ze voorbijgingen. Alles wat zwart blijft, is een vraag van vanavond.",
  slot: "En dat was het jaar. Nu de balken eraf — één voor één, en jullie doen het werk.",
  slotNaAfloop: "Zelfde film, zelfde jaar. Nu zonder balken: alles is gevraagd, alles is gezegd.",

  maanden: [
    {
      nr: 1,
      kop: "Het begint zoals het eindigt: met vuurwerk",
      momenten: [
        {emoji:"🎆", tekst:"De jaarwisseling levert [[361]] autobranden en [[228]] woningbranden op.",
         bij:"Het jaar is elf uur oud en de teller staat al vol."},
        {emoji:"❄️", tekst:"Een pak [[sneeuw]] legt het openbaar vervoer en het vliegverkeer grotendeels plat."},
        {emoji:"🤝", tekst:"Op 30 januari presenteren [[D66, VVD en CDA]] hun regeerakkoord."},
        {emoji:"🔮", tekst:"En wij doen veertien voorspellingen over dit jaar.",
         bij:"Opgeschreven, ondertekend, niet meer weg te praten."}
      ]
    },
    {
      nr: 2,
      kop: "In de sneeuw, en op het bordes",
      momenten: [
        {emoji:"🏔️", tekst:"De Winterspelen beginnen in [[Milaan en Cortina d’Ampezzo]]."},
        {emoji:"🥇", tekst:"Nederland wint [[tien]] keer goud; [[Noorwegen]] gaat met [[41]] medailles aan kop.",
         bij:"Schaatsen, en nog eens schaatsen."},
        {emoji:"⛷️", tekst:"Langlaufer [[Johannes Høsflot Klæbo]] breekt het record voor de meeste olympische titels."},
        {emoji:"🏛️", tekst:"Op 23 februari wordt het kabinet-[[Jetten]] beëdigd: een [[minderheids]]kabinet, samen 66 zetels."}
      ]
    },
    {
      nr: 3,
      kop: "De motoren slaan aan",
      momenten: [
        {emoji:"🏎️", tekst:"Het seizoen start met [[compleet nieuwe]] motor-, chassis-, banden- en brandstofregels."},
        {emoji:"🔋", tekst:"Coureurs moeten opeens hun accu-inzet over de hele ronde verdelen.",
         bij:"Wie te vroeg vol gaat, staat op het rechte stuk stil."}
      ]
    },
    {
      nr: 4,
      kop: "Vier mensen om de maan",
      momenten: [
        {emoji:"🚀", tekst:"[[Artemis II]] brengt vier astronauten om de maan — de eerste sinds de jaren zeventig."},
        {emoji:"🌊", tekst:"Na [[tien]] dagen landt de capsule op 10 april in zee."}
      ]
    },
    {
      nr: 5,
      kop: "Het Songfestival strijkt neer",
      momenten: [
        {emoji:"🎤", tekst:"[[Bulgarije]] wint, met [[Bangaranga]] van Dara."},
        {emoji:"📣", tekst:"Goed voor [[516]] punten, in de [[zeventigste]] editie."}
      ]
    },
    {
      nr: 6,
      kop: "Het WK begint, aan de overkant van de oceaan",
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
        {emoji:"💶", tekst:"Op 1 juli gaat de AOW [[omhoog]]."},
        {emoji:"😞", tekst:"Oranje gaat eruit tegen [[Marokko]] — bij 1-1, [[na strafschoppen]]."},
        {emoji:"🏆", tekst:"Op [[19]] juli wint [[Spanje]] de finale in het [[MetLife Stadium]], pas in de verlenging.",
         bij:"Invaller [[Ferran Torres]] maakt de enige goal van de wedstrijd."},
        {emoji:"🚴", tekst:"In Parijs evenaart [[Pogačar]] het record: [[vijf]] Tourzeges, net als Merckx en Hinault."},
        {emoji:"⛰️", tekst:"[[Carapaz]] grijpt de bolletjestrui op [[Alpe d’Huez]], in etappe 20."}
      ]
    },
    {
      nr: 8,
      kop: "Zomer, en de zalen zitten vol",
      momenten: [
        {emoji:"🎬", tekst:"[[Spider-Man: Brand New Day]] wordt de grootste kaskraker in de Amerikaanse bioscopen."},
        {emoji:"🏺", tekst:"Ook vol: de verfilming van [[The Odyssey]], en het vijfde deel van [[Toy Story]]."}
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

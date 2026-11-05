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

/**
 * Wie hoeveel van het nieuws weet (1 is gewoon, hoger is meer). De teams
 * in de nieuwsrondes worden zo verdeeld dat ze samen even sterk zijn.
 * Cas is quizmaster en speelt niet mee.
 */
const NIEUWS = { Joris: 4, Rik: 3, Eva: 2, Liz: 1, Bastiaan: 1 };
/** Hetzelfde voor muziek: Joris en Rik komen zo nooit in hetzelfde team. */
const MUZIEK = { Joris: 3, Rik: 3 };

export const PAKKETTEN: Pakketten = {
  jaar2026: {
    naam: "Blackjacks 2026 — Het Jaaroverzicht",
    beschrijving: "De hoofdquiz, in twee uur en vóór middernacht klaar: negen korte rondes die om en om wisselen tussen het jaar en onszelf, tussen ieder voor zich en in teams. Elk onderwerp uit het nieuws komt precies één keer voor; alleen over onszelf mag het vaker. De uitgevinkte rondes zijn extra's.",
    rondes: [
      {
        naam: "Warmdraaien",
        suit: "♠", thema: "Waar of niet waar", sfeer: "vilt",
        type: "waarnietwaar", tijd: 30, punten: 1, teamModus: "individueel",
        uitleg: "Het grote nieuws van 2026. Waar of niet waar? Iedereen voor zich.",
        vragen: [
          {reserve:true, v:"Sinds 1 juli betaal je minstens drie euro extra voor een pakketje van Temu of Shein.", goed:true,
           toelichting:"Een Europese heffing op pakketjes van buiten de EU onder de 150 euro: drie euro per soort product. Een shirt, een hoesje en een oplader kosten dus negen euro extra."},
          {reserve:true, v:"Arsenal won in 2026 eindelijk zijn eerste Champions League.", goed:false,
           toelichting:"Paris Saint-Germain won de finale in Boedapest na 1-1 en strafschoppen, en prolongeerde zo zijn titel."},
          {reserve:true, v:"Pogačar brak in 2026 het record voor de meeste Tourzeges.", goed:false,
           toelichting:"Hij evenaarde het. Met zijn vijfde zege staat hij naast Merckx, Hinault, Anquetil en Indurain."},
          {reserve:true, v:"Voor het eerst won een Spaanstalig album de Grammy voor album van het jaar.", goed:true,
           toelichting:"DeBÍ TiRAR MáS FOToS van Bad Bunny, op 1 februari in Los Angeles."},
          // Groot nieuws dat iedereen heeft meegekregen, kort en helder
          // gezegd. Zie CLAUDE.md.
          {v:"Rob Jetten werd de jongste premier ooit.", goed:true,
           toelichting:"38 jaar, beëdigd op 23 februari. Het record was van Ruud Lubbers: 43, in 1982."},
          {v:"Nederland eindigde op de Winterspelen in de top 3 van de medaillespiegel.", goed:true,
           toelichting:"Derde, voor het eerst ooit: tien keer goud. Alleen Noorwegen (18) en de VS (12) wonnen meer."},
          // Na de onthulling kort de winnaar laten zien (naOnthulling).
          {v:"Zweden won dit jaar het Songfestival.", goed:false,
           toelichting:"Nee: Bulgarije, voor het eerst ooit, met Bangaranga van Dara. Volgend jaar is het daar.",
           naOnthulling:{soort:"video", bron:"songfestival-2026-winnaar.mp4", bijschrift:"Dara — Bangaranga"}},
          {v:"Taylor Swift trad op in de rust van de Super Bowl.", goed:false,
           toelichting:"Nee, Bad Bunny, bijna helemaal in het Spaans. Midden in de show trouwde er écht een stel op het podium."},
          {reserve:true, v:"De maanvlucht van Artemis II duurde langer dan twee weken.", goed:false,
           toelichting:"Tien dagen: van 1 tot 10 april. Ze kwamen wel verder van de aarde dan ooit een mens."},
          {v:"De opvouwbare iPhone kost in Nederland meer dan 2.000 euro.", goed:true,
           toelichting:"Vanaf € 2.339 voor de iPhone Duo: de duurste iPhone ooit."},
          {reserve:true, v:"De VS namen de president van Venezuela gevangen.", goed:true,
           toelichting:"Nicolás Maduro, op 3 januari, na Amerikaanse luchtaanvallen. Hij werd naar New York gevlogen en aangeklaagd."},
          {reserve:true, v:"Nederland deed dit jaar niet mee aan het Songfestival.", goed:true,
           toelichting:"AVROTROS bleef weg uit Wenen omdat Israël mocht meedoen. De NPO zond het wel uit."},
          {reserve:true, v:"Oranje haalde op het WK de halve finale.", goed:false,
           toelichting:"Oranje ging eruit tegen Marokko, na strafschoppen."},
          {reserve:true, v:"Het minimumloon ging dit jaar boven de 15 euro per uur.", goed:false,
           toelichting:"Net niet: sinds 1 juli is het € 14,99 bruto per uur."},
          // Albert Heijn staat al als schatvraag in Dichtstbij Wint.
          {reserve:true, v:"Door een storing bleven in oktober schappen bij Albert Heijn leeg.", goed:true,
           toelichting:"Een IT-incident bij Ahold Delhaize. Ook Etos en Gall & Gall lagen eruit."},
          {reserve:true, v:"Bij haar arrestatie bood Britney Spears de agenten lasagne aan.", goed:true,
           toelichting:"Op 4 maart, voor rijden onder invloed. Een duik in haar zwembad mocht ook."},
          {reserve:true, v:"Hackers stookten Franse supermarktkoelingen op tot 50 graden.", goed:true,
           toelichting:"In oktober, bij honderden winkels. Al het verse eten moest weg."},
          {reserve:true, v:"Realityster Spencer Pratt werd burgemeester van Los Angeles.", goed:false,
           toelichting:"Hij deed echt mee en lag even voor, maar werd derde."},
          {reserve:true, v:"Voor het eerst sinds 1972 vlogen er mensen om de maan.", goed:true,
           toelichting:"Artemis II, met vier astronauten aan boord."},
          {reserve:true, v:"Op 1 juli 2026 ging de AOW omlaag.", goed:false,
           toelichting:"Omhoog, zoals elk half jaar."},
          // GTA VI staat nu als schatvraag in Dichtstbij Wint.
          {reserve:true, v:"GTA VI kwam in mei uit, zoals beloofd.", goed:false,
           toelichting:"Rockstar stelde de game nog een keer uit, naar 19 november."}
        ]
      },
      {
        naam: "Hoger of Lager",
        suit: "♥", thema: "Onze eigen cijfers, geschat", sfeer: "staal",
        type: "dichtstbij", tijd: 30, punten: 3, teamModus: "individueel",
        optioneel: true,
        uitleg: "Ieder voor zich een getal over onszelf. Het dichtstbij pakt 3 punten, precies goed levert er 5 op.",
        // Net als bij de sportcompetitie rekent de meespeelversie deze getallen
        // op de avond zelf uit; hier staat de stand van 18 september.
        vragen: [
          {v:"Hoeveel keer hebben we dit jaar met z’n allen gesport?", getal:462, eenheid:"keer", live:"getal.sportSamen"},
          {v:"Hoeveel keer stonden we dit jaar samen in de sportschool?", getal:269, eenheid:"keer", live:"getal.sportSamen:gym"},
          {v:"Hoeveel keer noteerde Rik dit jaar padel?", getal:27, eenheid:"keer", live:"getal.sportVan:Rik/padel"},
          {v:"Joris nam zich in januari voor om 105 keer te sporten. Hoeveel keer stond de teller in september?", getal:59, eenheid:"keer", live:"getal.doelVan:Joris"},
          {v:"Hoeveel verschillende sporten hebben we dit jaar samen bijgehouden?", getal:20, eenheid:"sporten", live:"getal.sportSoorten"}
        ]
      },
      {
        naam: "Vier Kaarten",
        suit: "♦", thema: "Het jaar in meerkeuze", sfeer: "oranje",
        type: "meerkeuze", tijd: 60, punten: 2, teamModus: "teams", aantalTeams: 2,
        kennis: NIEUWS,
        optioneel: true,
        uitleg: "Nieuwe teams. Steeds één antwoord goed — overleg snel.",
        vragen: [
          // De premier, Oranje, het Songfestival en de Winterspelen staan al elders: hier reserve.
          {reserve:true, v:"Wie werd in februari 2026 minister-president?",
           opties:["Henri Bontenbal","Rob Jetten","Dilan Yeşilgöz","Frans Timmermans"], goed:1,
           toelichting:"Met D66, VVD en CDA, beëdigd op 23 februari."},
          {v:"Welke film won in maart de Oscar voor beste film? Tip: de titel telt vier woorden.",
           opties:["Sinners","One Battle After Another","Hamnet","Marty Supreme"], goed:1,
           toelichting:"Paul Thomas Anderson ging met zes Oscars naar huis; Sinners won er vier."},
          {reserve:true, v:"Tegen welk land ging Oranje eruit op het WK?",
           opties:["Marokko","Japan","Argentinië","Brazilië"], goed:0,
           toelichting:"Na strafschoppen, bij 1-1."},
          {v:"Op 12 augustus werd het even nacht. Waar was de zonsverduistering totaal?",
           opties:["Lyon","Bilbao","Belfast"], goed:1,
           toelichting:"Een halve minuut maar: Bilbao lag vlak bij de rand van de schaduw. In Lyon en Belfast bleef het bij zo'n 93 procent van de zon."},
          {reserve:true, v:"Met welk nummer won Bulgarije het Songfestival?",
           opties:["Bangaranga","Tattoo","Espresso Macchiato","Europapa"], goed:0,
           toelichting:"Bangaranga van Dara, op het zeventigste Songfestival. Tattoo won in 2023, Europapa won helaas nooit."},
          {reserve:true, v:"Welke Noorse langlaufer werd in Italië de succesvolste winterolympiër ooit?",
           opties:["Johannes Høsflot Klæbo","Sven Kramer","Ireen Wüst","Shaun White"], goed:0,
           toelichting:"De Noorse langlaufer brak het record voor de meeste olympische gouden medailles."},
          {v:"Welke negentienjarige Italiaan voerde lange tijd het Formule 1-kampioenschap aan?",
           opties:["Oliver Bearman","Isack Hadjar","Kimi Antonelli","Gabriel Bortoleto"], goed:2,
           toelichting:"Na de Grand Prix van Spanje had hij 292 punten. Verstappen stond zesde: Red Bull kreeg de compleet nieuwe regels niet aan de praat."}
        ]
      },
      {
        naam: "De WK-poule",
        suit: "♣", thema: "Blackjacks Cup", sfeer: "poule",
        type: "open", tijd: 30, punten: 2, teamModus: "individueel",
        optioneel: true,
        uitleg: "Onze eigen poule, uit de export van blackjacks-cup. Vink hem aan om mee te doen.",
        vragen: [
          {v:"Wie won uiteindelijk de poule, en met hoeveel punten?", a:"Liz — 221 punten", live:"poule.winnaar",
           toelichting:"Daarna Bastiaan met 203, Cas met 187, Joris met 181, Eva met 152 en Rik met 142."},
          {v:"Wie eindigde er onderaan?", a:"Rik — 142 punten", live:"poule.onderaan",
           toelichting:"Nog 10 punten achter Eva."},
          {v:"Iedereen op één na had Spanje vooraf als wereldkampioen aangewezen. Wie niet?", a:"Eva (Frankrijk)", live:"poule.kampioen",
           toelichting:"Eva liet 20 punten liggen."},
          {v:"Bij welke vooraf-vraag was één van ons de enige met het goede antwoord?", a:"Finalist (B) — Joris (Argentinië)", live:"poule.enigeGoed",
           toelichting:"Ook goed: Winnaar Groep D — Liz (de Verenigde Staten) en Winnaar Groep K — Cas (Colombia)."},
          {v:"Wie haalde de meeste punten uit een joker, en op welke wedstrijd?", a:"Bastiaan op Argentinië–Zwitserland (3-1) en Liz op Noorwegen–Engeland (1-2)", live:"poule.jokerBest",
           toelichting:"12 punten elk: de uitslag precies goed, en dubbel door de joker."},
          {v:"Drie van ons verspilden een joker aan een wedstrijd die niets opleverde. Wie?", a:"Bastiaan en Liz op Nederland–Marokko (1-1) en Joris op Duitsland–Paraguay (1-1)", live:"poule.jokerVerspild"},
          {v:"Welke wedstrijd van de latere wereldkampioen Spanje voorspelde niemand van ons goed?", a:"Spanje–Kaapverdië (0-0)", live:"poule.niemandGoed",
           toelichting:"In totaal leverden achttien wedstrijden niemand van ons iets op."},
          {v:"Wie had de meeste uitslagen precies goed?", a:"Liz — negen keer", live:"poule.exact",
           toelichting:"Daarna Bastiaan met 6, Cas met 6, Eva met 3, Joris met 3 en Rik met 2."}
        ]
      },
      {
        naam: "Onze Sportcompetitie",
        suit: "♠", thema: "Resolution Recap — echte cijfers", sfeer: "gras",
        type: "open", tijd: 30, punten: 2, teamModus: "individueel",
        cijfers: "sport",
        uitleg: "Het hele jaar bijgehouden, tot op de dag nauwkeurig. Nu gaat het over jullie.",
        // `live` koppelt een vraag aan de cijfers uit resolution-recap. De
        // meespeelversie rekent vraag en antwoord dan op de avond zelf uit;
        // de tekst hier is de achtervang voor de losse HTML-quiz (stand van 4 november).
        vragen: [
          {v:"Wie haalde dit jaar het hoogste percentage van zijn eigen jaardoel?", a:"Eva — 163 procent", live:"sport.doelProcent",
           toelichting:"98 keer sporten op een doel van 60. Daarna Liz met 136 procent."},
          {v:"Wie sportte dit jaar vaker: Liz of Eva?", a:"Liz — 109 tegen 98", live:"sport.duel:Liz/Eva"},
          {v:"In welke maand sportten we met z’n allen het meest?", a:"oktober — 75 keer", live:"sport.drukkeMaand",
           toelichting:"Daarna april met 68."},
          {v:"Wat deden we dit jaar vaker: hardlopen of padel?", a:"Padel — 90 tegen 80", live:"sport.sportDuel",
           toelichting:"Na de sportschool, die met afstand bovenaan staat."},
          // Terugblik: 2025 was ons eerste sportjaar (cijfers in recap/vorigjaar.ts).
          {v:"Wie ging er vergeleken met vorig jaar het meest op vooruit?", a:"Rik — van 20 naar 59 keer", live:"sport.vooruit",
           toelichting:"Dat is 195 procent meer. Daarna Eva: van 44 naar 98."},
          // Reserve: niet sterk genoeg, of zonder referentie om te raden.
          {reserve:true, v:"Wie had als eerste zijn jaardoel binnen?", a:"Eva — op 27 juli", live:"sport.doelEerst:anders",
           toelichting:"Daarna Liz op 10 augustus en Bastiaan op 23 augustus."},
          {reserve:true, v:"Welke van deze sporten staat níet in onze top vier: hardlopen, klimmen, padel, skiën of sportschool?", a:"Klimmen — 6 keer", live:"sport.nietInTop",
           toelichting:"De top vier: sportschool (269), hardlopen (65), padel (61) en skiën (17)."},
          {reserve:true, v:"Eén sport staat bij alle zes precies één keer genoteerd. Duidelijk één gezamenlijk uitje. Welke?", a:"Klimmen", live:"sport.gezamenlijk"},
          {reserve:true, v:"Welke sport deden we samen het vaakst, als je de sportschool niet meetelt?", a:"Hardlopen — 65 keer", live:"sport.naGym",
           toelichting:"Daarna padel met 61."},
          {reserve:true, v:"Wie van ons sportte er dit jaar verreweg het vaakst?", a:"Cas — 105 keer", live:"sport.meeste",
           toelichting:"Daarna Liz met 91, Eva met 84, Bastiaan met 78, Joris met 59 en Rik met 45."},
          {reserve:true, v:"Wie is de enige van ons die het hele jaar geen enkele keer in de sportschool stond?", a:"Rik", live:"sport.geenGym"},
          {reserve:true, v:"Wie is de enige die pilates heeft bijgehouden?", a:"Liz", live:"sport.enige:pilates"},
          {reserve:true, v:"Wie hadden hun jaardoel in september al binnen?", a:"Eva, Liz en Bastiaan", live:"sport.doelBinnen", tijd:60,
           toelichting:"Eva 84 van 60, Liz 91 van 80, Bastiaan 78 van 70. Cas, Joris en Rik zaten er nog onder."},
          {reserve:true, v:"Welke van deze sporten heeft niemand van ons dit jaar gedaan: boulderen, fietsen, hockey of kajakken?", a:"Hockey", live:"sport.nietGedaan",
           toelichting:"De rest deed wel iemand: boulderen (Rik), fietsen (Cas) en kajakken (Cas)."}
        ]
      },
      {
        naam: "Dichtstbij Wint",
        suit: "♥", thema: "2026 in cijfers", sfeer: "staal",
        type: "dichtstbij", tijd: 60, punten: 3, teamModus: "teams", aantalTeams: 2,
        // Hier gokt iedereen, dus weegt kennis het minst. Joris en Rik spelen
        // hier daarom altijd samen: zo zie je ze één keer als duo, en voelen
        // de eerlijke teams in de andere rondes gewoon willekeurig.
        samen: ["Joris", "Rik"],
        uitleg: "In teams. Eén getal per team: het dichtstbij pakt 3 punten, precies goed levert er 5 op.",
        vragen: [
          // Een schatting van experts, geen cijfer van Albert Heijn zelf: zo staat het er ook.
          {v:"Door de hack in oktober liep Albert Heijn een week lang omzet mis. Hoeveel miljoen euro, volgens experts?", getal:150, eenheid:"miljoen euro",
           toelichting:"Tot 150 miljoen, rekende retailexpert Laurens Sloot uit. Een gewone week is goed voor zo'n 360 miljoen. Bron: RTL Z, 20 oktober 2026."},
          {reserve:true, v:"Een supermarktkoeling staat op zo'n 4 graden. Hackers zetten die van honderden Franse supermarkten in oktober hoger. Tot hoeveel graden?", getal:50, eenheid:"graden",
           toelichting:"Vijftig graden: van koelvak naar sauna. Al het verse eten moest weg, en hier en daar ontstond brand."},
          {reserve:true, v:"Wat kostte een gemiddeld koophuis in Nederland in september 2026?", getal:504658, eenheid:"euro",
           toelichting:"€ 504.658, volgens CBS en Kadaster: 2,9 procent meer dan een jaar eerder."},
          {reserve:true, v:"Het verstoten aapje Punch sjouwde overal een IKEA-knuffel mee. Hoeveel euro kost die knuffel?", getal:14.99, eenheid:"euro",
           toelichting:"€ 14,99 voor DJUNGELSKOG, de orang-oetan. Het filmpje ging de hele wereld over, en IKEA Japan stuurde de dierentuin een doos reserveknuffels."},
          {reserve:true, v:"Hoeveel cent kost sinds 1 januari 2026 een gewone postzegel?", getal:140, eenheid:"cent",
           toelichting:"€1,40. En sinds juli komt je brief standaard binnen twee dagen, niet meer de volgende dag."},
          {v:"Hoeveel autobranden telde Nederland tijdens de jaarwisseling naar 2026?", getal:361, eenheid:"autobranden",
           toelichting:"Diezelfde nacht waren er ook 228 woningbranden."},
          {reserve:true, v:"Hoeveel punten scoorde Seattle in de Super Bowl?", getal:29, eenheid:"punten",
           toelichting:"29-13 tegen New England. Kicker Jason Myers schoot een record van vijf velddoelpunten."},
          {reserve:true, v:"Hoeveel wandelaars haalden in juli de finish van de Vierdaagse in Nijmegen?", getal:42137, eenheid:"wandelaars",
           toelichting:"Er gingen er 45.761 van start. Het record, 42.777, is van een jaar eerder."},
          // GTA VI hoort er hoe dan ook in (CLAUDE.md). Het getal volgt na de
          // release op 19 november; tot dan herinnert de controle vooraf eraan.
          // Pas dan ook de film aan.
          {v:"Hoeveel mensen speelden GTA VI op de eerste dag?", getal:0, eenheid:"spelers", teVullen:true,
           toelichting:"— nog invullen na de release op 19 november —"}
        ]
      },
      {
        naam: "Taart & Verre Landen",
        suit: "♣", thema: "Resolution Recap — de rest", sfeer: "suiker",
        type: "open", tijd: 30, punten: 2, teamModus: "individueel",
        cijfers: "taart",
        uitleg: "Terug naar onszelf. De taartteller en de landenteller.",
        vragen: [
          // Terugblik: 2024 was het taartjaar (cijfers in recap/vorigjaar.ts).
          {v:"Wie was in 2024 onze taartkoning?", a:"Joris — 33 taarten", live:"taart.koning2024",
           toelichting:"En dit jaar? Vijf."},
          // Een getal in een open ronde: de quizmaster vinkt wie het dichtst zit goed.
          {v:"In 2024 aten we samen 80,5 taarten. Hoeveel waren het er dit jaar? Wie het dichtst bij zit, wint.", a:"49 taarten", live:"taart.totaalVs2024",
           toelichting:"39 procent minder. Joris at er in 2024 in zijn eentje al 33."},
          {reserve:true, v:"Wie at er dit jaar méér taart dan in 2024?", a:"Eva en Cas", live:"taart.meerDan2024", tijd:60,
           toelichting:"Eva van 1 naar 9 en Cas van 19,5 naar 24."},
          {reserve:true, v:"Hoeveel taarten hebben we dit jaar samen weggewerkt?", a:"46", live:"taart.totaal"},
          {reserve:true, v:"Wie at daar in zijn eentje precies de helft van?", a:"Cas — 23 taarten", live:"taart.meeste"},
          {v:"Wie kwam het hele jaar niet verder dan één enkele taart?", a:"Bastiaan", live:"taart.minste"},
          {reserve:true, v:"Cas deed op één dag in augustus drie landen aan. Welke?", a:"Saoedi-Arabië, de Verenigde Arabische Emiraten en Kroatië", live:"landen.opEenDag", tijd:60},
          {v:"Wie van ons kwamen het hele jaar niet buiten Nederland?", a:"Liz en Bastiaan", live:"landen.thuisblijvers", tijd:60}
        ]
      },
      {
        naam: "2026 in Emoji",
        suit: "♠", thema: "Het nieuws in plaatjes", sfeer: "bioscoop",
        type: "open", tijd: 60, punten: 2, teamModus: "teams", aantalTeams: 2,
        kennis: NIEUWS,
        uitleg: "In teams. Welk nieuws, welke film of welk evenement uit 2026 staat hier?",
        vragen: [
          {emoji:"❄️ 🚆 🚫 ✈️", v:"Wat legde begin 2026 half Nederland stil?", a:"Overvloedige sneeuwval",
           toelichting:"Het openbaar vervoer en het vliegverkeer lagen grotendeels stil."},
          {emoji:"🏜️ 🚙 🇶🇦 6️⃣", v:"Welke race, en wie won hem voor de zesde keer?", a:"De Dakar Rally — Nasser Al-Attiyah",
           toelichting:"In januari, en voor het eerst in een Dacia."},
          {emoji:"🕷️ 🧑 🆕 🌅", v:"Welke film?", a:"Spider-Man: Brand New Day",
           toelichting:"De grootste kaskraker van het jaar in de Amerikaanse bioscopen."},
          {reserve:true, emoji:"📚 🎁 🛵 👴", v:"Welk boek kreeg je in maart cadeau bij de boekwinkel?", a:"Piaggio van Hendrik Groen",
           toelichting:"Het Boekenweekgeschenk. Achter Hendrik Groen bleek Peter de Smet te zitten."},
          {emoji:"🎾 🍓 🇨🇿 🆚 🇨🇿", v:"Welke finale, in juli?", a:"De vrouwenfinale van Wimbledon",
           toelichting:"Linda Nosková versloeg landgenote Karolína Muchová. Bij de mannen prolongeerde Jannik Sinner."}
        ]
      },
      {
        naam: "Jullie Jaar in Beeld",
        suit: "♥", thema: "Eigen foto’s, video’s en muziek", sfeer: "bioscoop",
        type: "open", tijd: 60, punten: 2, teamModus: "teams", aantalTeams: 2,
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
        suit: "♦", thema: "Korte vragen, snel punten", sfeer: "bliksem",
        type: "open", tijd: 30, punten: 1, teamModus: "individueel",
        optioneel: true,
        uitleg: "Vier korte vragen, één punt per stuk. Eerste ingeving, meteen intikken. Tempo!",
        vragen: [
          {v:"Uit welk land kwam de winnaar van de marathon van Rotterdam?", a:"Ethiopië",
           toelichting:"Guye Adola, in 2:03:54."},
          {v:"Uit welk land kwam de winnaar van de TT van Assen?", a:"Japan",
           toelichting:"Ai Ogura: de eerste Japanse winnaar sinds Makoto Tamada in 2004."},
          {v:"In welke stad waren deze zomer de Commonwealth Games?", a:"Glasgow"},
          {v:"In welke stad kwam Sinterklaas dit jaar aan?", a:"Grave",
           toelichting:"Op 14 november, aan de Maas."}
        ]
      },
      {
        naam: "De Voorspellingen",
        suit: "♣", thema: "Wat jullie in januari dachten", sfeer: "violet",
        type: "open", tijd: 30, punten: 2, teamModus: "individueel",
        teVullen: true, cijfers: "voorspellingen",
        uitleg: "Aan het begin van 2026 deed iedereen veertien voorspellingen — Cas incluis. Nu de afrekening.",
        // In de meespeelversie komen vraag en antwoord uit voorspellingen.ts;
        // vul daar de uitkomsten in. De losse HTML-quiz wacht op handwerk.
        vragen: [
          {v:"Wiens voorspellingen kwamen dit jaar het vaakst uit?", a:"— nog invullen —", teVullen:true, live:"voorspellingen.meesteGoed"},
          {v:"En wie zat er het vaakst volledig naast?", a:"— nog invullen —", teVullen:true, live:"voorspellingen.meesteFout"},
          {v:"Welke voorspelling kwam uit terwijl niemand erin geloofde?", a:"— nog invullen —", teVullen:true, live:"voorspellingen.tegenDeStroom"},
          {v:"Welke voorspelling deed bijna iedereen, en kwam toch niet uit?", a:"— nog invullen —", teVullen:true, live:"voorspellingen.bijnaIedereen"},
          {reserve:true, v:"Welke voorspelling is het pijnlijkst verkeerd afgelopen?", a:"— nog invullen —", teVullen:true, live:"voorspellingen.pijnlijkst"}
        ]
      },
      {
        naam: "Oktober tot december",
        suit: "♠", thema: "De staart van het jaar — zelf aanvullen", sfeer: "vuurwerk",
        type: "open", tijd: 30, punten: 2, teamModus: "individueel",
        optioneel: true, teVullen: true,
        uitleg: "Deze maanden waren er nog niet toen de quiz werd gemaakt. Vul ze in december aan.",
        vragen: [
          {v:"Wie kreeg in oktober de Nobelprijs voor de Vrede?", a:"— nog invullen —", teVullen:true},
          {v:"Wat was het grootste nieuws van het najaar?", a:"— nog invullen —", teVullen:true},
          {v:"Wat stond er dit jaar op nummer één in de Top 2000?", a:"— nog invullen —", teVullen:true},
          {v:"Welk woord werd gekozen tot woord van het jaar?", a:"— nog invullen —", teVullen:true}
        ]
      },
      {
        naam: "De Hitparade",
        suit: "♥", thema: "De muziek van 2026", sfeer: "violet",
        type: "open", tijd: 60, punten: 2, teamModus: "teams", aantalTeams: 2,
        // De kenners in een ander team, zodat het voor iedereen een muziekronde is.
        kennis: MUZIEK,
        uitleg: "In teams, met Joris en Rik ieder aan een andere kant. Raden, gokken, meezingen: je hoeft geen kenner te zijn.",
        // Alleen nummers uit 2026. Wat er onder de film van het jaar ligt,
        // staat in showreel/muziek/LEESMIJ.md.
        vragen: [
          {emoji:"🌸 🌊 👸", v:"Met welk nummer van Taylor Swift begon 2026 op nummer 1?", a:"The Fate of Ophelia",
           toelichting:"Het stond de eerste weken van januari bovenaan in de Top 40."},
          {v:"Onder januari tot en met april in de openingsfilm klonk de hit die eind januari Taylor Swift van 1 stootte, en daar elf weken bleef. Welke, en van wie?", a:"I Just Might — Bruno Mars",
           toelichting:"Van 24 januari tot begin april. Wie goed luisterde naar de film, had hem al."},
          {reserve:true, v:"Shakira en Burna Boy stonden deze zomer maandenlang op 1 met Dai Dai. Welk record pakte Shakira daarmee?", a:"Geen zangeres voerde de Top 40 ooit langer aan",
           toelichting:"Ook Burna Boy schreef geschiedenis: hij werd de succesvolste Afrikaanse artiest ooit in de Top 40."},
          {emoji:"💯 😢", v:"Welke Nederlandse hit stootte Dai Dai van de troon?", a:"100 Tranen — Qlas, Antoon en Boef"},
          {v:"Wiens Spotify Wrapped is dit?", a:"— nog invullen —", teVullen:true, media:{soort:"beeld", bron:"wrapped-01.png"},
           toelichting:"Zet een screenshot van iemands top 5 artiesten in app/media, zonder naam erop."},
          {v:"Een AI-zanger zingt een nieuwsfeit uit 2026. Welk?", a:"— nog invullen —", teVullen:true, media:{soort:"muziek", bron:"ai-nieuws-01.mp3"},
           toelichting:"Laat een AI-muziekgenerator een couplet over een nieuwsfeit inzingen, en zet het in app/media."},
          {reserve:true, v:"Kennersvraag, dubbele punten: welke Roemeense dj maakte in 2026 een hit met Jason Derulo?", a:"DJ Goja, met Mi Chico", punten:4,
           toelichting:"Het origineel kwam in maart uit; in juni volgde de versie met Derulo en de Braziliaanse zangeres Melody."}
        ]
      },
      {
        naam: "2027",
        suit: "♥", thema: "Vooruitkijken", sfeer: "vuurwerk",
        type: "open", tijd: 60, punten: 2, teamModus: "teams", aantalTeams: 2,
        kennis: NIEUWS,
        uitleg: "In teams. Genoeg teruggekeken: wat staat er volgend jaar op de rol?",
        vragen: [
          {v:"In welk land wordt in 2027 het WK voetbal voor vrouwen gespeeld?", a:"Brazilië",
           toelichting:"De eerste keer dat dat toernooi naar Zuid-Amerika komt."},
          {reserve:true, v:"In welk land wordt in september 2027 de Ryder Cup gespeeld?", a:"Ierland",
           toelichting:"Op Adare Manor, bij Limerick. Het toernooi bestaat dan honderd jaar."},
          {v:"Welk land organiseert het WK rugby?", a:"Australië"},
          {v:"In welke maand kiest Frankrijk een nieuwe president?", a:"April"}
        ]
      },
      {
        naam: "Wie van de Blackjacks?",
        suit: "♦", thema: "Slotronde", sfeer: "vilt",
        type: "stem", tijd: 30, punten: 3, teamModus: "individueel",
        uitleg: "Iedereen kiest een naam. De meerderheid beslist: wie meestemt met de groep krijgt de punten.",
        vragen: [
          {v:"Wie kwam dit jaar het vaakst te laat?", a:"De groep beslist"},
          {reserve:true, v:"Wie heeft het meeste geld uitgegeven aan iets volstrekt nutteloos?", a:"De groep beslist"},
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
        type: "waarnietwaar", tijd: 30, punten: 1, teamModus: "individueel",
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
        type: "open", tijd: 60, punten: 2, teamModus: "teams", aantalTeams: 2,
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
        type: "meerkeuze", tijd: 30, punten: 2, teamModus: "individueel",
        uitleg: "Ieder voor zich. Kies A, B, C of D.",
        vragen: [
          {v:"In welk land waren de Olympische Winterspelen van 2026?",
           opties:["Noorwegen","Italië","Frankrijk","Zwitserland"], goed:1},
          {v:"Wie won in 2026 de Tour de France?",
           opties:["Remco Evenepoel","Mathieu van der Poel","Tadej Pogačar","Jonas Vingegaard"], goed:2},
          {v:"Bij welke sport sla je met een racket tegen een shuttle?",
           opties:["Tennis","Badminton","Squash","Padel"], goed:1},
          {v:"Hoeveel spelers staan er bij volleybal per team in het veld?",
           opties:["Vijf","Zes","Zeven","Elf"], goed:1},
          {v:"Bij welke sport kun je een hole-in-one slaan?",
           opties:["Golf","Honkbal","Hockey","Biljart"], goed:0}
        ]
      },
      {
        naam: "Dichtstbij Wint",
        suit: "♣", thema: "Cijferronde", sfeer: "staal",
        type: "dichtstbij", tijd: 60, punten: 3, teamModus: "teams", aantalTeams: 2,
        uitleg: "Eén getal per team. Het dichtstbij pakt 3 punten, precies goed levert er 5 op.",
        vragen: [
          {v:"Hoeveel toetsen heeft een piano?", getal:88, eenheid:"toetsen"},
          {v:"Hoeveel treden telt de Domtoren in Utrecht?", getal:465, eenheid:"treden"},
          {v:"Hoeveel botten heeft een volwassen mens?", getal:206, eenheid:"botten"},
          {v:"Hoeveel provincies heeft Nederland?", getal:12, eenheid:"provincies"}
        ]
      },
      {
        naam: "Nederland & de Wereld",
        suit: "♠", thema: "Meerkeuze", sfeer: "oranje",
        type: "meerkeuze", tijd: 60, punten: 2, teamModus: "teams", aantalTeams: 2,
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
          {v:"Wie schilderde De Sterrennacht?",
           opties:["Vincent van Gogh","Rembrandt van Rijn","Johannes Vermeer","Piet Mondriaan"], goed:0},
          {v:"Wat eet een reuzenpanda vooral?",
           opties:["Bamboe","Vis","Insecten","Vlees"], goed:0}
        ]
      },
      {
        naam: "Ons Jaar in Beeld",
        suit: "♥", thema: "Eigen familiefoto’s", sfeer: "bioscoop",
        type: "open", tijd: 60, punten: 2, teamModus: "teams", aantalTeams: 2,
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
        suit: "♦", thema: "Korte vragen, snel punten", sfeer: "bliksem",
        type: "open", tijd: 30, punten: 1, teamModus: "individueel",
        uitleg: "Korte vragen. Ieder voor zich, één punt per stuk. Tempo!",
        vragen: [
          {v:"Welke kleur krijg je als je blauw en geel mengt?", a:"Groen"},
          {v:"Wie woont er in paleis Huis ten Bosch?", a:"Koning Willem-Alexander",
           toelichting:"Met koningin Máxima. Het paleis staat in Den Haag."},
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

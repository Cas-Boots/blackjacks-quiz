/**
 * De geestdieren: ieder aan tafel krijgt er één, voor de hele avond.
 *
 * Het dier staat bij je naam op de televisie, op je telefoon, in de stand en
 * op het podium, en roept af en toe iets als je goed of fout zit. Puur voor
 * de lol: het dier telt nergens mee.
 *
 * In de database staat alleen de sleutel. Een sleutel die hier niet (meer)
 * bestaat valt terug op een dier gekozen op de naam, zodat er nooit een gat
 * op het scherm komt.
 */
import { hash, kies } from './kwinkslagen';

export interface Geestdier {
  sleutel: string;
  emoji: string;
  /** Zoals het op het scherm staat: "de Dramatische Lama". */
  titel: string;
  /** Wat het dier roept als je het goed had. */
  goed: readonly string[];
  /** Wat het dier roept als je het fout had. */
  fout: readonly string[];
  /** Waarmee het dier zich in de lobby meldt. */
  entree: string;
  /** Hoe het dier beweegt op het scherm; een CSS-animatie in app.css. */
  beweging: Beweging;
}

/** De manieren waarop een dier beweegt. Elk heeft een @keyframes `dier-…` in app.css. */
export type Beweging =
  | 'loop' | 'spring' | 'schommel' | 'zwem' | 'vlieg'
  | 'stuiter' | 'draai' | 'waggel' | 'kruip';

/** Hoe het dier over de televisie gaat als het binnenkomt: lopen, springen, slingeren, zwemmen of vliegen. */
export function gangVan(beweging: Beweging): 'stap' | 'spring' | 'schommel' | 'zwem' | 'vlieg' {
  if (beweging === 'zwem') return 'zwem';
  if (beweging === 'vlieg') return 'vlieg';
  if (beweging === 'spring' || beweging === 'stuiter') return 'spring';
  if (beweging === 'schommel') return 'schommel';
  return 'stap';
}

export const DIEREN: readonly Geestdier[] = [
  {
    sleutel: 'lama', emoji: '🦙', titel: 'de Dramatische Lama',
    goed: ['De lama spuugt van blijdschap.', 'Lama zegt: dat wist ik al.'],
    fout: ['De lama spuugt. Op zichzelf.', 'Lama draait zich beledigd om.'],
    entree: 'schrijdt binnen met veel te veel drama',
    beweging: 'loop',
  },
  {
    sleutel: 'luiaard', emoji: '🦥', titel: 'de Luiaard met Deadline',
    goed: ['De luiaard is voor één keer op tijd.', 'Zelfs de luiaard schrok hiervan.'],
    fout: ['De luiaard was er nog niet aan toe.', 'Luiaard doet een dutje. Morgen beter.'],
    entree: 'komt aan. Over een kwartiertje',
    beweging: 'schommel',
  },
  {
    sleutel: 'flamingo', emoji: '🦩', titel: 'de Wiebelende Flamingo',
    goed: ['De flamingo staat op één been te juichen.', 'Roze van trots.'],
    fout: ['De flamingo valt om. Sierlijk, dat wel.', 'Even op twee benen staan, flamingo.'],
    entree: 'staat al een uur op één been te wachten',
    beweging: 'vlieg',
  },
  {
    sleutel: 'pinguin', emoji: '🐧', titel: 'de Pinguïn in Pak',
    goed: ['De pinguïn trekt zijn strikje recht.', 'Chic gedaan, pinguïn.'],
    fout: ['De pinguïn glijdt uit op het ijs.', 'Pak aan, hoofd koud, antwoord fout.'],
    entree: 'waggelt binnen in smoking',
    beweging: 'waggel',
  },
  {
    sleutel: 'octopus', emoji: '🐙', titel: 'de Octopus met Acht Antwoorden',
    goed: ['Eén van de acht armen had het goed.', 'De octopus klapt. Acht keer.'],
    fout: ['Acht armen, nul goede antwoorden.', 'De octopus spuit inkt en verdwijnt.'],
    entree: 'zwaait met alle acht armen tegelijk',
    beweging: 'zwem',
  },
  {
    sleutel: 'kip', emoji: '🐔', titel: 'de Paniekkip',
    goed: ['Tok tok TOK! Goed!', 'De kip legt van blijdschap een ei.'],
    fout: ['De kip rent zonder kop in het rond.', 'Tok… tok… nee.'],
    entree: 'fladdert binnen in volle paniek',
    beweging: 'vlieg',
  },
  {
    sleutel: 'eenhoorn', emoji: '🦄', titel: 'de Eenhoorn met Kater',
    goed: ['Magie. Of geluk. Maakt niet uit.', 'De eenhoorn poept een regenboog.'],
    fout: ['De hoorn staat vandaag een beetje scheef.', 'Zelfs magie heeft een vrije avond.'],
    entree: 'galoppeert binnen in een wolk van glitter',
    beweging: 'stuiter',
  },
  {
    sleutel: 'uil', emoji: '🦉', titel: 'de Uil die Doet Alsof',
    goed: ['De uil knikt wijs. Alsof het niks was.', 'Oehoe, knap.'],
    fout: ['De uil deed maar alsof. Nu weet iedereen het.', 'Oehoe… oei.'],
    entree: 'kijkt heel wijs, maar weet eigenlijk niks',
    beweging: 'vlieg',
  },
  {
    sleutel: 'goudvis', emoji: '🐠', titel: 'de Goudvis met Drie Seconden Geheugen',
    goed: ['Goed! Wacht, wat was de vraag?', 'De goudvis is het alweer vergeten, maar: goed!'],
    fout: ['Fout. Gelukkig is de goudvis het zo vergeten.', 'Blub.'],
    entree: 'zwemt rondjes. Waar was hij ook alweer?',
    beweging: 'zwem',
  },
  {
    sleutel: 'wasbeer', emoji: '🦝', titel: 'de Wasbeer met Lange Vingers',
    goed: ['De wasbeer heeft het antwoord gejat. Van wie?', 'Buit binnen!'],
    fout: ['De wasbeer greep mis in de vuilnisbak.', 'Wasbeer wast zijn handen in onschuld.'],
    entree: 'sluipt binnen met iets in zijn wangen',
    beweging: 'loop',
  },
  {
    sleutel: 'kikker', emoji: '🐸', titel: 'de Kikker in de Keel',
    goed: ['Kwaak! In één sprong goed.', 'De kikker springt een gat in de lucht.'],
    fout: ['Kwaak. Kwaak kwaak. Nee.', 'De kikker plonst het water in.'],
    entree: 'springt binnen en kwaakt iets onverstaanbaars',
    beweging: 'spring',
  },
  {
    sleutel: 'egel', emoji: '🦔', titel: 'de Egel met Stekels op Scherp',
    goed: ['De egel rolt zich tevreden op.', 'Scherp, egel. Scherp.'],
    fout: ['Au. De egel prikt zichzelf.', 'De egel rolt zich op en doet alsof hij er niet is.'],
    entree: 'rolt binnen als een stekelig balletje',
    beweging: 'draai',
  },
  {
    sleutel: 'zeehond', emoji: '🦭', titel: 'de Applaudisserende Zeehond',
    goed: ['De zeehond klapt. Voor zichzelf.', 'Een vis voor de zeehond!'],
    fout: ['De zeehond klapt toch maar. Uit gewoonte.', 'Geen vis vandaag.'],
    entree: 'glijdt op zijn buik naar binnen',
    beweging: 'zwem',
  },
  {
    sleutel: 'kreeft', emoji: '🦞', titel: 'de Kreeft die Zijwaarts Denkt',
    goed: ['Zijwaarts gedacht, recht in de roos.', 'De kreeft knipt tevreden met zijn scharen.'],
    fout: ['De kreeft liep weer de verkeerde kant op.', 'Knip knip. Mis mis.'],
    entree: 'schuifelt zijwaarts naar binnen',
    beweging: 'loop',
  },
  {
    sleutel: 'hamster', emoji: '🐹', titel: 'de Hamster die Punten Hamstert',
    goed: ['De hamster propt het punt in zijn wangen.', 'Nog eentje voor de voorraad.'],
    fout: ['De wangen blijven leeg.', 'De hamster rent verder in zijn wiel.'],
    entree: 'komt binnen met volle wangen',
    beweging: 'stuiter',
  },
  {
    sleutel: 'nijlpaard', emoji: '🦛', titel: 'het Nijlpaard in de Porseleinkast',
    goed: ['Met veel geweld, maar goed.', 'Het nijlpaard doet een dansje. De vloer kraakt.'],
    fout: ['Krak. Daar gaat het servies.', 'Het nijlpaard zakt beteuterd onder water.'],
    entree: 'stampt binnen. Er valt iets om',
    beweging: 'loop',
  },
  {
    sleutel: 'giraf', emoji: '🦒', titel: 'de Giraf met Overzicht',
    goed: ['Van boven zag de giraf het meteen.', 'Hoog gegrepen en raak.'],
    fout: ['De giraf keek over het antwoord heen.', 'Te hoog gegrepen.'],
    entree: 'bukt nét op tijd voor de deurpost',
    beweging: 'loop',
  },
  {
    sleutel: 'slak', emoji: '🐌', titel: 'de Slak op Turbo',
    goed: ['Traag, maar raak.', 'De slak laat een glinsterend spoor van succes na.'],
    fout: ['Het huisje is er, het antwoord niet.', 'De slak trekt zich terug in zijn huisje.'],
    entree: 'is onderweg sinds vorige week',
    beweging: 'kruip',
  },
  {
    sleutel: 'krokodil', emoji: '🐊', titel: 'de Krokodil met Krokodillentranen',
    goed: ['De krokodil hapt het punt weg.', 'Happ! Binnen.'],
    fout: ['Krokodillentranen. Heel overtuigend.', 'De krokodil hapte in de lucht.'],
    entree: 'glimlacht met heel veel tanden',
    beweging: 'zwem',
  },
  {
    sleutel: 'kameel', emoji: '🐫', titel: 'de Kameel die Nergens Dorst van Krijgt',
    goed: ['Met twee bulten vol kennis.', 'De kameel trekt onverstoorbaar verder.'],
    fout: ['Een fata morgana van een antwoord.', 'De kameel kauwt er nog even op.'],
    entree: 'sjokt binnen uit de woestijn',
    beweging: 'loop',
  },
  {
    sleutel: 'aap', emoji: '🐒', titel: 'de Aap die Aan de Lamp Hangt',
    goed: ['De aap slingert van blijdschap door de kamer.', 'Oe-oe-AA-AA! Raak!'],
    fout: ['De aap mist de tak en valt in de bananen.', 'Apenstreken. Maar fout.'],
    entree: 'slingert binnen aan de lamp',
    beweging: 'schommel',
  },
  {
    sleutel: 'kangoeroe', emoji: '🦘', titel: 'de Kangoeroe met Springveren',
    goed: ['De kangoeroe springt tegen het plafond.', 'Met één sprong over de finish.'],
    fout: ['Te vroeg gesprongen.', 'De kangoeroe verstopt zich in zijn eigen buidel.'],
    entree: 'springt in drie sprongen de kamer door',
    beweging: 'spring',
  },
  {
    sleutel: 'hond', emoji: '🐕', titel: 'de Hond die Overal Achteraan Rent',
    goed: ['Goed zo! Brave! Wie is er een brave?', 'De staart gaat alle kanten op.'],
    fout: ['De hond rende achter het verkeerde balletje aan.', 'Zielige hondenogen. Helpt niet.'],
    entree: 'rent kwispelend drie rondjes om de tafel',
    beweging: 'loop',
  },
  {
    sleutel: 'dolfijn', emoji: '🐬', titel: 'de Dolfijn die Altijd Lacht',
    goed: ['De dolfijn maakt een salto uit het water.', 'Ieieieiek! Goed!'],
    fout: ['De dolfijn lacht toch maar. Een beetje schaapachtig.', 'Plons. Mis.'],
    entree: 'zwemt binnen door de gang. Niemand weet hoe',
    beweging: 'zwem',
  },
  {
    sleutel: 'bij', emoji: '🐝', titel: 'de Bij die Overal Zoemt',
    goed: ['Bzzz! Honingzoet antwoord.', 'De bij doet een dansje: hier zit het goede antwoord.'],
    fout: ['Bzzz… bzz… nee.', 'De bij vloog tegen het raam.'],
    entree: 'zoemt drie keer om je hoofd',
    beweging: 'vlieg',
  },
  {
    sleutel: 'vlinder', emoji: '🦋', titel: 'de Fladderende Vlinder',
    goed: ['Een vleugelslag, en raak.', 'De vlinder fladdert trots een rondje.'],
    fout: ['De vlinder fladderde de verkeerde kant op.', 'Vlinders in de buik. Antwoord in de prullenbak.'],
    entree: 'fladdert binnen door het open raam',
    beweging: 'vlieg',
  },
  {
    sleutel: 'papegaai', emoji: '🦜', titel: 'de Papegaai die Alles Napraat',
    goed: ['Goed! Goed! Goed! Rrraak!', 'De papegaai herhaalt het antwoord nog tien keer.'],
    fout: ['De papegaai praatte de verkeerde na.', 'Rrrrr… fout. Fout. Fout.'],
    entree: 'landt op de lamp en roept iedereens naam',
    beweging: 'vlieg',
  },
];

const PER_SLEUTEL = new Map(DIEREN.map((d) => [d.sleutel, d]));

export function isDier(sleutel: unknown): sleutel is string {
  return typeof sleutel === 'string' && PER_SLEUTEL.has(sleutel);
}

/** Het dier bij een sleutel. Zonder geldige sleutel beslist de naam. */
export function dierVan(sleutel: string | null | undefined, naam = ''): Geestdier {
  return (sleutel && PER_SLEUTEL.get(sleutel)) || kies(DIEREN, `dier:${naam}`);
}

/**
 * Een dier dat nog vrij is aan tafel. Zijn ze allemaal op, dan mag er
 * dubbel. Met een toevalsbron kiest hij willekeurig (opnieuw dobbelen),
 * anders op de naam, zodat dezelfde naam op een verse database weer
 * hetzelfde dier krijgt.
 */
export function vrijDier(bezet: Iterable<string | null>, naam: string, toeval?: () => number, niet?: string | null): string {
  const weg = new Set(bezet);
  if (niet) weg.add(niet);
  let kandidaten = DIEREN.filter((d) => !weg.has(d.sleutel));
  if (!kandidaten.length) kandidaten = DIEREN.filter((d) => d.sleutel !== niet);
  const i = toeval ? Math.floor(toeval() * kandidaten.length) : hash(`dier:${naam}`) % kandidaten.length;
  return kandidaten[Math.min(i, kandidaten.length - 1)].sleutel;
}

/** Een roep van het dier bij goed of fout, gekozen op een sleutel zodat elk scherm hetzelfde zegt. */
export function dierenroep(sleutel: string | null | undefined, naam: string, soort: 'goed' | 'fout', vraagSleutel: string): string {
  const dier = dierVan(sleutel, naam);
  return kies(dier[soort], `${vraagSleutel}:${naam}:${soort}`);
}

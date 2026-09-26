/**
 * De maatjes: ieder aan tafel kiest een dier dat de avond meegaat.
 *
 * Je foto blijft je portret; het dier zit klein op de rand en rent over het
 * scherm op de grote momenten: als je binnenkomt, als je het goed hebt, als
 * iedereen fout zit, als je stijgt en als je wint. Het roept er iets bij.
 * Puur voor de lol: het dier telt nergens mee.
 *
 * In de database staat alleen de sleutel. Een sleutel die hier niet (meer)
 * bestaat valt terug op een dier gekozen op de naam, zodat er nooit een gat
 * op het scherm komt.
 */
import { hash, kies } from './kwinkslagen';

export interface Maatje {
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
  /** Hoe het dier over het scherm gaat; zie gangVan en de `dier-…`-animaties in app.css. */
  beweging: Beweging;
  /** Zijn eigen kunstjes, naast de algemene; zie actiesVan. */
  acties: { blij: readonly Actie[]; sip: readonly Actie[] };
}

/**
 * Een kunstje dat het dier halverwege het scherm doet: iets met zijn lijf,
 * en soms iets erbij (een ei, bananen, een regenboog) dat opstijgt, wordt
 * weggegooid, valt of eromheen draait. `.actie[data-lijf=…]` en
 * `.ding[data-gaat=…]` in app.css.
 */
export interface Actie {
  lijf: Lijf;
  ding?: string;
  dingGaat?: DingGaat;
}
export type Lijf =
  | 'salto' | 'dans' | 'pirouette' | 'boing' | 'rol' | 'rek' | 'opblaas' | 'schud' | 'acht'
  | 'ondersteboven' | 'balans' | 'glij' | 'graaf' | 'kronkel'
  | 'zak' | 'omval' | 'mok' | 'verstop'
  | 'kijkrond' | 'snuffel' | 'trappel' | 'schrik' | 'hik' | 'zwaai' | 'slaap';
export type DingGaat = 'op' | 'gooi' | 'val' | 'rond';

/** Wat elk dier kan als het blij is, bovenop zijn eigen kunstjes. */
export const ALGEMEEN_BLIJ: readonly Actie[] = [
  { lijf: 'salto' },
  { lijf: 'dans', ding: '🎵', dingGaat: 'op' },
  { lijf: 'pirouette', ding: '✨', dingGaat: 'rond' },
  { lijf: 'boing', ding: '🎉', dingGaat: 'op' },
  { lijf: 'dans', ding: '❤️', dingGaat: 'op' },
];
/** Wat elk dier kan als het sip is. */
export const ALGEMEEN_SIP: readonly Actie[] = [
  { lijf: 'zak', ding: '💧', dingGaat: 'val' },
  { lijf: 'omval' },
  { lijf: 'mok', ding: '💢', dingGaat: 'op' },
  { lijf: 'verstop' },
];

/**
 * Alle kunstjes van een dier voor een stemming: zijn eigen, plus twee
 * algemene die bij dit dier horen. Zo heeft elk dier er een handvol, en
 * doen niet alle dieren hetzelfde.
 */
export function actiesVan(dier: Maatje, stemming: 'blij' | 'sip'): Actie[] {
  const algemeen = stemming === 'blij' ? ALGEMEEN_BLIJ : ALGEMEEN_SIP;
  const start = hash(`acties:${dier.sleutel}`) % algemeen.length;
  const erbij = [algemeen[start], algemeen[(start + 1) % algemeen.length]];
  return [...dier.acties[stemming], ...erbij];
}

/** Een kunstje voor dit moment. Met een toevalsbron elke keer een verrassing. */
export function kiesActie(dier: Maatje, stemming: 'blij' | 'sip', toeval: () => number = Math.random): Actie {
  const lijst = actiesVan(dier, stemming);
  return lijst[Math.min(lijst.length - 1, Math.floor(toeval() * lijst.length))];
}

/**
 * Hoe het pixeldier kijkt en staat tijdens een kunstje (Pixeldier.svelte):
 * ogen open of dicht, blosjes, poten die trappelen, een traan, zzz.
 */
export type Pose = 'staan' | 'loop' | 'blij' | 'sip' | 'slaap' | 'schrik';
const POSE: Record<Lijf, Pose> = {
  salto: 'blij', dans: 'blij', pirouette: 'blij', boing: 'blij', rol: 'staan', rek: 'staan',
  opblaas: 'blij', schud: 'schrik', acht: 'loop', ondersteboven: 'staan', balans: 'staan',
  glij: 'blij', graaf: 'loop', kronkel: 'loop', zak: 'sip', omval: 'schrik', mok: 'sip',
  verstop: 'sip', kijkrond: 'staan', snuffel: 'loop', trappel: 'loop', schrik: 'schrik',
  hik: 'schrik', zwaai: 'blij', slaap: 'slaap',
};
export function poseVan(lijf: Lijf, stemming: 'blij' | 'sip'): Pose {
  const pose = POSE[lijf];
  return stemming === 'sip' && pose !== 'slaap' && pose !== 'schrik' ? 'sip' : pose;
}

/** Waarmee een dier begint voor het echte kunstje: even rondkijken, snuffelen, schrikken. */
export const OPWARMERS: { blij: readonly Actie[]; sip: readonly Actie[] } = {
  blij: [
    { lijf: 'kijkrond' },
    { lijf: 'snuffel' },
    { lijf: 'trappel', ding: '💨', dingGaat: 'op' },
    { lijf: 'schrik', ding: '❗', dingGaat: 'op' },
    { lijf: 'zwaai', ding: '👋', dingGaat: 'op' },
  ],
  sip: [
    { lijf: 'kijkrond', ding: '❓', dingGaat: 'op' },
    { lijf: 'hik', ding: '💧', dingGaat: 'val' },
    { lijf: 'schrik', ding: '❗', dingGaat: 'op' },
  ],
};
/** Waarmee een sip dier soms afsluit: gewoon maar gaan slapen. */
export const EINDE_SIP: Actie = { lijf: 'slaap', ding: '💤', dingGaat: 'op' };

/**
 * Een heel optreden in drie tellen: een opwarmer, en dan twee verschillende
 * kunstjes van dit dier (sip soms eindigend in slaap). Zo doet een dier
 * zelden twee keer precies hetzelfde.
 */
export function kiesRoutine(dier: Maatje, stemming: 'blij' | 'sip', toeval: () => number = Math.random): Actie[] {
  const greep = <T>(lijst: readonly T[]) => lijst[Math.min(lijst.length - 1, Math.floor(toeval() * lijst.length))];
  const eerste = kiesActie(dier, stemming, toeval);
  const rest = actiesVan(dier, stemming).filter((a) => a.lijf !== eerste.lijf || a.ding !== eerste.ding);
  const tweede = stemming === 'sip' && toeval() < 0.4 ? EINDE_SIP : greep(rest.length ? rest : [eerste]);
  return [greep(OPWARMERS[stemming]), eerste, tweede];
}

/** De manieren waarop een dier beweegt; `.dier[data-beweging=…]` in app.css. */
export type Beweging =
  | 'loop' | 'spring' | 'schommel' | 'zwem' | 'vlieg' | 'graaf'
  | 'stuiter' | 'draai' | 'waggel' | 'kruip';

/** Hoe het dier over de televisie gaat als het binnenkomt: lopen, springen, slingeren, zwemmen, vliegen of graven. */
export function gangVan(beweging: Beweging): 'stap' | 'spring' | 'schommel' | 'zwem' | 'vlieg' | 'graaf' {
  if (beweging === 'graaf') return 'graaf';
  if (beweging === 'zwem') return 'zwem';
  if (beweging === 'vlieg') return 'vlieg';
  if (beweging === 'spring' || beweging === 'stuiter') return 'spring';
  if (beweging === 'schommel') return 'schommel';
  return 'stap';
}

export const DIEREN: readonly Maatje[] = [
  {
    sleutel: 'lama', emoji: '🦙', titel: 'de Dramatische Lama',
    goed: ['De lama spuugt van blijdschap.', 'Lama zegt: dat wist ik al.'],
    fout: ['De lama spuugt. Op zichzelf.', 'Lama draait zich beledigd om.'],
    entree: 'schrijdt binnen met veel te veel drama',
    beweging: 'loop',
    acties: { blij: [{ lijf: 'opblaas', ding: '💦', dingGaat: 'gooi' }, { lijf: 'dans' }], sip: [{ lijf: 'zak', ding: '💦', dingGaat: 'val' }] },
  },
  {
    sleutel: 'luiaard', emoji: '🦥', titel: 'de Luiaard met Deadline',
    goed: ['De luiaard is voor één keer op tijd.', 'Zelfs de luiaard schrok hiervan.'],
    fout: ['De luiaard was er nog niet aan toe.', 'Luiaard doet een dutje. Morgen beter.'],
    entree: 'komt aan. Over een kwartiertje',
    beweging: 'schommel',
    acties: { blij: [{ lijf: 'ondersteboven' }, { lijf: 'boing', ding: '🍃', dingGaat: 'op' }], sip: [{ lijf: 'verstop', ding: '💤', dingGaat: 'op' }] },
  },
  {
    sleutel: 'flamingo', emoji: '🦩', titel: 'de Wiebelende Flamingo',
    goed: ['De flamingo staat op één been te juichen.', 'Roze van trots.'],
    fout: ['De flamingo valt om. Sierlijk, dat wel.', 'Even op twee benen staan, flamingo.'],
    entree: 'staat al een uur op één been te wachten',
    beweging: 'vlieg',
    acties: { blij: [{ lijf: 'balans' }, { lijf: 'pirouette', ding: '🌸', dingGaat: 'rond' }], sip: [{ lijf: 'omval' }] },
  },
  {
    sleutel: 'pinguin', emoji: '🐧', titel: 'de Pinguïn in Pak',
    goed: ['De pinguïn trekt zijn strikje recht.', 'Chic gedaan, pinguïn.'],
    fout: ['De pinguïn glijdt uit op het ijs.', 'Pak aan, hoofd koud, antwoord fout.'],
    entree: 'waggelt binnen in smoking',
    beweging: 'waggel',
    acties: { blij: [{ lijf: 'glij', ding: '❄️', dingGaat: 'op' }, { lijf: 'dans', ding: '🎩', dingGaat: 'rond' }], sip: [{ lijf: 'omval', ding: '🧊', dingGaat: 'val' }] },
  },
  {
    sleutel: 'octopus', emoji: '🐙', titel: 'de Octopus met Acht Antwoorden',
    goed: ['Eén van de acht armen had het goed.', 'De octopus klapt. Acht keer.'],
    fout: ['Acht armen, nul goede antwoorden.', 'De octopus spuit inkt en verdwijnt.'],
    entree: 'zwaait met alle acht armen tegelijk',
    beweging: 'zwem',
    acties: { blij: [{ lijf: 'acht', ding: '🐚', dingGaat: 'gooi' }, { lijf: 'dans', ding: '🎵', dingGaat: 'op' }], sip: [{ lijf: 'verstop', ding: '🖤', dingGaat: 'op' }] },
  },
  {
    sleutel: 'kip', emoji: '🐔', titel: 'de Paniekkip',
    goed: ['Tok tok TOK! Goed!', 'De kip legt van blijdschap een ei.'],
    fout: ['De kip rent zonder kop in het rond.', 'Tok… tok… nee.'],
    entree: 'fladdert binnen in volle paniek',
    beweging: 'vlieg',
    acties: { blij: [{ lijf: 'boing', ding: '🥚', dingGaat: 'val' }, { lijf: 'schud', ding: '🪶', dingGaat: 'op' }], sip: [{ lijf: 'schud', ding: '🪶', dingGaat: 'val' }] },
  },
  {
    sleutel: 'eenhoorn', emoji: '🦄', titel: 'de Eenhoorn met Kater',
    goed: ['Magie. Of geluk. Maakt niet uit.', 'De eenhoorn poept een regenboog.'],
    fout: ['De hoorn staat vandaag een beetje scheef.', 'Zelfs magie heeft een vrije avond.'],
    entree: 'galoppeert binnen in een wolk van glitter',
    beweging: 'stuiter',
    acties: { blij: [{ lijf: 'boing', ding: '🌈', dingGaat: 'op' }, { lijf: 'salto', ding: '✨', dingGaat: 'rond' }], sip: [{ lijf: 'zak', ding: '💫', dingGaat: 'rond' }] },
  },
  {
    sleutel: 'uil', emoji: '🦉', titel: 'de Uil die Doet Alsof',
    goed: ['De uil knikt wijs. Alsof het niks was.', 'Oehoe, knap.'],
    fout: ['De uil deed maar alsof. Nu weet iedereen het.', 'Oehoe… oei.'],
    entree: 'kijkt heel wijs, maar weet eigenlijk niks',
    beweging: 'vlieg',
    acties: { blij: [{ lijf: 'pirouette', ding: '🎓', dingGaat: 'op' }, { lijf: 'dans', ding: '📚', dingGaat: 'gooi' }], sip: [{ lijf: 'mok', ding: '❓', dingGaat: 'op' }] },
  },
  {
    sleutel: 'goudvis', emoji: '🐠', titel: 'de Goudvis met Drie Seconden Geheugen',
    goed: ['Goed! Wacht, wat was de vraag?', 'De goudvis is het alweer vergeten, maar: goed!'],
    fout: ['Fout. Gelukkig is de goudvis het zo vergeten.', 'Blub.'],
    entree: 'zwemt rondjes. Waar was hij ook alweer?',
    beweging: 'zwem',
    acties: { blij: [{ lijf: 'salto', ding: '🫧', dingGaat: 'op' }, { lijf: 'acht', ding: '🫧', dingGaat: 'op' }], sip: [{ lijf: 'zak', ding: '❓', dingGaat: 'op' }] },
  },
  {
    sleutel: 'wasbeer', emoji: '🦝', titel: 'de Wasbeer met Lange Vingers',
    goed: ['De wasbeer heeft het antwoord gejat. Van wie?', 'Buit binnen!'],
    fout: ['De wasbeer greep mis in de vuilnisbak.', 'Wasbeer wast zijn handen in onschuld.'],
    entree: 'sluipt binnen met iets in zijn wangen',
    beweging: 'loop',
    acties: { blij: [{ lijf: 'opblaas', ding: '💰', dingGaat: 'op' }, { lijf: 'dans', ding: '🍕', dingGaat: 'gooi' }], sip: [{ lijf: 'verstop', ding: '🗑️', dingGaat: 'val' }] },
  },
  {
    sleutel: 'kikker', emoji: '🐸', titel: 'de Kikker in de Keel',
    goed: ['Kwaak! In één sprong goed.', 'De kikker springt een gat in de lucht.'],
    fout: ['Kwaak. Kwaak kwaak. Nee.', 'De kikker plonst het water in.'],
    entree: 'springt binnen en kwaakt iets onverstaanbaars',
    beweging: 'spring',
    acties: { blij: [{ lijf: 'boing', ding: '🪰', dingGaat: 'rond' }, { lijf: 'salto', ding: '💦', dingGaat: 'op' }], sip: [{ lijf: 'verstop', ding: '💦', dingGaat: 'op' }] },
  },
  {
    sleutel: 'egel', emoji: '🦔', titel: 'de Egel met Stekels op Scherp',
    goed: ['De egel rolt zich tevreden op.', 'Scherp, egel. Scherp.'],
    fout: ['Au. De egel prikt zichzelf.', 'De egel rolt zich op en doet alsof hij er niet is.'],
    entree: 'rolt binnen als een stekelig balletje',
    beweging: 'draai',
    acties: { blij: [{ lijf: 'rol' }, { lijf: 'dans', ding: '🍎', dingGaat: 'op' }], sip: [{ lijf: 'rol', ding: '💥', dingGaat: 'op' }] },
  },
  {
    sleutel: 'zeehond', emoji: '🦭', titel: 'de Applaudisserende Zeehond',
    goed: ['De zeehond klapt. Voor zichzelf.', 'Een vis voor de zeehond!'],
    fout: ['De zeehond klapt toch maar. Uit gewoonte.', 'Geen vis vandaag.'],
    entree: 'glijdt op zijn buik naar binnen',
    beweging: 'zwem',
    acties: { blij: [{ lijf: 'balans', ding: '⚽', dingGaat: 'rond' }, { lijf: 'boing', ding: '👏', dingGaat: 'op' }], sip: [{ lijf: 'zak', ding: '🐟', dingGaat: 'val' }] },
  },
  {
    sleutel: 'kreeft', emoji: '🦞', titel: 'de Kreeft die Zijwaarts Denkt',
    goed: ['Zijwaarts gedacht, recht in de roos.', 'De kreeft knipt tevreden met zijn scharen.'],
    fout: ['De kreeft liep weer de verkeerde kant op.', 'Knip knip. Mis mis.'],
    entree: 'schuifelt zijwaarts naar binnen',
    beweging: 'loop',
    acties: { blij: [{ lijf: 'schud', ding: '✂️', dingGaat: 'op' }, { lijf: 'dans', ding: '🦀', dingGaat: 'rond' }], sip: [{ lijf: 'mok', ding: '💢', dingGaat: 'op' }] },
  },
  {
    sleutel: 'hamster', emoji: '🐹', titel: 'de Hamster die Punten Hamstert',
    goed: ['De hamster propt het punt in zijn wangen.', 'Nog eentje voor de voorraad.'],
    fout: ['De wangen blijven leeg.', 'De hamster rent verder in zijn wiel.'],
    entree: 'komt binnen met volle wangen',
    beweging: 'stuiter',
    acties: { blij: [{ lijf: 'opblaas', ding: '🌻', dingGaat: 'op' }, { lijf: 'rol' }], sip: [{ lijf: 'zak', ding: '🌰', dingGaat: 'val' }] },
  },
  {
    sleutel: 'nijlpaard', emoji: '🦛', titel: 'het Nijlpaard in de Porseleinkast',
    goed: ['Met veel geweld, maar goed.', 'Het nijlpaard doet een dansje. De vloer kraakt.'],
    fout: ['Krak. Daar gaat het servies.', 'Het nijlpaard zakt beteuterd onder water.'],
    entree: 'stampt binnen. Er valt iets om',
    beweging: 'loop',
    acties: { blij: [{ lijf: 'boing', ding: '💥', dingGaat: 'op' }, { lijf: 'dans', ding: '🩰', dingGaat: 'rond' }], sip: [{ lijf: 'verstop', ding: '💦', dingGaat: 'op' }] },
  },
  {
    sleutel: 'giraf', emoji: '🦒', titel: 'de Giraf met Overzicht',
    goed: ['Van boven zag de giraf het meteen.', 'Hoog gegrepen en raak.'],
    fout: ['De giraf keek over het antwoord heen.', 'Te hoog gegrepen.'],
    entree: 'bukt nét op tijd voor de deurpost',
    beweging: 'loop',
    acties: { blij: [{ lijf: 'rek', ding: '🍃', dingGaat: 'op' }, { lijf: 'dans', ding: '🎵', dingGaat: 'op' }], sip: [{ lijf: 'zak', ding: '💧', dingGaat: 'val' }] },
  },
  {
    sleutel: 'slak', emoji: '🐌', titel: 'de Slak op Turbo',
    goed: ['Traag, maar raak.', 'De slak laat een glinsterend spoor van succes na.'],
    fout: ['Het huisje is er, het antwoord niet.', 'De slak trekt zich terug in zijn huisje.'],
    entree: 'is onderweg sinds vorige week',
    beweging: 'kruip',
    acties: { blij: [{ lijf: 'schud', ding: '💨', dingGaat: 'op' }, { lijf: 'rol' }], sip: [{ lijf: 'verstop', ding: '🐚', dingGaat: 'op' }] },
  },
  {
    sleutel: 'krokodil', emoji: '🐊', titel: 'de Krokodil met Krokodillentranen',
    goed: ['De krokodil hapt het punt weg.', 'Happ! Binnen.'],
    fout: ['Krokodillentranen. Heel overtuigend.', 'De krokodil hapte in de lucht.'],
    entree: 'glimlacht met heel veel tanden',
    beweging: 'zwem',
    acties: { blij: [{ lijf: 'opblaas', ding: '🦷', dingGaat: 'gooi' }, { lijf: 'salto', ding: '💦', dingGaat: 'op' }], sip: [{ lijf: 'zak', ding: '💧', dingGaat: 'val' }] },
  },
  {
    sleutel: 'kameel', emoji: '🐫', titel: 'de Kameel die Nergens Dorst van Krijgt',
    goed: ['Met twee bulten vol kennis.', 'De kameel trekt onverstoorbaar verder.'],
    fout: ['Een fata morgana van een antwoord.', 'De kameel kauwt er nog even op.'],
    entree: 'sjokt binnen uit de woestijn',
    beweging: 'loop',
    acties: { blij: [{ lijf: 'dans', ding: '🌴', dingGaat: 'op' }, { lijf: 'rek', ding: '☀️', dingGaat: 'rond' }], sip: [{ lijf: 'zak', ding: '🏜️', dingGaat: 'val' }] },
  },
  {
    sleutel: 'aap', emoji: '🐒', titel: 'de Aap die Aan de Lamp Hangt',
    goed: ['De aap slingert van blijdschap door de kamer.', 'Oe-oe-AA-AA! Raak!'],
    fout: ['De aap mist de tak en valt in de bananen.', 'Apenstreken. Maar fout.'],
    entree: 'slingert binnen aan de lamp',
    beweging: 'schommel',
    acties: { blij: [{ lijf: 'acht', ding: '🍌', dingGaat: 'gooi' }, { lijf: 'ondersteboven', ding: '🍌', dingGaat: 'rond' }], sip: [{ lijf: 'omval', ding: '🍌', dingGaat: 'val' }] },
  },
  {
    sleutel: 'kangoeroe', emoji: '🦘', titel: 'de Kangoeroe met Springveren',
    goed: ['De kangoeroe springt tegen het plafond.', 'Met één sprong over de finish.'],
    fout: ['Te vroeg gesprongen.', 'De kangoeroe verstopt zich in zijn eigen buidel.'],
    entree: 'springt in drie sprongen de kamer door',
    beweging: 'spring',
    acties: { blij: [{ lijf: 'boing', ding: '🥊', dingGaat: 'gooi' }, { lijf: 'salto' }], sip: [{ lijf: 'verstop', ding: '👜', dingGaat: 'op' }] },
  },
  {
    sleutel: 'hond', emoji: '🐕', titel: 'de Hond die Overal Achteraan Rent',
    goed: ['Goed zo! Brave! Wie is er een brave?', 'De staart gaat alle kanten op.'],
    fout: ['De hond rende achter het verkeerde balletje aan.', 'Zielige hondenogen. Helpt niet.'],
    entree: 'rent kwispelend drie rondjes om de tafel',
    beweging: 'loop',
    acties: { blij: [{ lijf: 'dans', ding: '🦴', dingGaat: 'gooi' }, { lijf: 'rol', ding: '🎾', dingGaat: 'rond' }], sip: [{ lijf: 'zak', ding: '🥺', dingGaat: 'op' }] },
  },
  {
    sleutel: 'dolfijn', emoji: '🐬', titel: 'de Dolfijn die Altijd Lacht',
    goed: ['De dolfijn maakt een salto uit het water.', 'Ieieieiek! Goed!'],
    fout: ['De dolfijn lacht toch maar. Een beetje schaapachtig.', 'Plons. Mis.'],
    entree: 'zwemt binnen door de gang. Niemand weet hoe',
    beweging: 'zwem',
    acties: { blij: [{ lijf: 'salto', ding: '💦', dingGaat: 'op' }, { lijf: 'acht', ding: '🫧', dingGaat: 'op' }], sip: [{ lijf: 'zak', ding: '💦', dingGaat: 'val' }] },
  },
  {
    sleutel: 'bij', emoji: '🐝', titel: 'de Bij die Overal Zoemt',
    goed: ['Bzzz! Honingzoet antwoord.', 'De bij doet een dansje: hier zit het goede antwoord.'],
    fout: ['Bzzz… bzz… nee.', 'De bij vloog tegen het raam.'],
    entree: 'zoemt drie keer om je hoofd',
    beweging: 'vlieg',
    acties: { blij: [{ lijf: 'acht', ding: '🌼', dingGaat: 'op' }, { lijf: 'dans', ding: '🍯', dingGaat: 'gooi' }], sip: [{ lijf: 'omval', ding: '🌧️', dingGaat: 'rond' }] },
  },
  {
    sleutel: 'vlinder', emoji: '🦋', titel: 'de Fladderende Vlinder',
    goed: ['Een vleugelslag, en raak.', 'De vlinder fladdert trots een rondje.'],
    fout: ['De vlinder fladderde de verkeerde kant op.', 'Vlinders in de buik. Antwoord in de prullenbak.'],
    entree: 'fladdert binnen door het open raam',
    beweging: 'vlieg',
    acties: { blij: [{ lijf: 'acht', ding: '🌸', dingGaat: 'op' }, { lijf: 'pirouette', ding: '✨', dingGaat: 'rond' }], sip: [{ lijf: 'zak', ding: '🍂', dingGaat: 'val' }] },
  },
  {
    sleutel: 'papegaai', emoji: '🦜', titel: 'de Papegaai die Alles Napraat',
    goed: ['Goed! Goed! Goed! Rrraak!', 'De papegaai herhaalt het antwoord nog tien keer.'],
    fout: ['De papegaai praatte de verkeerde na.', 'Rrrrr… fout. Fout. Fout.'],
    entree: 'landt op de lamp en roept iedereens naam',
    beweging: 'vlieg',
    acties: { blij: [{ lijf: 'schud', ding: '💬', dingGaat: 'op' }, { lijf: 'salto', ding: '🎶', dingGaat: 'op' }], sip: [{ lijf: 'mok', ding: '💬', dingGaat: 'op' }] },
  },
  {
    sleutel: 'das', emoji: '🦡', titel: 'de Das die Overal Doorheen Graaft',
    goed: ['De das groef het antwoord zo op.', 'Diep gegraven, goud gevonden.'],
    fout: ['De das groef een gat. En viel erin.', 'Te diep gegraven. Niks gevonden.'],
    entree: 'komt dwars door de vloer omhoog',
    beweging: 'graaf',
    acties: { blij: [{ lijf: 'graaf', ding: '🪨', dingGaat: 'gooi' }, { lijf: 'dans', ding: '🍄', dingGaat: 'op' }], sip: [{ lijf: 'verstop', ding: '🕳️', dingGaat: 'val' }] },
  },
  {
    sleutel: 'konijn', emoji: '🐇', titel: 'het Konijn met een Gat in de Tuin',
    goed: ['Het konijn schiet van blijdschap zijn hol in en weer uit.', 'Snel als een konijn, en raak.'],
    fout: ['Het konijn verdwijnt beschaamd in zijn hol.', 'Verkeerde afslag in de konijnenpijp.'],
    entree: 'duikt uit een hol op dat er net nog niet was',
    beweging: 'graaf',
    acties: { blij: [{ lijf: 'boing', ding: '🥕', dingGaat: 'gooi' }, { lijf: 'graaf', ding: '🌷', dingGaat: 'op' }], sip: [{ lijf: 'verstop', ding: '🕳️', dingGaat: 'val' }] },
  },
  {
    sleutel: 'worm', emoji: '🪱', titel: 'de Worm die de Diepte in Gaat',
    goed: ['De worm kronkelt van plezier.', 'Van onder de grond, recht in de roos.'],
    fout: ['De worm kruipt terug de aarde in.', 'Kronkel. Mis.'],
    entree: 'kronkelt omhoog uit de bloempot',
    beweging: 'graaf',
    acties: { blij: [{ lijf: 'kronkel', ding: '🍎', dingGaat: 'op' }, { lijf: 'graaf', ding: '🌱', dingGaat: 'op' }], sip: [{ lijf: 'kronkel', ding: '💧', dingGaat: 'val' }] },
  },
  {
    sleutel: 'eekhoorn', emoji: '🐿️', titel: 'de Eekhoorn die Alles Begraaft',
    goed: ['De eekhoorn begraaft het punt. Voor later.', 'Een nootje voor de winter!'],
    fout: ['De eekhoorn weet niet meer waar hij het antwoord begroef.', 'Geen nootje vandaag.'],
    entree: 'graaft eerst even een nootje in in de bank',
    beweging: 'graaf',
    acties: { blij: [{ lijf: 'graaf', ding: '🌰', dingGaat: 'val' }, { lijf: 'rol', ding: '🌰', dingGaat: 'gooi' }], sip: [{ lijf: 'zak', ding: '🌰', dingGaat: 'val' }] },
  },
];

const PER_SLEUTEL = new Map(DIEREN.map((d) => [d.sleutel, d]));

export function isDier(sleutel: unknown): sleutel is string {
  return typeof sleutel === 'string' && PER_SLEUTEL.has(sleutel);
}

/** Het dier bij een sleutel. Zonder geldige sleutel beslist de naam. */
export function dierVan(sleutel: string | null | undefined, naam = ''): Maatje {
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

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
  /**
   * Zijn karakter, elk van 1 tot 5. Het staat op de telefoon als je hem
   * kiest, en het bepaalt hoe hij zich in de wei gedraagt (wei.ts): een snel
   * dier rent vaker en harder, een slaperig dier dut vaker in, een gezellig
   * dier groet vaker, een ondeugend dier zit anderen vaker achterna, een
   * dramatisch dier doet vaker een kunstje.
   */
  karakter: Karakter;
  /** Wat hij het liefst eet; in de wei vindt hij het soms. */
  hapje: { ding: string; naam: string };
  /** Waar hij om bekend staat, in één zin. */
  specialiteit: string;
}

export interface Karakter {
  snel: number;
  slim: number;
  slaperig: number;
  gezellig: number;
  ondeugend: number;
  drama: number;
}

/** De eigenschappen in de volgorde en met de namen van het kaartje op de telefoon. */
export const EIGENSCHAPPEN: readonly { sleutel: keyof Karakter; naam: string }[] = [
  { sleutel: 'snel', naam: 'Snelheid' },
  { sleutel: 'slim', naam: 'Slimheid' },
  { sleutel: 'slaperig', naam: 'Slaperigheid' },
  { sleutel: 'gezellig', naam: 'Gezelligheid' },
  { sleutel: 'ondeugend', naam: 'Ondeugd' },
  { sleutel: 'drama', naam: 'Drama' },
];

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
    karakter: { snel: 3, slim: 3, slaperig: 2, gezellig: 2, ondeugend: 4, drama: 5 },
    hapje: { ding: '🌾', naam: 'hooi' },
    specialiteit: 'Spuugt precies op het verkeerde moment',
    acties: { blij: [{ lijf: 'opblaas', ding: '💦', dingGaat: 'gooi' }, { lijf: 'dans' }], sip: [{ lijf: 'zak', ding: '💦', dingGaat: 'val' }] },
  },
  {
    sleutel: 'luiaard', emoji: '🦥', titel: 'de Luiaard met Deadline',
    goed: ['De luiaard is voor één keer op tijd.', 'Zelfs de luiaard schrok hiervan.'],
    fout: ['De luiaard was er nog niet aan toe.', 'Luiaard doet een dutje. Morgen beter.'],
    entree: 'komt aan. Over een kwartiertje',
    beweging: 'schommel',
    karakter: { snel: 1, slim: 3, slaperig: 5, gezellig: 4, ondeugend: 1, drama: 1 },
    hapje: { ding: '🍃', naam: 'verse blaadjes' },
    specialiteit: 'Hangt alles uit, ook de spanning',
    acties: { blij: [{ lijf: 'ondersteboven' }, { lijf: 'boing', ding: '🍃', dingGaat: 'op' }], sip: [{ lijf: 'verstop', ding: '💤', dingGaat: 'op' }] },
  },
  {
    sleutel: 'flamingo', emoji: '🦩', titel: 'de Wiebelende Flamingo',
    goed: ['De flamingo staat op één been te juichen.', 'Roze van trots.'],
    fout: ['De flamingo valt om. Sierlijk, dat wel.', 'Even op twee benen staan, flamingo.'],
    entree: 'staat al een uur op één been te wachten',
    beweging: 'vlieg',
    karakter: { snel: 3, slim: 2, slaperig: 2, gezellig: 4, ondeugend: 1, drama: 4 },
    hapje: { ding: '🦐', naam: 'garnaaltjes' },
    specialiteit: 'Staat uren op één been',
    acties: { blij: [{ lijf: 'balans' }, { lijf: 'pirouette', ding: '🌸', dingGaat: 'rond' }], sip: [{ lijf: 'omval' }] },
  },
  {
    sleutel: 'pinguin', emoji: '🐧', titel: 'de Pinguïn in Pak',
    goed: ['De pinguïn trekt zijn strikje recht.', 'Chic gedaan, pinguïn.'],
    fout: ['De pinguïn glijdt uit op het ijs.', 'Pak aan, hoofd koud, antwoord fout.'],
    entree: 'waggelt binnen in smoking',
    beweging: 'waggel',
    karakter: { snel: 2, slim: 4, slaperig: 2, gezellig: 5, ondeugend: 2, drama: 2 },
    hapje: { ding: '🐟', naam: 'een visje' },
    specialiteit: 'Altijd netjes in pak, ook op het ijs',
    acties: { blij: [{ lijf: 'glij', ding: '❄️', dingGaat: 'op' }, { lijf: 'dans', ding: '🎩', dingGaat: 'rond' }], sip: [{ lijf: 'omval', ding: '🧊', dingGaat: 'val' }] },
  },
  {
    sleutel: 'octopus', emoji: '🐙', titel: 'de Octopus met Acht Antwoorden',
    goed: ['Eén van de acht armen had het goed.', 'De octopus klapt. Acht keer.'],
    fout: ['Acht armen, nul goede antwoorden.', 'De octopus spuit inkt en verdwijnt.'],
    entree: 'zwaait met alle acht armen tegelijk',
    beweging: 'zwem',
    karakter: { snel: 3, slim: 5, slaperig: 2, gezellig: 3, ondeugend: 4, drama: 3 },
    hapje: { ding: '🦀', naam: 'krabbetjes' },
    specialiteit: 'Acht antwoorden tegelijk',
    acties: { blij: [{ lijf: 'acht', ding: '🐚', dingGaat: 'gooi' }, { lijf: 'dans', ding: '🎵', dingGaat: 'op' }], sip: [{ lijf: 'verstop', ding: '🖤', dingGaat: 'op' }] },
  },
  {
    sleutel: 'kip', emoji: '🐔', titel: 'de Paniekkip',
    goed: ['Tok tok TOK! Goed!', 'De kip legt van blijdschap een ei.'],
    fout: ['De kip rent zonder kop in het rond.', 'Tok… tok… nee.'],
    entree: 'fladdert binnen in volle paniek',
    beweging: 'vlieg',
    karakter: { snel: 4, slim: 1, slaperig: 2, gezellig: 3, ondeugend: 3, drama: 5 },
    hapje: { ding: '🌽', naam: 'maïskorrels' },
    specialiteit: 'Paniek als levensstijl',
    acties: { blij: [{ lijf: 'boing', ding: '🥚', dingGaat: 'val' }, { lijf: 'schud', ding: '🪶', dingGaat: 'op' }], sip: [{ lijf: 'schud', ding: '🪶', dingGaat: 'val' }] },
  },
  {
    sleutel: 'eenhoorn', emoji: '🦄', titel: 'de Eenhoorn met Kater',
    goed: ['Magie. Of geluk. Maakt niet uit.', 'De eenhoorn poept een regenboog.'],
    fout: ['De hoorn staat vandaag een beetje scheef.', 'Zelfs magie heeft een vrije avond.'],
    entree: 'galoppeert binnen in een wolk van glitter',
    beweging: 'stuiter',
    karakter: { snel: 4, slim: 3, slaperig: 3, gezellig: 4, ondeugend: 2, drama: 5 },
    hapje: { ding: '🧁', naam: 'cupcakes' },
    specialiteit: 'Laat overal glitter achter',
    acties: { blij: [{ lijf: 'boing', ding: '🌈', dingGaat: 'op' }, { lijf: 'salto', ding: '✨', dingGaat: 'rond' }], sip: [{ lijf: 'zak', ding: '💫', dingGaat: 'rond' }] },
  },
  {
    sleutel: 'uil', emoji: '🦉', titel: 'de Uil die Doet Alsof',
    goed: ['De uil knikt wijs. Alsof het niks was.', 'Oehoe, knap.'],
    fout: ['De uil deed maar alsof. Nu weet iedereen het.', 'Oehoe… oei.'],
    entree: 'kijkt heel wijs, maar weet eigenlijk niks',
    beweging: 'vlieg',
    karakter: { snel: 2, slim: 4, slaperig: 4, gezellig: 2, ondeugend: 1, drama: 2 },
    hapje: { ding: '🐭', naam: 'muisjes' },
    specialiteit: 'Kijkt heel wijs, weet het eigenlijk niet',
    acties: { blij: [{ lijf: 'pirouette', ding: '🎓', dingGaat: 'op' }, { lijf: 'dans', ding: '📚', dingGaat: 'gooi' }], sip: [{ lijf: 'mok', ding: '❓', dingGaat: 'op' }] },
  },
  {
    sleutel: 'goudvis', emoji: '🐠', titel: 'de Goudvis met Drie Seconden Geheugen',
    goed: ['Goed! Wacht, wat was de vraag?', 'De goudvis is het alweer vergeten, maar: goed!'],
    fout: ['Fout. Gelukkig is de goudvis het zo vergeten.', 'Blub.'],
    entree: 'zwemt rondjes. Waar was hij ook alweer?',
    beweging: 'zwem',
    karakter: { snel: 3, slim: 1, slaperig: 2, gezellig: 4, ondeugend: 2, drama: 2 },
    hapje: { ding: '🍞', naam: 'broodkruimels' },
    specialiteit: 'Vergeet alles na drie seconden',
    acties: { blij: [{ lijf: 'salto', ding: '🫧', dingGaat: 'op' }, { lijf: 'acht', ding: '🫧', dingGaat: 'op' }], sip: [{ lijf: 'zak', ding: '❓', dingGaat: 'op' }] },
  },
  {
    sleutel: 'wasbeer', emoji: '🦝', titel: 'de Wasbeer met Lange Vingers',
    goed: ['De wasbeer heeft het antwoord gejat. Van wie?', 'Buit binnen!'],
    fout: ['De wasbeer greep mis in de vuilnisbak.', 'Wasbeer wast zijn handen in onschuld.'],
    entree: 'sluipt binnen met iets in zijn wangen',
    beweging: 'loop',
    karakter: { snel: 4, slim: 4, slaperig: 2, gezellig: 2, ondeugend: 5, drama: 2 },
    hapje: { ding: '🍕', naam: 'pizzakorstjes' },
    specialiteit: 'Jat alles wat los ligt',
    acties: { blij: [{ lijf: 'opblaas', ding: '💰', dingGaat: 'op' }, { lijf: 'dans', ding: '🍕', dingGaat: 'gooi' }], sip: [{ lijf: 'verstop', ding: '🗑️', dingGaat: 'val' }] },
  },
  {
    sleutel: 'kikker', emoji: '🐸', titel: 'de Kikker in de Keel',
    goed: ['Kwaak! In één sprong goed.', 'De kikker springt een gat in de lucht.'],
    fout: ['Kwaak. Kwaak kwaak. Nee.', 'De kikker plonst het water in.'],
    entree: 'springt binnen en kwaakt iets onverstaanbaars',
    beweging: 'spring',
    karakter: { snel: 5, slim: 2, slaperig: 2, gezellig: 3, ondeugend: 3, drama: 3 },
    hapje: { ding: '🪰', naam: 'vliegjes' },
    specialiteit: 'Springt eerst, denkt later',
    acties: { blij: [{ lijf: 'boing', ding: '🪰', dingGaat: 'rond' }, { lijf: 'salto', ding: '💦', dingGaat: 'op' }], sip: [{ lijf: 'verstop', ding: '💦', dingGaat: 'op' }] },
  },
  {
    sleutel: 'egel', emoji: '🦔', titel: 'de Egel met Stekels op Scherp',
    goed: ['De egel rolt zich tevreden op.', 'Scherp, egel. Scherp.'],
    fout: ['Au. De egel prikt zichzelf.', 'De egel rolt zich op en doet alsof hij er niet is.'],
    entree: 'rolt binnen als een stekelig balletje',
    beweging: 'draai',
    karakter: { snel: 2, slim: 3, slaperig: 4, gezellig: 1, ondeugend: 2, drama: 2 },
    hapje: { ding: '🍎', naam: 'appeltjes' },
    specialiteit: 'Rolt zich op bij de eerste moeilijke vraag',
    acties: { blij: [{ lijf: 'rol' }, { lijf: 'dans', ding: '🍎', dingGaat: 'op' }], sip: [{ lijf: 'rol', ding: '💥', dingGaat: 'op' }] },
  },
  {
    sleutel: 'zeehond', emoji: '🦭', titel: 'de Applaudisserende Zeehond',
    goed: ['De zeehond klapt. Voor zichzelf.', 'Een vis voor de zeehond!'],
    fout: ['De zeehond klapt toch maar. Uit gewoonte.', 'Geen vis vandaag.'],
    entree: 'glijdt op zijn buik naar binnen',
    beweging: 'zwem',
    karakter: { snel: 2, slim: 3, slaperig: 3, gezellig: 5, ondeugend: 2, drama: 4 },
    hapje: { ding: '🐟', naam: 'haring' },
    specialiteit: 'Applaudisseert voor alles',
    acties: { blij: [{ lijf: 'balans', ding: '⚽', dingGaat: 'rond' }, { lijf: 'boing', ding: '👏', dingGaat: 'op' }], sip: [{ lijf: 'zak', ding: '🐟', dingGaat: 'val' }] },
  },
  {
    sleutel: 'kreeft', emoji: '🦞', titel: 'de Kreeft die Zijwaarts Denkt',
    goed: ['Zijwaarts gedacht, recht in de roos.', 'De kreeft knipt tevreden met zijn scharen.'],
    fout: ['De kreeft liep weer de verkeerde kant op.', 'Knip knip. Mis mis.'],
    entree: 'schuifelt zijwaarts naar binnen',
    beweging: 'loop',
    karakter: { snel: 2, slim: 3, slaperig: 2, gezellig: 2, ondeugend: 3, drama: 3 },
    hapje: { ding: '🌿', naam: 'zeewier' },
    specialiteit: 'Denkt zijwaarts',
    acties: { blij: [{ lijf: 'schud', ding: '✂️', dingGaat: 'op' }, { lijf: 'dans', ding: '🦀', dingGaat: 'rond' }], sip: [{ lijf: 'mok', ding: '💢', dingGaat: 'op' }] },
  },
  {
    sleutel: 'hamster', emoji: '🐹', titel: 'de Hamster die Punten Hamstert',
    goed: ['De hamster propt het punt in zijn wangen.', 'Nog eentje voor de voorraad.'],
    fout: ['De wangen blijven leeg.', 'De hamster rent verder in zijn wiel.'],
    entree: 'komt binnen met volle wangen',
    beweging: 'stuiter',
    karakter: { snel: 4, slim: 2, slaperig: 3, gezellig: 4, ondeugend: 3, drama: 2 },
    hapje: { ding: '🌻', naam: 'zonnepitten' },
    specialiteit: 'Hamstert punten voor later',
    acties: { blij: [{ lijf: 'opblaas', ding: '🌻', dingGaat: 'op' }, { lijf: 'rol' }], sip: [{ lijf: 'zak', ding: '🌰', dingGaat: 'val' }] },
  },
  {
    sleutel: 'nijlpaard', emoji: '🦛', titel: 'het Nijlpaard in de Porseleinkast',
    goed: ['Met veel geweld, maar goed.', 'Het nijlpaard doet een dansje. De vloer kraakt.'],
    fout: ['Krak. Daar gaat het servies.', 'Het nijlpaard zakt beteuterd onder water.'],
    entree: 'stampt binnen. Er valt iets om',
    beweging: 'loop',
    karakter: { snel: 2, slim: 2, slaperig: 4, gezellig: 3, ondeugend: 3, drama: 4 },
    hapje: { ding: '🍉', naam: 'watermeloen' },
    specialiteit: 'Past nergens, gaat overal',
    acties: { blij: [{ lijf: 'boing', ding: '💥', dingGaat: 'op' }, { lijf: 'dans', ding: '🩰', dingGaat: 'rond' }], sip: [{ lijf: 'verstop', ding: '💦', dingGaat: 'op' }] },
  },
  {
    sleutel: 'giraf', emoji: '🦒', titel: 'de Giraf met Overzicht',
    goed: ['Van boven zag de giraf het meteen.', 'Hoog gegrepen en raak.'],
    fout: ['De giraf keek over het antwoord heen.', 'Te hoog gegrepen.'],
    entree: 'bukt nét op tijd voor de deurpost',
    beweging: 'loop',
    karakter: { snel: 3, slim: 4, slaperig: 2, gezellig: 3, ondeugend: 1, drama: 2 },
    hapje: { ding: '🌿', naam: 'acaciablaadjes' },
    specialiteit: 'Ziet alles van bovenaf',
    acties: { blij: [{ lijf: 'rek', ding: '🍃', dingGaat: 'op' }, { lijf: 'dans', ding: '🎵', dingGaat: 'op' }], sip: [{ lijf: 'zak', ding: '💧', dingGaat: 'val' }] },
  },
  {
    sleutel: 'slak', emoji: '🐌', titel: 'de Slak op Turbo',
    goed: ['Traag, maar raak.', 'De slak laat een glinsterend spoor van succes na.'],
    fout: ['Het huisje is er, het antwoord niet.', 'De slak trekt zich terug in zijn huisje.'],
    entree: 'is onderweg sinds vorige week',
    beweging: 'kruip',
    karakter: { snel: 1, slim: 3, slaperig: 3, gezellig: 3, ondeugend: 1, drama: 2 },
    hapje: { ding: '🥬', naam: 'sla' },
    specialiteit: 'Op turbo: twee meter per uur',
    acties: { blij: [{ lijf: 'schud', ding: '💨', dingGaat: 'op' }, { lijf: 'rol' }], sip: [{ lijf: 'verstop', ding: '🐚', dingGaat: 'op' }] },
  },
  {
    sleutel: 'krokodil', emoji: '🐊', titel: 'de Krokodil met Krokodillentranen',
    goed: ['De krokodil hapt het punt weg.', 'Happ! Binnen.'],
    fout: ['Krokodillentranen. Heel overtuigend.', 'De krokodil hapte in de lucht.'],
    entree: 'glimlacht met heel veel tanden',
    beweging: 'zwem',
    karakter: { snel: 3, slim: 3, slaperig: 4, gezellig: 1, ondeugend: 4, drama: 3 },
    hapje: { ding: '🍗', naam: 'kippenpootjes' },
    specialiteit: 'Glimlacht met heel veel tanden',
    acties: { blij: [{ lijf: 'opblaas', ding: '🦷', dingGaat: 'gooi' }, { lijf: 'salto', ding: '💦', dingGaat: 'op' }], sip: [{ lijf: 'zak', ding: '💧', dingGaat: 'val' }] },
  },
  {
    sleutel: 'kameel', emoji: '🐫', titel: 'de Kameel die Nergens Dorst van Krijgt',
    goed: ['Met twee bulten vol kennis.', 'De kameel trekt onverstoorbaar verder.'],
    fout: ['Een fata morgana van een antwoord.', 'De kameel kauwt er nog even op.'],
    entree: 'sjokt binnen uit de woestijn',
    beweging: 'loop',
    karakter: { snel: 2, slim: 3, slaperig: 3, gezellig: 2, ondeugend: 2, drama: 1 },
    hapje: { ding: '🌵', naam: 'cactus' },
    specialiteit: 'Heeft nooit dorst, nooit haast',
    acties: { blij: [{ lijf: 'dans', ding: '🌴', dingGaat: 'op' }, { lijf: 'rek', ding: '☀️', dingGaat: 'rond' }], sip: [{ lijf: 'zak', ding: '🏜️', dingGaat: 'val' }] },
  },
  {
    sleutel: 'aap', emoji: '🐒', titel: 'de Aap die Aan de Lamp Hangt',
    goed: ['De aap slingert van blijdschap door de kamer.', 'Oe-oe-AA-AA! Raak!'],
    fout: ['De aap mist de tak en valt in de bananen.', 'Apenstreken. Maar fout.'],
    entree: 'slingert binnen aan de lamp',
    beweging: 'schommel',
    karakter: { snel: 5, slim: 3, slaperig: 1, gezellig: 4, ondeugend: 5, drama: 4 },
    hapje: { ding: '🍌', naam: 'bananen' },
    specialiteit: 'Slingert aan alles wat hangt',
    acties: { blij: [{ lijf: 'acht', ding: '🍌', dingGaat: 'gooi' }, { lijf: 'ondersteboven', ding: '🍌', dingGaat: 'rond' }], sip: [{ lijf: 'omval', ding: '🍌', dingGaat: 'val' }] },
  },
  {
    sleutel: 'kangoeroe', emoji: '🦘', titel: 'de Kangoeroe met Springveren',
    goed: ['De kangoeroe springt tegen het plafond.', 'Met één sprong over de finish.'],
    fout: ['Te vroeg gesprongen.', 'De kangoeroe verstopt zich in zijn eigen buidel.'],
    entree: 'springt in drie sprongen de kamer door',
    beweging: 'spring',
    karakter: { snel: 5, slim: 2, slaperig: 2, gezellig: 3, ondeugend: 3, drama: 3 },
    hapje: { ding: '🌿', naam: 'gras' },
    specialiteit: 'Springt over elk probleem heen',
    acties: { blij: [{ lijf: 'boing', ding: '🥊', dingGaat: 'gooi' }, { lijf: 'salto' }], sip: [{ lijf: 'verstop', ding: '👜', dingGaat: 'op' }] },
  },
  {
    sleutel: 'hond', emoji: '🐕', titel: 'de Hond die Overal Achteraan Rent',
    goed: ['Goed zo! Brave! Wie is er een brave?', 'De staart gaat alle kanten op.'],
    fout: ['De hond rende achter het verkeerde balletje aan.', 'Zielige hondenogen. Helpt niet.'],
    entree: 'rent kwispelend drie rondjes om de tafel',
    beweging: 'loop',
    karakter: { snel: 5, slim: 2, slaperig: 2, gezellig: 5, ondeugend: 3, drama: 3 },
    hapje: { ding: '🦴', naam: 'botjes' },
    specialiteit: 'Rent achter alles aan',
    acties: { blij: [{ lijf: 'dans', ding: '🦴', dingGaat: 'gooi' }, { lijf: 'rol', ding: '🎾', dingGaat: 'rond' }], sip: [{ lijf: 'zak', ding: '🥺', dingGaat: 'op' }] },
  },
  {
    sleutel: 'dolfijn', emoji: '🐬', titel: 'de Dolfijn die Altijd Lacht',
    goed: ['De dolfijn maakt een salto uit het water.', 'Ieieieiek! Goed!'],
    fout: ['De dolfijn lacht toch maar. Een beetje schaapachtig.', 'Plons. Mis.'],
    entree: 'zwemt binnen door de gang. Niemand weet hoe',
    beweging: 'zwem',
    karakter: { snel: 5, slim: 5, slaperig: 1, gezellig: 5, ondeugend: 2, drama: 3 },
    hapje: { ding: '🐟', naam: 'makreel' },
    specialiteit: 'Lacht altijd, ook als het fout is',
    acties: { blij: [{ lijf: 'salto', ding: '💦', dingGaat: 'op' }, { lijf: 'acht', ding: '🫧', dingGaat: 'op' }], sip: [{ lijf: 'zak', ding: '💦', dingGaat: 'val' }] },
  },
  {
    sleutel: 'bij', emoji: '🐝', titel: 'de Bij die Overal Zoemt',
    goed: ['Bzzz! Honingzoet antwoord.', 'De bij doet een dansje: hier zit het goede antwoord.'],
    fout: ['Bzzz… bzz… nee.', 'De bij vloog tegen het raam.'],
    entree: 'zoemt drie keer om je hoofd',
    beweging: 'vlieg',
    karakter: { snel: 5, slim: 3, slaperig: 1, gezellig: 4, ondeugend: 2, drama: 2 },
    hapje: { ding: '🌼', naam: 'nectar' },
    specialiteit: 'Zoemt overal tegelijk',
    acties: { blij: [{ lijf: 'acht', ding: '🌼', dingGaat: 'op' }, { lijf: 'dans', ding: '🍯', dingGaat: 'gooi' }], sip: [{ lijf: 'omval', ding: '🌧️', dingGaat: 'rond' }] },
  },
  {
    sleutel: 'vlinder', emoji: '🦋', titel: 'de Fladderende Vlinder',
    goed: ['Een vleugelslag, en raak.', 'De vlinder fladdert trots een rondje.'],
    fout: ['De vlinder fladderde de verkeerde kant op.', 'Vlinders in de buik. Antwoord in de prullenbak.'],
    entree: 'fladdert binnen door het open raam',
    beweging: 'vlieg',
    karakter: { snel: 3, slim: 1, slaperig: 2, gezellig: 3, ondeugend: 1, drama: 4 },
    hapje: { ding: '🌸', naam: 'bloemennectar' },
    specialiteit: 'Fladdert alle kanten op behalve de goede',
    acties: { blij: [{ lijf: 'acht', ding: '🌸', dingGaat: 'op' }, { lijf: 'pirouette', ding: '✨', dingGaat: 'rond' }], sip: [{ lijf: 'zak', ding: '🍂', dingGaat: 'val' }] },
  },
  {
    sleutel: 'papegaai', emoji: '🦜', titel: 'de Papegaai die Alles Napraat',
    goed: ['Goed! Goed! Goed! Rrraak!', 'De papegaai herhaalt het antwoord nog tien keer.'],
    fout: ['De papegaai praatte de verkeerde na.', 'Rrrrr… fout. Fout. Fout.'],
    entree: 'landt op de lamp en roept iedereens naam',
    beweging: 'vlieg',
    karakter: { snel: 4, slim: 3, slaperig: 1, gezellig: 4, ondeugend: 3, drama: 5 },
    hapje: { ding: '🍒', naam: 'kersen' },
    specialiteit: 'Praat iedereen na',
    acties: { blij: [{ lijf: 'schud', ding: '💬', dingGaat: 'op' }, { lijf: 'salto', ding: '🎶', dingGaat: 'op' }], sip: [{ lijf: 'mok', ding: '💬', dingGaat: 'op' }] },
  },
  {
    sleutel: 'das', emoji: '🦡', titel: 'de Das die Overal Doorheen Graaft',
    goed: ['De das groef het antwoord zo op.', 'Diep gegraven, goud gevonden.'],
    fout: ['De das groef een gat. En viel erin.', 'Te diep gegraven. Niks gevonden.'],
    entree: 'komt dwars door de vloer omhoog',
    beweging: 'graaf',
    karakter: { snel: 3, slim: 3, slaperig: 4, gezellig: 1, ondeugend: 3, drama: 1 },
    hapje: { ding: '🍄', naam: 'paddenstoelen' },
    specialiteit: 'Graaft dwars door alles heen',
    acties: { blij: [{ lijf: 'graaf', ding: '🪨', dingGaat: 'gooi' }, { lijf: 'dans', ding: '🍄', dingGaat: 'op' }], sip: [{ lijf: 'verstop', ding: '🕳️', dingGaat: 'val' }] },
  },
  {
    sleutel: 'konijn', emoji: '🐇', titel: 'het Konijn met een Gat in de Tuin',
    goed: ['Het konijn schiet van blijdschap zijn hol in en weer uit.', 'Snel als een konijn, en raak.'],
    fout: ['Het konijn verdwijnt beschaamd in zijn hol.', 'Verkeerde afslag in de konijnenpijp.'],
    entree: 'duikt uit een hol op dat er net nog niet was',
    beweging: 'graaf',
    karakter: { snel: 5, slim: 2, slaperig: 2, gezellig: 4, ondeugend: 3, drama: 2 },
    hapje: { ding: '🥕', naam: 'worteltjes' },
    specialiteit: 'Verdwijnt in een hol als het spannend wordt',
    acties: { blij: [{ lijf: 'boing', ding: '🥕', dingGaat: 'gooi' }, { lijf: 'graaf', ding: '🌷', dingGaat: 'op' }], sip: [{ lijf: 'verstop', ding: '🕳️', dingGaat: 'val' }] },
  },
  {
    sleutel: 'worm', emoji: '🪱', titel: 'de Worm die de Diepte in Gaat',
    goed: ['De worm kronkelt van plezier.', 'Van onder de grond, recht in de roos.'],
    fout: ['De worm kruipt terug de aarde in.', 'Kronkel. Mis.'],
    entree: 'kronkelt omhoog uit de bloempot',
    beweging: 'graaf',
    karakter: { snel: 1, slim: 1, slaperig: 3, gezellig: 3, ondeugend: 1, drama: 1 },
    hapje: { ding: '🍂', naam: 'dode blaadjes' },
    specialiteit: 'Gaat altijd de diepte in',
    acties: { blij: [{ lijf: 'kronkel', ding: '🍎', dingGaat: 'op' }, { lijf: 'graaf', ding: '🌱', dingGaat: 'op' }], sip: [{ lijf: 'kronkel', ding: '💧', dingGaat: 'val' }] },
  },
  {
    sleutel: 'eekhoorn', emoji: '🐿️', titel: 'de Eekhoorn die Alles Begraaft',
    goed: ['De eekhoorn begraaft het punt. Voor later.', 'Een nootje voor de winter!'],
    fout: ['De eekhoorn weet niet meer waar hij het antwoord begroef.', 'Geen nootje vandaag.'],
    entree: 'graaft eerst even een nootje in in de bank',
    beweging: 'graaf',
    karakter: { snel: 5, slim: 2, slaperig: 2, gezellig: 2, ondeugend: 3, drama: 3 },
    hapje: { ding: '🌰', naam: 'nootjes' },
    specialiteit: 'Begraaft alles voor later',
    acties: { blij: [{ lijf: 'graaf', ding: '🌰', dingGaat: 'val' }, { lijf: 'rol', ding: '🌰', dingGaat: 'gooi' }], sip: [{ lijf: 'zak', ding: '🌰', dingGaat: 'val' }] },
  },
];

/** Hoe lang de naam van een maatje mag zijn: past op een naambordje op de televisie. */
export const MAX_DIERNAAM = 20;

/**
 * Een naam voor je maatje, netjes gemaakt: geen stuurtekens, geen dubbele
 * spaties, niet te lang. Leeg (of geen tekst) wordt null: dan heet het dier
 * weer gewoon naar zijn soort.
 */
export function schoneDierNaam(naam: unknown): string | null {
  if (typeof naam !== 'string') return null;
  // Eerst wit (ook tabs en regeleinden) tot één spatie; dan weg met stuurtekens
  // en tekens die tekst omkeren. Emoji met een verbinder (🏳️‍🌈) blijven heel.
  const schoon = naam.replace(/\s+/g, ' ').replace(/[\p{Cc}\u202A-\u202E\u2066-\u2069]/gu, '').trim();
  return [...schoon].slice(0, MAX_DIERNAAM).join('').trim() || null;
}

/** Het maatje voluit: "Knabbel, de Paniekkip", of zonder naam gewoon "de Paniekkip". */
export function maatjeVoluit(dier: Maatje, dierNaam?: string | null): string {
  return dierNaam ? `${dierNaam}, ${dier.titel}` : dier.titel;
}

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

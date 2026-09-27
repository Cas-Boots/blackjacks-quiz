/**
 * De wei: waar de maatjes in de lobby rondscharrelen terwijl iedereen binnenkomt.
 *
 * Elk dier heeft een eigen willetje. Het loopt wat, blijft staan, snuffelt,
 * valt in slaap, springt, doet een kunstje, rent ineens een eind weg, of
 * zit een ander achterna. Komen twee dieren elkaar tegen, dan groeten ze
 * elkaar. En wie op zijn eigen dier tikt, krijgt een kunstje.
 *
 * Elk dier neemt ook zijn eigen stukje wereld mee (THUIS): de aap een
 * bananenboom, de luiaard een boom om in te hangen, de vissen een vijver,
 * de bij bloemen, het konijn een moestuin, de das een paar holen, de kameel
 * een cactus. Alleen wat er voor de dieren van vanavond nodig is staat in de
 * wei, zodat het nooit vol raakt. Grond, water en lucht werken samen: vissen
 * blijven in de vijver, landdieren lopen erachter langs over de oever of gaan
 * een bad nemen of drinken, de kikker springt erin met een plons, vogels strijken neer in de
 * boom, de bij zweeft boven de bloemen, gravers verdwijnen in het ene hol en
 * komen uit het andere boven.
 *
 * Hoe vaak een dier wat doet hangt af van zijn karakter (shared/dieren.ts):
 * een snel dier rent vaker en harder, een slaperig dier dut vaker en langer,
 * een gezellig dier groet sneller opnieuw, een ondeugend dier zit vaker een
 * ander achterna, een dramatisch dier doet vaker een kunstje, en een slim
 * dier snuffelt meer rond. Soms vindt het zijn lievelingshapje.
 *
 * Dit is alleen het brein: `stapWei` schuift de tijd een stukje op.
 * Dierenwei.svelte tekent het, met Pixeldier.svelte.
 */
import { actiesVan, dierVan, gangVan, poseVan, type Actie, type Lijf, type Pose } from '$lib/shared/dieren';
import { DECOR } from '$lib/shared/pixeldecor';

export type Doen =
  | 'loop' | 'ren' | 'staan' | 'snuffel' | 'slaap' | 'spring' | 'kunstje' | 'groet'
  | 'jaag' | 'vlucht' | 'graaf' | 'onder' | 'op' | 'schrik' | 'eet'
  // met de wereld erbij
  | 'naar' | 'klim' | 'inboom' | 'omlaag' | 'zwem' | 'bad' | 'plons' | 'drink' | 'bestuif' | 'knabbel' | 'waad';

export type Soort = 'grond' | 'lucht' | 'water' | 'graaf';

/* ---- De wereld --------------------------------------------------------- */

export type DecorSoort = 'boom' | 'bananenboom' | 'vijver' | 'bloemen' | 'moestuin' | 'hol' | 'cactus';

/** Een stuk decor: waar het begint en hoe breed het is, in procenten van de wei. */
export interface Decor {
  soort: DecorSoort;
  x: number;
  breed: number;
}

const SOORTEN: readonly DecorSoort[] = ['boom', 'bananenboom', 'vijver', 'bloemen', 'moestuin', 'hol', 'cactus'];
/** Hoe breed elk stuk decor is, in em: een dier is 1em breed (shared/pixeldecor.ts, 32 pixels per em). */
export const DECOR_EM = Object.fromEntries(SOORTEN.map((s) => [s, DECOR[s].rijen[0].length / 32])) as Readonly<Record<DecorSoort, number>>;
/** Waar je in de boom zit, in em boven de grond: tussen de onderste bladeren. */
const TAK: Partial<Record<DecorSoort, number>> = { boom: 1.0, bananenboom: 1.25 };

/** Wat elk dier meeneemt naar de wei. Wie hier niet staat, gebruikt gewoon wat er al is. */
export const THUIS: Readonly<Record<string, readonly DecorSoort[]>> = {
  aap: ['bananenboom'], luiaard: ['boom'], eekhoorn: ['boom', 'hol'], uil: ['boom'], papegaai: ['boom'],
  giraf: ['boom'], egel: ['boom'],
  goudvis: ['vijver'], dolfijn: ['vijver'], octopus: ['vijver'], krokodil: ['vijver'], nijlpaard: ['vijver'],
  zeehond: ['vijver'], pinguin: ['vijver'], kikker: ['vijver'], flamingo: ['vijver'], kreeft: ['vijver'],
  bij: ['bloemen'], vlinder: ['bloemen'], konijn: ['moestuin', 'hol'], hamster: ['moestuin'], kip: ['moestuin'],
  slak: ['moestuin'], das: ['hol'], worm: ['hol'], kameel: ['cactus'],
};
/** Wie nooit uit het water komt. */
const WATERDIEREN = new Set(['goudvis', 'dolfijn', 'octopus']);
/** Wie graag een bad neemt. */
const BADERS = new Set(['krokodil', 'nijlpaard', 'zeehond', 'pinguin']);
/** Wie in de boom klimt (de rest van de boomliefhebbers eet eronder, of strijkt erin neer). */
const KLIMMERS = new Set(['aap', 'luiaard', 'eekhoorn']);
const GRAVERS = new Set(['das', 'worm', 'konijn', 'eekhoorn']);

/** Welk decor de dieren van nu nodig hebben: elk soort één keer, holen twee keer (je moet ergens anders boven kunnen komen). */
export function decorVoor(sleutels: readonly string[]): DecorSoort[] {
  const nodig = new Set(sleutels.flatMap((s) => THUIS[s] ?? []));
  return [...nodig].flatMap((d) => (d === 'hol' ? ['hol', 'hol'] : [d]) as DecorSoort[]);
}

/**
 * Zet het decor neer: wat er al stond blijft staan, wat erbij moet krijgt een
 * vrije plek (per avond anders), en wat niet meer nodig is verdwijnt. Past
 * iets niet (op een smalle telefoon), dan komt het er niet.
 */
export function maakWereld(
  sleutels: readonly string[],
  breedteEm: number,
  oud: readonly Decor[] = [],
  toeval: () => number = Math.random,
): Decor[] {
  const nodig = decorVoor(sleutels);
  const wereld: Decor[] = [];
  const over = [...oud];
  const vrij: DecorSoort[] = [];
  for (const soort of nodig) {
    const i = over.findIndex((d) => d.soort === soort);
    if (i >= 0) wereld.push(over.splice(i, 1)[0]);
    else vrij.push(soort);
  }
  // Grote stukken eerst, dan is er nog ruimte voor de kleine.
  vrij.sort((a, b) => DECOR_EM[b] - DECOR_EM[a]);
  for (const soort of vrij) {
    const breed = (DECOR_EM[soort] * 100) / Math.max(1, breedteEm);
    if (breed > 60) continue;
    for (let poging = 0; poging < 80; poging++) {
      const x = tussen(toeval, 2, 98 - breed);
      if (wereld.every((d) => x + breed + 2 < d.x || x > d.x + d.breed + 2)) {
        wereld.push({ soort, x, breed });
        break;
      }
    }
  }
  return wereld.sort((a, b) => a.x - b.x);
}

const midden = (d: Decor) => d.x + d.breed / 2;
const zoek = (wereld: readonly Decor[], soort: DecorSoort) => wereld.find((d) => d.soort === soort);

/* ---- De bewoners ------------------------------------------------------- */

/** Wat een dier gaat doen als het ergens aankomt. */
export type Klus =
  | 'klim' | 'strijkneer' | 'blad' | 'appel' | 'bad' | 'plons' | 'waad' | 'drink' | 'was' | 'bestuif' | 'knabbel' | 'holgraaf';

export interface Bewoner {
  id: number;
  naam: string;
  /** De naam die de speler zijn maatje gaf, of null. */
  dierNaam: string | null;
  sleutel: string;
  soort: Soort;
  /** Waar hij staat, in procenten van de breedte. */
  x: number;
  /** Hoe hoog, in em boven de grond: in een boom, boven de bloemen, of onder water (negatief). */
  hoog: number;
  /** Of hij in de vijver ligt. */
  nat: boolean;
  richting: 1 | -1;
  doen: Doen;
  /** Hoe lang hij hier nog mee bezig is, in ms. */
  tot: number;
  /** Hoe lang deze bezigheid in totaal duurt: de lengte van de animatie. */
  duur: number;
  /** Het kunstje (of het ding erbij) van dit moment. */
  actie: Actie | null;
  /** Wie hij achternazit, of voor wie hij vlucht. */
  ander: number | null;
  /** Waar hij heen loopt, en wat hij daar gaat doen. */
  doel: number | null;
  klus: Klus | null;
  /** Hoe lang hij niet opnieuw gaat groeten. */
  groetPauze: number;
  /** Telt op bij elke nieuwe bezigheid, zodat de animatie opnieuw begint. */
  beurt: number;
}

export const RAND = 5;
const SNEL = { loop: 7, ren: 20, lucht: 10 } as const;
/** Hoe hoog vliegers vliegen, in em boven de grond. */
const VLIEGHOOGTE = 0.6;
/** Wie langs de vijver loopt, loopt over de oever erachter: een tikje hoger, met het water ervoor. */
const ACHTEROEVER = 0.24;

/**
 * Wat opvalt. Er doen er hooguit MAX_DRUK tegelijk iets geks; de rest
 * scharrelt, snuffelt of dut. Zo blijft de wei levendig maar nooit een kermis.
 */
const OPVALLEND: ReadonlySet<Doen> = new Set<Doen>(['kunstje', 'groet', 'jaag', 'vlucht', 'eet', 'spring', 'ren', 'schrik', 'plons']);
export const MAX_DRUK = 3;
export const drukte = (wei: readonly Bewoner[]) => wei.filter((b) => OPVALLEND.has(b.doen)).length;

/** Het karakter van dit dier. */
const karakter = (b: Bewoner) => dierVan(b.sleutel).karakter;
/** Hoe hard dit dier gaat: een 1 voor snelheid kruipt, een 5 vliegt. */
export const tempo = (b: Bewoner) => 0.55 + 0.2 * karakter(b).snel;
/** Hoe lang het duurt voor dit dier weer iemand groet: een gezellig dier doet het zo weer. */
const groetRust = (b: Bewoner, toeval: () => number) => tussen(toeval, 9000, 15000) * ((6 - karakter(b).gezellig) / 3);
const DICHTBIJ = 7;

export function soortVan(sleutel: string): Soort {
  if (WATERDIEREN.has(sleutel)) return 'water';
  const gang = gangVan(dierVan(sleutel).beweging);
  if (gang === 'vlieg') return 'lucht';
  if (gang === 'graaf') return 'graaf';
  return 'grond';
}

function tussen(toeval: () => number, min: number, max: number) {
  return min + toeval() * (max - min);
}

function greep<T>(lijst: readonly T[], toeval: () => number): T {
  return lijst[Math.min(lijst.length - 1, Math.floor(toeval() * lijst.length))];
}

/** Een nieuw dier in de wei. Het valt erin, schrikt even, en gaat dan zijns weegs. */
export function nieuweBewoner(
  speler: { id: number; naam: string; dier: string | null; dierNaam?: string | null },
  toeval: () => number = Math.random,
): Bewoner {
  const sleutel = dierVan(speler.dier, speler.naam).sleutel;
  const soort = soortVan(sleutel);
  return {
    id: speler.id,
    naam: speler.naam,
    dierNaam: speler.dierNaam ?? null,
    sleutel,
    soort,
    x: tussen(toeval, 12, 88),
    hoog: soort === 'lucht' ? VLIEGHOOGTE : 0,
    nat: false,
    richting: toeval() < 0.5 ? 1 : -1,
    doen: 'op',
    tot: 900,
    duur: 900,
    actie: { lijf: 'boing', ding: '✨', dingGaat: 'op' },
    ander: null,
    doel: null,
    klus: null,
    groetPauze: 4000,
    beurt: 0,
  };
}

function begin(b: Bewoner, doen: Doen, duur: number, actie: Actie | null = null, ander: number | null = null) {
  b.doen = doen;
  b.tot = duur;
  b.duur = duur;
  b.actie = actie;
  b.ander = ander;
  b.beurt += 1;
}

/** Op pad naar een plek in de wereld, om daar iets te doen. */
function opPad(b: Bewoner, doel: number, klus: Klus) {
  b.doel = Math.min(100 - RAND, Math.max(RAND, doel));
  b.klus = klus;
  b.richting = b.doel > b.x ? 1 : -1;
  begin(b, 'naar', 20_000);
}

/** Wat dit dier in deze wereld graag gaat doen, met hoe graag. */
function klussen(b: Bewoner, wereld: readonly Decor[]): [Klus, number][] {
  const s = b.sleutel;
  const uit: [Klus, number][] = [];
  const heeft = (d: DecorSoort) => !!zoek(wereld, d);
  if (s === 'aap' && heeft('bananenboom')) uit.push(['klim', 16]);
  else if (KLIMMERS.has(s) && heeft('boom')) uit.push(['klim', s === 'luiaard' ? 22 : 12]);
  if ((s === 'uil' || s === 'papegaai') && heeft('boom')) uit.push(['strijkneer', 16]);
  if (s === 'giraf' && heeft('boom')) uit.push(['blad', 14]);
  if (s === 'egel' && heeft('boom')) uit.push(['appel', 12]);
  if (heeft('vijver') && !WATERDIEREN.has(s)) {
    if (BADERS.has(s)) uit.push(['bad', 16]);
    else if (s === 'kikker') uit.push(['plons', 14]);
    else if (s === 'flamingo') uit.push(['waad', 16]);
    else if (s === 'wasbeer') uit.push(['was', 8]);
    else if (b.soort !== 'lucht') uit.push(['drink', s === 'kreeft' ? 10 : 3]);
  }
  if ((s === 'bij' || s === 'vlinder') && heeft('bloemen')) uit.push(['bestuif', 18]);
  if (['konijn', 'hamster', 'kip', 'slak'].includes(s) && heeft('moestuin')) uit.push(['knabbel', 12]);
  if (s === 'kameel' && heeft('cactus')) uit.push(['knabbel', 10]);
  if (GRAVERS.has(s) && heeft('hol')) uit.push(['holgraaf', 10]);
  return uit;
}

/** Waar een klus je heen stuurt. */
function doelVan(klus: Klus, b: Bewoner, wereld: readonly Decor[], toeval: () => number): number | null {
  const s = b.sleutel;
  const boom = zoek(wereld, s === 'aap' ? 'bananenboom' : 'boom');
  const vijver = zoek(wereld, 'vijver');
  switch (klus) {
    case 'klim':
    case 'strijkneer':
      return boom ? midden(boom) + tussen(toeval, -1, 1) : null;
    case 'blad':
    case 'appel':
      return boom ? midden(boom) + (toeval() < 0.5 ? -1 : 1) * boom.breed * 0.3 : null;
    case 'bad':
    case 'plons':
      return vijver ? tussen(toeval, vijver.x + vijver.breed * 0.25, vijver.x + vijver.breed * 0.75) : null;
    case 'waad':
      return vijver ? (toeval() < 0.5 ? vijver.x + vijver.breed * 0.12 : vijver.x + vijver.breed * 0.88) : null;
    case 'drink':
    case 'was':
      // Aan de kant, met je snuit naar het water.
      return vijver ? (b.x < midden(vijver) ? vijver.x - 1 : vijver.x + vijver.breed + 1) : null;
    case 'bestuif': {
      const bloemen = zoek(wereld, 'bloemen');
      return bloemen ? tussen(toeval, bloemen.x + 1, bloemen.x + bloemen.breed - 1) : null;
    }
    case 'knabbel': {
      const plek = zoek(wereld, s === 'kameel' ? 'cactus' : 'moestuin');
      return plek ? midden(plek) + (s === 'kameel' ? (toeval() < 0.5 ? -2 : 2) : tussen(toeval, -2, 2)) : null;
    }
    case 'holgraaf': {
      const holen = wereld.filter((d) => d.soort === 'hol');
      return holen.length ? midden(greep(holen, toeval)) : null;
    }
  }
}

/** Aangekomen: nu doen waarvoor je kwam. */
function aankomst(b: Bewoner, wereld: readonly Decor[], toeval: () => number) {
  const klus = b.klus;
  const s = b.sleutel;
  const hapje = dierVan(s).hapje.ding;
  b.doel = null;
  b.klus = null;
  switch (klus) {
    case 'klim': {
      const boom = zoek(wereld, s === 'aap' ? 'bananenboom' : 'boom');
      b.hoog = TAK[boom?.soort ?? 'boom'] ?? 1.1;
      return begin(b, 'klim', 1000, { lijf: 'trappel' });
    }
    case 'strijkneer':
      b.hoog = (TAK.boom ?? 1.1) + 0.05;
      return begin(b, 'inboom', tussen(toeval, 3500, 7000), s === 'uil' ? { lijf: 'slaap', ding: '💤', dingGaat: 'op' } : { lijf: 'schud', ding: '🎵', dingGaat: 'op' });
    case 'blad':
      b.richting = toeval() < 0.5 ? 1 : -1;
      return begin(b, 'knabbel', 2600, { lijf: 'rek', ding: '🍃', dingGaat: 'val' });
    case 'appel':
      return begin(b, 'knabbel', 2200, { lijf: 'snuffel', ding: '🍎', dingGaat: 'op' });
    case 'bad':
      b.nat = true;
      b.hoog = -0.3;
      return begin(b, 'bad', tussen(toeval, 4000, 7500), { lijf: 'kijkrond', ding: '🫧', dingGaat: 'op' });
    case 'plons':
      b.nat = true;
      b.hoog = -0.3;
      return begin(b, 'plons', 900, { lijf: 'boing', ding: '💦', dingGaat: 'op' });
    case 'waad':
      return begin(b, 'waad', tussen(toeval, 3000, 5500), { lijf: 'balans' });
    case 'drink': {
      const vijver = zoek(wereld, 'vijver');
      if (vijver) b.richting = b.x < midden(vijver) ? 1 : -1;
      return begin(b, 'drink', 2200, { lijf: 'snuffel', ding: '💧', dingGaat: 'op' });
    }
    case 'was': {
      const vijver = zoek(wereld, 'vijver');
      if (vijver) b.richting = b.x < midden(vijver) ? 1 : -1;
      return begin(b, 'drink', 2400, { lijf: 'schud', ding: '🍕', dingGaat: 'rond' });
    }
    case 'bestuif':
      b.hoog = 0.45;
      return begin(b, 'bestuif', tussen(toeval, 2500, 4500), { lijf: 'acht', ding: '✨', dingGaat: 'rond' });
    case 'knabbel':
      return begin(b, 'knabbel', 2200, { lijf: 'snuffel', ding: s === 'kameel' ? '🌵' : hapje, dingGaat: 'op' });
    case 'holgraaf':
      return begin(b, 'graaf', 1300, { lijf: 'graaf', ding: '🟫', dingGaat: 'gooi' });
    default:
      return begin(b, 'staan', 1500);
  }
}

/** Iets nieuws verzinnen, nu de vorige bezigheid klaar is. */
function bedenk(b: Bewoner, wei: Bewoner[], wereld: readonly Decor[], toeval: () => number) {
  const vijver = zoek(wereld, 'vijver');
  const holen = wereld.filter((d) => d.soort === 'hol');

  // Na het graven: onder de grond door naar een nieuwe plek (een ander hol, als die er is), en weer op.
  if (b.doen === 'graaf') return begin(b, 'onder', tussen(toeval, 900, 1600));
  if (b.doen === 'onder') {
    b.x = holen.length ? midden(greep(holen, toeval)) : tussen(toeval, 10, 90);
    return begin(b, 'op', 900, { lijf: 'boing', ding: '🌱', dingGaat: 'op' });
  }
  // Uit de boom: eerst omhoog, dan wat doen, dan weer omlaag.
  if (b.doen === 'klim') {
    const actie: Actie =
      b.sleutel === 'aap' ? { lijf: 'snuffel', ding: '🍌', dingGaat: 'val' }
        : b.sleutel === 'eekhoorn' ? { lijf: 'snuffel', ding: '🌰', dingGaat: 'op' }
          : { lijf: 'ondersteboven', ding: '💤', dingGaat: 'op' };
    return begin(b, 'inboom', b.sleutel === 'luiaard' ? tussen(toeval, 6000, 10000) : tussen(toeval, 2500, 4500), actie);
  }
  if (b.doen === 'inboom') {
    b.hoog = b.soort === 'lucht' ? VLIEGHOOGTE : 0;
    return begin(b, b.soort === 'lucht' ? 'loop' : 'omlaag', 900, b.soort === 'lucht' ? null : { lijf: 'boing' });
  }
  if (b.doen === 'bestuif') b.hoog = VLIEGHOOGTE;
  // Na de plons: nog even baden.
  if (b.doen === 'plons') return begin(b, 'bad', tussen(toeval, 2500, 4500), { lijf: 'kijkrond' });
  // Uit bad: naar de kant zwemmen en eruit.
  if (b.nat && b.soort !== 'water') {
    const kant = vijver ? (b.x < midden(vijver) ? vijver.x - 1.5 : vijver.x + vijver.breed + 1.5) : b.x;
    b.doel = kant;
    b.klus = null;
    b.richting = kant > b.x ? 1 : -1;
    return begin(b, 'naar', 20_000);
  }

  // Vissen blijven in hun vijver: zwemmen, dobberen, en af en toe een sprong.
  const ruimte = MAX_DRUK - drukte(wei.filter((a) => a !== b));
  const mag = ruimte > 0 ? 1 : 0;
  const k = karakter(b);
  if (b.soort === 'water' && b.nat) {
    const keuzes: [string, number][] = [['zwem', 50], ['bad', 22], ['spring', 7 * mag], ['kunstje', 1.5 * k.drama * mag]];
    let worp = toeval() * keuzes.reduce((t, [, w]) => t + w, 0);
    const [wat] = keuzes.find(([, w]) => (worp -= w) < 0) ?? ['zwem'];
    if (wat === 'zwem') {
      if (toeval() < 0.4) b.richting = b.richting === 1 ? -1 : 1;
      return begin(b, 'zwem', tussen(toeval, 2000, 4500));
    }
    if (wat === 'bad') return begin(b, 'bad', tussen(toeval, 1500, 3000), toeval() < 0.5 ? { lijf: 'kijkrond', ding: '🫧', dingGaat: 'op' } : null);
    if (wat === 'spring') return begin(b, 'spring', 1300, { lijf: 'salto', ding: '💦', dingGaat: 'op' });
    return begin(b, 'kunstje', 1600, greep(actiesVan(dierVan(b.sleutel), 'blij'), toeval));
  }

  if (b.doen === 'slaap' && ruimte > 0 && toeval() < 0.5) return begin(b, 'schrik', 700, { lijf: 'schrik', ding: '❗', dingGaat: 'op' });

  // Achterna zitten doe je iemand die gewoon wat rondscharrelt, niet wie op pad is, zwemt of in een boom zit.
  const anderen = wei.filter((a) => a.id !== b.id && ['loop', 'staan', 'snuffel', 'slaap'].includes(a.doen) && !a.nat && a.hoog <= VLIEGHOOGTE);
  const keuzes: [Doen | Klus, number][] = [
    ['loop', 30], ['staan', 14], ['snuffel', b.soort === 'lucht' ? 0 : 3 * k.slim], ['slaap', 2.5 * k.slaperig],
    ['spring', 6 * mag], ['kunstje', 3.5 * k.drama * mag], ['ren', 2 * k.snel * mag], ['graaf', b.soort === 'graaf' && !holen.length ? 10 : 0],
    ['jaag', anderen.length && ruimte >= 2 ? 2 * k.ondeugend : 0], ['eet', 4 * mag],
    ...klussen(b, wereld),
  ];
  let worp = toeval() * keuzes.reduce((t, [, w]) => t + w, 0);
  const [keus] = keuzes.find(([, w]) => (worp -= w) < 0) ?? ['loop'];

  // Vliegers vliegen weer op hoogte, en landen alleen om te slapen.
  if (b.soort === 'lucht') b.hoog = keus === 'slaap' ? 0 : VLIEGHOOGTE;
  switch (keus) {
    case 'loop':
      if (toeval() < 0.35) b.richting = b.richting === 1 ? -1 : 1;
      return begin(b, 'loop', tussen(toeval, 1500, 4000));
    case 'ren':
      return begin(b, 'ren', tussen(toeval, 800, 1600), { lijf: 'trappel', ding: '💨', dingGaat: 'op' });
    case 'staan':
      return begin(b, 'staan', tussen(toeval, 1200, 4200), toeval() < 0.4 ? { lijf: 'kijkrond' } : null);
    case 'snuffel':
      return begin(b, 'snuffel', tussen(toeval, 1300, 2200), { lijf: 'snuffel' });
    case 'slaap':
      return begin(b, 'slaap', tussen(toeval, 3000, 5500) * (k.slaperig / 3), { lijf: 'slaap', ding: '💤', dingGaat: 'op' });
    case 'eet':
      // Zijn lievelingshapje valt uit de lucht, en hij snuffelt het op.
      return begin(b, 'eet', 1800, { lijf: 'snuffel', ding: dierVan(b.sleutel).hapje.ding, dingGaat: 'val' });
    case 'spring':
      return begin(b, 'spring', 1100, { lijf: 'boing' });
    case 'kunstje':
      return begin(b, 'kunstje', 1600, greep(actiesVan(dierVan(b.sleutel), 'blij'), toeval));
    case 'graaf':
      return begin(b, 'graaf', 1300, { lijf: 'graaf', ding: '🟫', dingGaat: 'gooi' });
    case 'jaag': {
      const prooi = greep(anderen, toeval);
      begin(b, 'jaag', tussen(toeval, 2200, 3500), { lijf: 'trappel' }, prooi.id);
      // De prooi schrikt eerst, en rent dan weg.
      begin(prooi, 'schrik', 500, { lijf: 'schrik', ding: '❗', dingGaat: 'op' }, b.id);
      return;
    }
    default: {
      const klus = keus as Klus;
      const doel = doelVan(klus, b, wereld, toeval);
      if (doel === null) return begin(b, 'staan', 1500);
      return opPad(b, doel, klus);
    }
  }
}

/** Op je dier getikt: dat doet meteen een kunstje, en wordt er even blij van. */
export function aai(b: Bewoner, toeval: () => number = Math.random) {
  const wakker = b.doen === 'slaap';
  if (b.doen === 'onder' || b.doen === 'klim' || b.doen === 'inboom' || b.doen === 'naar') return;
  b.groetPauze = Math.max(b.groetPauze, 2000);
  if (wakker) return begin(b, 'schrik', 700, { lijf: 'schrik', ding: '❗', dingGaat: 'op' });
  begin(b, 'kunstje', 1600, greep(actiesVan(dierVan(b.sleutel), 'blij'), toeval));
}

/** De tijd `dt` ms verder. Past de dieren aan; geeft niets terug. */
export function stapWei(wei: Bewoner[], dt: number, toeval: () => number = Math.random, wereld: readonly Decor[] = []) {
  const perId = new Map(wei.map((b) => [b.id, b]));
  const vijver = zoek(wereld, 'vijver');
  const inVijver = (x: number) => !!vijver && x > vijver.x + 0.5 && x < vijver.x + vijver.breed - 0.5;

  for (const b of wei) {
    b.groetPauze = Math.max(0, b.groetPauze - dt);
    b.tot -= dt;

    // Een vis zonder water zoekt de vijver op (hij komt er meteen in terecht); zonder vijver zweeft hij.
    if (b.soort === 'water' && vijver && !b.nat) {
      b.x = tussen(toeval, vijver.x + vijver.breed * 0.2, vijver.x + vijver.breed * 0.8);
      b.nat = true;
      b.hoog = -0.3;
    }
    if (b.soort === 'water' && !vijver && b.nat) {
      b.nat = false;
      b.hoog = 0;
    }

    const ander = b.ander !== null ? perId.get(b.ander) : undefined;
    // Wie schrok omdat hij achterna gezeten wordt, gaat er vandoor.
    if (b.doen === 'schrik' && b.tot <= 0 && ander?.doen === 'jaag') {
      b.richting = b.x < ander.x ? -1 : 1;
      begin(b, 'vlucht', ander.tot, { lijf: 'trappel', ding: '💦', dingGaat: 'op' }, ander.id);
    }
    if (b.doen === 'jaag' && ander) {
      b.richting = ander.x > b.x ? 1 : -1;
      if (Math.abs(ander.x - b.x) < 3) {
        // Gepakt! Allebei een sprongetje, en vrienden.
        begin(b, 'groet', 1500, { lijf: 'boing', ding: '✨', dingGaat: 'rond' }, ander.id);
        begin(ander, 'groet', 1500, { lijf: 'zwaai', ding: '❤️', dingGaat: 'op' }, b.id);
        b.groetPauze = groetRust(b, toeval);
        ander.groetPauze = groetRust(ander, toeval);
        continue;
      }
    }

    const lucht = b.soort === 'lucht';
    const snelheid =
      b.doen === 'loop' || b.doen === 'naar' ? (lucht ? SNEL.lucht : SNEL.loop)
        : b.doen === 'zwem' ? SNEL.loop * 0.6
          : b.doen === 'ren' || b.doen === 'jaag' ? SNEL.ren
            : b.doen === 'vlucht' ? SNEL.ren * 0.9
              : 0;
    if (snelheid) {
      const voor = b.x;
      if (b.doen === 'naar' && b.doel !== null) b.richting = b.doel > b.x ? 1 : -1;
      b.x += (b.richting * snelheid * tempo(b) * dt) / 1000;
      if (b.doen === 'naar' && b.doel !== null && (b.x - b.doel) * (voor - b.doel) <= 0) {
        b.x = b.doel;
        if (b.nat && !inVijver(b.x)) {
          // Aan de kant geklommen.
          b.nat = false;
          b.hoog = 0;
          b.doel = null;
          begin(b, 'staan', 1200, { lijf: 'schud', ding: '💦', dingGaat: 'op' });
        } else aankomst(b, wereld, toeval);
        continue;
      }
      // Vissen blijven in de vijver.
      if (b.soort === 'water' && vijver && b.nat) {
        const van = vijver.x + vijver.breed * 0.12;
        const tot = vijver.x + vijver.breed * 0.88;
        if (b.x < van || b.x > tot) {
          b.x = Math.min(tot, Math.max(van, b.x));
          b.richting = b.richting === 1 ? -1 : 1;
        }
      }
      if (b.x < RAND || b.x > 100 - RAND) {
        b.x = Math.min(100 - RAND, Math.max(RAND, b.x));
        b.richting = b.richting === 1 ? -1 : 1;
      }
    }
    // Landdieren lopen langs de vijver over de oever erachter.
    if (!lucht && !b.nat && b.hoog >= 0 && b.hoog <= ACHTEROEVER) b.hoog = inVijver(b.x) ? ACHTEROEVER : 0;
    if (b.tot <= 0) bedenk(b, wei, wereld, toeval);
  }

  // Wie elkaar tegenkomt, groet elkaar: omdraaien, zwaaien, een hartje.
  const vrij = (b: Bewoner) =>
    (b.doen === 'loop' || b.doen === 'staan' || b.doen === 'snuffel') && b.groetPauze <= 0 && !b.nat && b.hoog <= VLIEGHOOGTE;
  for (const a of wei) {
    if (!vrij(a) || drukte(wei) + 2 > MAX_DRUK) continue;
    const b = wei.find((c) => c !== a && vrij(c) && Math.abs(c.x - a.x) < DICHTBIJ);
    if (!b) continue;
    a.richting = b.x > a.x ? 1 : -1;
    b.richting = a.x > b.x ? 1 : -1;
    begin(a, 'groet', 1500, { lijf: 'zwaai', ding: '❤️', dingGaat: 'op' }, b.id);
    begin(b, 'groet', 1500, { lijf: toeval() < 0.5 ? 'boing' : 'dans', ding: '🎵', dingGaat: 'op' }, a.id);
    a.groetPauze = groetRust(a, toeval);
    b.groetPauze = groetRust(b, toeval);
  }
}

/** Hoe het dier erbij staat: de pose voor Pixeldier en het lijf voor `.actie[data-lijf]`. */
export function houdingVan(b: Bewoner): { pose: Pose; lijf: Lijf | null; vlieg: boolean } {
  const lucht = b.soort === 'lucht';
  const beweegt = b.doen === 'loop' || b.doen === 'ren' || b.doen === 'jaag' || b.doen === 'vlucht' || b.doen === 'naar' || b.doen === 'klim';
  const lijf = b.actie?.lijf ?? null;
  const pose: Pose =
    b.doen === 'slaap' || (b.doen === 'inboom' && lijf === 'slaap') ? 'slaap'
      : beweegt ? (lucht || b.nat ? 'staan' : 'loop')
        : b.doen === 'groet' ? 'blij'
          : lijf ? poseVan(lijf, 'blij')
            : 'staan';
  const zit = b.doen === 'inboom' || b.doen === 'slaap';
  return { pose, lijf: beweegt && lijf === 'trappel' && b.doen !== 'klim' ? null : lijf, vlieg: lucht && !zit };
}

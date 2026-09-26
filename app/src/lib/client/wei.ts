/**
 * De wei: waar de maatjes in de lobby rondscharrelen terwijl iedereen binnenkomt.
 *
 * Elk dier heeft een eigen willetje. Het loopt wat, blijft staan, snuffelt,
 * valt in slaap, springt, doet een kunstje, rent ineens een eind weg, of
 * zit een ander achterna. Komen twee dieren elkaar tegen, dan groeten ze
 * elkaar. Gravers duiken onder de grond en komen ergens anders boven,
 * vliegers en zwemmers zweven erboven. En wie op zijn eigen dier tikt,
 * krijgt een kunstje.
 *
 * Dit is alleen het brein: `stapWei` schuift de tijd een stukje op.
 * Dierenwei.svelte tekent het, met Pixeldier.svelte.
 */
import { actiesVan, dierVan, gangVan, poseVan, type Actie, type Lijf, type Pose } from '$lib/shared/dieren';

export type Doen =
  | 'loop' | 'ren' | 'staan' | 'snuffel' | 'slaap' | 'spring' | 'kunstje' | 'groet'
  | 'jaag' | 'vlucht' | 'graaf' | 'onder' | 'op' | 'schrik';

export type Soort = 'grond' | 'lucht' | 'water' | 'graaf';

export interface Bewoner {
  id: number;
  naam: string;
  sleutel: string;
  soort: Soort;
  /** Waar hij staat, in procenten van de breedte. */
  x: number;
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
  /** Hoe lang hij niet opnieuw gaat groeten. */
  groetPauze: number;
  /** Telt op bij elke nieuwe bezigheid, zodat de animatie opnieuw begint. */
  beurt: number;
}

export const RAND = 5;
const SNEL = { loop: 7, ren: 20, lucht: 10 } as const;
const DICHTBIJ = 7;

export function soortVan(sleutel: string): Soort {
  const gang = gangVan(dierVan(sleutel).beweging);
  if (gang === 'vlieg') return 'lucht';
  if (gang === 'zwem') return 'water';
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
  speler: { id: number; naam: string; dier: string | null },
  toeval: () => number = Math.random,
): Bewoner {
  const sleutel = dierVan(speler.dier, speler.naam).sleutel;
  return {
    id: speler.id,
    naam: speler.naam,
    sleutel,
    soort: soortVan(sleutel),
    x: tussen(toeval, 12, 88),
    richting: toeval() < 0.5 ? 1 : -1,
    doen: 'op',
    tot: 900,
    duur: 900,
    actie: { lijf: 'boing', ding: '✨', dingGaat: 'op' },
    ander: null,
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

/** Iets nieuws verzinnen, nu de vorige bezigheid klaar is. */
function bedenk(b: Bewoner, wei: Bewoner[], toeval: () => number) {
  // Na het graven: onder de grond door naar een nieuwe plek, en weer op.
  if (b.doen === 'graaf') return begin(b, 'onder', tussen(toeval, 900, 1600));
  if (b.doen === 'onder') {
    b.x = tussen(toeval, 10, 90);
    return begin(b, 'op', 900, { lijf: 'boing', ding: '🌱', dingGaat: 'op' });
  }
  if (b.doen === 'slaap' && toeval() < 0.5) return begin(b, 'schrik', 700, { lijf: 'schrik', ding: '❗', dingGaat: 'op' });

  const anderen = wei.filter((a) => a.id !== b.id && a.doen !== 'onder');
  const keuzes: [Doen, number][] = [
    ['loop', 34], ['staan', 12], ['snuffel', b.soort === 'lucht' ? 0 : 9], ['slaap', 6],
    ['spring', 8], ['kunstje', 12], ['ren', 7], ['graaf', b.soort === 'graaf' ? 12 : 0],
    ['jaag', anderen.length ? 8 : 0],
  ];
  let worp = toeval() * keuzes.reduce((s, [, w]) => s + w, 0);
  const [doen] = keuzes.find(([, w]) => (worp -= w) < 0) ?? ['loop'];

  switch (doen) {
    case 'loop':
      if (toeval() < 0.35) b.richting = b.richting === 1 ? -1 : 1;
      return begin(b, 'loop', tussen(toeval, 1500, 4000));
    case 'ren':
      return begin(b, 'ren', tussen(toeval, 800, 1600), { lijf: 'trappel', ding: '💨', dingGaat: 'op' });
    case 'staan':
      return begin(b, 'staan', tussen(toeval, 1200, 2600), toeval() < 0.5 ? { lijf: 'kijkrond' } : null);
    case 'snuffel':
      return begin(b, 'snuffel', tussen(toeval, 1300, 2200), { lijf: 'snuffel' });
    case 'slaap':
      return begin(b, 'slaap', tussen(toeval, 3000, 5500), { lijf: 'slaap', ding: '💤', dingGaat: 'op' });
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
  }
}

/** Op je dier getikt: dat doet meteen een kunstje, en wordt er even blij van. */
export function aai(b: Bewoner, toeval: () => number = Math.random) {
  const wakker = b.doen === 'slaap';
  if (b.doen === 'onder') return;
  b.groetPauze = Math.max(b.groetPauze, 2000);
  if (wakker) return begin(b, 'schrik', 700, { lijf: 'schrik', ding: '❗', dingGaat: 'op' });
  begin(b, 'kunstje', 1600, greep(actiesVan(dierVan(b.sleutel), 'blij'), toeval));
}

/** De tijd `dt` ms verder. Past de dieren aan; geeft niets terug. */
export function stapWei(wei: Bewoner[], dt: number, toeval: () => number = Math.random) {
  const perId = new Map(wei.map((b) => [b.id, b]));
  for (const b of wei) {
    b.groetPauze = Math.max(0, b.groetPauze - dt);
    b.tot -= dt;

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
        b.groetPauze = ander.groetPauze = 10000;
        continue;
      }
    }

    const snelheid =
      b.doen === 'loop' ? (b.soort === 'lucht' ? SNEL.lucht : SNEL.loop)
        : b.doen === 'ren' || b.doen === 'jaag' ? SNEL.ren
          : b.doen === 'vlucht' ? SNEL.ren * 0.9
            : 0;
    if (snelheid) {
      b.x += (b.richting * snelheid * dt) / 1000;
      if (b.x < RAND || b.x > 100 - RAND) {
        b.x = Math.min(100 - RAND, Math.max(RAND, b.x));
        b.richting = b.richting === 1 ? -1 : 1;
      }
    }
    if (b.tot <= 0) bedenk(b, wei, toeval);
  }

  // Wie elkaar tegenkomt, groet elkaar: omdraaien, zwaaien, een hartje.
  const vrij = (b: Bewoner) => (b.doen === 'loop' || b.doen === 'staan' || b.doen === 'snuffel') && b.groetPauze <= 0;
  for (const a of wei) {
    if (!vrij(a)) continue;
    const b = wei.find((c) => c !== a && vrij(c) && Math.abs(c.x - a.x) < DICHTBIJ);
    if (!b) continue;
    a.richting = b.x > a.x ? 1 : -1;
    b.richting = a.x > b.x ? 1 : -1;
    begin(a, 'groet', 1500, { lijf: 'zwaai', ding: '❤️', dingGaat: 'op' }, b.id);
    begin(b, 'groet', 1500, { lijf: toeval() < 0.5 ? 'boing' : 'dans', ding: '🎵', dingGaat: 'op' }, a.id);
    a.groetPauze = b.groetPauze = tussen(toeval, 9000, 15000);
  }
}

/** Hoe het dier erbij staat: de pose voor Pixeldier en het lijf voor `.actie[data-lijf]`. */
export function houdingVan(b: Bewoner): { pose: Pose; lijf: Lijf | null; vlieg: boolean } {
  const lucht = b.soort === 'lucht';
  const beweegt = b.doen === 'loop' || b.doen === 'ren' || b.doen === 'jaag' || b.doen === 'vlucht';
  const lijf = b.actie?.lijf ?? null;
  const pose: Pose =
    b.doen === 'slaap' ? 'slaap'
      : beweegt ? (lucht || b.soort === 'water' ? 'staan' : 'loop')
        : b.doen === 'groet' ? 'blij'
          : lijf ? poseVan(lijf, 'blij')
            : 'staan';
  return { pose, lijf: beweegt && lijf === 'trappel' ? null : lijf, vlieg: lucht && b.doen !== 'slaap' };
}

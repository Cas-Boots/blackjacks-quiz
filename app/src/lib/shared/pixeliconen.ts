/**
 * Kleine pixelplaatjes voor wat er rond een maatje verschijnt: een hartje,
 * een muzieknootje, een sterretje, een druppel, zzz, een uitroepteken.
 *
 * Emoji naast pixeldieren oogt rommelig; deze passen erbij. Wat hier niet
 * staat (een ei, een cupcake, een steen) blijft gewoon een emoji. Een letter is
 * een kleur uit het palet, een punt is leeg; de omlijning komt er vanzelf bij.
 */

export const ICOONMAAT = 7;
const OMLIJNING = '#1c1224';

interface Icoon {
  rijen: readonly string[];
  palet: Readonly<Record<string, string>>;
}

const HART: Icoon = {
  palet: { r: '#ff4f6d', w: '#ffc2cc' },
  rijen: ['.rr.rr.', 'rwrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...', '.......'],
};
const NOOT: Icoon = {
  palet: { g: '#ffd23f' },
  rijen: ['..ggggg', '..g...g', '..g...g', '..g...g', 'ggg.ggg', 'ggg.ggg', '.......'],
};
const STER: Icoon = {
  palet: { y: '#ffe066', w: '#ffffff' },
  rijen: ['...y...', '...y...', '..yyy..', 'yyywyyy', '..yyy..', '...y...', '...y...'],
};
const DRUPPEL: Icoon = {
  palet: { b: '#62b6ff', w: '#d6ecff' },
  rijen: ['...b...', '..bbb..', '.bbbbb.', '.bwbbb.', '.bbbbb.', '..bbb..', '.......'],
};
/** Eén dikke Z met trapjes van twee: een schuine lijn van één pixel verdwijnt in de omlijning. */
const ZZZ: Icoon = {
  palet: { z: '#dfe8ff', s: '#a9b8e0' },
  rijen: ['.zzzzzz', '....zz.', '...zz..', '..zz...', '.zz....', 'zzzzzz.', '.ssssss'],
};
const UITROEP: Icoon = {
  palet: { r: '#ffd23f' },
  rijen: ['..rr...', '..rr...', '..rr...', '..rr...', '.......', '..rr...', '.......'],
};
const VRAAG: Icoon = {
  palet: { r: '#ffd23f' },
  rijen: ['.rrrr..', 'rr..rr.', '...rr..', '..rr...', '.......', '..rr...', '.......'],
};
const WOLKJE: Icoon = {
  palet: { w: '#eef2f7', s: '#b9c3cf' },
  rijen: ['.......', '...ww..', '.wwwwww', 'wwwwwww', '.sssss.', '.......', '.......'],
};
const BEL: Icoon = {
  palet: { b: '#9fd8ff', w: '#ffffff' },
  rijen: ['..bbb..', '.b...b.', 'b.w...b', 'b.....b', '.b...b.', '..bbb..', '.......'],
};
/** Het boze adertje: vier hoekjes die naar buiten knikken, geen haakjes. */
const BOOS: Icoon = {
  palet: { r: '#ff5a4f' },
  rijen: ['..r.r..', '..r.r..', 'rrr.rrr', '.......', 'rrr.rrr', '..r.r..', '..r.r..'],
};

/** Een feesttoeter met een paar snippers eruit; losse snippers waren ruis. */
const CONFETTI: Icoon = {
  palet: { p: '#b36bff', y: '#ffd23f', r: '#ff5a7a', b: '#62b6ff', g: '#6cd46c' },
  rijen: ['...y.r.', '.b.....', '.....g.', '...pp..', '..pyp..', '.ppp...', 'pp.....'],
};

/* Hapjes en dingen die de maatjes vaak bij zich hebben. */
const APPEL: Icoon = {
  palet: { r: '#e8423f', s: '#b52b35', w: '#ffb3a8', b: '#7a4a2a', g: '#6cd46c' },
  rijen: ['...bgg.', '...b...', '.rrrrr.', 'rwrrrrr', 'rrrrrrr', 'rrrrrrs', '.rrrss.'],
};
const EIKEL: Icoon = {
  palet: { c: '#7a4a2a', n: '#c9803a', w: '#f0b872', b: '#5a3620' },
  rijen: ['...b...', '..ccc..', '.ccccc.', '.nnnnn.', '.nwnnn.', '..nnn..', '...n...'],
};
const VIS: Icoon = {
  palet: { b: '#62b6ff', l: '#bfe3ff', w: '#ffffff', o: '#15101a' },
  rijen: ['.......', 'b..bbbb', 'bbbbwob', '.bbbbbb', 'bbblllb', 'b..bbb.', '.......'],
};
const BANAAN: Icoon = {
  palet: { y: '#ffd23f', s: '#d9a521', b: '#6b4a24' },
  rijen: ['.....b.', '....yy.', '....yy.', '...yyy.', '.yyyys.', 'ssss...', '.......'],
};
const BLAD: Icoon = {
  palet: { g: '#6cd46c', d: '#3f9a4f' },
  rijen: ['.....gg', '...gggg', '..ggdgg', '.ggdgg.', '.gdgg..', '.dg....', 'd......'],
};
const HERFSTBLAD: Icoon = {
  palet: { g: '#f0913a', d: '#b8562a' },
  rijen: BLAD.rijen,
};
const BLOESEM: Icoon = {
  palet: { p: '#ff9ec4', y: '#ffd23f' },
  rijen: ['.pp.pp.', 'ppppppp', 'ppyyypp', '.pyyyp.', 'ppyyypp', 'ppppppp', '.pp.pp.'],
};
const BLOEM: Icoon = {
  palet: { p: '#ffd23f', y: '#8a5a2a' },
  rijen: BLOESEM.rijen,
};
const BOT: Icoon = {
  palet: { w: '#f4efe2', s: '#c9c0aa' },
  rijen: ['.......', '.......', 'ww...ww', 'wwwwwww', 'ss...ss', '.......', '.......'],
};
const WORTEL: Icoon = {
  palet: { o: '#f5892a', s: '#c4621d', g: '#6cd46c' },
  rijen: ['....g.g', '....oog', '...ooo.', '..ooo..', '.oso...', 'oo.....', '.......'],
};
const PIZZA: Icoon = {
  palet: { b: '#c9803a', y: '#ffd23f', r: '#d8334a' },
  rijen: ['bbbbbbb', 'yyyyyyy', '.yryyy.', '.yyyry.', '..yyy..', '..yry..', '...y...'],
};
const PADDENSTOEL: Icoon = {
  palet: { r: '#e8423f', w: '#ffffff', e: '#f1e4c8' },
  rijen: ['..rrr..', '.rwrrr.', 'rrrrwrr', 'rrrrrrr', '..eee..', '..eee..', '..eee..'],
};
const BOEM: Icoon = {
  palet: { o: '#ff8a3d', y: '#ffd23f', w: '#ffffff' },
  rijen: ['.o...o.', '..ooo..', '.oyyyo.', 'ooywyoo', '.oyyyo.', '..ooo..', '.o...o.'],
};
const PRAATJE: Icoon = {
  palet: { w: '#f4f1ea', s: '#8a93a6' },
  rijen: ['.......', '.wwwww.', 'wwwwwww', 'wswswsw', 'wwwwwww', '.wwwww.', '.w.....'],
};

const PER_TEKEN: Record<string, Icoon> = {
  '❤️': HART, '🎵': NOOT, '🎶': NOOT, '✨': STER, '💫': STER, '💧': DRUPPEL, '💦': DRUPPEL,
  '💤': ZZZ, '❗': UITROEP, '❓': VRAAG, '💨': WOLKJE, '🫧': BEL, '💢': BOOS, '🎉': CONFETTI,
  '🍎': APPEL, '🌰': EIKEL, '🐟': VIS, '🍌': BANAAN, '🍃': BLAD, '🌿': BLAD, '🍂': HERFSTBLAD,
  '🌸': BLOESEM, '🌼': BLOEM, '🌻': BLOEM, '🦴': BOT, '🥕': WORTEL, '🍕': PIZZA, '🍄': PADDENSTOEL,
  '💥': BOEM, '💬': PRAATJE,
};

export type IcoonPaden = { kleur: string; d: string }[];
const klaar = new Map<string, IcoonPaden | null>();

/** Het pixelplaatje bij een teken, als SVG-paden per kleur; null als het een gewone emoji blijft. */
export function icoonVan(teken: string): IcoonPaden | null {
  if (klaar.has(teken)) return klaar.get(teken)!;
  const icoon = PER_TEKEN[teken];
  if (!icoon) {
    klaar.set(teken, null);
    return null;
  }
  const vol = (x: number, y: number) => icoon.rijen[y]?.[x] !== undefined && icoon.rijen[y][x] !== '.';
  const perKleur = new Map<string, string[]>();
  const zet = (kleur: string, x: number, y: number) => {
    const lijst = perKleur.get(kleur) ?? [];
    lijst.push(`M${x} ${y}h1v1h-1z`);
    perKleur.set(kleur, lijst);
  };
  for (let y = -1; y <= ICOONMAAT; y++) {
    for (let x = -1; x <= ICOONMAAT; x++) {
      if (vol(x, y)) zet(icoon.palet[icoon.rijen[y][x]], x, y);
      else if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => vol(x + dx, y + dy))) zet(OMLIJNING, x, y);
    }
  }
  const paden = [...perKleur].map(([kleur, delen]) => ({ kleur, d: delen.join('') }));
  klaar.set(teken, paden);
  return paden;
}

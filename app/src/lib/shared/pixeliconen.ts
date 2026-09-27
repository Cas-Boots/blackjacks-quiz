/**
 * Kleine pixelplaatjes voor wat er rond een maatje verschijnt: een hartje,
 * een muzieknootje, een sterretje, een druppel, zzz, een uitroepteken.
 *
 * Emoji naast pixeldieren oogt rommelig; deze passen erbij. Wat hier niet
 * staat (een ei, een banaan, pizza) blijft gewoon een emoji. Een letter is
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
const ZZZ: Icoon = {
  palet: { z: '#dfe8ff' },
  rijen: ['zzzzz..', '...z...', '..z....', '.z.....', 'zzzzz..', '.......', '.......'],
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
const BOOS: Icoon = {
  palet: { r: '#ff5a4f' },
  rijen: ['rr...rr', 'r.....r', '.......', 'r.....r', 'rr...rr', '.......', '.......'],
};

const CONFETTI: Icoon = {
  palet: { r: '#ff5a7a', y: '#ffd23f', b: '#62b6ff', g: '#6cd46c' },
  rijen: ['r...y..', '..b...g', '.y..r..', 'g...b.y', '..r....', 'b..g..r', '...y...'],
};

const PER_TEKEN: Record<string, Icoon> = {
  '❤️': HART, '🎵': NOOT, '🎶': NOOT, '✨': STER, '💫': STER, '💧': DRUPPEL, '💦': DRUPPEL,
  '💤': ZZZ, '❗': UITROEP, '❓': VRAAG, '💨': WOLKJE, '🫧': BEL, '💢': BOOS, '🎉': CONFETTI,
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

/**
 * De maatjes in pixelkunst.
 *
 * Elk dier is een raster van 16 bij 16, met de kop naar rechts. Een letter
 * is een kleur uit het palet van dat dier; een punt is leeg. Een paar letters
 * betekenen overal hetzelfde, zodat het dier ermee kan bewegen:
 *
 *   k  omlijning           w o  oog: wit en pupil (dicht: een streepje)
 *   c  wang (bloost als hij blij is)
 *   v  vleugel (klappert: om en om zoals getekend en omhoog gespiegeld)
 *
 * De onderste `poten` rijen zijn de poten: elke losse kolom daarin is een poot,
 * en om en om tilt het dier er de helft van op. Zo lopen ze echt.
 *
 * Wat eruit komt (pixelsVan) zijn lagen: het lijf, de ogen open en dicht, de
 * wangen, de vleugels op en neer, de poten in rust en in twee stappen.
 * Pixeldier.svelte zet die lagen als SVG neer; app.css wisselt ze.
 */

export const MAAT = 16;

export interface Sprite {
  rijen: readonly string[];
  palet: Readonly<Record<string, string>>;
  /** Hoeveel rijen onderaan poten zijn. 0: geen poten (vis, worm, slak). */
  poten: number;
}

/** Wat voor elk dier geldt, tenzij het palet het anders zegt. */
const BASIS: Record<string, string> = {
  k: '#23171a',
  w: '#ffffff',
  o: '#15101a',
};
/** De blos op de wangen als het dier blij is. */
export const BLOS = '#ff6f91';

export const SPRITES: Readonly<Record<string, Sprite>> = {
  lama: {
    poten: 3,
    palet: { a: '#f1e4cb', b: '#9c7b5a', d: '#fff8ec', c: '#f1e4cb', r: '#d8334a', g: '#f2c230', t: '#3aa6a0' },
    rijen: [
      '...........k.k..',
      '..........kakak.',
      '..........kaaak.',
      '..........kawok.',
      '..........kcaaak',
      '..........kaddk.',
      '..........kaak..',
      '...kkkkkkkkaak..',
      '.kkrgtrgtrgaak..',
      'kaarrgtrgtraak..',
      'kaaaaaaaaaaaak..',
      '.kaaaaaaaaaaak..',
      '..kkkkkkkkkkk...',
      '...b.b....b.b...',
      '...b.b....b.b...',
      '...b.b....b.b...',
    ],
  },
  luiaard: {
    poten: 2,
    palet: { a: '#8f6f55', b: '#5b4332', d: '#ecdcbf', m: '#4a3528', c: '#ecdcbf', n: '#2a1d16' },
    rijen: [
      '................',
      '................',
      '.........kkkkk..',
      '........kaaaaak.',
      '.......kaddddddk',
      '.......kdmwomddk',
      '.......kddddcndk',
      '..kkkkkkkddkkkk.',
      '.kaaaaaaaakkaak.',
      'kaaaaaaaaaaaaak.',
      'kaaaaaaaaaaaaak.',
      'kaaaaaaaaaaaaak.',
      '.kaaaaaaaaaaak..',
      '..kkkkkkkkkkk...',
      '..bb.bb..bb.bb..',
      '..b...b..b...b..',
    ],
  },
  flamingo: {
    poten: 4,
    palet: { a: '#f58bb0', b: '#d45a86', d: '#ffc2d6', v: '#e5679a', c: '#f58bb0', n: '#2a1d16', y: '#f4e7d7' },
    rijen: [
      '..........kkk...',
      '.........kawok..',
      '.........kcaayk.',
      '..........kkkyn.',
      '...........kakn.',
      '...........kak..',
      '..kkkkkkkkkaak..',
      '.kaaaaaaaaaaak..',
      'kavvvvvvaaaaak..',
      'kaavvvvaaaaak...',
      '.kaaaaaaaaak....',
      '..kkkkkkkkk.....',
      '.....b..........',
      '.....b..b.......',
      '.....b..b.......',
      '.....b..b.......',
    ],
  },
  pinguin: {
    poten: 1,
    palet: { a: '#26303f', d: '#f3f3f0', y: '#f5a524', b: '#f5a524', c: '#f3f3f0', r: '#d8334a', v: '#1a2230' },
    rijen: [
      '.....kkkkk......',
      '....kaaaaak.....',
      '...kaaaadwok....',
      '...kaaadddcyy...',
      '...kaaddddkyk...',
      '...kaadddrdrk...',
      '..kavaddddrdk...',
      '..kavaddddddk...',
      '..kavaddddddk...',
      '..kavaddddddk...',
      '..kaaaddddddk...',
      '..kaaadddddk....',
      '...kaaaddddk....',
      '....kkkkkkk.....',
      '................',
      '...bb...bb......',
    ],
  },
  octopus: {
    poten: 4,
    palet: { a: '#c54ab8', b: '#a3399a', d: '#e27fd6', c: '#c54ab8' },
    rijen: [
      '................',
      '.....kkkkkk.....',
      '....kaaaaaak....',
      '...kaaddaaaak...',
      '...kaddaaaaak...',
      '...kaaaaaaaak...',
      '...kawoaawoak...',
      '...kacaaaacak...',
      '...kaaaaaaaak...',
      '....kaaaaaak....',
      '...kaakaakaak...',
      '..b.b..b..b..b..',
      '..b.b..b..b..b..',
      '.b..b..b..b...b.',
      '.b...b.b.b....b.',
      '..........b.....',
    ],
  },
  kip: {
    poten: 3,
    palet: { a: '#fbfaf5', b: '#f5a524', r: '#e0303c', y: '#f5a524', v: '#e8e2d2', c: '#fbfaf5', d: '#fbfaf5' },
    rijen: [
      '..........rr....',
      '.........krrk...',
      '........kaaaak..',
      '........kawoaky.',
      '........kcaaakyy',
      '.kk.....kaaarkk.',
      'kaak...kaaaark..',
      'kaaakkkaaaaak...',
      'kaavvvvvaaaak...',
      '.kavvvvvaaaak...',
      '.kaavvvaaaaak...',
      '..kaaaaaaaak....',
      '...kkkkkkkk.....',
      '.....b..b.......',
      '.....b..b.......',
      '....bb.bb.......',
    ],
  },
  eenhoorn: {
    poten: 3,
    palet: {
      a: '#fbf7fb', b: '#c9b8d6', d: '#fbf7fb', c: '#fbf7fb', y: '#f2c230',
      r: '#ff6f91', g: '#7fd67f', t: '#6cb6ff', p: '#b58cff',
    },
    rijen: [
      '..............y.',
      '.............y..',
      '.........rgtkk..',
      '........rgtkaak.',
      '........gtkawok.',
      '.......gtpkcaaak',
      '..........kaaak.',
      '.kkkkkkkkkaak...',
      'kptaaaaaaaaaak..',
      'kgaaaaaaaaaaak..',
      'raaaaaaaaaaaak..',
      '.kaaaaaaaaaaak..',
      '..kkkkkkkkkkk...',
      '...b.b....b.b...',
      '...b.b....b.b...',
      '...y.y....y.y...',
    ],
  },
  uil: {
    poten: 1,
    palet: { a: '#8a6a4a', d: '#e9d6b4', y: '#f5a524', b: '#f5a524', v: '#6d5238', c: '#e9d6b4', f: '#5a4430' },
    rijen: [
      '...kk.....kk....',
      '...kak...kak....',
      '...kaakkkaak....',
      '..kdddddddddk...',
      '..kdwodddwodk...',
      '..kdoodyddoodk..',
      '..kdddkykdddk...',
      '..kaaaaaaaaaak..',
      '..kavvadddavak..',
      '..kavvddddvvak..',
      '..kavvdfdfvvak..',
      '..kaavddddvaak..',
      '...kaaaaaaaak...',
      '....kkkkkkkk....',
      '................',
      '.....bb..bb.....',
    ],
  },
  goudvis: {
    poten: 0,
    palet: { a: '#f59a2a', b: '#e2711d', d: '#ffd08a', c: '#f59a2a' },
    rijen: [
      '................',
      '................',
      '................',
      '.......kkk......',
      '......kbbbk.....',
      'kk...kaaaaakk...',
      'kbk.kaaaaaaaak..',
      'kbbkaaddaaawok..',
      '.kbbaaddaaaaaak.',
      '.kbbaaddaaacaak.',
      'kbbkaaaaaaaaak..',
      'kbk..kaaaaaak...',
      'kk....kbkkkk....',
      '.......kk.......',
      '................',
      '................',
    ],
  },
  wasbeer: {
    poten: 2,
    palet: { a: '#8d8f97', b: '#4a4c54', m: '#2c2d33', d: '#e6e6e6', n: '#15101a', c: '#e6e6e6', s: '#4a4c54' },
    rijen: [
      '................',
      '..........k..k..',
      '.........kak.ak.',
      '.........kaaaaak',
      '........kddmmmdk',
      '........kmwomwok',
      '........kmmmmmmn',
      '.........kdcddk.',
      '..kkkkkkkkaaak..',
      '.kaaaaaaaaaaak..',
      'kssaaaaaaaaaak..',
      'kaaaaaaaaaaaak..',
      'kssaaaaaaaaaak..',
      '.kkkkkkkkkkkk...',
      '...b.b...b.b....',
      '...b.b...b.b....',
    ],
  },
  kikker: {
    poten: 2,
    palet: { a: '#5cbf4a', b: '#3e8e33', d: '#c7ec8a', r: '#d8334a', c: '#5cbf4a' },
    rijen: [
      '................',
      '................',
      '................',
      '........kkk.kkk.',
      '.......kwwok.wok',
      '.......kwook.ook',
      '...kkkkkaaaaaaak',
      '..kaaaaaaaaaaaak',
      '.kaaaaaaaacaaaak',
      '.kaaaaaaaakkkkkk',
      '.kaaaaaadddddk..',
      'kbbaaaaddddddk..',
      'kbbbaaaddddddk..',
      '.kkkkkkkkkkkk...',
      '..bb.b..bb.b....',
      '.bbb.bb.bbbbb...',
    ],
  },
  egel: {
    poten: 1,
    palet: { a: '#6b4e36', s: '#9a7552', d: '#e8cfa6', c: '#e8cfa6', b: '#3b2a20', n: '#15101a' },
    rijen: [
      '................',
      '................',
      '................',
      '................',
      '....k.k.k.k.....',
      '...kskskskskk...',
      '..kasasasasask..',
      '.ksasasasasaskk.',
      'kasasasasasaddk.',
      'ksasasasasadwok.',
      'kasasasasaddddkn',
      'ksasasasasadcddn',
      'kasasasasasaddk.',
      '.kaaaaaaaaaakk..',
      '..kkkkkkkkkk....',
      '...bb..bb..bb...',
    ],
  },
  zeehond: {
    poten: 0,
    palet: { a: '#8d99a6', b: '#6a7682', d: '#c3ccd5', n: '#15101a', c: '#c3ccd5' },
    rijen: [
      '................',
      '................',
      '................',
      '..........kkk...',
      '.........kaaak..',
      '........kaaawok.',
      '........kaaaaakn',
      '........kaaacddk',
      '.......kaaaakdk.',
      '......kaaaaak...',
      '.kk..kaaaaaaak..',
      'kbbkkaaaaadddk..',
      'kbbaaaaaaaddddk.',
      '.kkaaaaaaddddbk.',
      '...kkkkkkkkkbbk.',
      '............kk..',
    ],
  },
  kreeft: {
    poten: 2,
    palet: { a: '#e0452f', b: '#b3321f', d: '#f58a6c', c: '#e0452f', n: '#15101a' },
    rijen: [
      '................',
      '................',
      '............kk..',
      '...........kaak.',
      '..........k.kaak',
      '.........kak.kk.',
      '......n.n.kak...',
      '......kwokwokak.',
      '..k...kaaaakak..',
      '.kak.kaaaaaak...',
      'kaaakaddadaak...',
      'kbaaaaddaddak...',
      '.kaaaaaaaaak....',
      '..kkkkkkkkk.....',
      '...b.b.b.b......',
      '...b.b.b.b......',
    ],
  },
  hamster: {
    poten: 1,
    palet: { a: '#e8a860', d: '#fbf1e0', b: '#c98a47', c: '#ffb5a0', r: '#ffb5a0', n: '#3a2418' },
    rijen: [
      '................',
      '................',
      '................',
      '................',
      '................',
      '..........kk....',
      '.....kkkkkrak...',
      '....kaaaaaaakk..',
      '...kaaaaaaawok..',
      '..kaaaaaaaaaaak.',
      '..kaaaaaaaaccnk.',
      '..kaaaaaaaddddk.',
      '..kaaaaaaddddk..',
      '...kaaaaddddk...',
      '....kkkkkkkk....',
      '.....bb..bb.....',
    ],
  },
  nijlpaard: {
    poten: 2,
    palet: { a: '#8e84a8', b: '#6c6386', d: '#c4b9d8', r: '#e79ab2', n: '#3a2c4c', c: '#e79ab2' },
    rijen: [
      '................',
      '................',
      '................',
      '..........k.k...',
      '.........kakak..',
      '..kkkkkkkkaaaak.',
      '.kaaaaaaaaawoakk',
      'kaaaaaaaaaaaaaak',
      'kaaaaaaaaaaacdnk',
      'kaaaaaaaaaaaddak',
      'kaaaaaaaaaaaaaak',
      'kaaaaaaaaaaaaak.',
      '.kaaaaaaaaaaak..',
      '..kkkkkkkkkkk...',
      '..bb.bb..bb.bb..',
      '..bb.bb..bb.bb..',
    ],
  },
  giraf: {
    poten: 3,
    palet: { a: '#f2c14e', s: '#a0602a', b: '#a0602a', d: '#f7dd9a', c: '#f2c14e', n: '#15101a' },
    rijen: [
      '..........k.k...',
      '..........s.s...',
      '.........kaaak..',
      '.........kawoakk',
      '.........kcaaadk',
      '.........kaskkk.',
      '.........kaak...',
      '.........ksak...',
      '.........kaak...',
      '..kkkkkkkkaask..',
      '.kaasaasaaasak..',
      'kasaaasaasaaak..',
      '..kkkkkkkkkkk...',
      '...b.b....b.b...',
      '...b.b....b.b...',
      '...b.b....b.b...',
    ],
  },
  slak: {
    poten: 0,
    palet: { a: '#b8c46a', s: '#c07a3c', d: '#e8a860', h: '#8a4f24', c: '#b8c46a', n: '#15101a' },
    rijen: [
      '................',
      '................',
      '................',
      '.............w..',
      '............o.o.',
      '...kkkkk....k.k.',
      '..ksdsdsk...k.k.',
      '.ksddhhdsk..kak.',
      '.ksdhsshdk.kaak.',
      '.ksdhsdhdk.kcak.',
      '.ksddhhdskkaaak.',
      '..ksdddskaaaak..',
      '.kkkkkkkkaaak...',
      'kaaaaaaaaaaak...',
      '.kkkkkkkkkkk....',
      '................',
    ],
  },
  krokodil: {
    poten: 2,
    palet: { a: '#4f9a4a', b: '#3a7a37', d: '#a6d27a', w: '#ffffff', c: '#4f9a4a', n: '#15101a', t: '#ffffff' },
    rijen: [
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '..........kk....',
      '.........kwok...',
      '..kkkkkkkaaaakkk',
      '.kbabababaaaaaan',
      'kaaaaaaaaaacaaak',
      'kaaaaaaaaaaktttk',
      '.kkaaaadddddkkk.',
      '...kkkkkkkkkk...',
      '....b.b..b.b....',
      '...bb.b.bb.b....',
    ],
  },
  kameel: {
    poten: 4,
    palet: { a: '#d6a462', b: '#a67a44', d: '#e8c48c', c: '#d6a462', n: '#15101a' },
    rijen: [
      '................',
      '................',
      '...........kkk..',
      '..........kaaok.',
      '..kk..kk..kcaaak',
      '.kaak.kaak.kaakn',
      '.kaaakaaak.kak..',
      'kaaaaaaaaakaak..',
      'kaaaaaaaaaaaak..',
      'kaaaaaaaaaaak...',
      '.kaaaaaaaaaak...',
      '..kkkkkkkkkk....',
      '...b.b...b.b....',
      '...b.b...b.b....',
      '...b.b...b.b....',
      '..bb.bb.bb.bb...',
    ],
  },
  aap: {
    poten: 2,
    palet: { a: '#7a4f2e', b: '#5a3820', d: '#e8c49a', c: '#e8c49a', n: '#15101a' },
    rijen: [
      '................',
      '................',
      '..........kkkk..',
      '.........kaaaak.',
      '........kkaddddk',
      '........kadwodwo',
      '........kaddddck',
      '.........kaddnk.',
      '..kk.kkkkkkkkk..',
      '.kak.kaaaaaaak..',
      '.kak.kaadddaaak.',
      '..kakaaddddaaak.',
      '...kkaaaaaaaak..',
      '.....kkkkkkkk...',
      '......b.b.b.b...',
      '.....bb.b.bb.bb.',
    ],
  },
  kangoeroe: {
    poten: 0,
    palet: { a: '#c98a55', b: '#8f5d34', d: '#ecc79b', c: '#c98a55', n: '#15101a' },
    rijen: [
      '..........k.k...',
      '.........kakak..',
      '.........kaaak..',
      '.........kawokk.',
      '.........kcaaank',
      '..........kaakk.',
      '.........kaak...',
      '........kaaadk..',
      '.......kaaaddk..',
      '......kaaaaddk..',
      '.....kaaaaaddkk.',
      '...kkaaaaaaakak.',
      '..kaakaaaaaak...',
      '.kak..kkkkkk....',
      'kak....bb.bb....',
      'kk....bbbbbbb...',
    ],
  },
  hond: {
    poten: 3,
    palet: { a: '#c8925a', b: '#8a5a30', d: '#f3e1c4', e: '#7a4a28', c: '#f3e1c4', n: '#15101a', r: '#e0303c' },
    rijen: [
      '................',
      '................',
      '..........kkk...',
      '.........keaakk.',
      '.........keawok.',
      '.k.......keaaaak',
      'kak......kaacddn',
      'kak.......kkrkk.',
      '.kakkkkkkkaaak..',
      '..kaaaaaaaaaak..',
      '..kaaaaaaaaaak..',
      '..kaaaaaddddak..',
      '...kkkkkkkkkk...',
      '....b.b...b.b...',
      '....b.b...b.b...',
      '....b.b...b.b...',
    ],
  },
  dolfijn: {
    poten: 0,
    palet: { a: '#5c8fcf', b: '#3f6fae', d: '#cfe2f7', c: '#5c8fcf', n: '#15101a' },
    rijen: [
      '................',
      '................',
      '................',
      '........k.......',
      '.......kbk......',
      '......kbbak.....',
      '..kkkkkaaaakkk..',
      '.kbaaaaaaaawokk.',
      'kbaaaaaaaaaaaaak',
      'kbaaaaaddddcddkk',
      '.kbaaaddddddkk..',
      '..kkbakkkkkk....',
      'k.kbbk..........',
      'kbbbk...........',
      '.kkk............',
      '................',
    ],
  },
  bij: {
    poten: 1,
    palet: { a: '#f5c518', s: '#2a2020', v: '#d8f0ff', b: '#2a2020', c: '#f5c518' },
    rijen: [
      '................',
      '................',
      '................',
      '................',
      '.....kkk.kkk....',
      '....kvvvkvvvk...',
      '....kvvvvvvvk.k.',
      '.....kkvvvkk.k..',
      '...kkkkkkkkkkk..',
      '..kasasasaawok..',
      '.kasasasasaaaak.',
      'kkasasasasacaak.',
      '..kasasasaaaak..',
      '...kkkkkkkkkk...',
      '................',
      '.....b.b.b......',
    ],
  },
  vlinder: {
    poten: 0,
    palet: { a: '#3a2c4c', q: '#ff8c3a', y: '#ffd23f', p: '#b58cff', c: '#3a2c4c' },
    rijen: [
      '................',
      '...........k.k..',
      '............kk..',
      '..kkkk...kkkk...',
      '.kqqqqk.kqqqqk..',
      'kqqyyqqkqqyyqqk.',
      'kqyppyqkqyppyqk.',
      'kqqyyqkakqyyqqk.',
      '.kqqqqkawokqqk..',
      '..kkqqkaakqqk...',
      '..kqqqkaakqqqk..',
      '.kqyyqkaakqyyqk.',
      '.kqqqk.kk.kqqqk.',
      '..kkk......kkk..',
      '................',
      '................',
    ],
  },
  papegaai: {
    poten: 0,
    palet: { a: '#e0303c', g: '#3fae4a', t: '#2f7fd8', y: '#f5c518', v: '#3fae4a', d: '#fbfaf5', b: '#6a6a6a', c: '#e0303c', n: '#2a2020' },
    rijen: [
      '.........kkkk...',
      '........kaaaak..',
      '........kadwokk.',
      '........kaaddnnk',
      '........kaacknnk',
      '.......kaaaak.nk',
      '......kaaaaak...',
      '.....kavvvaak...',
      '....kavvvvaak...',
      '...kgvvvvaaak...',
      '..ktgvvvaaak....',
      '.ktgyk.kkkk.....',
      'ktgyk...b.b.....',
      'kgyk....b.b.....',
      '.kk.............',
      '................',
    ],
  },
  das: {
    poten: 2,
    palet: { a: '#6e6f76', b: '#2c2d33', d: '#f1f1ee', m: '#2c2d33', c: '#f1f1ee', n: '#15101a' },
    rijen: [
      '................',
      '................',
      '................',
      '................',
      '................',
      '..........kkk...',
      '..kkkkkkkkdmdkk.',
      '.kaaaaaaaaddmwok',
      'kaaaaaaaadmmdddk',
      'kaaaaaaaadddcdnk',
      'kaaaaaaaaadddkk.',
      'kaaaaaaaaaaak...',
      '.aaaaaaaaaaak...',
      '.kkkkkkkkkkk....',
      '.bb.bb..bb.bb...',
      '.bb.bb..bb.bb...',
    ],
  },
  konijn: {
    poten: 2,
    palet: { a: '#d9d2c8', b: '#a89e92', d: '#fbf7f0', r: '#f4a7b9', c: '#f4a7b9', n: '#15101a' },
    rijen: [
      '..........kk.kk.',
      '.........krakrk.',
      '.........krakrk.',
      '.........kaakak.',
      '.........kaaaak.',
      '........kaawoak.',
      '........kaaacank',
      '..k.....kaaaakk.',
      '.kdk.kkkkaaak...',
      '.kddkaaaaaaaak..',
      '..kkaaaaaaaaak..',
      '...kaaaaaaaaak..',
      '...kaaaaadddk...',
      '....kkkkkkkkk...',
      '....bb...b.b....',
      '...bbb..bb.bb...',
    ],
  },
  worm: {
    poten: 0,
    palet: { a: '#f08aa0', b: '#d06a82', c: '#ffb3c4' },
    rijen: [
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '..........kkk...',
      '.........kaaak..',
      '.........kawok..',
      '.........kacak..',
      '.........kbak...',
      '..kkk...kaak....',
      '.kaaak.kabk.....',
      'kabkaakaak......',
      'kak.kbaak.......',
      '.k...kkk........',
    ],
  },
  eekhoorn: {
    poten: 2,
    palet: { a: '#c8642a', b: '#8a4218', d: '#f3d9b4', c: '#f3d9b4', n: '#15101a', s: '#e07a3a' },
    rijen: [
      '................',
      '.kkkk...........',
      'kssssk....k.k...',
      'ksaaask..kakak..',
      'ksaaaask.kaaak..',
      '.ksaaask.kawok..',
      '..ksaaskkaaaank.',
      '..kksaaskcaddk..',
      '.kssaaaskdddk...',
      '.ksaaaakaddk....',
      '.ksaaaakaddak...',
      '..kssakaaddak...',
      '...kkkaaaaaak...',
      '....kkkkkkkk....',
      '.....bb..bb.....',
      '....bbb.bbb.....',
    ],
  },
};

export interface Pixel {
  x: number;
  y: number;
  kleur: string;
}

/** Een laag als SVG-pad per kleur: één `<path>` per kleur, geen honderden `<rect>`s. */
export type Laag = { kleur: string; d: string }[];

export interface Lagen {
  lijf: Laag;
  ogenOpen: Laag;
  ogenDicht: Laag;
  wangen: Laag;
  vleugelNeer: Laag;
  vleugelOp: Laag;
  potenRust: Laag;
  potenA: Laag;
  potenB: Laag;
}

function alsLaag(pixels: Pixel[]): Laag {
  const perKleur = new Map<string, string[]>();
  for (const p of pixels) {
    const lijst = perKleur.get(p.kleur) ?? [];
    lijst.push(`M${p.x} ${p.y}h1v1h-1z`);
    perKleur.set(p.kleur, lijst);
  }
  return [...perKleur].map(([kleur, delen]) => ({ kleur, d: delen.join('') }));
}

/** Dezelfde poot: de kolommen van de pootrijen die aan elkaar vastzitten. */
function potenGroepen(pixels: Pixel[]): Pixel[][] {
  const kolommen = [...new Set(pixels.map((p) => p.x))].sort((a, b) => a - b);
  const groepen: number[][] = [];
  for (const x of kolommen) {
    const laatste = groepen.at(-1);
    if (laatste && x - laatste.at(-1)! === 1) laatste.push(x);
    else groepen.push([x]);
  }
  return groepen.map((xs) => pixels.filter((p) => xs.includes(p.x)));
}

const cache = new Map<string, Lagen>();

/** De lagen van een sprite: wat vast is, en wat beweegt. */
export function lagenVan(sleutel: string): Lagen {
  const klaar = cache.get(sleutel);
  if (klaar) return klaar;
  const sprite = SPRITES[sleutel] ?? SPRITES.hond;
  const palet = { ...BASIS, ...sprite.palet };
  const kleur = (t: string) => palet[t] ?? palet.a;

  const lijf: Pixel[] = [];
  const ogenOpen: Pixel[] = [];
  const ogenDicht: Pixel[] = [];
  const wangen: Pixel[] = [];
  const vleugel: Pixel[] = [];
  const poten: Pixel[] = [];
  const potenVanaf = MAAT - sprite.poten;

  sprite.rijen.forEach((rij, y) => {
    [...rij].forEach((t, x) => {
      if (t === '.') return;
      if (y >= potenVanaf) return void poten.push({ x, y, kleur: kleur(t) });
      if (t === 'w' || t === 'o') {
        ogenOpen.push({ x, y, kleur: kleur(t) });
        ogenDicht.push({ x, y, kleur: palet.k });
        return;
      }
      if (t === 'c') wangen.push({ x, y, kleur: BLOS });
      if (t === 'v') {
        // Onder de vleugel zit gewoon lijf: klapt hij op, dan zie je dat.
        lijf.push({ x, y, kleur: palet.a });
        vleugel.push({ x, y, kleur: kleur('v') });
        return;
      }
      lijf.push({ x, y, kleur: kleur(t) });
    });
  });

  // Vleugel op: gespiegeld over zijn bovenste rij, zodat hij omhoog wijst,
  // met een eigen randje waar hij boven het lijf uitsteekt.
  const top = Math.min(...vleugel.map((p) => p.y));
  const vleugelOp: Pixel[] = vleugel.map((p) => ({ ...p, y: top - (p.y - top) - 1 })).filter((p) => p.y >= 0);
  const bezet = new Set([...lijf, ...vleugelOp].map((p) => `${p.x},${p.y}`));
  const randje = new Map<string, Pixel>();
  for (const p of vleugelOp) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = p.x + dx;
      const y = p.y + dy;
      if (x < 0 || y < 0 || x >= MAAT || bezet.has(`${x},${y}`)) continue;
      randje.set(`${x},${y}`, { x, y, kleur: palet.k });
    }
  }
  vleugelOp.unshift(...randje.values());

  // Lopen: om en om de helft van de poten optillen (de onderste pixel weg).
  const groepen = potenGroepen(poten);
  const bodem = MAAT - 1;
  const stap = (even: boolean) =>
    groepen.flatMap((g, i) => ((i % 2 === 0) === even ? g.filter((p) => p.y !== bodem) : g));

  const lagen: Lagen = {
    lijf: alsLaag(lijf),
    ogenOpen: alsLaag(ogenOpen),
    ogenDicht: alsLaag(ogenDicht),
    wangen: alsLaag(wangen),
    vleugelNeer: alsLaag(vleugel),
    vleugelOp: alsLaag(vleugelOp),
    potenRust: alsLaag(poten),
    potenA: alsLaag(stap(true)),
    potenB: alsLaag(stap(false)),
  };
  cache.set(sleutel, lagen);
  return lagen;
}

/**
 * De maatjes in pixelkunst.
 *
 * Elk dier is een raster van 32 bij 32, met de kop naar rechts, en allemaal in
 * dezelfde maat getekend: een omlijning van één pixel, poten met een eigen
 * randje en een voet eronder, zodat ze naast elkaar als één familie ogen. Een
 * letter is een kleur uit het palet van dat dier; een punt is leeg. Een paar letters
 * betekenen overal hetzelfde, zodat het dier ermee kan bewegen:
 *
 *   k  omlijning           w o  oog: wit (of een eigen kleur in het palet) en pupil
 *   c  wang (bloost als hij blij is)
 *   v  vleugel (klappert: om en om zoals getekend en omhoog gespiegeld)
 *
 * De onderste `poten` rijen zijn de poten: elke groep kolommen die daarin aan
 * elkaar vastzit is een poot (laat er dus een lege kolom tussen), en om en om
 * tilt het dier er de helft van op. Zo lopen ze echt.
 *
 * Op het scherm (lagenVan) komen er licht, schaduw, een getinte omlijning en
 * glans in de ogen bij. Wat eruit komt zijn lagen: het lijf, de ogen open en dicht, de
 * wangen, de vleugels op en neer, de poten in rust en in twee stappen.
 * Pixeldier.svelte zet die lagen als SVG neer; app.css wisselt ze.
 */

/** Het dier zoals het getekend wordt: 32 bij 32. */
export const MAAT = 32;
/** Traan, zzz en uitroep zijn grover: elk van hun pixels is er SCHAAL bij SCHAAL van het dier. */
export const SCHAAL = 2;

export interface Sprite {
  /** 32 rijen van 32. */
  rijen: readonly string[];
  palet: Readonly<Record<string, string>>;
  /** Hoeveel rijen onderaan poten zijn, in rijen van de tekening zelf. 0: geen poten (vis, worm, slak). */
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
    poten: 7,
    palet: { a: '#f1e4cb', b: '#9c7b5a', d: '#fff8ec', c: '#f1e4cb', r: '#d8334a', g: '#f2c230', t: '#3aa6a0' },
    rijen: [
      '......................kk..kk....',
      '.....................kaakkaak...',
      '.....................kaakkaak...',
      '.....................kaaaaaak...',
      '.....................kaawwook...',
      '.....................kaawwook...',
      '.....................kaawwookk..',
      '.....................kccaaaaaak.',
      '.....................kccaaaaaak.',
      '.....................kaaddddkk..',
      '.....................kaadddk....',
      '.....................kaaaakk....',
      '...................kkkaaaak.....',
      '...................kkkaaaak.....',
      '.......kkkkkkkkkkkkkkkaaaak.....',
      '.....kkrggttrrggttrrggaaaak.....',
      '...kkkrrrggttrrggttrrgaaaak.....',
      '..kaaarrrggttrrggttrrraaaak.....',
      '.kaaaaarrrggttrrggttraaaaak.....',
      '.kaaaaaaaaaaaaaaaaaaaaaaaak.....',
      '..kaaaaaaaaaaaaaaaaaaaaaaak.....',
      '..kaaaaaaaaaaaaaaaaaaaaaaak.....',
      '...kkaaaaaaaaaaaaaaaaaaaak......',
      '.....kkkkkkkkkkkkkkkkkkkkk......',
      '.....kk...kk.......kk...kk......',
      '....kbbk.kbbk.....kbbk.kbbk.....',
      '....kbbk.kbbk.....kbbk.kbbk.....',
      '....kbbk.kbbk.....kbbk.kbbk.....',
      '....kbbk.kbbk.....kbbk.kbbk.....',
      '....kbbk.kbbk.....kbbk.kbbk.....',
      '....kbbk.kbbk.....kbbk.kbbk.....',
      '.....kk...kk.......kk...kk......',
    ],
  },
  luiaard: {
    poten: 3,
    palet: { a: '#8c7862', b: '#5f4c3c', d: '#f0e3c6', m: '#3d2b20', n: '#2a1d16', h: '#efe6cf', s: '#a8927a', c: '#f0e3c6' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '................................',
      '........................k.......',
      '.....................kkkakkk....',
      '....................kaaaaaaak...',
      '...................kaaaaaaaaak..',
      '..................kaaaddddddaak.',
      '........kkkkkkkkkkaaaddddddddaak',
      '.....kkkaaaaaaaaaaaaddddddddddak',
      '....kaaaasaaasaaaaammowdddmowmak',
      '...kasaaasaaasaaasaamoodddmoomak',
      '..kaasaaaaaaaaaaasaadmmddddmmdak',
      '.kaaaaaaaaasaaasaaaaddddnnndddk.',
      '.kaaaaasaaasaaasaaaaadcdnnndck..',
      '.kaaaaasaaaaaaaaaaasaadkdddkk...',
      '.kaasaaaaaaaaaaaaaasaaaakkkk....',
      '..kasaaaasaaaasaaaaaaaakkkk.....',
      '..kbaaaaasaaaasaaaaaaakkbbbk....',
      '..kbbaaaaaaaaaaaaaaaak.kbbbk....',
      '..kbbbkkaaaaaaaaaabbk..kbbbk....',
      '..kbbbk.kkbbbkkkkbbbk..kbbbk....',
      '..kbbbk..kbbbk..kbbbk..kbbbk....',
      '..kbbbk..kbbbk..kbbbk..kbbbk....',
      '..kbbbk..kbbbk..kbbbk..kbbbk....',
      '..kbbbk..kbbbk..kbbbk..kbbbk....',
      '..kbbbk..kbbbk..kbbbk..kbbbk....',
      '..kbbbk..kbbbk..kbbbk..kbbbk....',
      '...khhhk..khhhk..khhhk..khhhk...',
      '....kkk....kkk....kkk....kkk....',
      '................................',
    ],
  },
  flamingo: {
    poten: 9,
    palet: { a: '#f58bb0', b: '#d45a86', d: '#ffc2d6', v: '#e5679a', c: '#f58bb0', n: '#2a1d16', y: '#f4e7d7' },
    rijen: [
      '....................kkkk........',
      '...................kaawokk......',
      '...................kaawoayyyk...',
      '...................kcaaaayyynk..',
      '....................kaakkkkknnk.',
      '...................kaak......nk.',
      '..................kaak.......k..',
      '..................kaak..........',
      '...................kaak.........',
      '....................kaak........',
      '....................kaak........',
      '....................kaaak.......',
      '.....kkkkkkkkkkkkkkkkaaaaak.....',
      '...kkaaaaaaaaaaaaaaaaaaaaak.....',
      '..kaaaaaaaaaaaaaaaaaaaaaaak.....',
      '..kavvvvvvvvvvvvaaaaaaaaaak.....',
      '.kaavvvvvvvvvvvvaaaaaaaaak......',
      '.kaaavvvvvvvvvvaaaaaaaaaak......',
      '..kaaaavvvvvvaaaaaaaaaakk.......',
      '..kaaaaaaaaaaaaaaaaaaaak........',
      '...kkaaaaaaaaaaaaaaaakk.........',
      '.....kkkkkkkkkkkkkkkk...........',
      '..........kk....................',
      '.........kbbk...................',
      '.........kbbk...kk..............',
      '.........kbbk..kbbk.............',
      '.........kbbk..kbbk.............',
      '.........kbbk..kbbk.............',
      '.........kbbk..kbbk.............',
      '.........kbbk..kbbk.............',
      '.........kbbk..kbbk.............',
      '..........kk....kk..............',
    ],
  },
  pinguin: {
    poten: 3,
    palet: { a: '#26303f', d: '#f3f3f0', y: '#f5a524', b: '#f5a524', c: '#f3f3f0', r: '#d8334a', v: '#1a2230' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '...........kkkkkkkk.............',
      '.........kkaaaaaaaak............',
      '........kaaaaaaaaawwkk..........',
      '........kaaaaaaaadwwook.........',
      '.......kaaaaaaadddwwookk........',
      '.......kaaaaaaadddddccyyy.......',
      '.......kaaaaadddddddccyyyy......',
      '.......kaaaaadddddddkkyyyk......',
      '.......kaaaadddddddddkyyk.......',
      '.......kaaaaddddddrrddrrk.......',
      '......kaaaaaddddddrrdddrk.......',
      '......kavvaadddddddrrrrdk.......',
      '.....kaavvaaddddddddrrddk.......',
      '.....kaavvaaddddddddddddk.......',
      '.....kaavvaaddddddddddddk.......',
      '.....kaavvaaddddddddddddk.......',
      '.....kaavvaaddddddddddddk.......',
      '.....kaavvaaddddddddddddk.......',
      '.....kaavvaaddddddddddddk.......',
      '.....kaaaaaaddddddddddddk.......',
      '.....kaaaaaadddddddddddk........',
      '.....kaaaaaadddddddddddk........',
      '......kaaaaaadddddddddk.........',
      '......kaaaaaadddddddddk.........',
      '.......kkaaaaadddddddk..........',
      '.........kkkkkkkkkkkk...........',
      '......kbbbbk....kbbbbk..........',
      '.......kkkk......kkkk...........',
      '................................',
    ],
  },
  octopus: {
    poten: 10,
    palet: { a: '#c54ab8', b: '#a3399a', d: '#e27fd6', c: '#c54ab8' },
    rijen: [
      '................................',
      '...........kkkkkkkkkk...........',
      '.........kkaaaaaaaaaakk.........',
      '........kaaaaaaaaaaaaaak........',
      '........kaaaadddaaaaaaak........',
      '.......kaaadddddaaaaaaaak.......',
      '.......kaadddddaaaaaaaaak.......',
      '.......kaadddaaaaaaaaaaak.......',
      '.......kaaaaaaaaaaaaaaaak.......',
      '.......kaawwooaaaawwooaak.......',
      '.......kaawwooaaaawwooaak.......',
      '.......kaawwooaaaawwooaak.......',
      '.......kaaccaaaaaaaaccaak.......',
      '.......kaaccaaaaaaaaccaak.......',
      '.......kaaaaaaaaaaaaaaaak.......',
      '........kaaaaaaaaaaaaaak........',
      '.........kaaaaaaaaaaaak.........',
      '.........kaaaaaaaaaaaak.........',
      '........kaaakkaaaakkaaak........',
      '.......kaaaakkaaaakkaaaak.......',
      '....bb..bb....bb....bb....bb....',
      '....bb..bb....bb....bb....bb....',
      '...kbbkkbbk..kbbk..kbbk..kbbk...',
      '..kbbbkkbbk..kbbk..kbbk..kbbbk..',
      '.kbbbk.kbbk..kbbk..kbbk...kbbbk.',
      '.kbbk..kbbbk.kbbk.kbbbk....kbbk.',
      '.kbbk...kbbbkkbbkkbbkk.....kbbk.',
      '.kbbk....kbbkkbbkkbbkk.....kbbk.',
      '..kk......kk..kk..kbbbk.....kk..',
      '...................kbbk.........',
      '....................kk..........',
      '................................',
    ],
  },
  kip: {
    poten: 7,
    palet: { a: '#fbfaf5', b: '#f5a524', r: '#e0303c', y: '#f5a524', v: '#e8e2d2', c: '#fbfaf5', d: '#fbfaf5' },
    rijen: [
      '.....................rr.........',
      '....................rrrr........',
      '...................krrrrk.......',
      '...................krrrrk.......',
      '..................kaaaaaak......',
      '.................kaawwooaak.....',
      '.................kaawwooaakky...',
      '.................kaawwooaakkyyy.',
      '.................kccaaaaaakkyyyy',
      '.................kccaaaaaakkkyyy',
      '.................kaaaaaaarkkkk..',
      '...kk...........kaaaaaaarrkkk...',
      '..kaakk........kkaaaaaaarrk.....',
      '.kaaaaak......kaaaaaaaaark......',
      '.kaaaaakk....kkaaaaaaaaakk......',
      '.kaaaaaakkkkkkaaaaaaaaaak.......',
      '.kaaaaavvvvvvvvaaaaaaaaak.......',
      '..kaaavvvvvvvvvvaaaaaaaak.......',
      '..kaaavvvvvvvvvvaaaaaaaak.......',
      '...kaaavvvvvvvvaaaaaaaaak.......',
      '...kaaavvvvvvvvaaaaaaaaak.......',
      '....kaaaavvvvaaaaaaaaaak........',
      '....kaaaaaaaaaaaaaaaaaak........',
      '.....kkaaaaaaaaaaaaaakk.........',
      '.......kkkkkkkkkkkkkk...........',
      '.........kbbk...kbbk............',
      '.........kbbk...kbbk............',
      '.........kbbk...kbbk............',
      '.........kbbk...kbbk............',
      '........kbbbbk.kbbbbk...........',
      '........kkkkkk.kkkkkk...........',
      '................................',
    ],
  },
  eenhoorn: {
    poten: 6,
    palet: {
      a: '#fbf7fb', b: '#c9b8d6', d: '#fbf7fb', c: '#fbf7fb', y: '#f2c230',
      r: '#ff6f91', g: '#7fd67f', t: '#6cb6ff', p: '#b58cff',
    },
    rijen: [
      '............................yy..',
      '...........................yyy..',
      '..........................yyy...',
      '..........................yy....',
      '...................rggttk.kk....',
      '.................rrggttkkkkk....',
      '.................rrggttkkaak....',
      '................rggttkkawwook...',
      '................gggttkkawwook...',
      '...............ggtttkkaawwookk..',
      '..............gggttpkkccaaaaaak.',
      '..............ggttppkkccaaaaaak.',
      '.....................kaaaaaaak..',
      '....................kaaaaaaak...',
      '...................kkaaakk......',
      '...kkkkkkkkkkkkkkkkaaaaakk......',
      '..kpttaaaaaaaaaaaaaaaaaaak......',
      '.kpptaaaaaaaaaaaaaaaaaaaaak.....',
      '.kggaaaaaaaaaaaaaaaaaaaaaak.....',
      'kkgaaaaaaaaaaaaaaaaaaaaaaak.....',
      'rraaaaaaaaaaaaaaaaaaaaaaaak.....',
      '.raaaaaaaaaaaaaaaaaaaaaaaak.....',
      '..kaaaaaaaaaaaaaaaaaaaaaaak.....',
      '...kkaaaaaaaaaaaaaaaaaaaak......',
      '.....kkkkkkkkkkkkkkkkkkkkk......',
      '.....kk...kk.......kk...kk......',
      '....kbbk.kbbk.....kbbk.kbbk.....',
      '....kbbk.kbbk.....kbbk.kbbk.....',
      '....kbbk.kbbk.....kbbk.kbbk.....',
      '....kbbk.kbbk.....kbbk.kbbk.....',
      '....kyyk.kyyk.....kyyk.kyyk.....',
      '....kyyk.kyyk.....kyyk.kyyk.....',
    ],
  },
  uil: {
    poten: 3,
    palet: { a: '#8a6a4a', e: '#e2cda6', d: '#f1e4c8', y: '#f5a524', v: '#6a4e34', s: '#8a6a4a', w: '#ffcf3a', c: '#f1e4c8', b: '#f5a524' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '................................',
      '.......k................k.......',
      '......kak..............kak......',
      '......kaak..kkkkkkkk..kaak......',
      '.......kaakkaaaaaaaakkaak.......',
      '........kkddddaaaaddddkk........',
      '........kddddddaaddddddk........',
      '.......kddwwwwddddwwwwddk.......',
      '.......kdwwwwwwddwwwwwwdk.......',
      '......kddwwwoowddwwwoowddk......',
      '.....kvvdwwwoowddwwwoowdvvk.....',
      '.....kvvddwwwwddydwwwwddvvk.....',
      '....kvvvvcdddddyyddddddvvvvk....',
      '....kvvvvvddddaayaddddvvvvvk....',
      '....kvvvvvaaaaeeeeaaaavvvvvk....',
      '....kvvvvvaaeeeeeeeeaavvvvvk....',
      '....kvvvvvaeeeeeeeeeeavvvvvk....',
      '....kvvvvvaeeseeseeseavvvvvk....',
      '....kvvvvvaeeeseeseesavvvvvk....',
      '....kvvvvvaeeeeeeeeeeavvvvvk....',
      '.....kvvvaaeeeseeseeeaavvvk.....',
      '.....kvvvaaeeeeseeseeaavvvk.....',
      '......kvkkaaeeeseeseaakkvk......',
      '.......k..kkaaeeseaakk..k.......',
      '...........kyykkkkyyk...........',
      '...........kyyk..kyyk...........',
      '...........kyyk..kyyk...........',
      '............kk....kk............',
      '................................',
    ],
  },
  goudvis: {
    poten: 0,
    palet: { a: '#f59a2a', b: '#e2711d', d: '#ffd08a', c: '#f59a2a' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '...............kkkk.............',
      '..............kbbbbk............',
      '.............kbbbbbbk...........',
      '...........kkaaaaaaaakk.........',
      '.kkk......kaaaaaaaaaaaakk.......',
      '.kbbk....kkaaaaaaaaaaaaaak......',
      '.kbbbk..kaaaaaaaaaaaaawwook.....',
      '.kbbbkk.kaaaaddaaaaaaawwook.....',
      '..kbbbbkaaaaddddaaaaaawwookk....',
      '..kbbbbbaaaaddddaaaaaaaaaaak....',
      '...kbbbbaaaaddddaaaaaaaaaaaak...',
      '...kbbbbaaaaddddaaaaaaccaaaak...',
      '..kbbbbbaaaaaddaaaaaaaccaaak....',
      '..kbbbbkaaaaaaaaaaaaaaaaaaak....',
      '.kbbbkkkaaaaaaaaaaaaaaaaakk.....',
      '.kbbbk....kaaaaaaaaaaaaaak......',
      '.kbbk......kkaaaaaaaaaakk.......',
      '.kkk.........kbbkkkkkkk.........',
      '.............kbbkkk.............',
      '..............kkkkk.............',
      '................................',
      '................................',
    ],
  },
  wasbeer: {
    poten: 4,
    palet: { a: '#8d8f97', b: '#3a3b40', m: '#232428', d: '#f0f0ee', n: '#111111', c: '#f0f0ee' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '...kkkk.........................',
      '..kmmmmk............kk....kk....',
      '..kmmmmk...........kaakkkkaak...',
      '.kmmmmmmk..........kamaaaamak...',
      '.kaaaaaak..........kaaaaaaaak...',
      '.kaaaaaak.........kadddddddddk..',
      '.kmmmmmmkkkkkkkkkkammwwmmwwmmmk.',
      '.kmmmmmmkaaaaaaaaaammwommwommmk.',
      '.kaaaaaaaaaaaaaaaaammmmmmmdddddk',
      '.kaaaaaaaaaaaaaaaaaaaaaaaadddddn',
      '.kmmmaaaaaaaaaaaaaaaaaaaaadddddn',
      '..kmmaaaaaaaaaaaaaaaaaaaaaadddkk',
      '..kaaaaaaaaaaaaaaaaaaaaaaakkkk..',
      '...kkaaaaaaaaaaaaaaaaaakkk......',
      '.....kaaaaaaaaaaaaaaaakk........',
      '.....kbaaaaaaaaaaaaaakbbk.......',
      '.....kbbkaaaaaaaaaakkkbbk.......',
      '.....kbbkkkbbkkkkbbk.kbbk.......',
      '.....kbbk.kbbk..kbbk.kbbk.......',
      '.....kbbk.kbbk..kbbk.kbbk.......',
      '.....kbbk.kbbk..kbbk.kbbk.......',
      '.....kbbk.kbbk..kbbk.kbbk.......',
      '.....kbbk.kbbk..kbbk.kbbk.......',
      '.....kbbk.kbbk..kbbk.kbbk.......',
      '......kk...kk....kk...kk........',
      '................................',
      '................................',
    ],
  },
  kikker: {
    poten: 7,
    palet: { a: '#5cbf4a', b: '#3e8e33', d: '#c7ec8a', r: '#d8334a', c: '#5cbf4a' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................kkkkkk....kkkk..',
      '...............kwwwwook...wwook.',
      '...............kwwwwook...wwook.',
      '...............kwwooook...ooook.',
      '.............kkkwwooookk..ooook.',
      '.............kkkaaaaaaaaaaaaaak.',
      '.......kkkkkkkkaaaaaaaaaaaaaaak.',
      '.....kkaaaaaaaaaaaaaaaaaaaaaaak.',
      '....kaaaaaaaaaaaaaaaaaaaaaaaaak.',
      '....kaaaaaaaaaaaaaaaccaaaaaaaak.',
      '...kaaaaaaaaaaaaaaaaccaaaaaaakkk',
      '...kaaaaaaaaaaaaaaaakkkkkkkkkkkk',
      '...kaaaaaaaaaaaaaaaakkkkkkkkkkk.',
      '...kaaaaaaaaaaaaaddddddddkkkk...',
      '..kkaaaaaaaaaaadddddddddddk.....',
      '..kbbaaaaaaaaaadddddddddddk.....',
      '.kbbbbbaaaaaaaddddddddddddk.....',
      '.kbbbbbaaaaaaaddddddddddddk.....',
      '..kbbbbbaaaaaadddddddddddk......',
      '...kkkkkkkkkkkkkkkkkkkkkk.......',
      '...kbbbbk....kbbk...kbbk........',
      '...kbbbbk....kbbk...kbbk........',
      '..kbbbbbbk...kbbk...kbbk........',
      '..kbbbbbbk...kbbk...kbbk........',
      '.kbbbbbbbbk.kbbbbk.kbbbbk.......',
      '..kkkkkkkk...kkkk...kkkk........',
      '................................',
    ],
  },
  egel: {
    poten: 4,
    palet: { a: '#6b4e36', s: '#9a7552', d: '#e8cfa6', c: '#e8cfa6', b: '#3b2a20', n: '#15101a' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '........kk..kk..kk..kk..........',
      '.......ksskksskksskkssk.........',
      '.......ksskksskksskksskkk.......',
      '......kassaassaassaassaask......',
      '.....kaassaassaassaassaassk.....',
      '....ksaassaassaassaassaasskkk...',
      '...kssaassaassaassaassaasskkkk..',
      '..kassaassaassaassaassaadddkkk..',
      '.kasssaassaassaassaassadwwook...',
      '.kssaassaassaassaasssaadwwook...',
      '.kssaassaassaassaassadddwwook...',
      '.kaassaassaassaassaaddddddddkkn.',
      '.kaassaassaassaassaadddddddddknn',
      '.kssaassaassaassaassadddccddddnn',
      '.kssaassaassaassaasssaadccddddn.',
      '.kasssaassaassaassaassaddddddk..',
      '..kassaassaassaassaassaadddkk...',
      '..kaaaaaaaaaaaaaaaaaaaaakkk.....',
      '...kkaaaaaaaaaaaaaaaaaakk.......',
      '.....kkkkkkkkkkkkkkkkkkkk.......',
      '......kkkk....kkkk....kk........',
      '.....kbbbbk..kbbbbk..kbbbbk.....',
      '......kbbk....kbbk....kbbbk.....',
      '.......kk......kk......kkk......',
      '................................',
    ],
  },
  zeehond: {
    poten: 0,
    palet: { a: '#8d99a6', b: '#6a7682', d: '#c9d2da', s: '#76828f', n: '#15101a', c: '#c9d2da' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '.....................kkkkkk.....',
      '....................kaaaaaak....',
      '...................kaaaaaaaak...',
      '..................kaaaaawoaaak..',
      '..................kaaaaaooaaakk.',
      '..................kaaaaaaddddddk',
      '.................kaaaaaaaddcddnn',
      '................kaaaaaaaaddddddk',
      '................kaaaaaaaaddddkkk',
      '................kaaaaaaaaakkkkk.',
      '................kaaaaaaaaak.....',
      '........kkkkkkkkkaaaaaaaaak.....',
      '..kk.kkkaaaaaaaaaaaaaaaaaak.....',
      'kkbbkaaaaaasaasaaaaaaaaaaak.....',
      'bbbaaaaasaaaaaaaasaaaaaaaak.....',
      'bbbaaaaaaaaaaaaaaaaaaaaaak......',
      'kkaaaaaaaaaaaaaaaaaaaaaak.......',
      'kkaaaaaaaaaaaaaaaaaaaaaak.......',
      'bbbaaaaaaddddddddddddaak........',
      'bbbaaadddddddddddddddddk........',
      'kkbbkaddddddddddddbbbbbbk.......',
      '..kk.kkkaddddddddbbbbbbbbk......',
      '........kkkkkkkkkkbbbbbbk.......',
      '..................kkkkkk........',
      '................................',
      '................................',
    ],
  },
  kreeft: {
    poten: 8,
    palet: { a: '#e0452f', b: '#a52e1d', r: '#7a2014', d: '#f58a6c', n: '#15101a', c: '#e0452f' },
    rijen: [
      '...................k............',
      '..................krk...........',
      '.............k....krrk...kkk....',
      '............krk....krk..kaaakkk.',
      '.............krk...krk..kaakaaak',
      '..............krk..krrk.kaakkaak',
      '...............krk..krk.kaakkaak',
      '...............krrk.krk.kaakkaak',
      '................krrk.krkkaakkaak',
      '.................krrkkrkkaaaaaak',
      '..................krrkrraaaaaaak',
      '...................krkkraaaaaaak',
      '....................krkrkaaaaak.',
      '.....................kworkaaak..',
      '....................kkkarkaak...',
      'k.................kkaaaakaaak...',
      'ak...k..kkkkkkkkkkaaaaaaaaak....',
      'aakkkakkbaabaabaaaaaaaaaaaak....',
      'aaaaabaabaabaabaaaaaaaaaaaak....',
      'aaaaabaabaabaabaaaaaaaaaaak.....',
      'aaaaabaabaabaabaaaaaaaaaaakkkkk.',
      'aaaaabaabaabaabaaaaaaaaaaaaaaaak',
      'aaakkbkkbaabaabaaakkaaakkaaaaaak',
      'aak..k.kbkkkbkkkbk.kbkk..kkaaaak',
      'ak.....kbk.kbk.kbk.kbk.....kkkk.',
      'k......kbk.kbk.kbk.kbk..........',
      '.......kbk.kbk.kbk.kbk..........',
      '.......kbk.kbk.kbk.kbk..........',
      '.......kbk.kbk.kbk.kbk..........',
      '.......kbk.kbk.kbk.kbk..........',
      '........k...k...k...k...........',
      '................................',
    ],
  },
  hamster: {
    poten: 4,
    palet: { a: '#e8a45a', d: '#fbf3e4', e: '#f6c98c', r: '#f2a1a8', c: '#f6c98c' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '...........kk....kkkk...........',
      '..........kaak..kaaaak..........',
      '.........kaaaakkkaarak..........',
      '.........kaaraaaaaarak..........',
      '........kkaaraaaaaaaaakk........',
      '.......kaaaaaaaaaaaaaaaak.......',
      '......kaaaaaaaaaaaaaaaaaak......',
      '.....kaaaaaaaaaaaaaaaawoaak.....',
      '.....kaaaaaaaaaaaaaaaaooaak.....',
      '....kaaaaaaaaaaaaaaaaaooeeek....',
      '....kaaaaaaaaaaaddddddeecerrk...',
      '....kaaaaaaaaddddddddddddekk....',
      '....kaaaaaaaddddddddddddddek....',
      '.....kaaaaaaddddddddddddddk.....',
      '.....kaaaaadddddddddddddddk.....',
      '......kaaaaadddddddddddddk......',
      '.......kaaaaddddddddddddk.......',
      '........kkaaadddddddddkk........',
      '.........krraaaaddddkkrrk.......',
      '.........krrkkkkrrkk.krrk.......',
      '.........krrk..krrk..krrk.......',
      '..........kk....kk....kk........',
      '................................',
      '................................',
    ],
  },
  nijlpaard: {
    poten: 6,
    palet: { a: '#8e84a8', b: '#6c6386', d: '#c4b9d8', r: '#e79ab2', n: '#3a2c4c', c: '#e79ab2' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................kk.kk...........',
      '...............kbbkaakk.........',
      '...............kbbaaaaakk.......',
      '...............kbbaawoaaakk.....',
      '........kkkkkkkkkaaawoaaaaakkk..',
      '......kkaaaaaaaaaaaaaaaaaankaak.',
      '....kkaaaaaaaaaaaaaaaaaaaaaaank.',
      '...kaaaaaaaaaaaaaaaaaaaaaaaaak..',
      '..kaaaaaaaaaaaaaaaaaaaaaaaaaaak.',
      '..kaaaaaaaaaaaaaaaaaaaaccaaaaak.',
      '.kaaaaaaaaaaaaaaaaaaaaaaaaaaaak.',
      '.kaaaaaaaaaaaaaaaaaaaaaaaaaaaak.',
      '.kaaaaaaaaaaaaaaaaaaaakkkkkkkk..',
      '..kaaaaddddddddddddaaaaarrrrrk..',
      '..kaaddddddddddddddddaaaarrrk...',
      '..kbddddddddddddddddddaaaaak....',
      '..kbbddddddddddddddddabbkkk.....',
      '..kbbbkkaddddddddaaakbbbk.......',
      '..kbbbk.kbbbkkkbbbkkkbbbk.......',
      '..kbbbk.kbbbk.kbbbk.kbbbk.......',
      '..kbbbk.kbbbk.kbbbk.kbbbk.......',
      '..kdddk.kdddk.kdddk.kdddk.......',
      '...kkk...kkk...kkk...kkk........',
      '................................',
      '................................',
    ],
  },
  giraf: {
    poten: 7,
    palet: { a: '#f2c14e', s: '#a0602a', b: '#a0602a', d: '#f7dd9a', c: '#f2c14e', n: '#15101a' },
    rijen: [
      '....................kk..kk......',
      '....................ss..ss......',
      '....................ss..ss......',
      '...................kaaaaaak.....',
      '...................kaawwooak....',
      '...................kaawwooakk...',
      '...................kaawwooaakkk.',
      '...................kccaaaaaaddk.',
      '...................kccaaaaaaddk.',
      '...................kaasskkkkkk..',
      '...................kaasskkk.....',
      '...................kaaaakkk.....',
      '...................kaaaak.......',
      '...................kssaak.......',
      '...................kssaak.......',
      '...................kaaaak.......',
      '.................kkkaaaakk......',
      '.................kkkaaaask......',
      '.....kkkkkkkkkkkkkkaaaasask.....',
      '...kkaaassaaaassaaaaaasssak.....',
      '..kaaaaassaaasssaaaaaassaak.....',
      '.kkassaaaaaasssaaassaaaaaak.....',
      '.kaassaaaaaassaaaassaaaaak......',
      '....kkkkkkkkkkkkkkkkkkkkkk......',
      '.....kk...kk.......kk...kk......',
      '....kbbk.kbbk.....kbbk.kbbk.....',
      '....kbbk.kbbk.....kbbk.kbbk.....',
      '....kbbk.kbbk.....kbbk.kbbk.....',
      '....kbbk.kbbk.....kbbk.kbbk.....',
      '....kbbk.kbbk.....kbbk.kbbk.....',
      '....kbbk.kbbk.....kbbk.kbbk.....',
      '.....kk...kk.......kk...kk......',
    ],
  },
  slak: {
    poten: 0,
    palet: { a: '#b8c46a', s: '#c07a3c', d: '#e8a860', h: '#8a4f24', c: '#b8c46a', n: '#15101a' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '........................kk..kk..',
      '.......................kwokkwok.',
      '.......................kwokkwok.',
      '........................kk..kk..',
      '........................kakkak..',
      '........................kakkak..',
      '.......kkkkkkkk.........kakkak..',
      '.....kksddssddskk.......kakkak..',
      '....kssdddssdddssk......kakkak..',
      '....kssdddhhhddssk......kaaaak..',
      '...kssdddhhhhhhddsk.....kaaak...',
      '...kssdddhhsshhdddk.....kaaak...',
      '...kssddhhsssshhddk....kaaaak...',
      '...kssddhhsssdhhddk....kccaak...',
      '...kssdddhhsdhhhddk....kccaak...',
      '...kssdddhhhhhhddskk.kkaaaaak...',
      '....kssddddhhhdsskkkkaaaaaak....',
      '....kssddddddddsskkaaaaaaaak....',
      '.....kksddddddskkkaaaaaaakk.....',
      '....kkkkkkkkkkkkkkaaaaaaak......',
      '..kkkkkkkkkkkkkkkaaaaaaak.......',
      '.kaaaaaaaaaaaaaaaaaaaaaak.......',
      '.kaaaaaaaaaaaaaaaaaaaaak........',
      '..kkkkkkkkkkkkkkkkkkkkk.........',
      '................................',
    ],
  },
  krokodil: {
    poten: 6,
    palet: { a: '#4f9a4a', b: '#3a7a37', d: '#b3d88a', t: '#ffffff', n: '#15101a', c: '#4f9a4a' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '.....................kkk........',
      '....................kaaak.......',
      '.........kkkkkkkkkkkaawoak....kk',
      '...kkkkkkbaabaabaabaaawoaakkkkna',
      'kkkbaabaaaaaaaaaaaaaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaaaaaaaaaaaaacaaaaa',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaddddaaaaaakktktktkk',
      'kkkaaaaaaddddddddddddkkdddtdtdtk',
      '...kkbbkkkddddddddddk.kddddddddk',
      '....kbbk..kbbkkkkbbk..kbbkkkkkk.',
      '....kbbk..kbbk..kbbk..kbbk......',
      '....kbbk..kbbk..kbbk..kbbk......',
      '....kbbk..kbbk..kbbk..kbbk......',
      '....kbbbk.kbbbk.kbbbk.kbbbk.....',
      '.....kkk...kkk...kkk...kkk......',
      '................................',
      '................................',
      '................................',
    ],
  },
  kameel: {
    poten: 10,
    palet: { a: '#d6a462', b: '#a67a44', d: '#e8c48c', c: '#d6a462', n: '#15101a' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '.......................kkkkk....',
      '......................kaaaook...',
      '.....................kaaaaookk..',
      '.............kk......kcaaaaaaak.',
      '.....kk......kkk......kcaaaaaakk',
      '....kaakk....kkaaak....kaaaaakkn',
      '...kaaaaak..kaaaaak....kaaakkkn.',
      '...kaaaaak..kaaaaak....kaaak....',
      '..kaaaaaaakkaaaaaaak..kaaak.....',
      '..kaaaaaaaaaaaaaaaak..kaaak.....',
      '.kaaaaaaaaaaaaaaaaaakkaaaak.....',
      '.kaaaaaaaaaaaaaaaaaaaaaaaak.....',
      '.kaaaaaaaaaaaaaaaaaaaaaaak......',
      '.kaaaaaaaaaaaaaaaaaaaaaaak......',
      '..kaaaaaaaaaaaaaaaaaaaaak.......',
      '..kaaaaaaaaaaaaaaaaaaaaak.......',
      '...kkaaaaaaaaaaaaaaaaaak........',
      '.....kkkkkkkkkkkkkkkkkkk........',
      '....kbbk.kbbk..kbbk.kbbk........',
      '....kbbk.kbbk..kbbk.kbbk........',
      '....kbbk.kbbk..kbbk.kbbk........',
      '....kbbk.kbbk..kbbk.kbbk........',
      '....kbbk.kbbk..kbbk.kbbk........',
      '....kbbk.kbbk..kbbk.kbbk........',
      '....kbbk.kbbk..kbbk.kbbk........',
      '....kbbk.kbbk..kbbk.kbbk........',
      '....kbbk.kbbk..kbbk.kbbk........',
      '....kkk...kkk..kkk...kkk........',
      '................................',
    ],
  },
  aap: {
    poten: 6,
    palet: { a: '#7a4f2e', b: '#5a3820', d: '#f0cfa4', e: '#e3a984', n: '#3a2418', c: '#f0cfa4' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '...............kkkkkk...........',
      '.............kkaaaaaakk.........',
      '............kaaaaaaaaaak........',
      '..........kkkaaddaaddaakkk......',
      '.........kaaaaddddddddaaaak.....',
      '........kaeeaddooddooddaeeak....',
      '........kaeeaddooddooddaeeak....',
      '........kaeeaaddddddddaaeeak....',
      '.......kkkaaaadddndnddaaaak.....',
      '......kaaakkkacdddddddakkk......',
      '.....kaaaaak.kddkdddkdk.........',
      '....kaaaaaak..kkdkkkkk..........',
      '....kaakkaak.kkaaaaaak.kk.......',
      '....kaakaaakkaaaaaaaaakaak......',
      '....kaakaak.kaaaddddaaaaak......',
      '....kaakkk.kaaaaddddaaaaaak.....',
      '....kaak...kaaaddddddaakaak.....',
      '....kaaak..kaaaddddddaakaak.....',
      '.....kaaakkkaaaddddddaakaak.....',
      '......kaaaaaaaaaddddaakkaaak....',
      '.......kaaaaaaaaddddaaakkaak....',
      '........kkddakaaaaaaaaakkddk....',
      '.........kddkkaaakkkaaakkddk....',
      '..........kk.kaaak.kaaak.kk.....',
      '.............kaaak.kaaak........',
      '.............kaaak.kaaak........',
      '............kddddk.kddddk.......',
      '.............kkkk...kkkk........',
      '................................',
    ],
  },
  kangoeroe: {
    poten: 0,
    palet: { a: '#c98a55', b: '#8f5d34', d: '#ecc79b', c: '#c98a55', n: '#15101a' },
    rijen: [
      '....................kk..kk......',
      '...................kaakkaak.....',
      '...................kaakkaak.....',
      '...................kaaaaaak.....',
      '...................kaawwookk....',
      '...................kaawwookk....',
      '...................kaawwookkkk..',
      '...................kcaaaaaaannk.',
      '....................kcaaaaaannk.',
      '.....................kaaaaakkk..',
      '....................kaaaakk.....',
      '...................kkaaaak......',
      '..................kaaaaak.......',
      '.................kkaaaaadk......',
      '................kaaaaaadddk.....',
      '...............kkaaaaaadddk.....',
      '..............kaaaaaaaddddk.....',
      '.............kkaaaaaaaddddk.....',
      '............kaaaaaaaaaddddkkk...',
      '...........kkaaaaaaaaaddddkkk...',
      '..........kaaaaaaaaaaaaddkkkk...',
      '.........kaaaaaaaaaaaaaakkaak...',
      '......kkkaaaaaaaaaaaaaaakkaak...',
      '.....kaaakkkaaaaaaaaaaaak.......',
      '....kaaaaakkkaaaaaaaaaak........',
      '...kaaak.....kkkkkkkkkkk........',
      '..kaaak.......kkkk..kkkk........',
      '.kaaak........bbbb..bbbb........',
      '.kaak........bbbbb..bbbbb.......',
      '.kkk........bbbbbbbbbbbbbb......',
      '............bbbbbbbbbbbbbb......',
      '................................',
    ],
  },
  hond: {
    poten: 8,
    palet: { a: '#c8925a', b: '#8a5a30', d: '#f3e1c4', e: '#7a4a28', c: '#f3e1c4', n: '#15101a', r: '#e0303c' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '.....................kkkk.......',
      '....................keaaakk.....',
      '...................keeaawwkkk...',
      '...................keeaawwook...',
      '...................keeaawwookk..',
      '...................keeaaaaaaak..',
      '..kk...............keaaaaaaaaakk',
      '.kaak..............kaaaaacddddnn',
      '.kaak...............kaaaccddddn.',
      '.kaak................kkkrrkkkk..',
      '.kaaak...............kkkrrkk....',
      '..kaaak............kkaaaaakk....',
      '...kaaakkkkkkkkkkkkaaaaaaak.....',
      '....kakaaaaaaaaaaaaaaaaaaak.....',
      '.....kaaaaaaaaaaaaaaaaaaaak.....',
      '.....kaaaaaaaaaaaaaaaaaaaak.....',
      '.....kaaaaaaaaaaaaaaaaaaaak.....',
      '.....kaaaaaaaaaaaddddddaaak.....',
      '......kaaaaaaaaaddddddddak......',
      '.......kkkkkkkkkkkkkkkkkkk......',
      '.......kk...kk.....kk...kk......',
      '......kbbk.kbbk...kbbk.kbbk.....',
      '......kbbk.kbbk...kbbk.kbbk.....',
      '......kbbk.kbbk...kbbk.kbbk.....',
      '......kbbk.kbbk...kbbk.kbbk.....',
      '......kbbk.kbbk...kbbk.kbbk.....',
      '......kbbk.kbbk...kbbk.kbbk.....',
      '.......kk...kk.....kk...kk......',
      '................................',
    ],
  },
  dolfijn: {
    poten: 0,
    palet: { a: '#5b93d1', b: '#3f70ae', d: '#e6f0fa', n: '#15101a', c: '#5b93d1' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '............k...................',
      '...........kbk..................',
      '...........kbbk.................',
      '...........kbbbkkkkkkkkk........',
      '............kbbbbbbbbbaakk......',
      '............kbbbbbbbbbbbaakk....',
      '..........kkbbbbbbbbbbbbbaaak...',
      '.........kbbbbbbbbbbbboobaaak...',
      '........kbbbbbbbbbbbbboobaaaak..',
      '.......kbbbbbbaaddddbbbdaaaaakkk',
      '.......kbbbbaddddddddddddddaaaaa',
      '......kbbbbddddddddddddddddaaaaa',
      '.....kbbbbddddddddddddddddkkkkkk',
      '.....kbbbddddkkkbkkkadddddddddk.',
      'kk..kbbbdddkk..kbbk.kkkkkkkkkk..',
      'aakkkbbdddk.....kbbk............',
      'kaaabbddkk.......kbk............',
      'kaaabddk..........k.............',
      '.kaaaddk........................',
      '..kkaaak........................',
      '....kaak........................',
      '....kaak........................',
      '....kaak........................',
      '....kaak........................',
      '....kaak........................',
      '.....kk.........................',
      '................................',
      '................................',
      '................................',
    ],
  },
  bij: {
    poten: 6,
    palet: { a: '#f7c51e', s: '#2a2020', q: '#dff3ff', u: '#a9d4ee', b: '#2a2020', c: '#f28ba0' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '.................kk.............',
      '..........kkkk.kkqqkk...........',
      '.........kqqqqkqqqqqqk..........',
      '........kqqqqqqqqqqqqkkk....kk..',
      '.......kqqqqqqqqquqqqkssk..kssk.',
      '.......kqqquqqqqqquqqqksk..ksk..',
      '.......kqqqquqqqqqquqkksk.ksk...',
      '.......kqqqqquqqqqqqqkksk.ksk...',
      '.......kqqqqqqqqqqqqqkkskksk....',
      '........kqqqqqqkkqqkk.kskksk....',
      '........kkaaassaaakk..kssssk....',
      '......kkssaaassaaasskkssssssk...',
      '.....kaassaaassaaassasssswwssk..',
      '....kaaassaaassaaassasssswossk..',
      '....kaaassaaassaaassssssssssssk.',
      '..kkkaaassaaassaaassassssssssk..',
      '.ksssaaassaaassaaassassssssssk..',
      '..kkkaaassaaassaaassaassssssk...',
      '....kaaassaaassaaassaaassssk....',
      '.....kaassaaassaaassaakkkkk.....',
      '......kkssaaassaaasskk..........',
      '........kkaaassaaakksk..........',
      '.........kskkkkskk.ksk..........',
      '.........ksk..ksk..ksk..........',
      '..........k....k....k...........',
      '................................',
      '................................',
      '................................',
      '................................',
    ],
  },
  vlinder: {
    poten: 0,
    palet: { a: '#3a2c4c', q: '#ff8c3a', y: '#ffd23f', p: '#b58cff', c: '#3a2c4c' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '......................kk..kk....',
      '......................kk..kk....',
      '.........................kkk....',
      '........................kkk.....',
      '........................kk......',
      '.....kkkkkk........kkkkkk.......',
      '...kkqqqqqqkk....kkqqqqqqkk.....',
      '..kqqqqqqqqqqk..kqqqqqqqqqqk....',
      '..kqqqqyyqqqqk..kqqqqyyqqqqk....',
      '.kqqqyyyyyyqqqkkqqqyyyyyyqqqk...',
      '.kqqyyppppyyqqkkqqyyppppyyqqk...',
      '.kqqyyppppyyqkkkkqyyppppyyqqk...',
      '.kqqqyyyyyyqqkaakqqyyyyyyqqqk...',
      '..kqqqqyyqqqkkaakkooyyyqqqqk....',
      '..kqqqqqqqqqkkaawwookkqqqqqk....',
      '...kkqqqqqqqkkaawwookqqqqkk.....',
      '....kkkkqqqqkkaaaakkkqqqk.......',
      '....kkkkqqqqkkaaaakkqqqqk.......',
      '.....kkqqqqqkkaaaakkqqqqqkk.....',
      '....kqqqqqqqkkaaaakkqqqqqqqk....',
      '....kqyyyyqqkkaaaakkqqyyyyqk....',
      '...kqqyyyyqk..kaak..kqyyyyqqk...',
      '...kqqqqqqqk...kk...kqqqqqqqk...',
      '....kqqqqkk..........kkqqqqk....',
      '.....kkkk..............kkkk.....',
      '................................',
    ],
  },
  papegaai: {
    poten: 0,
    palet: { a: '#e0303c', g: '#3fae4a', t: '#2f7fd8', y: '#f5c518', v: '#3fae4a', d: '#fbfaf5', b: '#6a6a6a', c: '#e0303c', n: '#2a2020' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '...................kkkkkk.......',
      '..................kaaaaaak......',
      '.................kaaaawwook.....',
      '.................kaaddwwookk....',
      '.................kaaddwwookkk...',
      '.................kaaadddddnnnk..',
      '.................kaaaaddddnnnnk.',
      '.................kaaaacckknnnnk.',
      '................kaaaaaackknnnnk.',
      '...............kkaaaaaaak..nnnk.',
      '..............kaaaaaaaaak....nk.',
      '.............kkaaaaaaaaak.......',
      '............kaaaaaaaaaaak.......',
      '...........kkaavvvvaaaaak.......',
      '..........kaavvvvvvvaaaak.......',
      '..........kaavvvvvvvaaaak.......',
      '.........kavvvvvvvvaaaaak.......',
      '........kgvvvvvvvvvaaaaak.......',
      '.......kggvvvvvvvaaaaaak........',
      '.....kktggvvvvvvvaaaaaak........',
      '....kttgggvvvvvvaaaaakk.........',
      '...kkttggykk..kkkkkkkk..........',
      '..kttggyyk......kk..kk..........',
      '..kttggyyk......bb..bb..........',
      '.ktggyykk.......bb..bb..........',
      '.kgggyyk........bb..bb..........',
      '..kgykk.........bb..bb..........',
      '...kk...........................',
      '................................',
    ],
  },
  das: {
    poten: 8,
    palet: { a: '#8d8f97', b: '#2a2b30', s: '#5d5f66', m: '#26272c', d: '#f3f2ee', n: '#111111', c: '#f3f2ee' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '.................kkk............',
      '......kkkkkkkkkkkmkddddk........',
      '...kkksssssssssssmmddddddkk.....',
      '..kssssssssssssssmmmmdddddddk...',
      '.kssssssssssssssssmmmmwommdddk..',
      '.ksssaaaaaaaaaaaadmmmmwommmmddnk',
      '.kaaaaaaaaaaaaaaaddmmmmmmmmmmnnk',
      '.kaaaaaaaaaaaaaaadddddmmmmmmmk..',
      '.kaaaaaaaaaaaaaaaddddddddddk....',
      '.kaaaaaaaaaaaaaaaaaaaakkkkkk....',
      '.kbbbaaaaaaaaaaaaaaaaabbbk......',
      '..kkkkkkkkkkkkkkkkkkkkkkkk......',
      '..kbbbk.kbbbk.kbbbk.kbbbk.......',
      '..kbbbk.kbbbk.kbbbk.kbbbk.......',
      '..kbbbk.kbbbk.kbbbk.kbbbk.......',
      '..kbbbk.kbbbk.kbbbk.kbbbk.......',
      '..kdbdk.kdbdk.kdbdk.kdbdk.......',
      '...kkk...kkk...kkk...kkk........',
      '................................',
      '................................',
    ],
  },
  konijn: {
    poten: 4,
    palet: { a: '#d9d2c8', b: '#a89e92', d: '#fbf7f0', r: '#f4a7b9', c: '#f4a7b9', n: '#15101a' },
    rijen: [
      '................................',
      '.....................kk...kkk...',
      '....................krak.krrk...',
      '...................krraakkrrk...',
      '...................krraakkrrk...',
      '...................kraaakkrrk...',
      '...................kaaaakkaak...',
      '...................kaaaakkaak...',
      '...................kaaaaaaaak...',
      '..................kaaawwooaak...',
      '..................kaaawwooaak...',
      '.................kaaaawwooaakk..',
      '.................kaaaaaaccaannk.',
      '.................kaaaaaaccaannk.',
      '.................kaaaaaaaaakkk..',
      '....kk.........kkkaaaaaaakk.....',
      '...kddk........kkkaaaaaak.......',
      '...kdddk...kkkkkkaaaaaaak.......',
      '...kddddkkkaaaaaaaaaaaaaak......',
      '....kdddkaaaaaaaaaaaaaaaaak.....',
      '.....kkkkaaaaaaaaaaaaaaaaak.....',
      '......kkaaaaaaaaaaaaaaaaaak.....',
      '......kkaaaaaaaaaaaaaaaaaak.....',
      '.......kaaaaaaaaaaaaaaaaak......',
      '.......kaaaaaaaaaaadddddkk......',
      '........kaaaaaaaaadddddkkk......',
      '........kkkkkkkkkkkkkkkkkk......',
      '........kkkk......kk..kk........',
      '.......kbbbbk....kbbkkbbk.......',
      '......kbbbbbk...kbbbkkbbbk......',
      '.....kbbbbbbk..kbbbbkkbbbbk.....',
      '.....kbbbbbk...kbbbk..kbbbk.....',
    ],
  },
  worm: {
    poten: 0,
    palet: { a: '#f08aa0', b: '#d06a82', c: '#ffb3c4' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '.....................kkkk.......',
      '....................kaaaak......',
      '...................kaawwook.....',
      '...................kaawwook.....',
      '...................kaawwook.....',
      '...................kaaccaak.....',
      '...................kaaccak......',
      '...................kbbaaak......',
      '..................kkbbakk.......',
      '.................kkaaaak........',
      '.....kkkk.......kaaaakk.........',
      '...kkaaaakk....kkaabk...........',
      '..kaaaaaaaak..kaaabk............',
      '..kaabkaaaak..kaaak.............',
      '.kaabk.kkaaakkaaak..............',
      '.kaak....kbaaaaaak..............',
      '.kaak.....kbaaakk...............',
      '..kk.......kkkk.................',
      '................................',
    ],
  },
  eekhoorn: {
    poten: 6,
    palet: { a: '#c8642a', b: '#8a4218', d: '#f3d9b4', c: '#f3d9b4', n: '#15101a', s: '#e07a3a' },
    rijen: [
      '................................',
      '...kkkkkk.......................',
      '..ksssssskk.....................',
      '.ksssssssssk........kk..kk......',
      '.ksssaaaasskk......kaakkaak.....',
      '.kssaaaaaaassk.....kaakkaak.....',
      '.kssaaaaaaassk.....kaaaaaak.....',
      '..kssaaaaaaassk....kaawwook.....',
      '..kssaaaaaaassk....kaawwook.....',
      '...kkssaaaaassk...kaaawwookk....',
      '....kssaaaaasskkk.kaaaaaaannk...',
      '.....kkssaaaasskkkaaaaaaaannk...',
      '....kkkkssaaasskkkcaaaadddkk....',
      '....kkkkssaaaasskkccaddddk......',
      '....kssssaaaaasskkdddddddk......',
      '...ksssaaaaaaaskkkdddddkk.......',
      '...ksssaaaaaaakkkadddddk........',
      '...kssaaaaaaaakkaaddddk.........',
      '...kssaaaaaaaakkaaddddak........',
      '....kssaaaaaakkkaaddddaak.......',
      '....kssssaaakkkaaaddddaak.......',
      '.....kksssakkkaaaaaddaaak.......',
      '.......kkkkaaaaaaaaaaaaak.......',
      '........kkkkaaaaaaaaaaak........',
      '........kkkkkkkkkkkkkkk.........',
      '..........kkkk.....kkkk.........',
      '.........kbbbbk...kbbbbk........',
      '........kbbbbbk..kbbbbbk........',
      '.......kbbbbbbk.kbbbbbbk........',
      '.......kbbbbbk..kbbbbbk.........',
      '........kkkkk....kkkkk..........',
      '................................',
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
  /** Waar de pupil zit, in de grove maat (MAAT / SCHAAL): voor de traan en het uitroepteken. */
  oog: { x: number; y: number };
}

/* ---- Kleur ------------------------------------------------------------- */

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function hexVan([r, g, b]: number[]): string {
  return '#' + [r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('');
}
/** Mengt `hex` met `naar` (0 is niets, 1 is helemaal). */
function meng(hex: string, naar: string, hoeveel: number): string {
  const a = rgb(hex);
  const b = rgb(naar);
  return hexVan(a.map((c, i) => c + (b[i] - c) * hoeveel));
}
/** Lichter naar een warm licht, donkerder naar een koele schaduw: dat oogt levendiger dan wit en zwart. */
const licht = (hex: string, n: number) => meng(hex, '#fff6dc', n);
const schaduw = (hex: string, n: number) => meng(hex, '#1b1030', n);
/** Hoe licht een kleur oogt, van 0 tot 1. */
function helderheid(hex: string): number {
  const [r, g, b] = rgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
/**
 * De omlijning bij een vulkleur: een donkere tint ervan. Een licht dier (de
 * eenhoorn, de kip) krijgt er meer donker bij, anders wordt zijn rand grijs en
 * valt hij weg tegen het vilt.
 */
const randKleur = (hex: string) => schaduw(hex, Math.min(0.86, 0.72 + 0.3 * Math.max(0, helderheid(hex) - 0.5)));

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

/** Groepjes pixels die aan elkaar vastzitten (vier richtingen). */
function klonten(punten: { x: number; y: number }[]): { x: number; y: number }[][] {
  const over = new Map(punten.map((p) => [`${p.x},${p.y}`, p]));
  const uit: { x: number; y: number }[][] = [];
  for (const start of punten) {
    if (!over.has(`${start.x},${start.y}`)) continue;
    const klont = [start];
    over.delete(`${start.x},${start.y}`);
    for (let i = 0; i < klont.length; i++) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = `${klont[i].x + dx},${klont[i].y + dy}`;
        const buur = over.get(k);
        if (buur) {
          over.delete(k);
          klont.push(buur);
        }
      }
    }
    uit.push(klont);
  }
  return uit;
}

const cache = new Map<string, Lagen>();

/**
 * De lagen van een sprite: wat vast is, en wat beweegt.
 *
 * De tekening krijgt licht van linksboven (een warme rand bovenaan, een koele schaduw onderaan),
 * een omlijning in een donkere tint van wat erbinnen zit in plaats van overal
 * zwart, en een glinstering in elk oog.
 */
export function lagenVan(sleutel: string): Lagen {
  const klaar = cache.get(sleutel);
  if (klaar) return klaar;
  const sprite = SPRITES[sleutel] ?? SPRITES.hond;
  const palet = { ...BASIS, ...sprite.palet };
  const kleur = (t: string) => palet[t] ?? palet.a;

  const raster = sprite.rijen;
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= MAAT || y >= MAAT ? '.' : raster[y][x]);
  const rand = (t: string) => t === '.' || t === 'k';
  const oogLetter = (t: string) => t === 'w' || t === 'o';

  /** De kleur van een vulpixel, met licht en schaduw naar hoe hij aan de rand ligt. */
  function vul(x: number, y: number, t: string): string {
    const basis = t === 'v' ? kleur('v') : kleur(t);
    if (rand(at(x, y + 1))) return schaduw(basis, 0.22);
    if (rand(at(x, y - 1))) return licht(basis, 0.28);
    if (rand(at(x + 1, y))) return schaduw(basis, 0.12);
    if (rand(at(x - 1, y))) return licht(basis, 0.14);
    if (rand(at(x, y + 2))) return schaduw(basis, 0.08);
    return basis;
  }
  /** De omlijning: een donkere tint van de buur binnenin, anders gewoon donker. */
  function lijn(x: number, y: number): string {
    for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) {
      const t = at(x + dx, y + dy);
      if (!rand(t) && !oogLetter(t) && t !== 'c') return randKleur(kleur(t === 'v' ? 'a' : t));
    }
    return palet.k;
  }

  const lijf: Pixel[] = [];
  const ogen: { x: number; y: number; t: string }[] = [];
  const wangen: Pixel[] = [];
  const vleugel: Pixel[] = [];
  const poten: Pixel[] = [];
  const potenVanaf = MAAT - sprite.poten;

  raster.forEach((rij, y) => {
    [...rij].forEach((t, x) => {
      if (t === '.') return;
      const px = { x, y, kleur: t === 'k' ? lijn(x, y) : oogLetter(t) ? kleur(t) : vul(x, y, t) };
      if (y >= potenVanaf) return void poten.push(px);
      if (oogLetter(t)) return void ogen.push({ x, y, t });
      if (t === 'c') wangen.push({ x, y, kleur: BLOS });
      if (t === 'v') {
        // Onder de vleugel zit gewoon lijf: klapt hij op, dan zie je dat.
        lijf.push({ x, y, kleur: vul(x, y, 'a') });
        vleugel.push(px);
        return;
      }
      lijf.push(px);
    });
  });

  // De ogen: open met een glinstering linksboven in de pupil; dicht een
  // streepje onderaan, met daarboven het ooglid in de kleur van de kop.
  const ogenOpen: Pixel[] = [];
  const ogenDicht: Pixel[] = [];
  let oog = { x: 11, y: 4 };
  const letterVan = new Map(ogen.map((p) => [`${p.x},${p.y}`, p.t]));
  for (const klont of klonten(ogen)) {
    const letter = (p: { x: number; y: number }) => letterVan.get(`${p.x},${p.y}`)!;
    const pupil = klont.filter((p) => letter(p) === 'o').sort((a, b) => a.y - b.y || a.x - b.x);
    const glans = pupil.length >= 3 ? pupil[0] : null;
    for (const p of klont) {
      const t = letter(p);
      ogenOpen.push({ ...p, kleur: p === glans ? '#ffffff' : t === 'w' ? sprite.palet.w ?? '#f4f1ea' : kleur('o') });
    }
    const onder = Math.max(...klont.map((p) => p.y));
    const boven = Math.min(...klont.map((p) => p.y));
    for (const p of klont) {
      const erboven = at(p.x, boven - 1);
      const lid = rand(erboven) || oogLetter(erboven) ? kleur('a') : kleur(erboven);
      ogenDicht.push({ ...p, kleur: p.y === onder ? palet.k : lid });
    }
    const laatste = pupil.at(-1);
    if (laatste) oog = { x: Math.floor(laatste.x / SCHAAL), y: Math.floor(laatste.y / SCHAAL) };
  }

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
      randje.set(`${x},${y}`, { x, y, kleur: randKleur(kleur('v')) });
    }
  }
  vleugelOp.unshift(...randje.values());

  // Lopen: om en om de helft van de poten optillen (de onderste rijen van die poot weg).
  const groepen = potenGroepen(poten);
  const stap = (even: boolean) =>
    groepen.flatMap((g, i) => {
      if ((i % 2 === 0) !== even) return g;
      const voet = Math.max(...g.map((p) => p.y));
      return g.filter((p) => p.y <= voet - SCHAAL);
    });

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
    oog,
  };
  cache.set(sleutel, lagen);
  return lagen;
}

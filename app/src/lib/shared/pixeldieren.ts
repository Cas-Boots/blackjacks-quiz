/**
 * De maatjes in pixelkunst.
 *
 * Elk dier is een raster van 16 bij 16 (grof) of 32 bij 32 (fijn), met de kop
 * naar rechts. De fijne zijn de dieren die in 16 pixels niet te herkennen
 * waren: daar is ruimte voor het masker van de wasbeer, de schaar van de
 * kreeft, de gele ogen van de uil. Een letter
 * is een kleur uit het palet van dat dier; een punt is leeg. Een paar letters
 * betekenen overal hetzelfde, zodat het dier ermee kan bewegen:
 *
 *   k  omlijning           w o  oog: wit (of een eigen kleur in het palet) en pupil
 *   c  wang (bloost als hij blij is)
 *   v  vleugel (klappert: om en om zoals getekend en omhoog gespiegeld)
 *
 * De onderste `poten` rijen zijn de poten: elke losse kolom daarin is een poot,
 * en om en om tilt het dier er de helft van op. Zo lopen ze echt.
 *
 * Op het scherm komt hij twee keer zo fijn (lagenVan): Scale2x maakt de trapjes
 * schuin, en dan komen er licht, schaduw, een getinte omlijning en glans in de
 * ogen bij. Wat eruit komt zijn lagen: het lijf, de ogen open en dicht, de
 * wangen, de vleugels op en neer, de poten in rust en in twee stappen.
 * Pixeldier.svelte zet die lagen als SVG neer; app.css wisselt ze.
 */

/** De tekening: 16 bij 16. */
export const BRON = 16;
/** Hoeveel keer groter hij op het scherm komt, na het gladmaken. */
export const SCHAAL = 2;
/** Het dier zoals het getekend wordt: 32 bij 32. */
export const MAAT = BRON * SCHAAL;

export interface Sprite {
  /** 16 rijen van 16 (grof, wordt opgeschaald) of 32 van 32 (fijn, al op maat). */
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
    poten: 5,
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
      '.kaaaaaaaaaaaaaaaaaaaaakkkkkk...',
      '..kaaaaasaaaaaaasaaaaaak........',
      '...kkaaaaaaasaaaaaaaaaaak.......',
      '....kaaaaaaaaaaaaabkaaaak.......',
      '....kaaaakbbbkkkbbbbaaaak.......',
      '....kaaaakbbbk.kbbbbkaaaak......',
      '....kaaakkbbbbkkbbbbkaaaak......',
      '....kaaakkbbbbk.kbbbkkaaaak.....',
      '...kaaaakkbbbbk.kbbbbkaaaak.....',
      '...kaaaak.kbbbk.kbbbbkkaaaak....',
      '...kaaaak.kbbbk.kbbbbkkaaaak....',
      '...kaaak..kbbbk..kbbbkkaaaakk...',
      '..khhhhk.khhhhk.khhhhk.khhhhhk..',
      '.khkhkhk..kkkk...kkkk...khkhkhk.',
      '..k.k.k..................k.k.k..',
      '................................',
    ],
  },
  flamingo: {
    poten: 8,
    palet: { a: '#f58bb0', b: '#d45a86', d: '#ffc2d6', v: '#e5679a', c: '#f58bb0', n: '#2a1d16', y: '#f4e7d7' },
    rijen: [
      '..................kaaaak........',
      '.................kawwwaakkkk....',
      '................kaawooaayyyyk...',
      '................kaawooaayyyyyk..',
      '................kaaaaaaaayyynk..',
      '.................kaccaaakkknnk..',
      '.................kaaaaak..knk...',
      '.................kaaakk....k....',
      '.........kkkkkkkkkaak...........',
      '.......kkaaaaaaaakaak...........',
      '...kkkkaaaavaaaaaaaaak..........',
      '..kvvvavvvvvvvvvaaaaak..........',
      '..kvvvavvvvvvvvvaaaaak..........',
      '...kvvvvvvvvvvvvaaaaak..........',
      '....kavaavvvvvaaaaaaak..........',
      '.....kaaaaaaaaaaaaaak...........',
      '......kaaaaaaaaaaaak............',
      '.......kkaaaaaaaakk.............',
      '.........kkkbkkkbk..............',
      '...........kbk..kbk.............',
      '..........kbbk..kbk.............',
      '..........kbk...kbkk............',
      '.........kbbbk..kbbbk...........',
      '.........kbbbk..kbbbk...........',
      '.........kbbbk..kbbbk...........',
      '..........kbk....kbk............',
      '..........kbbk..kbbk............',
      '...........kbk..kbk.............',
      '...........kbk..kbk.............',
      '...........kbbk.kbbk............',
      '............kk...kk.............',
      '................................',
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
    poten: 5,
    palet: { a: '#5cbf4a', b: '#3e8e33', d: '#c7ec8a', r: '#ff6f91', c: '#5cbf4a' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '.................kk......k......',
      '................kaak...kkakk....',
      '...............kaaaak.kaaaaak...',
      '..............kaawwwakaawwwaak..',
      '..............kaawooakaaoowaak..',
      '..............kaawooaaaaoowaak..',
      '..........kkkkkkaaaaaaaaaaaak...',
      '........kkaaaaaaaaaaaaaaaaaak...',
      '......kkaaaaaaaaaaaaaaaaaaaak...',
      '.....kaaaaaaaaaaaaaaaaaaaaaaak..',
      '....kaabbbbaaaaaaakkaaaaaaaaak..',
      '....kabbbbbbaaaaaaakkkkkkkkkk...',
      '....kbbbbbbbbaaaaaaaaaccaaarrk..',
      '...kbbbbbbbbbbadddddddaaaaakrrk.',
      '...kbbbbbbbbbbdddddddddaakk.krk.',
      '...kbbbbbbbbbdddddddddddk....k..',
      '....kbbbbbbbbdddddddddddk.......',
      '.....kbbbbbbaadddddddddbk.......',
      '...kkkkbbbbaaaadddddddbbk.......',
      '..kbbbbbbbbbbkkkkkkkkkbbkk......',
      '..kbbbbbbbbbbk.....kbbbbbbk.....',
      '...kkkkkkkkkk......kbbbbbbk.....',
      '..kbkkbkkbkkbk.....kbkbkbk......',
      '...k..k..k..k.......k.k.k.......',
      '................................',
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
    poten: 5,
    palet: { a: '#8e84a8', b: '#6c6386', d: '#c4b9d8', r: '#e79ab2', n: '#3a2c4c', c: '#e79ab2', t: '#fbf7ee', q: '#c95f86' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '................................',
      '..................k....k........',
      '................kkakkkkakk......',
      '...............kaaaaaaaaaak.....',
      '..............kbaawwaaawwak.....',
      '.............kbbbawoaaawoak.....',
      '.............kbbkawoaaawok......',
      '..............kkaaaaaaaaaakkk...',
      '..............kaaaaaaaaaaaaaak..',
      '.........kkkkkkaaaaaaaaaaaaannk.',
      '......kkkaaaaaaaaaaaaccaaaaaaak.',
      '....kkaaaaaaaaaaaaaaaaaaaaaaaak.',
      '...kaaaaaaaaaaaaaaaaaaaaaaaaaak.',
      '..kaaaaaaaaaaaaaaaaaaaaaaaaaaak.',
      '.kaaaaaaaaaaaaaaaaaaaaaaaaaaakk.',
      'kaaaaaaaaaaaaaaaaaaaakkaaaaakk..',
      '.kaaaaaaaaaaaaaaaaaaaakkkkkkkak.',
      '.kaaaaaaaaaaaaaaaaaaaaaatdttaak.',
      '.kaaaaaaaaaaaaaaaaaaaaaatdttaak.',
      '.kaaaaaaaaddddaaaaaaaaaaaaaaak..',
      '..kaaddddddddddddddaaakkkkkkk...',
      '...kddddddddddddddddak..........',
      '...kbddddddddddddddbbk..........',
      '...kbbkkkaaaaaaakkkbbk..........',
      '...kbbk.kbbkkkbbk.kbbk..........',
      '...kbbk.kbbk.kbbk.kbbk..........',
      '...kddk.kddk.kddk.kddk..........',
      '....kk...kk...kk...kk...........',
      '................................',
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
    palet: { a: '#b8c46a', s: '#c07a3c', d: '#e8a860', h: '#8a4f24', c: '#b8c46a', n: '#15101a', g: '#e8eef2' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '...........kkkk.....kkk....kkk..',
      '........kkkddddkkk.koowk..kwwwk.',
      '.......kddhhhhhhddkkoowk..kwook.',
      '......kdshhsssssdddkwwwkk.kwook.',
      '.....kdshhsssssssdddkkaaak.kaak.',
      '....kdshhsssssssssdddkaaak.kaak.',
      '....kdshssshhhhhhsdddkkaak.kaak.',
      '....kdshssshsssshhdddkkaak.kaak.',
      '....kdshsshhssssshdddkkaakkaaak.',
      '....kdshsshhsshsshhddkkaaaaaak..',
      '....kdshssshshhssshddkaaaaaaak..',
      '....kddhsssshhssshhddkaaaaaaak..',
      '....kddhhsssssssdhdddaaaaaaaak..',
      '.....kddhhssssddhhddkaaaaaaaak..',
      '......kddhhhddhhhddkkaaaaaacak..',
      '.......kdddhhhddddk..kaakaaaak..',
      '......kkkkkddddkkkkkkaaaakkkk...',
      '...kkkaaaaaaaaaaaaaaaaaaaaaaak..',
      '..kaaaaaaaaaaaaaaaaaaaaaaaaak...',
      '.kaaaaaaaaaaaaaaaaaaaaaaaaaak...',
      '..kkkkkkkkkkkkkkkkkkkkkkkkkk....',
      '................................',
      '................................',
      '................................',
    ],
  },
  krokodil: {
    poten: 5,
    palet: { a: '#4f9a4a', b: '#3a7a37', d: '#b3d88a', t: '#ffffff', n: '#15101a', c: '#4f9a4a', l: '#7cc8ff' },
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
      '....................kkk.........',
      '...................kaaak........',
      '..................kaaaaak.......',
      '..................kawwwak.......',
      '.......k..k..k..k.kawooak.......',
      '......kbkkbkkbkkbkkawooak.......',
      '....k.kbkabaabaabaaaaaaaakkkkk..',
      '...kbkaaaaaaaaaaaaaalaaaaaaaank.',
      '...kbaaaaaaaaaaaaaaalkkatatatak.',
      '..kaaaaaaaaaaaaaaaaaaakkkkkkkkk.',
      '.kaaaaaaaaaaaaaaaaaaaaaaatatatk.',
      'kaaaaaaaddddddddddddaaaaakkkkk..',
      '.kaaaaaddddddddddddddbkkk.......',
      '..kkkbbkkkbddddddkkkbbk.........',
      '....kbbk.kbbkkkbbk.kbbk.........',
      '....kbbk.kbbk.kbbk.kbbk.........',
      '....kbbk.kbbk.kbbk.kbbk.........',
      '.....kk...kk...kk...kk..........',
      '................................',
      '................................',
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
    poten: 3,
    palet: { a: '#c98a55', b: '#8f5d34', d: '#ecc79b', c: '#c98a55', n: '#15101a' },
    rijen: [
      '................................',
      '..................kk.kk.........',
      '.................kaakaak........',
      '.................kadkadk........',
      '.................kadkadk........',
      '.................kadkadk........',
      '.................kaaaaaak.......',
      '................kaaawwwaak......',
      '................kaaawooaak......',
      '...............kaaaawooaaak.....',
      '................kaaaaaaaaank....',
      '................kaaaaaacaank....',
      '.............kkkaaaaaakkkkk.....',
      '............kaaaaaaaaak.........',
      '...........kaaaaaaaaaak.........',
      '..........kaaaaaaaaaak..........',
      '..........kaaaaaaaaaaak.........',
      '..........kaaaaaaadaaaak........',
      '.........kaaaaaadawoaaaak.......',
      '.........kaaaaadaaaadkaaak......',
      '........kaaaaaaddaaadkkaak......',
      '.......kaaaaaaadbbbbbk.kk.......',
      '.....kkaaaaaaaaddddddk..........',
      '....kaaaaaaaaaaddddddk..........',
      '...kaaaaaaaaaaaaddddk...........',
      '..kaaaaaaaaaaaaaaddk............',
      '.kaaaaakkkaaaaaaakk.............',
      '..kkkkkkkkkaaaaakkkkkkk.........',
      '......kbbbbbkkkaaaaaaaak........',
      '......kbbbbbk.kaaaaaaaak........',
      '.......kkkkk...kkkkkkkk.........',
      '................................',
    ],
  },
  hond: {
    poten: 6,
    palet: { a: '#c8925a', b: '#8a5a30', d: '#f3e1c4', e: '#7a4a28', c: '#f3e1c4', n: '#15101a', r: '#e0303c', y: '#f2c230', q: '#d9536d', u: '#3f7fd8' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '..................kkkkkk........',
      '...............kkkeaaaaakk......',
      '..............keeeeaaaaaaak.....',
      '..............keeeeaaaaaaaak....',
      '..............keeeeaawwwawwwk...',
      '..kk..........keeeeaawooawook...',
      '.kddk.........keeeeaawooawook...',
      '.kaak........kaeeeeaaaaaaaaaakk.',
      '.kaaak........keeeeaaaaaaddddnnk',
      '.kaaak........keeeeaaaaadddddnnk',
      '..kaaak..kkkkkkeeeeaaaadddddddk.',
      '..kaaakkkaaaaaaeeeeaaaaaddddddk.',
      '...kaaaaaaaaaaaaeeeauuaakkkkkk..',
      '...kaaaaaaaaaaaaeeeauuuakkqrk...',
      '...kaaaaaaaaaaaaaaaauuuk.kqrk...',
      '...kaaaaaaaaaaaaaaaaauuukkqrk...',
      '...kaaaaaaaaaaadddddduyukkqrk...',
      '....kaaaaaaaaadddddddduukkrk....',
      '...kaaaaaaaaaaddddddddaaakk.....',
      '...kaaakkaaaaaaddddddkaaak......',
      '...kaaak.kaaakkkaaakkkaaak......',
      '...kaaak.kaaak.kaaak.kaaak......',
      '...kaaak.kaaak.kaaak.kaaak......',
      '...kdddk.kdddk.kdddk.kdddk......',
      '...kdddk.kdddk.kdddk.kdddk......',
      '....kkk...kkk...kkk...kkk.......',
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
      '..........kyyk....kyyk..........',
      '...........kak....kak...........',
      '...........kaak..kaak...........',
      '.......kkkk.kaakkaak.kkkk.......',
      '.....kkaaaakkkaaaakkkaaaakk.....',
      '....kaaaaaaaawwaawwaaaaaaaak....',
      '...kaaqqqqqqawoaaowaqqqqqqaak...',
      '..kyaqaaqqqqawoaaowaqqqqaaqayk..',
      '.kaaqqyaaqqqaayaayaaqqqaayqqaak.',
      '.kaaqyyyyaaqqaayyaaqqaayyyyqaak.',
      '.kaaqyyyyyaaqqaaaaqqaayyyyyqaak.',
      '.kayqqyyyqqqaaqaaqaaqqqyyyqqyak.',
      '.kaaqqqqqqqqqaaaaaaqqqqqqqqqaak.',
      '.kaaqqqqqqqqqqqaaqqqqqqqqqqqaak.',
      '..kaqqqqqqqqqqaaaaqqqqqqqqqqak..',
      '...kyqqqqqqqqakaakaqqqqqqqqyk...',
      '....kaaqqaaaakkaakkaaaaqqaak....',
      '.....kkaaaqqaakaakaaqqaaakk.....',
      '.....kaaqqqqqqaaaaqqqqqqaak.....',
      '....kaaqqqqqqqaaaaqqqqqqqaak....',
      '....kaqqqqppqaqaaqaqppqqqqak....',
      '....kaqqqpppaqqaaqqapppqqqak....',
      '....kaqqqppaqqqaaqqqappqqqak....',
      '....kaaqqqaqqqaaaaqqqaqqqaak....',
      '.....kaaqaqqqaaaaaaqqqaqaak.....',
      '.....kyaaaaaaakaakaaaaaaayk.....',
      '......kkkyakkkkaakkkkaykkk......',
      '.........kk....kk....kk.........',
      '................................',
      '................................',
      '................................',
      '................................',
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
    poten: 4,
    palet: { a: '#8d8f97', b: '#2a2b30', s: '#5d5f66', m: '#26272c', d: '#f3f2ee', n: '#111111', c: '#f3f2ee', h: '#d8d2c4', e: '#8a5a30' },
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
      '....................kk..........',
      '...................kmmk.........',
      '.......kkkkkkkkkkkkmmdmkk.......',
      '.....kksssssssssssssmmdddk......',
      '....ksssssssssssssssdmmmmmk.....',
      '....ksssssssssssssssdmwwwmdk....',
      '.kkkaaasssssssssssssdmwoomddk...',
      'kaaaaaaaaaaaaaaaaaaddmwoomddk...',
      'kaaaaaaaaaaaaaaaaaaddmmmmmmmdk..',
      '.kaaaaaaaaaaaaaaaaaddddddmmmmdk.',
      '.kaaaaaaaaaaaaaaaaadddddddmmmmk.',
      '..kaaaaaaaaaaaaaaaaddddkdddmmnk.',
      '...kaaabbbbbbbbbbbbbddddkkkkenk.',
      '...kbbbbbbbbbbbbbbbbbddddk..kk..',
      '...kbbbbbbbbbbbbbbbbbbbbbk......',
      '...kbbbbbbbbbbbbbbbbkkbbbk......',
      '...kbbbkkkbbbkkkbbbk.kbbbk......',
      '...kbbbk.kbbbk.kbbbk.kbbbk......',
      '...kbbbk.kbbbk.kbbbk.kbbbk......',
      '...khbhk.khbhk.khbhk.khbhk......',
      '....kkk...kkk...kkk...kkk.......',
      '................................',
    ],
  },
  konijn: {
    poten: 4,
    palet: { a: '#d9d2c8', b: '#a89e92', d: '#fbf7f0', r: '#f4a7b9', c: '#f4a7b9', n: '#15101a', t: '#ffffff' },
    rijen: [
      '......................k.........',
      '.....................kak........',
      '....................kaak........',
      '..........kkkk......kark........',
      '.........kaaaak.....kark........',
      '..........karrakk...kark........',
      '...........kkarrak..kark........',
      '.............karrakkkarkk.......',
      '..............karraaaaaaak......',
      '...............kkaaaaaaaaak.....',
      '...............kaaaaawwwaaak....',
      '...............kaaaaawooaaak....',
      '...............kaaaaawooaaaak...',
      '.........kkkkkkkaaaaaaaaaarak...',
      '.......kkaaaaaaaaaaaaaadddrk....',
      '......kaaaaaaaaaaaaaaccddddk....',
      '...kkkaaaabaaaaaaaaaaaakkkk.....',
      '..kdddaaabbaaaaaaaaaaaaattk.....',
      '.kdddddaabaaaaaaaadddkkkdtk.....',
      '.kdddddabaaaaaaaadddddk.kk......',
      '..kdddabbaaaaaaaadddddk.........',
      '...kkaabaaaaaaaaadddddk.........',
      '....kaabaaaaaaaaadddddk.........',
      '....kaabbaaaaaaaadddddk.........',
      '.....kaabaaaaaaaaadddk..........',
      '......kabaaaaaaaaaadak..........',
      '.....kkkkaaaaaaaakaaak..........',
      '....kaaaaaaaaakkkkaaak..........',
      '....kaaaaaaaaak..kdddk..........',
      '.....kkkkkkkkk....kkk...........',
      '................................',
      '................................',
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
  /** Waar de pupil zit, in de maat van de tekening (16): voor de traan en het uitroepteken. */
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

/* ---- Opschalen --------------------------------------------------------- */

/**
 * Scale2x (EPX): elke pixel wordt er vier, en waar twee buren schuin
 * hetzelfde zijn wordt de trap een schuine lijn. Omdat het op de letters werkt
 * en niet op kleuren, blijven ogen ogen en poten poten.
 */
export function scale2x(rijen: readonly string[]): string[] {
  const h = rijen.length;
  const w = rijen[0].length;
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? '.' : rijen[y][x]);
  const uit: string[][] = Array.from({ length: h * 2 }, () => Array(w * 2).fill('.'));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = at(x, y);
      const a = at(x, y - 1);
      const b = at(x + 1, y);
      const c = at(x - 1, y);
      const d = at(x, y + 1);
      // Alleen randen gladmaken die niet door ogen of poten snijden.
      const mag = (t: string) => t !== 'w' && t !== 'o' && p !== 'w' && p !== 'o';
      uit[y * 2][x * 2] = c === a && c !== d && a !== b && mag(a) ? a : p;
      uit[y * 2][x * 2 + 1] = a === b && a !== c && b !== d && mag(b) ? b : p;
      uit[y * 2 + 1][x * 2] = d === c && d !== b && c !== a && mag(c) ? c : p;
      uit[y * 2 + 1][x * 2 + 1] = b === d && b !== a && d !== c && mag(d) ? d : p;
    }
  }
  return uit.map((r) => r.join(''));
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
 * De tekening (16×16) gaat eerst door Scale2x naar 32×32. Dan krijgt hij
 * licht van linksboven (een warme rand bovenaan, een koele schaduw onderaan),
 * een omlijning in een donkere tint van wat erbinnen zit in plaats van overal
 * zwart, en een glinstering in elk oog.
 */
export function lagenVan(sleutel: string): Lagen {
  const klaar = cache.get(sleutel);
  if (klaar) return klaar;
  const sprite = SPRITES[sleutel] ?? SPRITES.hond;
  const palet = { ...BASIS, ...sprite.palet };
  const kleur = (t: string) => palet[t] ?? palet.a;

  // Een fijne tekening (32×32) staat er al op maat; een grove (16×16) gaat door Scale2x.
  const fijn = sprite.rijen.length === MAAT;
  const raster = fijn ? [...sprite.rijen] : scale2x(sprite.rijen);
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
  const potenVanaf = MAAT - sprite.poten * (fijn ? 1 : SCHAAL);

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
  for (const kaal of klonten(ogen)) {
    // Een oog van twee pixels hoog kijkt boos; een rij erbij maakt het rond en
    // vriendelijk. Alleen waar erboven lijf zit, niet over de omlijning heen.
    const boven0 = Math.min(...kaal.map((p) => p.y));
    const klont = [...kaal];
    for (const p of kaal) {
      const t = at(p.x, boven0 - 1);
      if (!fijn && p.y === boven0 && !rand(t) && !oogLetter(t)) {
        const erbij = { x: p.x, y: boven0 - 1 };
        letterVan.set(`${erbij.x},${erbij.y}`, letterVan.get(`${p.x},${p.y}`)!);
        klont.push(erbij);
      }
    }
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

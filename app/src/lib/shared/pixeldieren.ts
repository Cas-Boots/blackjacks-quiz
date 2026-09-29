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
    poten: 7,
    palet: { a: '#f1e4cb', b: '#9c7b5a', d: '#fff8ec', c: '#f1e4cb', r: '#d8334a', g: '#f2c230', t: '#3aa6a0', n: '#15101a', h: '#6b4f36' },
    rijen: [
      '................................',
      '....................k...k.......',
      '...................kak.kak......',
      '...................kbk.kbk......',
      '...................kbkkkbk......',
      '..................kaaaaaaak.....',
      '..................kaaaaaaaak....',
      '..................kaaaawwwak....',
      '..................kaaaawooakk...',
      '..................kaaaawooaddk..',
      '..................kaaaaaaddddnk.',
      '..................kaaccaadddddk.',
      '...................kaaaaakdddkk.',
      '...................kaaaaaakkk...',
      '...................kaaaaaak.....',
      '...................kaaaaaak.....',
      '..kk...............kaaaaaak.....',
      '.kdakkkkkkkkkkkkkkkaaaaaaak.....',
      '.kdaarrrrrrrrrrrrrraaaaaaak.....',
      '..kaaggtgggtgggtgggaaaaaak......',
      '..kaagtttgtttgtttggaaaaaak......',
      '..kaaggtgggtgggtgggaaaaaak......',
      '..kaarrrrrrrrrrrrrraaaaaak......',
      '...kaararararararaaaaaaak.......',
      '....kaakkkaakkkkkkaakkkaak......',
      '....kaak.kaak....kaak.kaak......',
      '....kaak.kaak....kaak.kaak......',
      '....kaak.kaak....kaak.kaak......',
      '....khhk.khhk....khhk.khhk......',
      '....khhk.khhk....khhk.khhk......',
      '.....kk...kk......kk...kk.......',
      '................................',
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
    poten: 10,
    palet: { a: '#f58bb0', b: '#d45a86', d: '#ffc2d6', v: '#e5679a', c: '#f58bb0', n: '#2a1d16', y: '#f4e7d7' },
    rijen: [
      '................................',
      '..................kkkk..........',
      '................kkaaaakk........',
      '...............kaabbbbbakkkk....',
      '...............kaawwwwwayyyyk...',
      '...............kaawoowwayyyyyk..',
      '...............kaawoowwakyyynk..',
      '................kccwwwaaakynnk..',
      '.................kaaaaaak.knnk..',
      '.................kaaakkk...kk...',
      '................kaaak...........',
      '...............kaaak............',
      '..............kaaak.............',
      '........kkkkkkkaaak.............',
      '.....kkkaaaaaaaaaaak............',
      '...kkkkkkkkkkkkaaaaak...........',
      '..knnnvvvvvvvvvkaaaaak..........',
      '.knnnnvvvvvvvvkaaaaaaak.........',
      '..knnnvvvvvvvkaaaaaaaak.........',
      '...knnvvvvvkkaaaaaaaak..........',
      '....kkkkkkkkaaaaaaaak...........',
      '......kkkkkkkkkkkkk.............',
      '........kbk....kbk..............',
      '........kbk....kbk..............',
      '........kbk....kbk..............',
      '........kbk...kbbk..............',
      '.......kbbk...kbbk..............',
      '.......kbbk.....kbk.............',
      '........kbk......kbk............',
      '........kbk.......kbk...........',
      '........kbbbk.....kbbbbk........',
      '........kkkkk.....kkkkkk........',
    ],
  },
  pinguin: {
    poten: 3,
    palet: { a: '#26303f', d: '#f3f3f0', y: '#f5a524', b: '#f5a524', c: '#f3f3f0', r: '#d8334a', q: '#9c1f30', v: '#1a2230', l: '#56627a' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '............kkkkkk..............',
      '..........kkaaaaaakk............',
      '.........kaaaaaaaaaak...........',
      '........kaaaaaaaaaaaak..........',
      '........kaaaaaaaaaaaaak.........',
      '.......kaaaaaaaawwwwwwak........',
      '.......kaaaaaaawwwwoowakkkk.....',
      '.......kaaaaaaawwwwoowdyyyyyk...',
      '.......kaaaaaaaawwwwwdkyyyykk...',
      '.......kaaaaaaddddddcckkkk......',
      '.......kaaaaaadkkdddkkdk........',
      '......kaaaaaaadkrkdkrkdk........',
      '.....kakvkaaaddkrrqrrkddk.......',
      '.....kkvvkaaaddkrkdkrkddk.......',
      '....kkvvvkaaaddkkdddkkdddk......',
      '....kvvvvkaaaddddddddddddk......',
      '...kvvvvkaaaaddddddddddddk......',
      '...kvvvvkaaaaddddddddddddk......',
      '..kvvvvkaaaaaddddddddddddk......',
      '..kvvvkaaaaaaddddddddddddk......',
      '..kvvkaaaaaaaddddddddddddk......',
      '..kkkkaaaaaaadddddddddddk.......',
      '.....kaaaaaaaaddddddddddk.......',
      '......kaaaaaaaaddddddddk........',
      '.......kaaaaaaaaddddddk.........',
      '........kkkkkkkkkkkkkk..........',
      '.........kbbk....kbbk...........',
      '.........kbbbbbk.kbbbbbk........',
      '.........kkkkkkk.kkkkkkk........',
    ],
  },
  octopus: {
    poten: 6,
    palet: { a: '#c54ab8', b: '#a3399a', d: '#e27fd6', c: '#c54ab8', s: '#e8a0e0' },
    rijen: [
      '................................',
      '................................',
      '...........kkkkkkkkkk...........',
      '.........kkaaaaaaaaaakk.........',
      '........kaaaaaaaaabbaaak........',
      '.......kaaddaaaaaaaaaaaak.......',
      '......kaadddaaaaaaabbaaaak......',
      '......kaaddaaaaaaabbbbaaak......',
      '.....kaaaddaaaaaaabbbbaaaak.....',
      '.....kaaaaaaaaaaaaabbaaaaak.....',
      '.....kabbaaaaaaaaaaaaaaaaak.....',
      '.....kabbawwwwaaaawwwwaaaak.....',
      '.....kaaawwwwwwaawwwwwwaaak.....',
      '.....kaaawwwoowaawwwoowaaak.....',
      '.....kaaawwwoowaawwwoowaaak.....',
      '.....kaaawwwwwwaawwwwwwaaak.....',
      '.....kaaaawwwwaaaawwwwaaaak.....',
      '.....kaaccaaaakaakaaaaccaak.....',
      '.....kaaaaaaaaakkaaaaaaaaak.....',
      '.....kaaaaaaaaaaaaaaaaaaaak.....',
      '.....kaaaaaaaaaaaaaaaaaaaak.....',
      '....kaaaakkaaaakkaaaakkaaaak....',
      '...kaaaakkaaaak..kaaaakkaaaak...',
      '...kaaaakkaasak..kasaakkaaaak...',
      '..kaaaak.kaaaak..kaaaak.kaaaak..',
      '..kaaaak.kaasak..kasaak.kaaaak..',
      '..kabaak.kaaaak..kaaaak.kaabak..',
      '.kkaaaak.kaasak..kasaak.kaaaakk.',
      'kakabaak.kaaaak..kaaaak.kaabakak',
      'kakaaaak.kaasak..kasaak.kaaaakak',
      'kaaaaaak..kaak....kaak..kaaaaaak',
      '.kkkkkk....kk......kk....kkkkkk.',
    ],
  },
  kip: {
    poten: 7,
    palet: { a: '#fbfaf5', b: '#f2c230', r: '#e0303c', y: '#f5a524', v: '#e6dcc6', c: '#fbfaf5', d: '#fbfaf5', m: '#4a1018', p: '#ff7a8a' },
    rijen: [
      '.............kk.................',
      '..k....k....kak...kk.kk.kk....kk',
      '.kak..kak..kaak..krrkrrkrrk..kak',
      '.kaakkaaak.kk....krrrrrrrrk.kaak',
      '.kaaakaaaak....karrrrrrrrak.kk..',
      '.kaaaakaaak...kaakkkkaaakkk.....',
      '.kaaaaakaak..kaakwwwwkaakkkk....',
      '.kaaaaaaaaak.kakwwwwwwkayyyyk...',
      '.kaaaaaaaaak.kakwwwoowkayyyyyk..',
      '.kaaaaaaaaaakkakwwwoowkakmmmk...',
      '.kaaaaaaaaaaaaakwwwwwwkakmpk....',
      '.kaaaaaaaaaaaaaakwwwwkaayyyk....',
      '.kaaaaaaaaaaaaaaakkkkccrrkkk....',
      '..kaaaaaaaaaaaaaaaaaaaarrk......',
      '..kaaaaaaakkkkkkaaaaaaakk.......',
      '..kaaaaakkvvvvvvkkaaaaaaak......',
      '..kaaakkvvvvvvvvvvkaaaaaaak.....',
      '..kakkvvvvvvvvvvvvkaaaaaaak.....',
      '...kakkvkvvkvvvvvkaaaaaaaak.....',
      '...kaaakkkkkkkkkkaaaaaaaaak.....',
      '....kaaaaaaaaaaaaaaaaaaaak......',
      '.....kaaaaaaaaaaaaaaaaaaak......',
      '......kaaaaaaaaaaaaaaaaak.......',
      '........kaaaaaaaaaaaaak.........',
      '.........kkkkkkkkkkkkk..........',
      '.........kbk.....kbk............',
      '.........kbk.....kbk............',
      '.........kbk.....kbk............',
      '.........kbk.....kbk............',
      '........kbbbk...kbbbk...........',
      '.......kbkbkbk.kbkbkbk..........',
      '.......kkkkkkk.kkkkkkk..........',
    ],
  },
  eenhoorn: {
    poten: 8,
    palet: { a: '#fbf7fb', b: '#d9cbe6', d: '#f3dbe4', c: '#fbf7fb', y: '#f5c83a', h: '#c98a1c', r: '#ff6f91', q: '#ffa94d', g: '#7fd67f', t: '#6cb6ff', p: '#b58cff', n: '#7a4a6a' },
    rijen: [
      '............................kk..',
      '.....................k.....kyhk.',
      '...................kkakk..khyk..',
      '.........k.......kktprrakkyhk...',
      '........kyk.....kgtpraygahyk....',
      '.......kyyyk...kktpraygtkkkak...',
      '........kyk...kgtpraaaabbbbak...',
      '.........k....ktpraaaaawoowaak..',
      '............kktpraaaaaawoowaaak.',
      '...........kgtpraaaaaaaabbaadndk',
      '...........ktprqaaaaaaccaaaddndk',
      '..........ktprqaaaaaaaaaaakkkkdk',
      '....kk....kprqyaaaaaaakkadddddk.',
      '...kprkkkkprqyaaaaaaaaakkkdddk..',
      '..kprqygaprqyaaaaaaaaakk..kkk...',
      '..krqyaaaaaaaaaaaaaaaaaak.......',
      '.krqyaaayaaaaaaaaaaaaaaaak......',
      'krqyaaaaaaaaaaaaaaaaaaaaaak.....',
      'kqygaaaaaaayaaaaaaaaaaaaaak.....',
      'kygtaaayaaaaaaaaaaaaaaaaaak.....',
      'kgtpraaaaaaaaaaaaaaaaaaaak......',
      '.kprqkkaaaaaaaaaaaaaaaaak.......',
      '..kqbbbbkaaaakkkkkbbbkaaak......',
      '...kbbbk.kaaak...kbbk.kaak......',
      '...kbbk..kaak....kbbk.kaak......',
      '...kbbk..kaak....kbbk.kaak......',
      '...kbbk..kaak....kbbk.kaak......',
      '...kbbk..kaak....kbbk.kaak......',
      '...kyyk..kyyk....kyyk.kyyk......',
      '...kyyk..kyyk....kyyk.kyyk......',
      '....kk....kk......kk...kk.......',
      '................................',
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
    palet: { a: '#f7932a', b: '#e2711d', d: '#ffd08a', c: '#f7932a', e: '#ffb85c', t: '#ffb066', u: '#ec7f2a', l: '#ff7f6a', q: '#cdeeff', z: '#ffffff' },
    rijen: [
      '.kkk........kk..............kk..',
      'ktttk......kttkk...........kqqk.',
      'ktuttk....ktttttkk........kqzqqk',
      '.ktuttk...ktuttuttk.......kqqqqk',
      '.kttutuk..ktuttutttk.......kqqk.',
      '.kttuttuk..ktuttukkkkk......kk..',
      'kttttuttuk.ktutkkaaaaakkkk......',
      'ktttttututkktkkaaaaaaakkwwkk....',
      'ktuttttuuttkkaaaaaaaakwwwwwwk...',
      '.ktuuttututkaaaaaaaaakwwwwwwk...',
      '..kttuttutukaaaeaaaeakwwoowwk...',
      '..ktttuttukaaaeaaaeaakwwoowwk...',
      '...ktttuutkaaaaeaaaeakwwwwwwk...',
      '....kttttkaaaeaaaeaaabkkwwkkak..',
      '.....ktttkaaeaaaeaaaabaakkaaakk.',
      '.....ktttkaaaeaaaeaaabaaaaaakllk',
      '....kttttkaaaaaeaaaaaabaaaaaaklk',
      '...ktttttukaaaeddddddddddddakllk',
      '..kttttuutkadddeddddddddddddkkk.',
      '..ktttuttuukdddddddddddddddk....',
      '.ktttuttutukdddddddddddddddk....',
      'kttuuttuttutkkkkddddkdddddk.....',
      'ktuttttututkktttkddktkkdkk......',
      'ktttttuttuk.kttkkdktuttk........',
      '.ktttutttk..ktk..ktuttk.........',
      '.kttutttuk.ktk...kuttk..........',
      '.kttutttk...k...ktutk...........',
      'kttutttk.......ktutk............',
      'ktutttk.........kkk.............',
      '.kkttk..........................',
      '...kk...........................',
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
    poten: 3,
    palet: { a: '#5cbf4a', b: '#3e8e33', d: '#e6f59a', r: '#ff6f91', c: '#5cbf4a' },
    rijen: [
      '................................',
      '................................',
      '................................',
      '................................',
      '........................kkkk....',
      '................kkk....kaaaak...',
      '...............kaaak.kkawwwwak..',
      '..............kawwwakawwwwwwak..',
      '..............kwwoowkawwwwoowak.',
      '..............kwwoowkawwwwoowak.',
      '..............kawwwakaawwwwwak..',
      '.............kkaaaaaaaaaaaaaaak.',
      '...........kkaaaaaaaaaaaaaaaaaak',
      '.........kkaaaaaaaaaaaaaaaaaaaak',
      '........kaaaaabbaaaaaaaaaaaaaak.',
      '.......kaabbaaaaaaakaaaaaaaaaak.',
      '......kkkkkkkkaaaaaakaaaaaaaakk.',
      '.....kaabbaaaakkaaaaakkaaaakkrk.',
      '....kaabbaaaaaaakaaaacckkkkrrrk.',
      '...kaaaaaaaabbaakdddddddddkrrk..',
      '...kabbaaaaaabbaakddddddddkkk...',
      '...kaaaaaaaaaaaaakdddkaaak......',
      '...kaaaaabbaaaaaakdddkaaak......',
      '...kaaaaaaaaaaaakddddkaaaak.....',
      '....kaaaaaaaaaakddddddkaaak.....',
      '...kkkkkkkkkkkkddddddkkaaak.....',
      '..kaaaaaaaaaaaaakkkkkkkaaak.....',
      '..kaaaaaaaaaaaaaaak.kkkaaaak....',
      '...kkkkkaaaaaaaaaakkaaaaaaaak...',
      '........kaakaakaak.kakakakaak...',
      '.........kk.kk.kk...k.k.k.kk....',
      '................................',
    ],
  },
  egel: {
    poten: 3,
    palet: { a: '#5e4330', s: '#8a6647', q: '#efe0c0', d: '#ecd3a8', c: '#ecd3a8', e: '#c9a07a', b: '#3b2a20', n: '#15101a', z: '#9fd8ff' },
    rijen: [
      '................................',
      '................k...............',
      '...............kqk..............',
      '...............kqk..............',
      '...............kqk..............',
      '...............kqk..............',
      '...............ksk..............',
      '......k....k...ksk..............',
      '.....kqk..kqk.kassk.............',
      '...k..kqkkkqqkkassk..k.......k..',
      '..kqk.kqqqkqsqqassk.kek.....kzk.',
      '..kqqkkqsqskssqasskkeeek....kzzk',
      '.k.ksqqksskskaskskakeeekk....kk.',
      'kqkkqsqskaqsskaqsskkkekkkk......',
      'kqqqksssskassskassskdkkdddk.....',
      '.ksqskassskassskasskdddddddk....',
      '.kqsqskaskskaskskakdddkwookdk...',
      '.kksqsskaqsskaqsskkdddkwookddk..',
      'kqqkassskassskassskdddkwwwkddk..',
      'kqqskassskassskasskddddkkkdddkk.',
      '.ksqskaskskaskskaskdddddddddknnk',
      '..kssskaqsskaqsskkddddccddddknnk',
      '..kqssskassskassskdddddddddkdkk.',
      '...ksssskassskasskddddddddkdkk..',
      '....kaskskaskskaskdddddddkkk....',
      '.....kaqsskaqsskakdddddkk.......',
      '.....kkkssskassskakdkkk.........',
      '....kbbkkksskassskakk...........',
      '....kbbk..kkkkkkkkk.............',
      '....kbbbk.....kbbbk.............',
      '.....kkk.......kkk..............',
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
      '.........rrrrr..................',
      '..............rr.........kk.....',
      '................r.......kaak.kk.',
      '.................r......kadkkaak',
      '..................r.....kadkkaak',
      '........rr.........r....kadkkaak',
      '...rrrrr..rrrr.....r....kadakaak',
      '.rr...........r....r....kaaaaaak',
      '...............r....r...kaaaaaak',
      '................r...r...kaaaaaak',
      '.................r..r....kaaaak.',
      '.................r..r.....kaak..',
      '..................r.r.....kaak..',
      '...................rr....kaak...',
      'k...................kkkkkaak....',
      'kk..........kkkkkkkkwwwaaaak....',
      'kakkkkkkkkkkkddddddawooaaaak....',
      'kbakddkddkddkadaaaaawooaaaaaak..',
      'kbaaaabaabaakaaaaaaaaaaaaaaakkkk',
      'kbaaaabaabaakaaaaaaaaaaaaaaaaddk',
      'kbaaaabaabaakaaaaaaaaaaaaaaaaaak',
      'kbakaakaakaakaaaaaaaaaaaaaakkkk.',
      'kakkkkkkkkkkkaaaaaaaaaaaaaaaaaak',
      'kk..........kkbkkkkbkkkbkkkkbkk.',
      '.............kbk..kbk.kbk..kbk..',
      '.............kbk..kbk.kbk..kbk..',
      '.............kbk..kbk.kbk..kbk..',
      '............kbk..kbk...kbk..kbk.',
      '............kbk..kbk...kbk..kbk.',
      '............kbk..kbk...kbk..kbk.',
      '.............k....k.....k....k..',
      '................................',
    ],
  },
  hamster: {
    poten: 3,
    palet: { a: '#e89a48', d: '#fbf1dc', e: '#f2b36a', c: '#f7a08a', r: '#f29aa6', g: '#ffd23f', y: '#fff3a8', q: '#c98a12', n: '#15101a' },
    rijen: [
      '................................',
      '............kkk....kkk..........',
      '...........krrak..krrak.........',
      '...........krrak..krrak.........',
      '.........kkkaaakkkkaaakkk.......',
      '.......kkaaaaaaaaaaaaaaaakk.....',
      '......kaaaaaaaaaaaaaaaaaaaak....',
      '.....kaaaaaaaaaaaaaaaaaaaaaak...',
      '....kaaaaaaaaaaaaaaaaawwwaaaak..',
      '...kaaaaaaaaaaaaaaaaaawooaddddk.',
      '...kaaaaaaaaaaaaaaaaaawooaddddrk',
      '..kaaaaaaaaaaaaaaaaaaaaaaddndnrk',
      '..kaaaaaaaaaaaaaaaaakkkkkkddddk.',
      '.kaaaaaaaaaaaaaaaaakeeeeeekkkkkk',
      '.kaaaaaaaaaaaaaaaaakeeeeeeeeeeek',
      'kaaaaaaaaaaaaaaaaakeeeeeeeeeeeek',
      'kaaaaaaaaaaaaaaaaakeeeeeeeeeeeek',
      'kaaaaaaaaaaaaaaaaakeeeeeeeccceek',
      'kaaaaaaaaaaaaaaaaakeeeeeeeccceek',
      'kaaaaaaaaaaaaaaaaakeeeeeeeeeeeek',
      'kaaaaaaaaaaaaaaaaakeeeeeeeeeeeek',
      'kaaaaaaddddddddddakddddddddddddk',
      'kaaadddddddddddddddkddkkkkddddk.',
      '.kadddddddddddddddddkdkyggkddk..',
      '.kdddddddddddddddddkrkgqqgkrk...',
      '..kddddddddddddddddkrkgqqgkrk...',
      '...kdddddddddddddddkkkggggkk....',
      '....kddddddddddddddk..kkkk......',
      '.....kkkkkkkkkkkkkk.............',
      '.....krrrk...krrrk..............',
      '.....krrrrk..krrrrk.............',
      '......kkkk....kkkk..............',
    ],
  },
  nijlpaard: {
    poten: 4,
    palet: { a: '#8e84a8', b: '#6c6386', d: '#d6a3b8', r: '#e79ab2', n: '#3a2c4c', c: '#e79ab2', t: '#fbf7ee', q: '#c95f86', p: '#ffffff', s: '#6fb3d9' },
    rijen: [
      '................................',
      '................................',
      '.....kkkkkkk....................',
      '...kkkpppppk....................',
      '..k..ksssssk.........kkk........',
      '..k..kpppppk....kk..kwwwk.......',
      '...kkkpppppk...krkkkawook.......',
      '....kkkpppkk..kaaaaaawooak......',
      '...kppppppppkkaaaaaaaaaaaakkkkk.',
      '....kkkkkkkkkaaaaaaaaaaaaaanaank',
      '..kkaaaaaaaaaaaaaaaaaaaaaaaaaaak',
      '.kaaaaaaaaaaaaaabaaaccaaaaaaaaak',
      'kaaaaaaaaaaaaaaabaaaccaaaaaaaaak',
      'kaaaaaaaaaaaaaabaaaaaaaaaaaaaaak',
      'kaaaaaaaaaaaaaabaaakkaaaaaaaaaak',
      'kaaaaaaaaaaaaaaaaaaakkkkkkkkkkkk',
      'kaaaaaaaaaaaaaaaaaaakqqqqqqqqqqk',
      'kaaaaaaaaaaaaaaaaaaakqqqqqqqqqqk',
      'kaaaaaaaaaaaaaaaaaaaakqttqqqttqk',
      'kaaaaaaaaaaaaaaaaaaaaakttqqqttqk',
      'kaaaaaaaaaaaaaaaaaaaaakkkkkkkkkk',
      'kaaaaaaaaaaaaaaaaaaaddddddddddk.',
      '.kaaaaaaaaaaaaaaaadddddddddddk..',
      '.kaadddddddddddddddddddddkkkk...',
      '.kdddddddddddddddddddddddk......',
      '.kdddddddddddddddddddddddk......',
      '..kdddddddddddddddddddddk.......',
      '..kbbbkkkbbbkkkbbbkkkbbbk.......',
      '..kbbbk.kbbbk.kbbbk.kbbbk.......',
      '..kbbbk.kbbbk.kbbbk.kbbbk.......',
      '..kbttk.kbttk.kbttk.kbttk.......',
      '...kkk...kkk...kkk...kkk........',
    ],
  },
  giraf: {
    poten: 10,
    palet: { a: '#f2c14e', s: '#a8582a', b: '#a0602a', d: '#f7dd9a', c: '#f2c14e', n: '#15101a', h: '#6b3f1c', u: '#6a4c9c' },
    rijen: [
      '.....................k.k........',
      '....................khkhk.......',
      '...................kkakak.......',
      '..................kakaaaakk.....',
      '.................kaaaskkkaakk...',
      '..................khaawooaadnk..',
      '.................khhaawooaddddk.',
      '.................khaacaaaddkkkuk',
      '................khhssasadddddkuk',
      '................khassakkkkkkkuuk',
      '...............khhaaak......kuk.',
      '...............khsssak.......k..',
      '..............khhsssak..........',
      '.........kkkkkkhsaaaak..........',
      '.....kkkksasssasssassk..........',
      '....ksasssasssasssassk..........',
      '..kksaaaaasaaaaaaaaaak..........',
      '.kaaasssasssassasssask..........',
      '.kaassssasssassasssask..........',
      '.kakasaaaaaaassaaaasak..........',
      'khhhkasssaassaassassk...........',
      '.kkssasksasskaasskassk..........',
      '...kaak.ksak.ksak.ksak..........',
      '...kask.kssk.ksak.kask..........',
      '...kaak.kaak.kaak.kaak..........',
      '...kaak.kaak.kaak.kaak..........',
      '...kaak.kaak.kaak.kaak..........',
      '...kaak.kaak.kaak.kaak..........',
      '...khhk.khhk.khhk.khhk..........',
      '...khhk.khhk.khhk.khhk..........',
      '....kk...kk...kk...kk...........',
      '................................',
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
    poten: 9,
    palet: { a: '#d6a462', b: '#9a6c3c', d: '#e8c48c', c: '#d6a462', n: '#15101a', h: '#7a5630', g: '#d9c24a' },
    rijen: [
      '.....................kkk........',
      '....k.k.............kbbbkkk.....',
      '...kbkbkk.....k.k...kbbakakk....',
      '....kbbbbk...kbkbk..kkabbbkak...',
      '...kbbbbbk...kbbbk.kaaawooadnk..',
      '..kbbbbbbbk.kbbbbbk.kkawooddddk.',
      '.kbbbbbbbbbkbbbbbbbk..kacaddddk.',
      '.kbbbbbbbbbkbbbbbbbk..kaadkkkkgk',
      '.kbbbbbbbbbkbbbbbbbkk.kaadddddgk',
      '.kbbbbbbbbbabbbbbbbaakkaaadddkk.',
      '.kabaabaabaabaabaabaaakaaaakk...',
      'kabaaabaaabaaabaaabaabaaaaak....',
      'kaaaaaaaaaaaaaaaaaaaaabbaaak....',
      'kaaaaaaaaaaaaaaaaaaaaabaaaak....',
      'kaaaaaaaaaaaaaaaaaaaakbbbbk.....',
      'kaaaaaaaaaaaaaaaaaaaakbbbbk.....',
      'kbbbbbaaaaaaaaaaaaaaakbkbk......',
      'kbbbbbaaaaaaabbbbaabbkk.k.......',
      '.kbbbkkkaakkkkbbkkkkbbk.........',
      '.kaak..kaak..kaak..kaak.........',
      '.kaak..kaak..kaak..kaak.........',
      '.kaak..kaak..kaak..kaak.........',
      '.kaak..kaak..kaak..kaak.........',
      '.kaak..kaak..kaak..kaak.........',
      '.kbbbk.kbbbk.kbbbk.kbbbk........',
      '.kaak..kaak..kaak..kaak.........',
      '.kaak..kaak..kaak..kaak.........',
      '.kaak..kaak..kaak..kaak.........',
      '.khhhk.khhhk.khhhk.khhhk........',
      '.khhhk.khhhk.khhhk.khhhk........',
      '..kkk...kkk...kkk...kkk.........',
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
    poten: 4,
    palet: { a: '#e0303c', g: '#3fae4a', t: '#2f7fd8', y: '#f5c518', v: '#3fae4a', d: '#fbfaf5', b: '#6a6a6a', c: '#e0303c', n: '#2a2020', w: '#ffe27a' },
    rijen: [
      '................................',
      '................................',
      '.................kkkkkk.........',
      '...............kkaaaaaakk.......',
      '..............kaaaaaaaaakkkk....',
      '.............kaaaaadddddnnnnk...',
      '.............kaaaaddwwddnnnnnk..',
      '.............kaaaadwoowdnnnnnk..',
      '.............kaaaadwoowdnnnknk..',
      '.............kaccaddwwddnnk.k...',
      '............kaaaaadddddkkk......',
      '............kaaaaaaaaaak........',
      '...........kaaaaaaaaaaak........',
      '..........kavvvaaaaaaaaak.......',
      '.........kavvvvvaaaaaaaak.......',
      '.........kvvvvvvaaaaaaaak.......',
      '........kvvvvvvvaaaaaaaak.......',
      '........kvvvvvvvvaaaaaaak.......',
      '........kvvvvvvvvaaaaaaak.......',
      '.......ktvvvvvvvvaaaaaak........',
      '......kttgvvvvvvvaaaaaak........',
      '.....kttggavvvvvaaaaaaak........',
      '....kttggyaavvvvaaaaaaak........',
      '...kttggyaaaavvaaaaaaak.........',
      '..kttggyaakaaaaaaaaaaak.........',
      '.kttggyaak.kaaaaaaaaak..........',
      'kttggyaak...kaaaaaaaak..........',
      'kkkkkkkk.....kkkkkkkk...........',
      '.............kbk..kbk...........',
      '............kbbbk.kbbbk.........',
      '............kbkbk.kbkbk.........',
      '.............k.k...k.k..........',
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
    poten: 3,
    palet: { a: '#ab9b8c', b: '#7f6f62', d: '#f4ede2', r: '#f4a7b9', c: '#f4a7b9', n: '#15101a', t: '#ffffff' },
    rijen: [
      '......................kkkk......',
      '.....................kaaaak.....',
      '.....................karrak.....',
      '...........kkkkkkkk..karrak.....',
      '..........kaaaaaaaak.karrak.....',
      '..........kaaakkaaak.karrak.....',
      '..........kaak.karak.karrak.....',
      '...........kak.karak.karrak.....',
      '............k..karak.karrak.....',
      '...............kaaaakkaaaak.....',
      '...............kaaaaaaaaaaak....',
      '..............kaaaaaaaakkkaak...',
      '......kkkkkk..kaaaaaaaawwwaaak..',
      '....kkaaaaaakkkaaaaaaawwoowaaak.',
      '...kaaaaaaaaaakaaaaaaawwoowaddrk',
      '.kkkaaaaaaaaaakaaaaccaawwwaddddk',
      'ktttkaaaaaaaaaaaaaaccaaaaadddkk.',
      'kttttkaaaaaaaaaaaaaaaaaaaadkttk.',
      'kttttkaaaaaaaaaaaaaaaaaaaadkttk.',
      'kttttkaaaaaaaaaaaaaaaaaaaddkkkk.',
      'ktttkaaabbbbaaaaaaaddddddkk.....',
      '.kkkaaabaaaabaaaadddddddk.......',
      '.kaaaabaaaaaabaaddddddddk.......',
      '.kaaabaaaaaaaaaaddddddddk.......',
      '.kaaabaaaaaaaaaaddddddddk.......',
      '.kaabaaaaaaaaaaaaddddddk........',
      '.kaabaaaaaaaaaaaaadddddk........',
      '.kaaaaaaaaaaaaaadddkdddk........',
      '.kaaaakkkkkkkkkkkkkkdddk........',
      '.kaaaaaaaaaaaaaddk.kdddk........',
      '.kaaaaaaaaaaaaaddk.kddddk.......',
      '..kkkkkkkkkkkkkkk...kkkkk.......',
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
      '.......................kkkkk....',
      '......................kaaaaak...',
      '.....................kaaaaaaak..',
      '....................kaaaawwwaak.',
      '....................kaaaawooaak.',
      '...................kaaaaawooaaak',
      '...................kaaaaccaaaaak',
      '....................kaaaaaaakkk.',
      '....................kaaaaaaaaak.',
      '.....................kaaaaaaak..',
      '.....................kbbbbbbk...',
      '.....................kaaaaaak...',
      '.....................kaaaaaak...',
      '.......kkkkkk........kbbbbbbk...',
      '.....kkaabaaakk......kaaaaaak...',
      '....kbaaabaaabak....kaaaaaaak...',
      '...kabaaabaaabaak...kbbbbbbbk...',
      '..kaabaaabaaabaaak.kkaaaaaaak...',
      '.kaabaaaabaaabaaabkaaaaaabak....',
      '.kaabaakkkaaabaaabaaabaabbak....',
      'kaaabak...kaabaaabaaababbak.....',
      '.kaabk.....kaaaaabaaababaak.....',
      '.kaak.......kaaaabaaabaaak......',
      '..kk.........kaaabaaabaak.......',
      '..............kkaaaaabkk........',
      '................kkkkkk..........',
      '................................',
    ],
  },
  eekhoorn: {
    poten: 4,
    palet: { a: '#c8642a', b: '#8a4218', d: '#f3d9b4', c: '#f3d9b4', n: '#15101a', s: '#e07a3a' },
    rijen: [
      '................................',
      '..........k.....................',
      '.......kkkakkk......k...........',
      '......kaaaaaaak....ksk..........',
      '.....kaaaasaaaak...kak..........',
      '....kaasssssssaak..kaak.........',
      '....kaasssssssaak..kabak........',
      '...kaaaaaasaaaaaak.kabaakk......',
      '..kaassssaaaaaaaakkkkkkkaakk....',
      '.kaaassssaaakkkaakaaaaaaaaaak...',
      '.kaaassssaak...kkkaaaaaaaaaak...',
      '.kaaassssaak.....kaaaaaaawoaak..',
      '.kaaassssaak.....kaaaaaaaooaaak.',
      '.kaaassssaaak....kaaaaaadooddan.',
      '.kaaassssaaaak..kkaaaaadddddddk.',
      '..kaassssaaaak..kakkaaadccdddk..',
      '..kaasssssaaak.kaaaakkkkkkkkk...',
      '.kaasssssssaaakaaaaaaddddk......',
      '.kaasssssssaaakaaaaaaddddkk.....',
      '.kaasssssssaaakaaaaaadddkaak....',
      'kaaasssssssaakkaaaaaadddkaak....',
      '.kaasssssssakakaaaaaaddddkk.....',
      '.kaaasssssakaakaaaaaaddddk......',
      '.kaaaasssakaaakaaaaaaddddk......',
      '..kaaaasaakaaaakaaaaadddk.......',
      '..kaaaaaaakaaaaakaaaaadk........',
      '...kkaaaaaakaaaakaaaaadk........',
      '.....kkkkkk.kkkkkkkkkkkkk.......',
      '...........kbbbbbbbk.kbbbk......',
      '...........kbbbbbbbk.kbbbk......',
      '............kkkkkkk...kkk.......',
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
  /** Blije ogen: een boogje (^^) in plaats van een streepje. */
  ogenBlij: Laag;
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
  const ogenBlij: Pixel[] = [];
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
    // Blij: het ooglid dicht, met een boogje erin dat aan de zijkanten omlaag
    // loopt (^^). Hoe breder het oog, hoe hoger de boog (hooguit twee pixels).
    // Een smal oog krijgt de uiteinden van de boog ernaast, op de kop.
    // Loopt het wit van het oog over in een lichte vlek op de kop (de witte
    // snoet van de pinguïn), dan hoort het bij het gezicht: dat blijft wit, en
    // het boogje komt over de pupil.
    const wit = sprite.palet.w ?? '#f4f1ea';
    const groot =
      pupil.length > 0 &&
      klont.some((p) =>
        [[p.x - 1, p.y], [p.x + 1, p.y], [p.x, p.y - 1], [p.x, p.y + 1]].some(([x, y]) => {
          const t = at(x, y);
          return !rand(t) && !oogLetter(t) && t !== 'c' && helderheid(kleur(t)) > 0.8;
        }),
      );
    const boogOver = groot ? pupil : klont;
    const smal = Math.max(...boogOver.map((p) => p.x)) - Math.min(...boogOver.map((p) => p.x)) < 3;
    const links = Math.min(...boogOver.map((p) => p.x)) - (smal ? 1 : 0);
    const rechts = Math.max(...boogOver.map((p) => p.x)) + (smal ? 1 : 0);
    const boogOnder = Math.max(...boogOver.map((p) => p.y));
    const hoog = Math.min(2, boogOnder - Math.min(...boogOver.map((p) => p.y)));
    const boog = new Set<string>();
    for (let x = links; x <= rechts; x++) boog.add(`${x},${boogOnder - Math.min(x - links, rechts - x, hoog)}`);
    const inOog = new Set(klont.map((p) => `${p.x},${p.y}`));
    // Het ooglid is de kleur die het meest rond het oog zit (bij de wasbeer
    // het masker, niet de witte vacht erboven). Op een donkere kop is een
    // donker boogje onzichtbaar; daar wordt het licht, in het wit van het oog.
    const telling = new Map<string, number>();
    for (const p of klont) {
      for (const [x, y] of [[p.x - 1, p.y], [p.x + 1, p.y], [p.x, p.y - 1], [p.x, p.y + 1]]) {
        const t = at(x, y);
        if (inOog.has(`${x},${y}`) || rand(t) || oogLetter(t)) continue;
        telling.set(t, (telling.get(t) ?? 0) + 1);
      }
    }
    const meest = [...telling].sort((a, b) => b[1] - a[1])[0]?.[0];
    const blijLid = groot ? wit : meest ? kleur(meest) : kleur('a');
    const boogKleur = helderheid(blijLid) < 0.3 ? wit : palet.k;
    for (const p of klont) ogenBlij.push({ ...p, kleur: boog.has(`${p.x},${p.y}`) ? boogKleur : blijLid });
    for (const plek of boog) {
      const [x, y] = plek.split(',').map(Number);
      if (!inOog.has(plek) && !rand(at(x, y)) && !oogLetter(at(x, y))) ogenBlij.push({ x, y, kleur: boogKleur });
    }
    const laatste = pupil.at(-1);
    if (laatste) oog = { x: Math.floor(laatste.x / SCHAAL), y: Math.floor(laatste.y / SCHAAL) };
  }

  // Vleugel op: hij klapt omhoog. Van opzij zie je hem korter, en hij helt
  // naar achteren (de kop wijst naar rechts); een dier dat je van voren ziet
  // (de uil) slaat twee vleugels naar buiten uit. Hij krijgt zijn eigen licht,
  // schaduw en randje, ook waar hij voor het lijf langs gaat: anders is het een vlek.
  const vorm = new Set<string>();
  const paren = klonten(vleugel);
  const midden = vleugel.reduce((som, p) => som + p.x, 0) / (vleugel.length || 1);
  for (const klont of paren) {
    const top = Math.min(...klont.map((p) => p.y));
    const eigen = klont.reduce((som, p) => som + p.x, 0) / klont.length;
    const uit = paren.length > 1 ? (eigen < midden ? -1 : 1) : -0.5;
    for (const p of klont) {
      const d = Math.floor((p.y - top) * 0.6);
      const x = p.x + Math.trunc(d * uit);
      const y = top - 1 - d;
      if (x >= 0 && x < MAAT && y >= 0) vorm.add(`${x},${y}`);
    }
  }
  const inVorm = (x: number, y: number) => vorm.has(`${x},${y}`);
  const vleugelOp: Pixel[] = [...vorm].map((k) => {
    const [x, y] = k.split(',').map(Number);
    const basis = kleur('v');
    const tint = !inVorm(x, y - 1) ? licht(basis, 0.28) : !inVorm(x, y + 1) ? schaduw(basis, 0.22) : basis;
    return { x, y, kleur: tint };
  });
  const randje = new Map<string, Pixel>();
  for (const p of vleugelOp) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = p.x + dx;
      const y = p.y + dy;
      if (x < 0 || y < 0 || x >= MAAT || inVorm(x, y)) continue;
      randje.set(`${x},${y}`, { x, y, kleur: randKleur(kleur('v')) });
    }
  }
  vleugelOp.unshift(...randje.values());

  // Lopen: om en om de helft van de poten optillen. De hele poot gaat
  // omhoog, zodat de voet een voet blijft; wat dan in het lijf zou steken
  // valt weg. Vroeger ging de onderkant eraf, en dan verdween een korte voet.
  const groepen = potenGroepen(poten);
  const stap = (even: boolean) =>
    groepen.flatMap((g, i) => {
      if ((i % 2 === 0) !== even) return g;
      const boven = Math.min(...g.map((p) => p.y));
      const til = Math.min(SCHAAL, Math.max(...g.map((p) => p.y)) - boven);
      return g.map((p) => ({ ...p, y: p.y - til })).filter((p) => p.y >= boven);
    });

  const lagen: Lagen = {
    lijf: alsLaag(lijf),
    ogenOpen: alsLaag(ogenOpen),
    ogenDicht: alsLaag(ogenDicht),
    ogenBlij: alsLaag(ogenBlij),
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

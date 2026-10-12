/*
 * Everything the reel shows, in order. index.html draws it and audio.js scores it,
 * so both read the timing from here and can never drift apart.
 *
 * The news is told as the "BJ Journaal", hosted by the maatjes: the quiz's own pixel
 * animals. Every headline gets a picture (a drawn scene, `beeld`, unless `media`
 * points at a photo or a clip in media/; see README.md), a sticker headline and an
 * animal that reacts to it.
 *
 * The film counts in beats, not seconds. A month is a two-beat calendar sting plus
 * its headlines, rounded up to whole two-bar phrases, so every cut lands on a beat
 * and every month on a downbeat of the song.
 *
 * October–December hold placeholders until the news is in. As long as a month has
 * only placeholders it folds into one short "nog in de maak" gag, so the film never
 * shows a test card for long.
 *
 * Spoiler rule: nothing here may answer, or hint at, a quiz question. The quiz is in
 * app/src/lib/content/packs.ts. Its news topics (the cabinet, the Winter Games, the
 * moon flight, the World Cup, the Songfestival winner, the Tour, Formula 1, the big
 * films, the New Year's fireworks damage and the January snow) stay out of the reel.
 */
(function (root) {
  const BPM = 124;             // the tempo of the synthesized score
  const B = 60 / BPM;
  const BAR = 4 * B;

  const MAANDEN = ['JANUARI', 'FEBRUARI', 'MAART', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AUGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DECEMBER'];

  /*
   * The news. m: month (0 = January). tag: 'NL' or 'WERELD'.
   *   beeld    the sketch that tells it (film/schetsen.js): every headline is its own
   *            little cartoon, acted out by the maatjes, with the headline worked into it
   *            (a scoreboard, a karaoke screen, a cake, a departure board, falling letters)
   *   maatje   the animal that plays the lead (a key from maatjes.js)
   *   zegt     a speech bubble, only where it is the punchline
   *   overgang how the picture gets here from the headline before: snede (a cut on the
   *            beat, the default), zweep (a whip pan), iris or wis (a giant animal runs across)
   *   ernstig  serious news: no gag, no bouncing, plain type, and the music drops back
   *   media    optional { foto: 'x.jpg' } or { video: 'x', frames, fps }, plus bron (credit);
   *            a headline with media (or a beeld without a sketch) is shown as a picture
   *            with a sticker headline, and its maatje does `doet` and says `zegt`
   */
  const NIEUWS = [
    { m: 0, tag: 'NL', datum: '3 januari', beeld: 'darts', maatje: 'egel', kop: 'Van Veen gooit tot in de WK-finale', sub: 'Als derde Nederlander ooit staat hij in de eindstrijd. Luke Littler is net te sterk.' },
    { m: 0, tag: 'NL', datum: '13 januari', beeld: 'nachtwacht', maatje: 'wasbeer', overgang: 'zweep', kop: 'De Nachtwacht gaat uit de vernis', sub: 'In een glazen kamer halen restauratoren de oude laag eraf. Heel Nederland kijkt mee.' },
    { m: 0, tag: 'WERELD', datum: '17 – 21 januari', beeld: 'groenland', maatje: 'zeehond', kop: 'Trump wil Groenland', sub: 'Hij dreigt Europa met heffingen, ook Nederland. In Davos praat Rutte hem eruit.' },

    { m: 1, tag: 'NL', datum: '27 februari', beeld: 'concert', maatje: 'kikker', kop: 'Heel Nederland zingt Cheerio', sub: 'Justen de Wildt uit Veenendaal scoort dé meezinger van het jaar.' },
    { m: 1, tag: 'WERELD', datum: '17 februari', beeld: 'vuurpaard', maatje: 'eenhoorn', kop: 'Het jaar van het vuurpaard', sub: 'De Chinese kalender begint aan een zeldzaam jaar. Het vuurpaard komt maar eens in de zestig jaar langs.' },
    { m: 1, tag: 'WERELD', datum: '28 februari', beeld: 'iran', ernstig: true, kop: 'Oorlog met Iran', sub: 'Amerikaanse en Israëlische aanvallen doden de opperste leider. Nederlanders stranden in het Golfgebied.' },

    { m: 2, tag: 'NL', datum: '18 maart', beeld: 'stemmen', maatje: 'octopus', kop: 'Lokale partijen blijven de baas', sub: 'Bij de gemeenteraadsverkiezingen blijven de lokale partijen samen de grootste.' },
    { m: 2, tag: 'NL', datum: '26 maart', beeld: 'pro', maatje: 'papegaai', zegt: 'PRO! PRO! PRO!', overgang: 'zweep', kop: 'GroenLinks-PvdA heet voortaan Pro', sub: 'Progressief Nederland, met een groene roos als logo.' },
    { m: 2, tag: 'WERELD', datum: 'maart', beeld: 'tanker', maatje: 'kameel', kop: 'Hormuz dicht, tanken onbetaalbaar', sub: 'De oorlog sluit de zeestraat. Aan de pomp betaalt Nederland recordprijzen.' },

    { m: 3, tag: 'NL', datum: '5 april', beeld: 'kampioen', maatje: 'zeehond', kop: 'PSV kampioen, vroeger dan ooit', sub: 'De derde titel op rij is al in april binnen.' },
    { m: 3, tag: 'WERELD', datum: '12 april', beeld: 'boedapest', maatje: 'lama', kop: 'Orbán valt', sub: 'Na jaren aan de macht verliest hij de Hongaarse verkiezingen van Péter Magyar.' },
    { m: 3, tag: 'NL', datum: '27 april', beeld: 'koningsdag', maatje: 'giraf', overgang: 'wis', kop: 'Koningsdag in Dokkum', sub: 'De koninklijke familie viert feest in Friesland, waar de koning ooit de Elfstedentocht schaatste.' },

    { m: 4, tag: 'NL', datum: '2 mei', beeld: 'mol', maatje: 'das', kop: 'Daan Boom is de Mol', sub: 'Bram Krikke ontmaskert zijn eigen vriend en gaat er met de pot vandoor.' },
    { m: 4, tag: 'WERELD', datum: '13 mei', beeld: 'chip', maatje: 'hamster', overgang: 'iris', kop: 'Nvidia: rijkste bedrijf ooit', sub: 'Nog nooit was een bedrijf zoveel waard als de chipmaker achter de AI-koorts.' },
    { m: 4, tag: 'NL', datum: '18 mei', beeld: 'schiphol', maatje: 'luiaard', overgang: 'zweep', kop: 'Urenlange rijen op Schiphol', sub: 'De nieuwe beveiliging loopt vast. Honderden reizigers missen hun vlucht.' },

    { m: 5, tag: 'NL', datum: '26 juni', beeld: 'hitte', maatje: 'pinguin', kop: 'Code rood voor hitte', sub: 'Voor het eerst waarschuwt het KNMI voor hitte met code rood. Limburg puft het hardst.' },
    { m: 5, tag: 'NL', datum: '17 – 19 juni', beeld: 'japan', maatje: 'eekhoorn', kop: 'Keizer van Japan op bezoek', sub: 'Keizer Naruhito plant een kersenboom in het Amsterdamse Bos.' },
    { m: 5, tag: 'WERELD', datum: '22 juni', beeld: 'downing', maatje: 'krokodil', kop: 'Starmer stapt op', sub: 'De Britse premier vertrekt na een zware nederlaag bij de lokale verkiezingen.' },

    { m: 6, tag: 'NL', datum: '1 juli', beeld: 'trekkers', maatje: 'kip', kop: 'Trekkers op de Koekamp', sub: 'Boeren rijden naar Den Haag uit protest tegen de nieuwe stikstofplannen.' },
    { m: 6, tag: 'WERELD', datum: '3 juli', beeld: 'bruiloft', maatje: 'flamingo', kop: 'Taylor Swift trouwt', sub: 'Met Travis Kelce, in Madison Square Garden. Adam Sandler leidt de ceremonie.' },
    { m: 6, tag: 'WERELD', datum: '4 juli', beeld: 'amerika', maatje: 'aap', overgang: 'zweep', kop: 'Amerika wordt 250', sub: 'Tweehonderdvijftig jaar na de onafhankelijkheid staat het land in vuur en vlam.' },

    { m: 7, tag: 'WERELD', datum: '12 augustus', beeld: 'zon', maatje: 'uil', kop: 'Het wordt even nacht', sub: 'Een totale zonsverduistering trekt over Spanje en IJsland.' },
    { m: 7, tag: 'NL', datum: 'augustus', beeld: 'atletiek', maatje: 'kangoeroe', kop: 'Goudregen op het EK atletiek', sub: 'Visser, Schilder, Nillessen en Bol: het beste EK ooit voor Nederland.' },
    { m: 7, tag: 'NL', datum: '27 augustus', beeld: 'zomer', maatje: 'nijlpaard', overgang: 'iris', kop: 'Warmste zomer ooit gemeten', sub: 'Het oude record uit 2018 sneuvelt ruim. En het is ook nog eens kurkdroog.' },

    { m: 8, tag: 'NL', datum: '9 september', beeld: 'staking', maatje: 'slak', kop: 'Geen trein, bus of tram', sub: 'Een landelijke ov-staking tegen de bezuinigingen legt het land een dag stil.' },
    { m: 8, tag: 'NL', datum: '10 september', beeld: 'amalia', maatje: 'dolfijn', kop: 'Amalia gaat bij de marine', sub: 'Na de luchtmacht begint de kroonprinses in Den Helder bij de Koninklijke Marine.' },
    { m: 8, tag: 'NL', datum: '26 september', beeld: 'wielrennen', maatje: 'hond', overgang: 'zweep', kop: 'Vollering wereldkampioen', sub: 'In Montréal verovert Demi Vollering de regenboogtrui.' },

    // October to December: placeholders until the news is in. Replace one with a real item.
    ...[9, 10, 11].flatMap(m => [0, 1, 2].filter(k => !(m === 11 && k === 2)).map(k => ({ m, tag: k === 1 ? 'WERELD' : 'NL', datum: MAANDEN[m].toLowerCase(), beeld: 'testbeeld', placeholder: true, kop: 'Nieuws volgt', sub: `Plek ${k + 1} van ${MAANDEN[m].toLowerCase()}: nog in te vullen.` }))),
    { m: 11, tag: 'NL', datum: '31 december', beeld: 'vuurwerk', maatje: 'hond', kop: 'Oud en nieuw zonder vuurwerk', sub: 'Vanavond geldt voor het eerst het landelijke vuurwerkverbod. Sterretjes mogen nog.' },
  ];

  /*
   * The sketches' timing, here so the sound (audio.js) hits the same frames as the
   * picture (film/schetsen.js). tel: how many beats the sketch wants (more if the song
   * is fast, so it stays readable); rek: it can take spare beats (its action fills any
   * length); m: its moments, in beats from the start; klank: the sounds, as [moment or
   * beat, sound, loudness] (sounds are in GELUID in audio.js). A month's sketches add up
   * to whole bars (two beats of opening plus 14, 18 or 22), so nothing is padded.
   */
  const SCHETS = {
    darts: { tel: 6, m: { gooi: 0.5, raak: 1.5, twee: 2, drie: 2.5, score: 3 }, klank: [['gooi', 'zwiep'], ['raak', 'tok', 1.3], ['twee', 'tok'], ['drie', 'tok'], ['score', 'airhorn']] },
    nachtwacht: { tel: 6, m: { v1: 0.5, v2: 1.5, v3: 2.5, glans: 3.5 }, klank: [['v1', 'veeg'], ['v2', 'veeg'], ['v3', 'veeg'], ['glans', 'ping']] },
    groenland: { tel: 6, m: { zak: 0.25, grijp: 1.25, op: 1.5, glip: 3, plons: 3.5 }, klank: [['zak', 'zoem'], ['grijp', 'klak', 1.2], ['op', 'zoem'], ['glip', 'fluit-neer'], ['plons', 'plons']] },
    concert: { tel: 6, rek: true, m: { w0: 0, w1: 1, w2: 2, w3: 3, juich: 4 }, klank: [['w1', 'plop'], ['w2', 'plop'], ['w3', 'plop'], ['juich', 'juichen', 1.2], ['juich', 'toeter']] },
    vuurpaard: { tel: 4, m: {}, klank: [[0, 'galop'], [0.2, 'vuur']] },
    iran: { tel: 4, rek: true, m: {}, klank: [] },
    stemmen: { tel: 4, m: { groei: 0.5, door: 2 }, klank: [['groei', 'fluit-op'], ['door', 'glas', 1.2]] },
    pro: { tel: 4, m: { trek: 0.5, plak: 1.75 }, klank: [['trek', 'rip'], ['plak', 'pets', 1.2], [2.1, 'kwek']] },
    tanker: { tel: 6, m: { stop: 0.75, tank: 1, z1: 2, z2: 2.5, z3: 3, schrik: 3.5, til: 4, weg: 4.5 }, klank: [[0, 'zwiep'], ['stop', 'plof'], ['tank', 'teller'], ['z1', 'dun'], ['z2', 'dun', 1.1], ['z3', 'dunnn', 1.2], ['schrik', 'boing'], ['til', 'fluit-op'], ['weg', 'stap'], [5, 'stap'], [5.5, 'stap']] },
    kampioen: { tel: 4, m: { vlieg: 0.25, vang: 1, feest: 1.75 }, klank: [['vlieg', 'zwiep'], ['vang', 'ping'], ['feest', 'applaus'], ['feest', 'toeter']] },
    boedapest: { tel: 4, m: { val: 0.5, stap: 0.2 }, klank: [] },
    koningsdag: { tel: 6, rek: true, m: {}, klank: [[0.5, 'toeter'], [2, 'juichen']] },
    mol: { tel: 6, m: { s1: 1.5, s2: 2, s3: 2.5, rood: 3.5 }, klank: [['s1', 'piep'], ['s2', 'piep'], ['s3', 'piep'], ['rood', 'zoemer', 1.2]] },
    chip: { tel: 6, m: { top: 3 }, klank: [[0, 'fluit-op'], ['top', 'kassa']] },
    schiphol: { tel: 6, rek: true, m: { u1: 1, u2: 2, u3: 3, stap: 4, dicht: 4.75 }, klank: [[0.1, 'tiktak'], ['u1', 'zwiep'], ['u2', 'zwiep'], ['u3', 'zwiep'], ['u3', 'snurk'], ['stap', 'pets', 1.2], ['stap', 'juichen'], ['dicht', 'bam', 1.2], [5.25, 'trombone']] },
    hitte: { tel: 4, m: { barst: 2 }, klank: [[0, 'sis'], ['barst', 'glas', 1.3], [2.75, 'plof']] },
    japan: { tel: 6, rek: true, m: { plant: 0.5, bloei: 3.5 }, klank: [['plant', 'plop'], [1, 'fluit-op'], ['bloei', 'ping'], ['bloei', 'boing']] },
    downing: { tel: 4, m: { open: 0.5, dicht: 2.75 }, klank: [['open', 'kraak'], [1, 'stap'], [1.5, 'stap'], [2, 'stap'], ['dicht', 'bam', 1.3]] },
    trekkers: { tel: 6, rek: true, m: {}, klank: [[0.5, 'toet'], [1.75, 'toet'], [3, 'tuut', 1.2]] },
    bruiloft: { tel: 4, m: { gooi: 0.5, top: 1.5, vang: 2.5 }, klank: [['gooi', 'zwiep'], ['vang', 'ping'], ['vang', 'juichen']] },
    amerika: { tel: 4, m: { aan: 0.25, blaas: 2, boem: 2.5 }, klank: [['aan', 'teller'], ['blaas', 'blaas'], ['boem', 'vuurwerk', 1.2]] },
    zon: { tel: 6, rek: true, m: { nacht: 3 }, klank: [] },
    atletiek: { tel: 4, rek: true, m: { h1: 1, h2: 2.5 }, klank: [['h1', 'boing'], ['h2', 'boing'], [0.5, 'ping'], [1.5, 'ping'], [2, 'ping'], [3, 'ping']] },
    zomer: { tel: 4, m: { k1: 0.25, k2: 0.75, k3: 1.25, los: 2, stekker: 2.5 }, klank: [['k1', 'klak'], ['k2', 'klak'], ['k3', 'klak', 1.3], ['los', 'propeller'], ['stekker', 'plop'], [3, 'trombone', 0.8]] },
    staking: { tel: 6, rek: true, m: { flap: 0.25, slak: 3.5 }, klank: [['flap', 'flap'], ['slak', 'toet']] },
    amalia: { tel: 4, m: { smash: 1, plons: 2.5 }, klank: [['smash', 'glas', 1.3], ['plons', 'plons']] },
    wielrennen: { tel: 4, rek: true, m: { finish: 2.5 }, klank: [[0, 'bel'], ['finish', 'flits', 1.2]] },
    vuurwerk: { tel: 6, rek: true, m: {}, klank: [[0.1, 'sis'], [3.5, 'snurk']] },
  };
  // the moments of a headline's sketch, in beats
  const momenten = it => (SCHETS[it.beeld] && SCHETS[it.beeld].m) || {};
  // how each month opens, in turn: a different trick every time
  const STINGS = ['kalender', 'neon', 'stempel', 'trein', 'val', 'vliegtuig', 'opblaas', 'typ', 'stempel', 'neon', 'trein', 'kalender'];

  // For the in-memoriam card, which follows the months.
  const MEMORIAM = [
    { naam: 'Robert Jensen', wie: 'presentator' },
    { naam: 'Sonja Barend', wie: 'talkshowkoningin' },
    { naam: 'Marjan Minnesma', wie: 'klimaatstrijder' },
    { naam: 'Lieke Marsman', wie: 'dichter' },
    { naam: 'Wim T. Schippers', wie: 'kunstenaar' },
    { naam: 'Jerney Kaagman', wie: 'zangeres' },
  ];

  /*
   * Music. Put your songs in muziek/ and list them here: each one plays under a
   * chapter of the film, from scene `van` up to and including scene `tot` (scene
   * names as in the sequence below; a month name also finds a folded month). The
   * film follows the song: that chapter runs at the song's tempo, so every cut lands
   * on its beat. `node muziek.js tempo` finds the hook of each song (the loudest
   * stretch that starts with a jump, nearly always the chorus) and starts it there,
   * on the chapter's first downbeat.
   *
   *   vanaf:   start from the first downbeat after this time (seconds); 'auto' or left
   *            out: the hook
   *   tel:     start exactly here (seconds, on a downbeat); with bpm, skips the measuring
   *   voor:    bars of the song to play before the chapter, muffled, as if from far away
   *   db:      in dB, on top of the automatic levelling
   *   lowpass: muffle the chapter above this many Hz
   *   uit:     how it leaves: echo, spin (a backspin), stop (a tape stop), fade or stil
   *            (dead quiet on the last beat); left out, the mixer picks one
   *
   * The same song may play under two chapters. Only songs released in 2026. A chapter
   * without a file uses the synthesized score.
   */
  const MUZIEK = [
    // only songs released in 2026: the year's Dutch Top 40 number ones and the Dutch hit of the year
    { bestand: 'mr-know-it-all.mp3', van: 'TWEEDUIZEND ZESENTWINTIG', tot: 'HET JAAR IN BEELD', voor: 2 }, // Teddy Swims: comes out of the tv, drops on 2026
    { bestand: 'i-just-might.mp3', van: 'JANUARI', tot: 'APRIL' },                                        // Bruno Mars, #1 jan–apr
    { bestand: 'dai-dai.mp3', van: 'MEI', tot: 'AUGUSTUS' },                                              // Shakira & Burna Boy, #1 all summer
    { bestand: 'fever-dream.mp3', van: 'SEPTEMBER', tot: 'DECEMBER' },                                    // Alex Warren
    { bestand: 'fever-dream.mp3', van: 'IN MEMORIAM', tot: 'IN MEMORIAM', vanaf: 1.5, db: -7, lowpass: 6000, uit: 'fade' }, // its quiet opening, warm
    { bestand: 'cheerio.mp3', van: 'HET DOSSIER', tot: 'DE QUIZ' },                                       // Justen de Wildt: goodbye, 2026
  ];
  // measured tempos and hooks, written by `node muziek.js tempo`, per song and chapter
  let TEMPO = {};
  try { TEMPO = typeof module !== 'undefined' && module.exports ? require('./tempo.js') : (root.TEMPO || {}); } catch (e) { TEMPO = {}; }
  const tempoSleutel = mz => `${mz.bestand}@${mz.van}`;

  const STING = 2;              // beats: the trick that opens a month
  const KORT = 1.8;             // seconds: a headline lasts at least this long (a hero one beat pair longer)
  const FRASE = 4;              // beats: a month always fills whole bars

  // when a headline's maatje comes in, in beats from the start of the shot (a runner runs the whole shot)
  const gagTel = it => it.gagTel !== undefined ? it.gagTel : it.doet === 'ren' ? 0 : 1;
  // the film's tempo for a song: a slow song counts in double time, so the picture keeps moving
  const filmBpm = bpm => { while (bpm >= 200) bpm /= 2; while (bpm < 96) bpm *= 2; return bpm; };

  // beats per headline: what its sketch wants, and an even number of beats that lasts
  // at least KORT seconds; the month is rounded up to whole bars, the spare beats going
  // to the longest headlines
  function verdeel(items, beat) {
    let kort = 4; while (kort * beat < KORT) kort += 2;
    const tel = items.map(it => Math.max(kort, SCHETS[it.beeld] && !it.media ? SCHETS[it.beeld].tel : it.held ? kort + 2 : kort));
    const som = STING + tel.reduce((a, b) => a + b, 0);
    let extra = Math.ceil(som / FRASE) * FRASE - som;
    const rek = it => (SCHETS[it.beeld] && SCHETS[it.beeld].rek ? 1 : 0);
    const volgorde = items.map((_, i) => i).sort((a, b) => rek(items[b]) - rek(items[a]) || items[b].kop.length - items[a].kop.length);
    for (let k = 0; extra > 0; k++, extra -= 2) tel[volgorde[k % volgorde.length]] += 2;
    return tel;
  }

  /*
   * The film, scene by scene, with every start time and tempo.
   *   opts.alle: plan every song as if it were there (to find the hooks), at the tempo
   *              in opts.bpm[file] if given, else at the score's
   */
  function sequence(opts = {}) {
    // the scenes, in bars (a month's bars follow once its tempo is known)
    const plan = [];
    const add = (kind, bars, extra = {}) => plan.push({ kind, bars, ...extra });
    // the cold open and the intro: one bar per scene
    add('tv', 1, { naam: 'STAAT DIT AAN?' });
    add('rol', 1, { naam: 'HET AFTELLEN' });
    add('knal', 1, { naam: 'TWEEDUIZEND ZESENTWINTIG' });
    add('raster', 1, { naam: '365 DAGEN' });
    add('baan', 1, { naam: 'ÉÉN RONDJE ZON' });
    add('getallen', 1, { naam: 'IN GETALLEN' });
    add('opening', 2, { naam: 'HET JAAR IN BEELD' });
    // the news: a month per scene; months with only placeholders fold into one
    let prevM = 11, open = [];
    const vouw = () => {
      if (!open.length) return;
      add('vervolgd', 2, { naam: 'NOG IN DE MAAK', maanden: open, prevM });
      prevM = open[open.length - 1]; open = [];
    };
    for (let m = 0; m < 12; m++) {
      const items = NIEUWS.filter(n => n.m === m && !n.placeholder);
      if (!items.length) { open.push(m); continue; }
      vouw();
      add('maand', 0, { naam: MAANDEN[m], m, prevM, items, sting: STINGS[m] });
      prevM = m;
    }
    vouw();
    add('memoriam', 4, { naam: 'IN MEMORIAM' });
    add('dossier', 2, { naam: 'HET DOSSIER' });
    add('finale', 4, { naam: 'DE QUIZ' });

    // each chapter with a song runs at that song's tempo
    const maandVan = p => p.kind === 'maand' ? [p.m, p.m] : p.kind === 'vervolgd' ? [p.maanden[0], p.maanden[p.maanden.length - 1]] : null;
    const find = (naam, laatste) => {
      const hit = plan.map((p, i) => i).filter(i => plan[i].naam === naam);
      if (hit.length) return laatste ? hit[hit.length - 1] : hit[0];
      const mi = MAANDEN.indexOf(naam);
      if (mi < 0) return -1;
      // a month that is folded or empty: the nearest month scene on the right side
      const ms = plan.map((p, i) => [maandVan(p), i]).filter(([r]) => r);
      const kand = laatste ? ms.filter(([r]) => r[0] <= mi) : ms.filter(([r]) => r[1] >= mi);
      if (!kand.length) return -1;
      return laatste ? kand[kand.length - 1][1] : kand[0][1];
    };
    const liedjes = [];
    MUZIEK.forEach(mz => {
      const tp = opts.alle ? { bpm: (opts.bpm && opts.bpm[mz.bestand]) || BPM } : TEMPO[tempoSleutel(mz)] || TEMPO[mz.bestand];
      const bpm = (!opts.alle && mz.bpm) || (tp && tp.bpm);
      if (!bpm) return;
      const a = find(mz.van, false), b = find(mz.tot, true);
      if (a < 0 || b < a) return;
      if (plan.slice(a, b + 1).some(p => p.bar)) return; // overlaps an earlier song
      for (let i = a; i <= b; i++) plan[i].bar = 240 / filmBpm(bpm);
      liedjes.push({ ...mz, bpm, tel: mz.tel !== undefined ? mz.tel : tp && tp.tel, a, b, voor: mz.voor || 0 });
    });
    // the scenes before the first song count in to its tempo
    if (liedjes.length) { const f = liedjes.reduce((x, y) => (y.a < x.a ? y : x)); for (let i = 0; i < f.a; i++) plan[i].bar = plan[f.a].bar; }

    // now every month knows its tempo: lay out its headlines in beats
    plan.forEach(p => {
      if (p.kind !== 'maand') return;
      const beat = (p.bar || BAR) / 4, tel = verdeel(p.items, beat);
      let b = STING;
      p.slots = p.items.map((it, k) => {
        const prev = k ? p.items[k - 1] : null;
        const overgang = k === 0 || it.ernstig || prev.ernstig ? 'snede' : it.overgang || 'snede';
        const s = { it, b0: b, beats: tel[k], overgang };
        b += tel[k];
        return s;
      });
      p.bars = b / 4;
    });

    let t = 0;
    const seq = plan.map(p => {
      const bar = p.bar || BAR, beat = bar / 4;
      const sc = { ...p, bar, beat, start: t, dur: p.bars * bar };
      if (sc.slots) sc.slots = sc.slots.map(s => ({ ...s, start: s.b0 * beat, dur: s.beats * beat }));
      t += sc.dur;
      return sc;
    });
    liedjes.forEach(l => {
      l.start = seq[l.a].start; l.end = seq[l.b].start + seq[l.b].dur;
      l.bars = seq.slice(l.a, l.b + 1).reduce((s, sc) => s + sc.bars, 0);
      // the muffled run-up may only cover scenes without a song of their own
      let v = 0;
      for (let i = l.a - 1, left = l.voor; i >= 0 && left > 0; i--) {
        if (liedjes.some(o => o !== l && i >= o.a && i <= o.b)) break;
        const take = Math.min(left, seq[i].bars); v += take; left -= take;
      }
      l.voor = v;
      l.preStart = l.start - v * seq[l.a].bar;
    });
    return { seq, total: t, liedjes };
  }


  const REEL = { BPM, B, BAR, MAANDEN, NIEUWS, MEMORIAM, MUZIEK, STING, SCHETS, momenten, sequence, filmBpm, gagTel, tempoSleutel };
  if (typeof module !== 'undefined' && module.exports) module.exports = REEL;
  else root.REEL = REEL;
})(this);

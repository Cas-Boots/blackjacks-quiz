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
   * The news. m: month (0 = January). tag: 'NL' or 'WERELD'. beeld: the drawn scene.
   *   held     a hero shot: it gets the longest slot of its month, and its `sub` is shown
   *   maatje   the animal that reacts (a key from maatjes.js), and what it does:
   *   doet     juich, val, paniek, slaap, dans, kijk, ren, klap, spring, graaf, huil, zweet, schud,
   *            poets, zwaai, salueer, hang (from the top of the frame) or vlieg (flies in)
   *   zegt     its speech bubble; keep it to a few words
   *   geluid   the gag's sound effect (see SFX in audio.js)
   *   vorm     how it comes on: vol (full screen, the default), tv (on the telly, with the
   *            gang on the couch), krant (a spinning newspaper) or breaking (red bars, huge type)
   *   ernstig  serious news: no animal, no gag, a plain cut in and out
   *   media    optional { foto: 'x.jpg' } or { video: 'x', frames, fps }, plus bron (credit)
   */
  const NIEUWS = [
    { m: 0, tag: 'NL', datum: '3 januari', beeld: 'darts', kop: 'Van Veen gooit tot in de WK-finale', sub: 'Als derde Nederlander ooit staat hij in de eindstrijd. Luke Littler is net te sterk.', maatje: 'egel', doet: 'juich', zegt: '180!!!', geluid: 'toeter' },
    { m: 0, tag: 'NL', datum: '13 januari', beeld: 'nachtwacht', held: true, kop: 'De Nachtwacht gaat uit de vernis', sub: 'In een glazen kamer halen restauratoren de oude laag eraf. Heel Nederland kijkt mee.', maatje: 'wasbeer', doet: 'poets', zegt: 'SCHROB SCHROB', geluid: 'piep' },
    { m: 0, tag: 'WERELD', datum: '17 – 21 januari', beeld: 'groenland', kop: 'Trump wil Groenland', sub: 'Hij dreigt Europa met heffingen, ook Nederland. In Davos praat Rutte hem eruit.', maatje: 'zeehond', doet: 'schud', zegt: 'NIET TE KOOP!', geluid: 'toet' },

    { m: 1, tag: 'NL', datum: '27 februari', beeld: 'concert', held: true, kop: 'Heel Nederland zingt Cheerio', sub: 'Justen de Wildt uit Veenendaal scoort dé meezinger van het jaar.', maatje: 'kikker', doet: 'dans', zegt: 'CHEERIOOO!', geluid: 'juichen' },
    { m: 1, tag: 'WERELD', datum: '17 februari', beeld: 'vuurpaard', kop: 'Het jaar van het vuurpaard', sub: 'De Chinese kalender begint aan een zeldzaam jaar. Het vuurpaard komt maar eens in de zestig jaar langs.', maatje: 'eenhoorn', doet: 'kijk', zegt: 'FAMILIE?', geluid: 'ping' },
    { m: 1, tag: 'WERELD', datum: '28 februari', beeld: 'iran', ernstig: true, kop: 'Oorlog met Iran', sub: 'Amerikaanse en Israëlische aanvallen doden de opperste leider. Nederlanders stranden in het Golfgebied.' },

    { m: 2, tag: 'NL', datum: '18 maart', beeld: 'stemmen', vorm: 'krant', kop: 'Lokale partijen blijven de baas', sub: 'Bij de gemeenteraadsverkiezingen blijven de lokale partijen samen de grootste.', maatje: 'octopus', doet: 'zwaai', zegt: 'WELK HOKJE?', geluid: 'plop' },
    { m: 2, tag: 'NL', datum: '26 maart', beeld: 'pro', kop: 'GroenLinks-PvdA heet voortaan Pro', sub: 'Progressief Nederland, met een groene roos als logo.', maatje: 'papegaai', doet: 'vlieg', zegt: 'PRO! PRO! PRO!', geluid: 'kwek' },
    { m: 2, tag: 'WERELD', datum: 'maart', beeld: 'tanker', held: true, kop: 'Hormuz dicht, tanken onbetaalbaar', sub: 'De oorlog sluit de zeestraat. Aan de pomp betaalt Nederland recordprijzen.', maatje: 'kameel', doet: 'kijk', zegt: 'IK LOOP WEL.', geluid: 'tuut' },

    { m: 3, tag: 'NL', datum: '5 april', beeld: 'kampioen', kop: 'PSV kampioen, vroeger dan ooit', sub: 'De derde titel op rij is al in april binnen.', maatje: 'zeehond', doet: 'klap', zegt: 'ALWEER?!', geluid: 'applaus' },
    { m: 3, tag: 'WERELD', datum: '12 april', beeld: 'boedapest', vorm: 'breaking', kop: 'Orbán valt', sub: 'Na jaren aan de macht verliest hij de Hongaarse verkiezingen van Péter Magyar.', maatje: 'lama', doet: 'val', zegt: 'OEI!', geluid: 'fluit-neer' },
    { m: 3, tag: 'NL', datum: '27 april', beeld: 'koningsdag', held: true, kop: 'Koningsdag in Dokkum', sub: 'De koninklijke familie viert feest in Friesland, waar de koning ooit de Elfstedentocht schaatste.', maatje: 'giraf', doet: 'kijk', zegt: 'IK ZIE HEM!', geluid: 'fluit-op' },

    { m: 4, tag: 'NL', datum: '2 mei', beeld: 'mol', vorm: 'tv', held: true, kop: 'Daan Boom is de Mol', sub: 'Bram Krikke ontmaskert zijn eigen vriend en gaat er met de pot vandoor.', maatje: 'das', doet: 'graaf', zegt: 'IK WAS HET NIET!', geluid: 'plop' },
    { m: 4, tag: 'WERELD', datum: '13 mei', beeld: 'chip', vorm: 'breaking', kop: 'Nvidia: rijkste bedrijf ooit', sub: 'Nog nooit was een bedrijf zoveel waard als de chipmaker achter de AI-koorts.', maatje: 'hamster', doet: 'spring', zegt: 'KA-CHING!', geluid: 'kassa' },
    { m: 4, tag: 'NL', datum: '18 mei', beeld: 'schiphol', kop: 'Urenlange rijen op Schiphol', sub: 'De nieuwe beveiliging loopt vast. Honderden reizigers missen hun vlucht.', maatje: 'luiaard', doet: 'slaap', zegt: 'ZZZ…', geluid: 'trombone' },

    { m: 5, tag: 'NL', datum: '26 juni', beeld: 'hitte', kop: 'Code rood voor hitte', sub: 'Voor het eerst waarschuwt het KNMI voor hitte met code rood. Limburg puft het hardst.', maatje: 'pinguin', doet: 'zweet', zegt: 'HEET HEET HEET', geluid: 'sis' },
    { m: 5, tag: 'NL', datum: '17 – 19 juni', beeld: 'japan', held: true, kop: 'Keizer van Japan op bezoek', sub: 'Keizer Naruhito plant een kersenboom in het Amsterdamse Bos.', maatje: 'eekhoorn', doet: 'graaf', zegt: 'HIER?', geluid: 'plop' },
    { m: 5, tag: 'WERELD', datum: '22 juni', beeld: 'downing', vorm: 'krant', kop: 'Starmer stapt op', sub: 'De Britse premier vertrekt na een zware nederlaag bij de lokale verkiezingen.', maatje: 'krokodil', doet: 'huil', zegt: 'SNIK.', geluid: 'trombone' },

    { m: 6, tag: 'NL', datum: '1 juli', beeld: 'trekkers', kop: 'Trekkers op de Koekamp', sub: 'Boeren rijden naar Den Haag uit protest tegen de nieuwe stikstofplannen.', maatje: 'kip', doet: 'paniek', zegt: 'TOET TOET!', geluid: 'toeter' },
    { m: 6, tag: 'WERELD', datum: '3 juli', beeld: 'bruiloft', vorm: 'tv', held: true, kop: 'Taylor Swift trouwt', sub: 'Met Travis Kelce, in Madison Square Garden. Adam Sandler leidt de ceremonie.', maatje: 'flamingo', doet: 'dans', zegt: 'JAAA!', geluid: 'ping' },
    { m: 6, tag: 'WERELD', datum: '4 juli', beeld: 'amerika', kop: 'Amerika wordt 250', sub: 'Tweehonderdvijftig jaar na de onafhankelijkheid staat het land in vuur en vlam.', maatje: 'aap', doet: 'hang', zegt: 'HIEP HIEP!', geluid: 'toeter' },

    { m: 7, tag: 'WERELD', datum: '12 augustus', beeld: 'zon', held: true, kop: 'Het wordt even nacht', sub: 'Een totale zonsverduistering trekt over Spanje en IJsland.', maatje: 'uil', doet: 'kijk', zegt: 'AL BEDTIJD?', geluid: 'ping' },
    { m: 7, tag: 'NL', datum: 'augustus', beeld: 'atletiek', kop: 'Goudregen op het EK atletiek', sub: 'Visser, Schilder, Nillessen en Bol: het beste EK ooit voor Nederland.', maatje: 'kangoeroe', doet: 'spring', zegt: 'BOING!', geluid: 'boing' },
    { m: 7, tag: 'NL', datum: '27 augustus', beeld: 'zomer', kop: 'Warmste zomer ooit gemeten', sub: 'Het oude record uit 2018 sneuvelt ruim. En het is ook nog eens kurkdroog.', maatje: 'nijlpaard', doet: 'dans', zegt: 'IJSJE?', geluid: 'ping' },

    { m: 8, tag: 'NL', datum: '9 september', beeld: 'staking', held: true, kop: 'Geen trein, bus of tram', sub: 'Een landelijke ov-staking tegen de bezuinigingen legt het land een dag stil.', maatje: 'slak', doet: 'ren', zegt: 'INSTAPPEN!', geluid: 'toet' },
    { m: 8, tag: 'NL', datum: '10 september', beeld: 'amalia', kop: 'Amalia gaat bij de marine', sub: 'Na de luchtmacht begint de kroonprinses in Den Helder bij de Koninklijke Marine.', maatje: 'dolfijn', doet: 'spring', zegt: 'AHOI!', geluid: 'plons' },
    { m: 8, tag: 'NL', datum: '26 september', beeld: 'wielrennen', kop: 'Vollering wereldkampioen', sub: 'In Montréal verovert Demi Vollering de regenboogtrui.', maatje: 'hond', doet: 'ren', zegt: 'WOEF WOEF!', geluid: 'bel' },

    // October to December: placeholders until the news is in. Replace one with a real item.
    ...[9, 10, 11].flatMap(m => [0, 1, 2].filter(k => !(m === 11 && k === 2)).map(k => ({ m, tag: k === 1 ? 'WERELD' : 'NL', datum: MAANDEN[m].toLowerCase(), beeld: 'testbeeld', placeholder: true, kop: 'Nieuws volgt', sub: `Plek ${k + 1} van ${MAANDEN[m].toLowerCase()}: nog in te vullen.` }))),
    { m: 11, tag: 'NL', datum: '31 december', beeld: 'vuurwerk', held: true, kop: 'Oud en nieuw zonder vuurwerk', sub: 'Vanavond geldt voor het eerst het landelijke vuurwerkverbod. Sterretjes mogen nog.', maatje: 'hond', doet: 'dans', zegt: 'EINDELIJK RUST.', geluid: 'ping' },
  ];

  // For the in-memoriam card, which follows the months.
  const MEMORIAM = [
    { naam: 'Robert Jensen', wie: 'presentator' },
    { naam: 'Sonja Barend', wie: 'talkshowkoningin' },
    { naam: 'Marjan Minnesma', wie: 'klimaatstrijder' },
    { naam: 'Lieke Marsman', wie: 'dichter' },
    { naam: 'Wim T. Schippers', wie: 'kunstenaar' },
    { naam: 'Jerney Kaagman', wie: 'zangeres' },
  ];

  // The ticker under the news: the maatjes' own news, for whoever reads along.
  const TICKER = [
    'LAMA NOG STEEDS FLAUWGEVALLEN', 'GOUDVIS VERGEET WAAROM HIJ HIER IS', 'ZEEHOND KLAPT NOG STEEDS',
    'LUIAARD MIST VLUCHT, MERKT HET MORGEN', 'KIP IN PANIEK, NIEMAND WEET WAAROM', 'EEKHOORN VINDT NOTEN UIT 2019 TERUG',
    'NIJLPAARD BREEKT KOPJE (ALWEER)', 'SLAK HAALT TREIN IN', 'UIL DOET ALSOF HIJ DIT AL WIST',
    'WASBEER VERDACHT VAN DIEFSTAL DOSSIER', 'PAPEGAAI HERHAALT DIT BERICHT', 'PAPEGAAI HERHAALT DIT BERICHT',
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
   *   vanaf: start from the first downbeat after this time (seconds) instead of the hook
   *   tel:   start exactly here (seconds, on a downbeat); with bpm, skips the measuring
   *   voor:  bars of the song to play before the chapter, muffled, as if from far away
   *   gain:  in dB, on top of the automatic levelling
   *   uit:   how it leaves: echo, spin (a backspin), stop (a tape stop), fade or stil (dead
   *          quiet on the last beat); left out, the mixer picks one
   *
   * A chapter without a file uses the synthesized score.
   */
  const MUZIEK = [
    // the year's Dutch Top 40 number ones and the Dutch hit of the year
    { bestand: 'mr-know-it-all.mp3', van: 'TWEEDUIZEND ZESENTWINTIG', tot: 'HET JAAR IN BEELD', voor: 2 }, // Teddy Swims: comes out of the tv, drops on 2026
    { bestand: 'i-just-might.mp3', van: 'JANUARI', tot: 'APRIL' },                                        // Bruno Mars, #1 jan–apr
    { bestand: 'dai-dai.mp3', van: 'MEI', tot: 'AUGUSTUS' },                                              // Shakira & Burna Boy, #1 all summer
    { bestand: 'fever-dream.mp3', van: 'SEPTEMBER', tot: 'DECEMBER' },                                    // Alex Warren
    { bestand: 'niemand.mp3', van: 'IN MEMORIAM', tot: 'IN MEMORIAM', uit: 'fade', gain: -2 },                                   // Suzan & Freek; optional
    { bestand: 'cheerio.mp3', van: 'HET DOSSIER', tot: 'DE KWIS' },                                       // Justen de Wildt: goodbye, 2026
  ];
  // measured tempos and hooks, written by `node muziek.js tempo`
  let TEMPO = {};
  try { TEMPO = typeof module !== 'undefined' && module.exports ? require('./tempo.js') : (root.TEMPO || {}); } catch (e) { TEMPO = {}; }

  const STING = 2;              // beats: the calendar page that opens a month
  const KORT = 1.8;             // seconds: a headline lasts at least this long (a hero one beat pair longer)
  const FRASE = 8;              // beats: a month always fills whole two-bar phrases
  // how the picture goes from one headline to the next, in turn
  const OVERGANGEN = ['flits', 'zweep', 'iris', 'zweep', 'wis', 'flits', 'zweep', 'wis', 'iris', 'flits'];

  // when a headline's maatje comes in, in beats from the start of the shot (a runner runs the whole shot)
  const gagTel = it => it.gagTel !== undefined ? it.gagTel : it.doet === 'ren' ? 0 : 1;
  // the film's tempo for a song: a slow song counts in double time, so the picture keeps moving
  const filmBpm = bpm => { while (bpm >= 200) bpm /= 2; while (bpm < 96) bpm *= 2; return bpm; };

  // beats per headline: an even number of beats that lasts at least KORT seconds (a
  // hero gets two beats more, unless that costs a whole extra phrase), and the month
  // rounded up to whole phrases, the spare beats going to the longest headlines
  function verdeel(items, beat) {
    let kort = 4; while (kort * beat < KORT) kort += 2;
    const som = tel => STING + tel.reduce((a, b) => a + b, 0);
    const rest = tel => Math.ceil(som(tel) / FRASE) * FRASE - som(tel);
    let tel = items.map(it => it.held ? kort + 2 : kort);
    const plat = items.map(() => kort);
    if (rest(tel) >= 4 && rest(plat) < rest(tel)) tel = plat;
    let extra = rest(tel);
    const volgorde = items.map((_, i) => i).sort((a, b) => (items[a].held ? 1 : 0) - (items[b].held ? 1 : 0) || items[b].kop.length - items[a].kop.length);
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
      add('maand', 0, { naam: MAANDEN[m], m, prevM, items });
      prevM = m;
    }
    vouw();
    add('memoriam', 4, { naam: 'IN MEMORIAM' });
    add('dossier', 2, { naam: 'HET DOSSIER' });
    add('finale', 4, { naam: 'DE KWIS' });

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
      const tp = opts.alle ? { bpm: (opts.bpm && opts.bpm[mz.bestand]) || BPM } : TEMPO[mz.bestand];
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
    let nr = 0;
    plan.forEach(p => {
      if (p.kind !== 'maand') return;
      const beat = (p.bar || BAR) / 4, tel = verdeel(p.items, beat);
      let b = STING;
      p.slots = p.items.map((it, k) => {
        const prev = k ? p.items[k - 1] : null;
        const overgang = it.overgang || (k === 0 ? 'kalender' : it.ernstig || prev.ernstig ? 'snede' : OVERGANGEN[nr % OVERGANGEN.length]);
        nr++;
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


  const REEL = { BPM, B, BAR, MAANDEN, NIEUWS, MEMORIAM, TICKER, MUZIEK, STING, sequence, filmBpm, gagTel };
  if (typeof module !== 'undefined' && module.exports) module.exports = REEL;
  else root.REEL = REEL;
})(this);

/*
 * Everything the reel shows, in order. index.html draws it and audio.js scores it,
 * so both read the timing from here and can never drift apart.
 *
 * The news is told like a news network's "year in pictures": one picture per
 * headline, with a chyron. No figures on the news slides. The picture is a drawn
 * scene (`beeld`) unless `media` points at a photo or a video clip in media/, which
 * then takes over; see README.md.
 *
 * October–December hold placeholders (a test card) to fix the pacing. Replace them
 * with real items, then run `node audio.js && node render.js`.
 *
 * Spoiler rule: nothing here may answer, or hint at, a quiz question. The quiz is in
 * app/src/lib/content/packs.ts. Its news topics (the cabinet, the Winter Games, the
 * moon flight, the World Cup, the Songfestival winner, the Tour, Formula 1, the big
 * films, the New Year's fireworks damage and the January snow) stay out of the reel.
 */
(function (root) {
  const BPM = 100;
  const B = 60 / BPM;          // one beat, 0.6 s
  const BAR = 4 * B;           // one bar, 2.4 s

  const MAANDEN = ['JANUARI', 'FEBRUARI', 'MAART', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AUGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DECEMBER'];

  // m: month (0 = January). tag: 'NL' or 'WERELD'. beeld: the drawn scene.
  // media: optional { foto: 'x.jpg' } or { video: 'x.mp4' } in media/, plus bron (credit).
  const NIEUWS = [
    { m: 0, tag: 'NL', datum: '3 januari', beeld: 'darts', kop: 'Van Veen gooit tot in de WK-finale', sub: 'Als derde Nederlander ooit staat hij in de eindstrijd. Luke Littler is net te sterk.' },
    { m: 0, tag: 'NL', datum: '13 januari', beeld: 'nachtwacht', kop: 'De Nachtwacht gaat uit de vernis', sub: 'In een glazen kamer halen restauratoren de oude laag eraf. Heel Nederland kijkt mee.' },
    { m: 0, tag: 'WERELD', datum: '17 – 21 januari', beeld: 'groenland', kop: 'Trump wil Groenland', sub: 'Hij dreigt Europa met heffingen, ook Nederland. In Davos praat Rutte hem eruit.' },

    { m: 1, tag: 'NL', datum: '27 februari', beeld: 'concert', kop: 'Heel Nederland zingt Cheerio', sub: 'Justen de Wildt uit Veenendaal scoort dé meezinger van het jaar.' },
    { m: 1, tag: 'WERELD', datum: '17 februari', beeld: 'vuurpaard', kop: 'Het jaar van het vuurpaard', sub: 'De Chinese kalender begint aan een zeldzaam jaar. Het vuurpaard komt maar eens in de zestig jaar langs.' },
    { m: 1, tag: 'WERELD', datum: '28 februari', beeld: 'iran', kop: 'Oorlog met Iran', sub: 'Amerikaanse en Israëlische aanvallen doden de opperste leider. Nederlanders stranden in het Golfgebied.' },

    { m: 2, tag: 'NL', datum: '18 maart', beeld: 'stemmen', kop: 'Lokale partijen blijven de baas', sub: 'Bij de gemeenteraadsverkiezingen blijven de lokale partijen samen de grootste.' },
    { m: 2, tag: 'NL', datum: '26 maart', beeld: 'pro', kop: 'GroenLinks-PvdA heet voortaan Pro', sub: 'Progressief Nederland, met een groene roos als logo.' },
    { m: 2, tag: 'WERELD', datum: 'maart', beeld: 'tanker', kop: 'Hormuz dicht, tanken onbetaalbaar', sub: 'De oorlog sluit de zeestraat. Aan de pomp betaalt Nederland recordprijzen.' },

    { m: 3, tag: 'NL', datum: '5 april', beeld: 'kampioen', kop: 'PSV kampioen, vroeger dan ooit', sub: 'De derde titel op rij is al in april binnen.' },
    { m: 3, tag: 'WERELD', datum: '12 april', beeld: 'boedapest', kop: 'Orbán valt', sub: 'Na jaren aan de macht verliest hij de Hongaarse verkiezingen van Péter Magyar.' },
    { m: 3, tag: 'NL', datum: '27 april', beeld: 'koningsdag', kop: 'Koningsdag in Dokkum', sub: 'De koninklijke familie viert feest in Friesland, waar de koning ooit de Elfstedentocht schaatste.' },

    { m: 4, tag: 'NL', datum: '2 mei', beeld: 'mol', kop: 'Daan Boom is de Mol', sub: 'Bram Krikke ontmaskert zijn eigen vriend en gaat er met de pot vandoor.' },
    { m: 4, tag: 'WERELD', datum: '13 mei', beeld: 'chip', kop: 'AI maakt Nvidia het rijkste bedrijf ooit', sub: 'Nog nooit was een bedrijf zoveel waard als de chipmaker achter de AI-koorts.' },
    { m: 4, tag: 'NL', datum: '18 mei', beeld: 'schiphol', kop: 'Urenlange rijen op Schiphol', sub: 'De nieuwe beveiliging loopt vast. Honderden reizigers missen hun vlucht.' },

    { m: 5, tag: 'NL', datum: '26 juni', beeld: 'hitte', kop: 'Voor het eerst code rood voor hitte', sub: 'Het KNMI waarschuwt het halve land. Limburg puft onder de heetste dag van de zomer.' },
    { m: 5, tag: 'NL', datum: '17 – 19 juni', beeld: 'japan', kop: 'De keizer van Japan op bezoek', sub: 'Keizer Naruhito plant een kersenboom in het Amsterdamse Bos.' },
    { m: 5, tag: 'WERELD', datum: '22 juni', beeld: 'downing', kop: 'Starmer stapt op', sub: 'De Britse premier vertrekt na een zware nederlaag bij de lokale verkiezingen.' },

    { m: 6, tag: 'NL', datum: '1 juli', beeld: 'trekkers', kop: 'Trekkers op de Koekamp', sub: 'Boeren rijden naar Den Haag uit protest tegen de nieuwe stikstofplannen.' },
    { m: 6, tag: 'WERELD', datum: '3 juli', beeld: 'bruiloft', kop: 'Taylor Swift trouwt', sub: 'Met Travis Kelce, in Madison Square Garden. Adam Sandler leidt de ceremonie.' },
    { m: 6, tag: 'WERELD', datum: '4 juli', beeld: 'amerika', kop: 'Amerika viert zijn verjaardag', sub: 'Tweehonderdvijftig jaar na de onafhankelijkheid staat het land in vuur en vlam.' },

    { m: 7, tag: 'WERELD', datum: '12 augustus', beeld: 'zon', kop: 'Het wordt even nacht', sub: 'Een totale zonsverduistering trekt over Spanje en IJsland.' },
    { m: 7, tag: 'NL', datum: 'augustus', beeld: 'atletiek', kop: 'Goudregen op het EK atletiek', sub: 'Visser, Schilder, Nillessen en Bol: het beste EK ooit voor Nederland.' },
    { m: 7, tag: 'NL', datum: '27 augustus', beeld: 'zomer', kop: 'De warmste zomer ooit gemeten', sub: 'Het oude record uit 2018 sneuvelt ruim. En het is ook nog eens kurkdroog.' },

    { m: 8, tag: 'NL', datum: '9 september', beeld: 'staking', kop: 'Geen trein, bus of tram', sub: 'Een landelijke ov-staking tegen de bezuinigingen legt het land een dag stil.' },
    { m: 8, tag: 'NL', datum: '10 september', beeld: 'amalia', kop: 'Amalia gaat bij de marine', sub: 'Na de luchtmacht begint de kroonprinses in Den Helder bij de Koninklijke Marine.' },
    { m: 8, tag: 'NL', datum: '26 september', beeld: 'wielrennen', kop: 'Vollering wereldkampioen', sub: 'In Montréal verovert Demi Vollering de regenboogtrui.' },

    // October to December: placeholders that hold the pacing until the news is in
    ...[9, 10, 11].flatMap(m => [0, 1, 2].filter(k => !(m === 11 && k === 2)).map(k => ({ m, tag: k === 1 ? 'WERELD' : 'NL', datum: MAANDEN[m].toLowerCase(), beeld: 'testbeeld', placeholder: true, kop: 'Nieuws volgt', sub: `Plek ${k + 1} van ${MAANDEN[m].toLowerCase()}: nog in te vullen.` }))),
    { m: 11, tag: 'NL', datum: '31 december', beeld: 'vuurwerk', kop: 'Oud en nieuw zonder vuurwerk', sub: 'Vanavond geldt voor het eerst het landelijke vuurwerkverbod. Sterretjes mogen nog.' },
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

  const ITEM_BARS = 2;   // one headline: 4.8 s
  const STING_BARS = 0.5; // one month title: 1.2 s
  function sequence() {
    const seq = [];
    let t = 0;
    const add = (kind, bars, extra = {}) => { seq.push({ kind, bars, start: t, dur: bars * BAR, ...extra }); t += bars * BAR; };
    // the intro: one bar per scene, a touch slower than the first 15-second cut
    add('rol', 1, { naam: 'HET AFTELLEN' });
    add('knal', 1, { naam: 'TWEEDUIZEND ZESENTWINTIG' });
    add('raster', 1, { naam: '365 DAGEN' });
    add('baan', 1, { naam: 'ÉÉN RONDJE ZON' });
    add('getallen', 1, { naam: 'IN GETALLEN' });
    // the news, like a network's year in pictures
    add('opening', 2, { naam: 'HET JAAR IN BEELD' });
    let prevM = 0;
    for (let m = 0; m < 12; m++) {
      const items = NIEUWS.filter(n => n.m === m);
      if (!items.length) continue;
      add('maand', STING_BARS + ITEM_BARS * items.length, { naam: MAANDEN[m], m, prevM, items });
      prevM = m;
    }
    add('memoriam', 3, { naam: 'IN MEMORIAM' });
    add('dossier', 3, { naam: 'HET DOSSIER' });
    add('finale', 5, { naam: 'DE KWIS' });
    return { seq, total: t };
  }

  const REEL = { BPM, B, BAR, MAANDEN, NIEUWS, MEMORIAM, ITEM_BARS, STING_BARS, sequence };
  if (typeof module !== 'undefined' && module.exports) module.exports = REEL;
  else root.REEL = REEL;
})(this);

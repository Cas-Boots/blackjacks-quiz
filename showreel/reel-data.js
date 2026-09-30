/*
 * Everything the reel shows, in order. index.html draws it and audio.js scores it,
 * so both read the timing from here and can never drift apart.
 *
 * To add October–December: add items to NIEUWS with m: 9, 10 or 11. The months
 * appear on their own, and the reel grows by one bar for each new month plus three
 * bars per item. Then run `node audio.js && node render.js`.
 *
 * Spoiler rule: nothing here may answer, or hint at, a quiz question. The quiz is in
 * app/src/lib/content/packs.ts. Its news topics (the cabinet, the Winter Games, the
 * moon flight, the World Cup, the Songfestival winner, the Tour, Formula 1, the big
 * films, the New Year's fireworks and the January snow) stay out of the reel.
 */
(function (root) {
  const BPM = 120;
  const B = 60 / BPM;          // one beat, 0.5 s
  const BAR = 4 * B;           // one bar, 2 s

  const MAANDEN = ['JANUARI', 'FEBRUARI', 'MAART', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AUGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DECEMBER'];

  // m: month (0 = January). vorm: kop | nl | wereld | getal | zon
  // tag: 'NL' or 'WERELD'. plek: {lat, lon, naam} for the map layouts.
  const NIEUWS = [
    // januari
    { m: 0, tag: 'NL', datum: '3 JANUARI', vorm: 'kop', icon: 'dart', kop: 'Van Veen gooit tot in de WK-finale', sub: 'De 23-jarige uit Andel is pas de derde Nederlander die zo ver komt bij het WK darts. Luke Littler is te sterk: 7-1.' },
    { m: 0, tag: 'NL', datum: '13 JANUARI', vorm: 'nl', plek: { lat: 52.36, lon: 4.885, naam: 'Rijksmuseum', links: true }, kop: 'De Nachtwacht gaat uit de vernis', sub: 'Restauratoren halen de oude laag eraf, in een glazen kamer waar iedereen kan meekijken.' },
    { m: 0, tag: 'WERELD', datum: '17 – 21 JANUARI', vorm: 'wereld', plek: { lat: 72, lon: -40, naam: 'Groenland' }, kop: 'Trump wil Groenland', sub: 'Hij dreigt acht Europese landen met importheffingen, ook Nederland. Na een gesprek met Rutte in Davos trekt hij ze weer in.' },
    // februari
    { m: 1, tag: 'NL', datum: '27 FEBRUARI', vorm: 'kop', icon: 'microfoon', kop: 'Heel Nederland zingt Cheerio', sub: 'Justen de Wildt (22) uit Veenendaal heeft dé hit van het jaar: 23 weken in de Top 40.' },
    { m: 1, tag: 'WERELD', datum: '28 FEBRUARI', vorm: 'wereld', plek: { lat: 35.7, lon: 51.4, naam: 'Teheran' }, kop: 'Oorlog met Iran', sub: 'Amerikaanse en Israëlische aanvallen doden opperste leider Khamenei. Defensie haalt gestrande Nederlanders op.' },
    // maart
    { m: 2, tag: 'NL', datum: '18 MAART', vorm: 'getal', icon: 'stembus', getal: { n: 53.7, dec: 1, eenheid: '% OPKOMST' }, kop: 'Gemeenteraadsverkiezingen', sub: 'Lokale partijen blijven samen de grootste. GroenLinks-PvdA is de grootste landelijke partij.' },
    { m: 2, tag: 'WERELD', datum: '2 MAART', vorm: 'wereld', plek: { lat: 26.6, lon: 56.3, naam: 'Straat van Hormuz' }, kop: 'Hormuz gaat dicht', sub: 'De olieprijs stijgt in één maand met 65 procent. In april kost een liter diesel hier € 2,819.' },
    // april
    { m: 3, tag: 'NL', datum: '5 APRIL', vorm: 'kop', icon: 'trofee', kop: 'PSV is de vroegste kampioen ooit', sub: 'De derde titel op rij en de 27e in totaal, binnen op 5 april.' },
    { m: 3, tag: 'WERELD', datum: '12 APRIL', vorm: 'wereld', plek: { lat: 47.5, lon: 19.04, naam: 'Boedapest' }, kop: 'Orbán verslagen na zestien jaar', sub: 'Péter Magyar en zijn Tisza-partij winnen de Hongaarse verkiezingen met een tweederdemeerderheid.' },
    { m: 3, tag: 'NL', datum: '27 APRIL', vorm: 'nl', plek: { lat: 53.326, lon: 5.998, naam: 'Dokkum' }, kop: 'Koningsdag in Dokkum', sub: 'Voor het eerst onder Willem-Alexander in Friesland. Veertig jaar geleden schaatste hij er in de Elfstedentocht langs.' },
    // mei
    { m: 4, tag: 'NL', datum: '2 MEI', vorm: 'kop', icon: 'mol', kop: 'Daan Boom is de Mol', sub: 'Bram Krikke ontmaskert zijn vriend en wint € 13.280.' },
    { m: 4, tag: 'WERELD', datum: '13 MEI', vorm: 'getal', icon: 'chip', getal: { n: 5.5, dec: 1, voor: '$', eenheid: 'BILJOEN' }, kop: 'Nvidia is meer waard dan wie ook ooit', sub: 'De AI-koorts maakt de chipmaker het eerste bedrijf dat die grens haalt.' },
    // juni
    { m: 5, tag: 'NL', datum: '26 JUNI', vorm: 'nl', plek: { lat: 51.21, lon: 5.80, naam: 'Ell · 39,4 °C' }, kop: 'Voor het eerst code rood voor hitte', sub: 'Het KNMI waarschuwt acht provincies. In het Limburgse Ell wordt het 39,4 graden.' },
    { m: 5, tag: 'WERELD', datum: '22 JUNI', vorm: 'wereld', plek: { lat: 51.5, lon: -0.13, naam: 'Londen', links: true }, kop: 'Starmer stapt op', sub: 'De Britse premier vertrekt na een zware nederlaag bij de lokale verkiezingen.' },
    // juli
    { m: 6, tag: 'NL', datum: '1 JULI', vorm: 'kop', icon: 'trekker', kop: 'Trekkers op de Koekamp', sub: 'Boeren rijden naar Den Haag uit protest tegen de nieuwe stikstofplannen.' },
    { m: 6, tag: 'WERELD', datum: '3 JULI', vorm: 'kop', icon: 'hart', kop: 'Taylor Swift trouwt', sub: 'Met Travis Kelce, in Madison Square Garden. Adam Sandler leidt de ceremonie.' },
    // augustus
    { m: 7, tag: 'WERELD', datum: '12 AUGUSTUS', vorm: 'zon', kop: 'Totale zonsverduistering', sub: 'De eerste op het Europese vasteland in 27 jaar, boven Spanje en IJsland.' },
    { m: 7, tag: 'NL', datum: '16 AUGUSTUS', vorm: 'getal', getal: { n: 14, eenheid: 'MEDAILLES' }, kop: 'Het beste EK atletiek ooit', sub: 'Met goud voor Nadine Visser, Jessica Schilder, Stefan Nillessen en de 4x400 meter met Femke Bol.' },
    { m: 7, tag: 'NL', datum: '27 AUGUSTUS', vorm: 'getal', icon: 'thermometer', getal: { n: 19.3, dec: 1, eenheid: '°C' }, kop: 'De warmste zomer ooit gemeten', sub: 'Het gemiddelde in De Bilt. Het vorige record, uit 2018, was 18,9 graden.' },
    // september
    { m: 8, tag: 'NL', datum: '9 SEPTEMBER', vorm: 'kop', icon: 'trein', kop: 'Geen trein, bus of tram', sub: 'Een landelijke ov-staking tegen de bezuinigingen op WW en WIA. Alleen de Airport Sprinter rijdt.' },
    { m: 8, tag: 'NL', datum: '26 SEPTEMBER', vorm: 'wereld', plek: { lat: 45.5, lon: -73.6, naam: 'Montréal' }, kop: 'Vollering wereldkampioen', sub: 'Demi Vollering pakt de regenboogtrui, als eerste Nederlandse sinds 2022.' },
    // december — vanavond
    { m: 11, tag: 'NL', datum: '31 DECEMBER', vorm: 'kop', icon: 'vuurpijl', kop: 'Oud en nieuw zonder vuurwerk', sub: 'Het eerste landelijke vuurwerkverbod. Sterretjes mogen nog.' },
  ];

  // For the in-memoriam card, which follows the months.
  const MEMORIAM = [
    { naam: 'Robert Jensen', wie: 'presentator', jaren: '52' },
    { naam: 'Sonja Barend', wie: 'talkshowkoningin', jaren: '86' },
    { naam: 'Marjan Minnesma', wie: 'klimaatstrijder', jaren: '59' },
    { naam: 'Lieke Marsman', wie: 'dichter', jaren: '35' },
    { naam: 'Wim T. Schippers', wie: 'kunstenaar', jaren: '83' },
    { naam: 'Jerney Kaagman', wie: 'zangeres', jaren: '79' },
  ];

  // Colour theme per month: background, text, accent.
  const THEMA = [
    ['ink', 'paper', 'fire'], ['paper', 'ink', 'fire'], ['ink', 'paper', 'blue'], ['blue', 'paper', 'lime'],
    ['paper', 'ink', 'blue'], ['ink', 'paper', 'fire'], ['fire', 'ink', 'paper'], ['ink', 'paper', 'fire'],
    ['paper', 'ink', 'fire'], ['ink', 'paper', 'lime'], ['blue', 'paper', 'fire'], ['ink', 'paper', 'fire'],
  ];

  const ITEM_BARS = 3;
  function sequence() {
    const seq = [];
    let t = 0;
    const add = (kind, bars, extra = {}) => { seq.push({ kind, bars, start: t, dur: bars * BAR, ...extra }); t += bars * BAR; };
    add('rol', 4, { naam: 'HET AFTELLEN' });
    add('knal', 4, { naam: 'TWEEDUIZEND ZESENTWINTIG' });
    add('raster', 6, { naam: '365 DAGEN' });
    add('baan', 6, { naam: 'ÉÉN RONDJE ZON' });
    add('getallen', 8, { naam: 'IN GETALLEN' });
    add('nieuws', 2, { naam: 'HET NIEUWS' });
    let prevM = 0;
    for (let m = 0; m < 12; m++) {
      const items = NIEUWS.filter(n => n.m === m);
      if (!items.length) continue;
      add('maand', 1 + ITEM_BARS * items.length, { naam: MAANDEN[m], m, prevM, items, thema: THEMA[m] });
      prevM = m;
    }
    add('memoriam', 4, { naam: 'IN MEMORIAM' });
    add('dossier', 4, { naam: 'HET DOSSIER' });
    add('finale', 6, { naam: 'DE KWIS' });
    return { seq, total: t };
  }

  const REEL = { BPM, B, BAR, MAANDEN, NIEUWS, MEMORIAM, THEMA, ITEM_BARS, sequence };
  if (typeof module !== 'undefined' && module.exports) module.exports = REEL;
  else root.REEL = REEL;
})(this);

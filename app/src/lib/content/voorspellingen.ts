/**
 * De voorspellingen van januari 2026, overgenomen uit Voorspellingen_2026.xlsx.
 *
 * Per voorspelling: de vraag, wat iedereen antwoordde, en de inzet uit de
 * puntenmatrix (hoeveel punten een goede voorspelling oplevert). De
 * antwoorden staan er letterlijk in; alleen de vraagteksten zijn wat
 * netter gemaakt voor de televisie.
 *
 * Vul vóór de avond de uitkomsten in:
 *
 * - `uitkomst`: wat er echt gebeurde, als tekst. Bij ja/nee en getallen
 *   wordt daarmee vanzelf bepaald wie het goed had.
 * - `goed`: bij open voorspellingen (een zin) bepaal jij wie het goed had.
 *   Namen zoals hieronder. Laat weg als niemand het goed had.
 * - `uitkomst: null` betekent: nog onbekend. Dan telt de voorspelling nog
 *   niet mee en staat hij op de televisie als 'nog open'.
 *
 * Een paar uitkomsten rekent de app zelf uit:
 *
 * - 'auto:landen-meeste'  het aantal landen van de grootste reiziger (recap)
 * - 'auto:sport-eigen'    per persoon: heeft hij zijn eigen aantal gehaald (recap)
 * - 'auto:spelers'        hoeveel mensen er vanavond meespelen (de quiz zelf)
 * - 'auto:meeste-goed'    wie de meeste voorspellingen goed had (de rest van deze lijst)
 */

export type VoorspellingSoort = 'janee' | 'getal' | 'naam' | 'open';

export interface Voorspelling {
  nr: number;
  vraag: string;
  soort: VoorspellingSoort;
  antwoorden: Record<string, string | number>;
  /** Punten per persoon als de voorspelling uitkomt. */
  inzet: Record<string, number>;
  uitkomst: string | number | null;
  /** Wie het goed had, bij open voorspellingen. */
  goed?: string[];
  /** Iets om bij de onthulling te vertellen. */
  toelichting?: string;
}

export const VOORSPELLERS = ['Joris', 'Liz', 'Eva', 'Rik', 'Bastiaan', 'Cas'] as const;

const alle = (n: number) => Object.fromEntries(VOORSPELLERS.map((p) => [p, n])) as Record<string, number>;

export const VOORSPELLINGEN: Voorspelling[] = [
  {
    nr: 1,
    vraag: 'Hoeveel van ons krijgen er dit jaar een nieuwe baan?',
    soort: 'getal',
    antwoorden: { Joris: 1, Liz: 3, Eva: 3, Rik: 2, Bastiaan: 2, Cas: 3 },
    inzet: alle(1),
    uitkomst: null,
  },
  {
    nr: 2,
    vraag: 'Woont iedereen dit jaar op zichzelf?',
    soort: 'janee',
    antwoorden: { Joris: 'ja', Liz: 'ja', Eva: 'nee', Rik: 'nee', Bastiaan: 'ja', Cas: 'ja' },
    inzet: alle(1),
    uitkomst: null,
  },
  {
    nr: 3,
    vraag: 'Wordt het dit jaar in De Bilt warmer dan 36,5 °C?',
    soort: 'janee',
    antwoorden: { Joris: 'nee', Liz: 'ja', Eva: 'nee', Rik: 'ja', Bastiaan: 'ja', Cas: 'nee' },
    inzet: alle(1),
    uitkomst: null,
  },
  {
    nr: 4,
    vraag: 'Krijgen we dit jaar een kabinet, en zit dat het jaar uit zonder nieuwe verkiezingen?',
    soort: 'janee',
    antwoorden: { Joris: 'ja', Liz: 'ja', Eva: 'ja', Rik: 'nee', Bastiaan: 'ja', Cas: 'ja' },
    inzet: alle(1),
    uitkomst: null,
    toelichting: 'Het kabinet-Jetten kwam er; of het het jaar uitzit, weten we op 31 december.',
  },
  {
    nr: 5,
    vraag: 'Hoeveel gouden medailles wint Nederland op de Olympische Winterspelen?',
    soort: 'getal',
    antwoorden: { Joris: 10, Liz: 9, Eva: 16, Rik: 7, Bastiaan: 8, Cas: 18 },
    inzet: alle(1),
    uitkomst: 10,
    toelichting: 'Precies tien keer goud in Milaan-Cortina.',
  },
  {
    nr: 6,
    vraag: 'Welk land wordt wereldkampioen voetbal?',
    soort: 'naam',
    antwoorden: { Joris: 'Spanje', Liz: 'Frankrijk', Eva: 'Spanje', Rik: 'Spanje', Bastiaan: 'Frankrijk', Cas: 'Italië' },
    inzet: alle(1),
    uitkomst: 'Spanje',
    toelichting: 'Spanje won de finale van Argentinië, na verlenging.',
  },
  {
    nr: 7,
    vraag: 'Met hoeveel mensen spelen we volgend jaar de nieuwjaarsquiz?',
    soort: 'getal',
    antwoorden: { Joris: 6, Liz: 7, Eva: 7, Rik: 7, Bastiaan: 6, Cas: 6 },
    inzet: alle(1),
    uitkomst: 'auto:spelers',
  },
  {
    nr: 8,
    vraag: 'Noem één ding dat AI in 2026 kan, wat nu nog onmogelijk lijkt.',
    soort: 'open',
    antwoorden: {
      Joris: 'Het uitbrengen van een film van minimaal 90 minuten',
      Liz: 'Mensen koppelen op basis van hun interesses en zoekgeschiedenis',
      Eva: 'Rijmen',
      Rik: 'Dat de gratis AI-versie een goed padelschema kan maken',
      Bastiaan: 'Nauwkeurig wiskundige berekeningen maken',
      Cas: 'Een volwaardige Hollywoodfilm maken',
    },
    inzet: alle(3),
    uitkomst: null,
  },
  {
    nr: 9,
    vraag: 'Hoeveel landen (inclusief Nederland) bezoekt de persoon die in 2026 het meeste reist?',
    soort: 'getal',
    antwoorden: { Joris: 11, Liz: 15, Eva: 7, Rik: 11, Bastiaan: 7, Cas: 12 },
    inzet: alle(1),
    uitkomst: 'auto:landen-meeste',
  },
  {
    nr: 10,
    vraag: 'Hoeveel keer ga jij dit jaar zelf minimaal sporten?',
    soort: 'getal',
    antwoorden: { Joris: 105, Liz: 85, Eva: 105, Rik: 104, Bastiaan: 84, Cas: 162 },
    inzet: { Joris: 2, Liz: 2, Eva: 3, Rik: 3, Bastiaan: 2, Cas: 2 },
    uitkomst: 'auto:sport-eigen',
  },
  {
    nr: 11,
    vraag: 'Wie heeft er in 2026 de meeste luisterminuten op zijn Spotify Wrapped?',
    soort: 'naam',
    antwoorden: { Joris: 'Cas', Liz: 'Cas', Eva: 'Cas', Rik: 'Cas', Bastiaan: 'Cas', Cas: 'Cas' },
    inzet: alle(1),
    uitkomst: null,
  },
  {
    nr: 12,
    vraag: 'Wat is je sportieve voornemen van 2026?',
    soort: 'open',
    antwoorden: {
      Joris: 'In een periode van 7 dagen minimaal één keer 3x hardlopen en 3x fitness hebben gedaan',
      Liz: 'Gemiddeld 2x per week sporten en me hebben ingeschreven voor een groepssport',
      Eva: 'Meer sporten dan Rik',
      Rik: 'Beter voor mijn rug zorgen: spieren in mijn rug sterker maken en meer sporten (gym, hardlopen, padel)',
      Bastiaan: 'Meer traplopen in plaats van lift of roltrap',
      Cas: 'Summerbody krijgen',
    },
    inzet: { Joris: 2, Liz: 3, Eva: 3, Rik: 2, Bastiaan: 1, Cas: 3 },
    uitkomst: null,
  },
  {
    nr: 13,
    vraag: 'Welke grote gebeurtenis zal er dit jaar zijn voor iemand in de groep?',
    soort: 'open',
    antwoorden: {
      Joris: 'Iemand wordt of is oom/tante in 2026',
      Liz: 'Iemand (Cas/Joris) krijgt een relatie en Cas vindt een huis',
      Eva: 'Eva en Rik verloofd',
      Rik: 'Cas of Joris heeft een vriendin op oud en nieuw',
      Bastiaan: 'Cas koopt een huis',
      Cas: 'Er komt dit jaar gezinsuitbreiding (baby/hond/kat)',
    },
    inzet: { Joris: 2, Liz: 2, Eva: 4, Rik: 2, Bastiaan: 2, Cas: 2 },
    uitkomst: null,
  },
  {
    nr: 14,
    vraag: 'Wie heeft er op 31 december 2026 de meeste voorspellingen van deze lijst goed?',
    soort: 'naam',
    antwoorden: { Joris: 'Joris', Liz: 'Joris', Eva: 'Eva', Rik: 'Rik', Bastiaan: 'Joris', Cas: 'Cas' },
    inzet: alle(1),
    uitkomst: 'auto:meeste-goed',
  },
];

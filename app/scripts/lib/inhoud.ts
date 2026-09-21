/**
 * Eén plek die weet hoe index.html uit packs.ts ontstaat.
 *
 * `npm run content:sync` schrijft het resultaat weg; `npm run verify` en
 * `npm run content:check` bouwen dezelfde tekst in het geheugen en kijken of
 * hij al zo op schijf staat. Zo ziet de controle of iemand vragen in packs.ts
 * heeft aangepast zonder de losse quiz bij te werken.
 *
 * Er gaan drie blokken naar de losse quiz:
 *
 * · `PAKKETTEN`     — de vragen, letterlijk overgenomen uit packs.ts.
 * · `JAAROVERZICHT` — de tijdlijn van het jaar, letterlijk overgenomen uit
 *                     jaaroverzicht.ts, zodat je hem ook zonder Node kunt
 *                     bijschrijven.
 * · `ONS_JAAR`      — onze eigen cijfers per maand. De meespeelversie rekent
 *                     die op de avond zelf uit op de verse export van
 *                     resolution-recap; de losse quiz heeft geen server, dus
 *                     die krijgt hier een momentopname mee, uitgerekend op
 *                     dezelfde manier door dezelfde code.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyseer, type RecapExport } from '../../src/lib/server/recap/analyse';
import { eigenMaand, jaarTotaal } from '../../src/lib/server/jaaroverzicht';

const hier = dirname(fileURLToPath(import.meta.url));
export const PACKS_PAD = resolve(hier, '../../src/lib/content/packs.ts');
export const FILM_PAD = resolve(hier, '../../src/lib/content/jaaroverzicht.ts');
export const SNAPSHOT_PAD = resolve(hier, '../../src/lib/content/recap-snapshot.json');
export const HTML_PAD = resolve(hier, '../../../index.html');

export interface Vergelijking {
  /** Loopt index.html al gelijk met packs.ts? */
  gelijk: boolean;
  /** De tekst die index.html hoort te hebben. */
  nieuw: string;
  aantalRondes: number;
  aantalMaanden: number;
}

/**
 * Het letterlijke blok tussen `export const X … = ` en de afsluitende regel.
 * `houd` zegt hoeveel tekens van die afsluiting er nog bij horen: de
 * accolade zelf hoort in het blok, het `as Pakketten;` erachter niet.
 */
function blokUit(bron: string, kop: string, staart: string, houd: number, bestand: string): string {
  const begin = bron.indexOf(kop);
  const eind = bron.indexOf(staart, begin);
  if (begin < 0 || eind < 0) throw new Error(`blok niet gevonden in ${bestand}: ${kop}`);
  const blok = bron.slice(begin + kop.length, eind + houd);
  if (!blok.trimEnd().endsWith('}')) throw new Error(`blok uit ${bestand} sluit niet op een accolade`);
  return blok;
}

/**
 * Onze eigen cijfers per maand, zoals de televisie ze op de avond zelf zou
 * uitrekenen. `perPersoon` blijft eruit: de losse quiz heeft geen telefoons,
 * dus daar kijkt niemand naar, en het scheelt in een bestand dat op een
 * usb-stick mee moet.
 */
function onsJaar() {
  const analyse = analyseer(JSON.parse(readFileSync(SNAPSHOT_PAD, 'utf8')) as RecapExport);
  const maanden: Record<string, unknown> = {};
  for (let nr = 1; nr <= 12; nr++) {
    const { perPersoon, ...rest } = eigenMaand(analyse, nr);
    void perPersoon;
    maanden[String(nr)] = rest;
  }
  return { peildatum: analyse.peildatum, jaartotaal: jaarTotaal(analyse), maanden };
}

export function vergelijkInhoud(): Vergelijking {
  const bron = readFileSync(PACKS_PAD, 'utf8');
  const film = readFileSync(FILM_PAD, 'utf8');
  const html = readFileSync(HTML_PAD, 'utf8');

  const demo = bron.match(/const DEMO_BEELD = ("(?:[^"\\]|\\.)*");/);
  if (!demo) throw new Error('DEMO_BEELD niet gevonden in packs.ts');

  const blok = blokUit(bron, 'export const PAKKETTEN: Pakketten = ', '} as Pakketten;', 1, 'packs.ts');
  const filmBlok = blokUit(film, 'export const JAAROVERZICHT: Jaaroverzicht = ', '\n};', 2, 'jaaroverzicht.ts');

  const htmlBegin = html.indexOf('const DEMO_BEELD = ');
  const htmlEind = html.indexOf('\nconst STANDAARD_SPELERS');
  if (htmlBegin < 0 || htmlEind < 0) throw new Error('inhoudsblok niet gevonden in index.html');

  const nieuw =
    html.slice(0, htmlBegin) +
    `const DEMO_BEELD = ${demo[1]};\n\nconst PAKKETTEN = ${blok};\n\n` +
    `const JAAROVERZICHT = ${filmBlok};\n\n` +
    '/* Onze eigen cijfers per maand: een momentopname uit resolution-recap,\n' +
    '   uitgerekend door npm run content:sync. De meespeelversie rekent ze op\n' +
    '   de avond zelf uit op de verse cijfers. */\n' +
    `const ONS_JAAR = ${JSON.stringify(onsJaar(), null, 2)};\n` +
    html.slice(htmlEind);

  const aantalRondes = (blok.match(/\n\s{6}\{\n\s+naam:/g) ?? []).length;
  const aantalMaanden = (filmBlok.match(/\n\s{6}nr: \d+,/g) ?? []).length;
  return { gelijk: nieuw === html, nieuw, aantalRondes, aantalMaanden };
}

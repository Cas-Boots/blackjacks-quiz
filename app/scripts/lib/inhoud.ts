/**
 * Eén plek die weet hoe index.html uit packs.ts ontstaat.
 *
 * `npm run content:sync` schrijft het resultaat weg; `npm run verify` en
 * `npm run content:check` bouwen dezelfde tekst in het geheugen en kijken of
 * hij al zo op schijf staat. Zo ziet de controle of iemand vragen in packs.ts
 * heeft aangepast zonder de losse quiz bij te werken.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const hier = dirname(fileURLToPath(import.meta.url));
export const PACKS_PAD = resolve(hier, '../../src/lib/content/packs.ts');
export const HTML_PAD = resolve(hier, '../../../index.html');

export interface Vergelijking {
  /** Loopt index.html al gelijk met packs.ts? */
  gelijk: boolean;
  /** De tekst die index.html hoort te hebben. */
  nieuw: string;
  aantalRondes: number;
}

export function vergelijkInhoud(): Vergelijking {
  const bron = readFileSync(PACKS_PAD, 'utf8');
  const html = readFileSync(HTML_PAD, 'utf8');

  const demo = bron.match(/const DEMO_BEELD = ("(?:[^"\\]|\\.)*");/);
  if (!demo) throw new Error('DEMO_BEELD niet gevonden in packs.ts');

  const begin = bron.indexOf('export const PAKKETTEN: Pakketten = ');
  const eind = bron.indexOf('} as Pakketten;');
  if (begin < 0 || eind < 0) throw new Error('PAKKETTEN-blok niet gevonden in packs.ts');
  const blok = bron.slice(begin + 'export const PAKKETTEN: Pakketten = '.length, eind + 1);

  const htmlBegin = html.indexOf('const DEMO_BEELD = ');
  const htmlEind = html.indexOf('\nconst STANDAARD_SPELERS');
  if (htmlBegin < 0 || htmlEind < 0) throw new Error('PAKKETTEN-blok niet gevonden in index.html');

  const nieuw =
    html.slice(0, htmlBegin) +
    `const DEMO_BEELD = ${demo[1]};\n\nconst PAKKETTEN = ${blok};\n` +
    html.slice(htmlEind);

  const aantalRondes = (blok.match(/\n\s{6}\{\n\s+naam:/g) ?? []).length;
  return { gelijk: nieuw === html, nieuw, aantalRondes };
}

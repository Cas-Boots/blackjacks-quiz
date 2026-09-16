/**
 * Haalt het PAKKETTEN-blok uit de losse HTML-quiz en schrijft het als
 * getypte module naar src/lib/content/packs.ts.
 *
 * De losse quiz blijft daarmee de bron van de vragen, zodat de app en het
 * ene-bestand-scherm nooit uit elkaar lopen. Draai dit opnieuw zodra je
 * vragen aanpast in ../index.html.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const hier = dirname(fileURLToPath(import.meta.url));
const htmlPad = resolve(hier, '../../index.html');
const uitPad = resolve(hier, '../src/lib/content/packs.ts');

const html = readFileSync(htmlPad, 'utf8');

const demoMatch = html.match(/const DEMO_BEELD = ("(?:[^"\\]|\\.)*");/);
if (!demoMatch) throw new Error('DEMO_BEELD niet gevonden in index.html');

const start = html.indexOf('const PAKKETTEN = {');
const eind = html.indexOf('\nconst STANDAARD_SPELERS');
if (start < 0 || eind < 0) throw new Error('PAKKETTEN-blok niet gevonden in index.html');

const blok = html
  .slice(start, eind)
  .replace(/^const PAKKETTEN = /, '')
  .trim()
  .replace(/;$/, '');

const uit = `// AUTOMATISCH GEGENEREERD — niet met de hand aanpassen.
// Bron: ../../index.html. Opnieuw genereren met: npm run content:sync
import type { Pakketten } from './types';

const DEMO_BEELD = ${demoMatch[1]};

export const PAKKETTEN: Pakketten = ${blok} as Pakketten;

export const PAKKET_IDS = Object.keys(PAKKETTEN);
`;

writeFileSync(uitPad, uit);

const aantalRondes = (blok.match(/\n\s{6}\{\n\s+naam:/g) ?? []).length;
console.log(`packs.ts geschreven — ${Object.keys(JSON.parse(JSON.stringify({}))).length + aantalRondes} rondes, ${uit.length} tekens`);

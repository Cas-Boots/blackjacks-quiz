/**
 * Eén bron voor de vragen: src/lib/content/packs.ts.
 *
 * Dat bestand is getypt, dus een vergeten antwoord of een verkeerd vraagtype
 * valt bij `npm run check` al om. De losse HTML-quiz kan geen module
 * importeren (hij moet vanaf een usb-stick werken, zonder server), dus dit
 * script schrijft hetzelfde blok in ../index.html. Met --check controleert
 * het alleen of de twee nog gelijk lopen; dat draait in CI.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const hier = dirname(fileURLToPath(import.meta.url));
const bronPad = resolve(hier, '../src/lib/content/packs.ts');
const htmlPad = resolve(hier, '../../index.html');
const alleenControleren = process.argv.includes('--check');

const bron = readFileSync(bronPad, 'utf8');
const html = readFileSync(htmlPad, 'utf8');

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

if (nieuw === html) {
  console.log(`index.html loopt gelijk met packs.ts — ${aantalRondes} rondes.`);
} else if (alleenControleren) {
  console.error('index.html loopt achter op src/lib/content/packs.ts. Draai: npm run content:sync');
  process.exit(1);
} else {
  writeFileSync(htmlPad, nieuw);
  console.log(`index.html bijgewerkt — ${aantalRondes} rondes, ${nieuw.length} tekens.`);
}

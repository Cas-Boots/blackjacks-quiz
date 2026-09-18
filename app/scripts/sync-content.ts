/**
 * Eén bron voor de vragen: src/lib/content/packs.ts.
 *
 * Dat bestand is getypt, dus een vergeten antwoord of een verkeerd vraagtype
 * valt bij `npm run check` al om. De losse HTML-quiz kan geen module
 * importeren (hij moet vanaf een usb-stick werken, zonder server), dus dit
 * script schrijft hetzelfde blok in ../index.html. Met --check controleert
 * het alleen of de twee nog gelijk lopen; dat draait in CI.
 */
import { writeFileSync } from 'node:fs';
import { vergelijkInhoud, HTML_PAD } from './lib/inhoud';

const alleenControleren = process.argv.includes('--check');
const { gelijk, nieuw, aantalRondes } = vergelijkInhoud();

if (gelijk) {
  console.log(`index.html loopt gelijk met packs.ts — ${aantalRondes} rondes.`);
} else if (alleenControleren) {
  console.error('index.html loopt achter op src/lib/content/packs.ts. Draai: npm run content:sync');
  process.exit(1);
} else {
  writeFileSync(HTML_PAD, nieuw);
  console.log(`index.html bijgewerkt — ${aantalRondes} rondes, ${nieuw.length} tekens.`);
}

/**
 * Is de speling bij ieder zijn eigen getal eerlijk? Een vergelijking.
 *
 * Bij "hoeveel weken loop jij achter op Cas?" heeft iedereen een ander
 * antwoord, van een paar weken tot een halfjaar. Dit script bootst per
 * speler duizenden gokken na en telt hoe vaak die binnen de speling vallen,
 * voor een vaste marge in weken, een marge in procenten, en de regel die de
 * app gebruikt (shared/eigengetal.ts: per vijf weken een week, minstens twee).
 * Eerlijk is: iedereen ongeveer even veel kans.
 *
 * Hoe mensen ernaast zitten weten we niet; daarom drie aannames naast
 * elkaar. De mix is die uit het spanningsmodel (EIGEN_GOK).
 *
 *   npm run marge
 *   npm run marge -- --haas Cas --gokken 100000
 */
import snapshot from '../src/lib/content/recap-snapshot.json';
import { analyseer, type RecapExport } from '../src/lib/server/recap/analyse';
import { beantwoord } from '../src/lib/server/recap/vragen';
import { SPELING, binnenSpeling } from '../src/lib/shared/eigengetal';
import { EIGEN_GOK, gokEigen, SPELERS, zaai } from './spanning-model';

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i].startsWith('--')) args.set(process.argv[i].slice(2), process.argv[i + 1] ?? '');
}
const HAAS = args.get('haas') ?? 'Cas';
const GOKKEN = Number(args.get('gokken') ?? 50_000);

const uit = beantwoord(`sport.achterstand:${HAAS}`, analyseer(snapshot as unknown as RecapExport));
if (!uit?.eigenGetal) throw new Error('geen achterstanden uit te rekenen');
const doelen = Object.entries(uit.eigenGetal).filter(([naam]) => (SPELERS as readonly string[]).includes(naam));

const regels: [string, (gok: number, doel: number) => boolean][] = [
  ['binnen 2 weken', (g, d) => Math.abs(g - d) <= 2],
  ['binnen 3 weken', (g, d) => Math.abs(g - d) <= 3],
  ['binnen 4 weken', (g, d) => Math.abs(g - d) <= 4],
  ['binnen 20%', (g, d) => binnenSpeling(g, d, { minimaal: 0, deel: 0.2 })],
  ['binnen 30%', (g, d) => binnenSpeling(g, d, { minimaal: 0, deel: 0.3 })],
  [`de app: ${SPELING.minimaal} weken of ${SPELING.deel * 100}%`, (g, d) => binnenSpeling(g, d)],
  ['3 weken of 20%', (g, d) => binnenSpeling(g, d, { minimaal: 3, deel: 0.2 })],
];
const modellen: [string, { deel: number; weken: number }][] = [
  ['in verhouding mis (±35%)', { deel: 0.35, weken: 0 }],
  ['altijd ± 5 weken mis', { deel: 0, weken: 5 }],
  [`mix (±${EIGEN_GOK.deel * 100}% en ±${EIGEN_GOK.weken} weken), het spanningsmodel`, EIGEN_GOK],
];

console.log(`\nAchterstand op ${HAAS} (peildatum ${analyseer(snapshot as unknown as RecapExport).peildatum}), ${GOKKEN.toLocaleString('nl-NL')} gokken per speler.`);
console.log('De namen staan op volgorde van achterstand; de getallen zelf laat het script weg, zodat je ze nog kunt raden.');
for (const [label, model] of modellen) {
  zaai(20261231);
  console.log(`\nAls je ${label}: kans om te scoren`);
  console.log('regel'.padEnd(26) + doelen.map(([n]) => n.padStart(10)).join('') + '   hoogste/laagste');
  for (const [naam, regel] of regels) {
    const kansen = doelen.map(([, d]) => {
      let raak = 0;
      for (let i = 0; i < GOKKEN; i++) if (regel(gokEigen(d, model), d)) raak++;
      return raak / GOKKEN;
    });
    const verhouding = Math.max(...kansen) / Math.max(1e-9, Math.min(...kansen));
    console.log(naam.padEnd(26) + kansen.map((k) => `${Math.round(k * 100)}%`.padStart(10)).join('') + verhouding.toFixed(1).padStart(10));
  }
}
console.log('\nEerlijk: hoogste/laagste dicht bij 1, in alle drie de aannames.');

/**
 * Hoe spannend blijft de avond? Een simulatie op basis van wie wat weet.
 *
 * Speelt de standaardavond uit packs.ts duizenden keren na, met de echte
 * teamindeling (maakTeams, dus eerlijke teams naar kennis en Joris en Rik
 * samen bij Dichtstbij Wint), de echte gouden kaarten en dubbele slotrondes
 * (vermenigvuldigers) en de echte telling (berekenBonussen). Alleen wie een
 * vraag goed heeft en hoe snel, komt uit de profielen in spanning-model.ts:
 * dat zijn aannames, bijstellen mag.
 *
 * Elke gesimuleerde avond wordt met dezelfde antwoorden en tijden doorgerekend
 * voor elke ondergrens van de snelheid, zodat je alleen het effect van die
 * regel ziet.
 *
 *   npm run spanning                      # 20.000 avonden
 *   npm run spanning -- --avonden 5000
 *   npm run spanning -- --minimum 0.5,0.75,1
 */
import { vermenigvuldigers, vermenigvuldigerVan } from '../src/lib/server/vermenigvuldiger';
import { berekenBonussen, PUNT_WAARDE, type BonusVraag } from '../src/lib/server/bonus';
import { eersteGeheimeRonde } from '../src/lib/shared/bonus';
import { isAfrekening } from '../src/lib/shared/state';
import { rondes, spelers, speelRonde, toeval } from './spanning-model';

/* De profielen (wie wat weet, en hoe snel) staan in spanning-model.ts. */

/* ---- Instellingen ------------------------------------------------------- */

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i].startsWith('--')) args.set(process.argv[i].slice(2), process.argv[i + 1] ?? '');
}
const AVONDEN = Number(args.get('avonden') ?? 20_000);
const MINIMA = (args.get('minimum') ?? '0.5,0.75,1').split(',').map(Number);

interface Gespeeld {
  /** Per vraag de BonusVraag, in speelvolgorde. */
  vragen: BonusVraag[];
  /** Per vraag: de punten die je zonder snelheid hoogstens kon halen (voor 'nog kanshebbers'). */
  maxPerVraag: number[];
  /** Bij welke ronde elke vraag hoort. */
  rondeVan: number[];
  /** Punten uit de afrekening van de voorspellingen, per ronde, buiten de vragen om. */
  afrekening: Map<number, Record<number, number>>;
}

function speelAvond(): Gespeeld {
  const v = vermenigvuldigers(Math.floor(toeval() * 1e9), rondes);
  const uit: Gespeeld = { vragen: [], maxPerVraag: [], rondeVan: [], afrekening: new Map() };
  rondes.forEach((r, ri) => {
    const g = speelRonde(r, ri);
    if (g.afrekening) {
      uit.afrekening.set(ri, g.afrekening);
      return;
    }
    g.vragen.forEach((vraag, vi) => {
      const mult = vermenigvuldigerVan(v[ri], vi);
      uit.vragen.push({ ...vraag, vermenigvuldiger: mult });
      uit.maxPerVraag.push(g.max[vi] * mult);
      uit.rondeVan.push(ri);
    });
  });
  return uit;
}

/* ---- Tellen en meten ----------------------------------------------------- */

/** De stand na elke ronde, voor deze ondergrens van de snelheid. */
function standNaRondes(avond: Gespeeld, minimumDeel: number): Record<number, number>[] {
  const { perVraag } = berekenBonussen(avond.vragen, { minimumDeel });
  const stand: Record<number, number> = Object.fromEntries(spelers.map((s) => [s.id, 0]));
  const naRonde: Record<number, number>[] = [];
  let q = 0;
  for (let ri = 0; ri < rondes.length; ri++) {
    for (; q < avond.vragen.length && avond.rondeVan[q] === ri; q++) {
      for (const [id, p] of Object.entries(perVraag.get(avond.vragen[q].sleutel)?.punten ?? {})) stand[Number(id)] += p;
    }
    for (const [id, p] of Object.entries(avond.afrekening.get(ri) ?? {})) stand[Number(id)] += p;
    naRonde.push({ ...stand });
  }
  return naRonde;
}

const geheimVanaf = eersteGeheimeRonde(rondes.length, rondes.findIndex((_, i) => {
  // De eerste dubbele slotronde, zoals de server hem vindt.
  return vermenigvuldigers(1, rondes)[i]?.dubbel;
}));
const halverwege = Math.floor(rondes.length / 2) - 1;

interface Meting {
  winst: Record<number, number>;
  leiderHalverwegeWint: number;
  leiderVoorGeheimWint: number;
  gatEind: number[];
  nekAanNek: number;
  kanshebbersVoorGeheim: number;
  /** Na hoeveel rondes de winnaar niet meer in te halen was (rekenkundig). */
  beslistNa: number[];
}

function nieuweMeting(): Meting {
  return { winst: {}, leiderHalverwegeWint: 0, leiderVoorGeheimWint: 0, gatEind: [], nekAanNek: 0, kanshebbersVoorGeheim: 0, beslistNa: [] };
}

const koploper = (stand: Record<number, number>) =>
  Number(Object.entries(stand).sort((a, b) => b[1] - a[1])[0][0]);

const metingen = new Map(MINIMA.map((m) => [m, nieuweMeting()]));

for (let n = 0; n < AVONDEN; n++) {
  const avond = speelAvond();
  // Wat er na een ronde nog hoogstens te halen valt (zonder snelheidsaftrek).
  const restNa = rondes.map((_, ri) => {
    let rest = 0;
    avond.vragen.forEach((_, q) => { if (avond.rondeVan[q] > ri) rest += avond.maxPerVraag[q]; });
    rondes.forEach((r, rj) => { if (rj > ri && isAfrekening(r)) rest += r.vragen.length * r.punten * PUNT_WAARDE; });
    return rest;
  });

  for (const minimum of MINIMA) {
    const m = metingen.get(minimum)!;
    const naRonde = standNaRondes(avond, minimum);
    const eind = naRonde[naRonde.length - 1];
    const winnaar = koploper(eind);
    m.winst[winnaar] = (m.winst[winnaar] ?? 0) + 1;
    if (koploper(naRonde[halverwege]) === winnaar) m.leiderHalverwegeWint++;
    if (geheimVanaf > 0 && koploper(naRonde[geheimVanaf - 1]) === winnaar) m.leiderVoorGeheimWint++;

    const gesorteerd = Object.values(eind).sort((a, b) => b - a);
    m.gatEind.push(gesorteerd[0] - gesorteerd[1]);
    if (gesorteerd[0] - gesorteerd[1] < 1000) m.nekAanNek++;

    if (geheimVanaf > 0) {
      const voor = naRonde[geheimVanaf - 1];
      const top = Math.max(...Object.values(voor));
      m.kanshebbersVoorGeheim += Object.values(voor).filter((p) => top - p <= restNa[geheimVanaf - 1] * 0.5).length;
    }

    // Rekenkundig beslist: niemand kan de koploper nog inhalen, ook niet met alles goed en meteen.
    let beslist = rondes.length;
    for (let ri = 0; ri < rondes.length; ri++) {
      const s = Object.values(naRonde[ri]).sort((a, b) => b - a);
      if (s[0] - s[1] > restNa[ri]) { beslist = ri + 1; break; }
    }
    m.beslistNa.push(beslist);
  }
}

/* ---- Verslag ------------------------------------------------------------- */

const pct = (x: number) => `${Math.round((100 * x) / AVONDEN)}%`.padStart(5);
const mediaan = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

console.log(`\n${AVONDEN.toLocaleString('nl-NL')} gesimuleerde avonden, ${rondes.length} rondes, ${rondes.reduce((n, r) => n + r.vragen.length, 0)} vragen.`);
console.log(`Halverwege = na ronde ${halverwege + 1}; de stand wordt geheim vanaf ronde ${geheimVanaf + 1}.\n`);
console.log('Ondergrens snelheid'.padEnd(34) + MINIMA.map((m) => `${Math.round(m * 100)}%`.padStart(9)).join(''));
const rij = (label: string, f: (m: Meting) => string) =>
  console.log(label.padEnd(34) + MINIMA.map((m) => f(metingen.get(m)!).padStart(9)).join(''));
for (const s of spelers) rij(`Winkans ${s.naam}`, (m) => pct(m.winst[s.id] ?? 0));
rij('Koploper halverwege wint', (m) => pct(m.leiderHalverwegeWint));
rij('Koploper vóór de geheime stand wint', (m) => pct(m.leiderVoorGeheimWint));
rij('Kanshebbers vóór de geheime stand', (m) => (m.kanshebbersVoorGeheim / AVONDEN).toFixed(1));
rij('Nek aan nek (< 1.000 verschil)', (m) => pct(m.nekAanNek));
rij('Gat 1e–2e aan het eind (mediaan)', (m) => mediaan(m.gatEind).toLocaleString('nl-NL'));
rij('Rekenkundig beslist na ronde (med.)', (m) => String(mediaan(m.beslistNa)));
console.log(`\nKanshebbers: wie op minder dan de helft van wat er nog te halen valt achter de koploper staat.`);

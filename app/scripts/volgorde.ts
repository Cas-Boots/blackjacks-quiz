/**
 * Maakt de volgorde van de rondes uit voor de spanning?
 *
 * Warmdraaien blijft de opener; de andere rondes van de standaardavond gaan in
 * elke mogelijke volgorde. De volgorde bepaalt welke twee rondes als
 * slotronde dubbel tellen (de laatste twee echte rondes, de afrekening van de
 * voorspellingen niet meegerekend) en waar de geheime stand begint.
 *
 * Elke avond wordt één keer per ronde nagespeeld (spanning-model.ts) en dan
 * voor elke volgorde doorgerekend, zodat alle volgordes dezelfde avonden
 * krijgen en je alleen het effect van de volgorde ziet.
 *
 *   npm run volgorde                     # 3.000 avonden per volgorde
 *   npm run volgorde -- --avonden 10000
 */
import { berekenBonussen } from '../src/lib/server/bonus';
import { DUBBELE_SLOTRONDES, GOUDEN_KAART, eersteGeheimeRonde } from '../src/lib/shared/bonus';
import { isAfrekening } from '../src/lib/shared/state';
import { rondes, spelers, speelRonde, toeval } from './spanning-model';

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i].startsWith('--')) args.set(process.argv[i].slice(2), process.argv[i + 1] ?? '');
}
const AVONDEN = Number(args.get('avonden') ?? 3000);
const N = rondes.length;
const P = spelers.length;
const MINSTE_VRAGEN_VOOR_GOUD = 3;

/* ---- Eén avond: per ronde de punten, los van de plek in de volgorde ------ */

interface RondeUitkomst {
  /** Per speler de punten van de hele ronde, zonder vermenigvuldiger. */
  som: Float64Array;
  /** Per speler wat de gouden kaart er nog eens bij doet (de punten van die ene vraag). */
  goud: Float64Array;
  /** Wat één speler hoogstens kon halen, zonder vermenigvuldiger, en de gouden vraag daarvan. */
  maxSom: number;
  maxGoud: number;
}

function speelAvond(): RondeUitkomst[] {
  return rondes.map((r, ri) => {
    const g = speelRonde(r, ri);
    const som = new Float64Array(P);
    const goud = new Float64Array(P);
    if (g.afrekening) {
      for (const [id, p] of Object.entries(g.afrekening)) som[Number(id) - 1] = p;
      const max = r.vragen.length * r.punten * 500;
      return { som, goud, maxSom: max, maxGoud: 0 };
    }
    // Snelheid hangt per vraag alleen van die vraag af (geen reeksen meer),
    // dus de ronde kan los worden geteld.
    const { perVraag } = berekenBonussen(g.vragen);
    const goudVraag = r.vragen.length >= MINSTE_VRAGEN_VOOR_GOUD ? Math.floor(toeval() * r.vragen.length) : -1;
    g.vragen.forEach((vraag, vi) => {
      for (const [id, p] of Object.entries(perVraag.get(vraag.sleutel)?.punten ?? {})) {
        som[Number(id) - 1] += p;
        if (vi === goudVraag) goud[Number(id) - 1] += p * (GOUDEN_KAART - 1);
      }
    });
    const maxSom = g.max.reduce((a, b) => a + b, 0);
    return { som, goud, maxSom, maxGoud: goudVraag >= 0 ? g.max[goudVraag] * (GOUDEN_KAART - 1) : 0 };
  });
}

/* ---- Alle volgordes, met Warmdraaien voorop -------------------------------- */

function permutaties(lijst: number[]): number[][] {
  if (lijst.length <= 1) return [lijst];
  return lijst.flatMap((x, i) => permutaties([...lijst.slice(0, i), ...lijst.slice(i + 1)]).map((p) => [x, ...p]));
}
const rest = Array.from({ length: N - 1 }, (_, i) => i + 1);
const volgordes = permutaties(rest).map((p) => [0, ...p]);
const huidigeSleutel = Array.from({ length: N }, (_, i) => i).join(',');

/** Per volgorde: welke plekken dubbel tellen, en waar het geheim begint. */
const opzet = volgordes.map((v) => {
  const speelbaar = v.map((ri, plek) => ({ ri, plek })).filter(({ ri }) => !isAfrekening(rondes[ri]));
  const slot = new Set(speelbaar.length > DUBBELE_SLOTRONDES ? speelbaar.slice(-DUBBELE_SLOTRONDES).map(({ plek }) => plek) : []);
  const eersteDubbel = Math.min(...[...slot], Infinity);
  const geheimVanaf = eersteGeheimeRonde(N, Number.isFinite(eersteDubbel) ? eersteDubbel : -1);
  return { v, slot, geheimVanaf };
});

interface Meting {
  leiderHalverwegeWint: number;
  /** De koploper vóór de laatste twee rondes wint: een vast meetpunt, voor elke volgorde gelijk. */
  leiderVoorSlotWint: number;
  leiderVoorGeheimWint: number;
  nekAanNek: number;
  kanshebbers: number;
  winst: Float64Array;
}
const metingen: Meting[] = volgordes.map(() => ({
  leiderHalverwegeWint: 0, leiderVoorSlotWint: 0, leiderVoorGeheimWint: 0, nekAanNek: 0, kanshebbers: 0, winst: new Float64Array(P),
}));

const halverwege = Math.floor(N / 2) - 1;
const voorSlot = N - 3;
const stand = new Float64Array(P);
const leiderNa = new Int32Array(N);
const restNa = new Float64Array(N);

function koploper(s: Float64Array): number {
  let beste = 0;
  for (let i = 1; i < P; i++) if (s[i] > s[beste]) beste = i;
  return beste;
}

const start = Date.now();
for (let n = 0; n < AVONDEN; n++) {
  const avond = speelAvond();
  for (let k = 0; k < volgordes.length; k++) {
    const { v, slot, geheimVanaf } = opzet[k];
    stand.fill(0);
    // Wat er na elke plek nog hoogstens te halen valt.
    let nog = 0;
    for (let plek = N - 1; plek >= 0; plek--) {
      restNa[plek] = nog;
      const u = avond[v[plek]];
      nog += (u.maxSom + u.maxGoud) * (slot.has(plek) ? 2 : 1);
    }
    let voorGeheim: Float64Array | null = null;
    for (let plek = 0; plek < N; plek++) {
      const u = avond[v[plek]];
      const m = slot.has(plek) ? 2 : 1;
      for (let p = 0; p < P; p++) stand[p] += (u.som[p] + u.goud[p]) * m;
      leiderNa[plek] = koploper(stand);
      if (plek === geheimVanaf - 1) voorGeheim = Float64Array.from(stand);
    }
    const winnaar = leiderNa[N - 1];
    const mt = metingen[k];
    mt.winst[winnaar]++;
    if (leiderNa[halverwege] === winnaar) mt.leiderHalverwegeWint++;
    if (leiderNa[voorSlot] === winnaar) mt.leiderVoorSlotWint++;
    if (geheimVanaf > 0 && leiderNa[geheimVanaf - 1] === winnaar) mt.leiderVoorGeheimWint++;
    const s = Array.from(stand).sort((a, b) => b - a);
    if (s[0] - s[1] < 1000) mt.nekAanNek++;
    if (voorGeheim) {
      const top = Math.max(...voorGeheim);
      const grens = restNa[geheimVanaf - 1] * 0.5;
      for (let p = 0; p < P; p++) if (top - voorGeheim[p] <= grens) mt.kanshebbers++;
    }
  }
}

/* ---- Verslag ------------------------------------------------------------- */

const kort = (ri: number) => rondes[ri].naam.replace('Wie van de Blackjacks?', 'Wie van ons?').replace('Onze Sportcompetitie', 'Sport').replace('De Voorspellingen', 'Voorspellingen').replace('2026 in Emoji', 'Emoji').replace('Dichtstbij Wint', 'Dichtstbij').replace('De Hitparade', 'Hitparade');
const pct = (x: number) => `${((100 * x) / AVONDEN).toFixed(0)}%`;
const rangschik = [...metingen.keys()].sort(
  (a, b) => metingen[a].leiderVoorSlotWint - metingen[b].leiderVoorSlotWint || metingen[b].nekAanNek - metingen[a].nekAanNek,
);
const huidig = volgordes.findIndex((v) => v.join(',') === huidigeSleutel);

const beschrijf = (k: number) => {
  const m = metingen[k];
  const { v, slot, geheimVanaf } = opzet[k];
  const rij = v.map((ri, plek) => (slot.has(plek) ? `${kort(ri)}×2` : kort(ri))).join(' → ');
  const geheim = `geheim de laatste ${N - geheimVanaf}`;
  const winst = spelers.map((s, i) => `${s.naam.slice(0, 3)} ${pct(m.winst[i])}`).join(' ');
  return `${rij}\n    koploper na ronde ${voorSlot + 1} wint ${pct(m.leiderVoorSlotWint)} · na ronde ${halverwege + 1} ${pct(m.leiderHalverwegeWint)} · nek aan nek ${pct(m.nekAanNek)} · ${geheim}, koploper daarvoor wint ${pct(m.leiderVoorGeheimWint)}\n    winkans: ${winst}`;
};

console.log(`\n${volgordes.length.toLocaleString('nl-NL')} volgordes × ${AVONDEN.toLocaleString('nl-NL')} avonden (${((Date.now() - start) / 1000).toFixed(0)} s). Gerangschikt op: hoe vaak de koploper na ronde ${voorSlot + 1}, vóór de laatste twee rondes, ook wint (lager is spannender).\n`);
console.log(`Nu (plek ${rangschik.indexOf(huidig) + 1} van ${volgordes.length}):\n  ${beschrijf(huidig)}\n`);
console.log('De vijf spannendste:');
for (const k of rangschik.slice(0, 5)) console.log(`  ${beschrijf(k)}`);
console.log('\nDe drie minst spannende:');
for (const k of rangschik.slice(-3)) console.log(`  ${beschrijf(k)}`);

// Het patroon: wat doet het met de spanning als een ronde een slotronde is?
console.log(`\nPer ronde: als slotronde (×2) tegenover elders — koploper na ronde ${voorSlot + 1} wint:`);
for (let ri = 1; ri < N; ri++) {
  if (isAfrekening(rondes[ri])) continue;
  const alsSlot: number[] = [];
  const elders: number[] = [];
  opzet.forEach(({ v, slot }, k) => (slot.has(v.indexOf(ri)) ? alsSlot : elders).push(metingen[k].leiderVoorSlotWint));
  const gem = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  console.log(`  ${kort(ri).padEnd(16)} als slot ${pct(gem(alsSlot)).padStart(4)}   elders ${pct(gem(elders)).padStart(4)}`);
}
const allen = metingen.map((m) => m.leiderVoorSlotWint).sort((a, b) => a - b);
console.log(`\nSpreiding over alle volgordes: ${pct(allen[0])} tot ${pct(allen[allen.length - 1])} (mediaan ${pct(allen[Math.floor(allen.length / 2)])}).`);

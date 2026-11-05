/**
 * Hoe spannend blijft de avond? Een simulatie op basis van wie wat weet.
 *
 * Speelt de standaardavond uit packs.ts duizenden keren na, met de echte
 * teamindeling (maakTeams, dus eerlijke teams naar kennis en Joris en Rik
 * samen bij Dichtstbij Wint), de echte gouden kaarten en dubbele slotrondes
 * (vermenigvuldigers) en de echte telling (berekenBonussen). Alleen wie een
 * vraag goed heeft en hoe snel, komt uit de profielen hieronder: dat zijn
 * aannames, bijstellen mag.
 *
 * Elke gesimuleerde avond wordt met dezelfde antwoorden en tijden doorgerekend
 * voor elke ondergrens van de snelheid, zodat je alleen het effect van die
 * regel ziet.
 *
 *   npm run spanning                      # 20.000 avonden
 *   npm run spanning -- --avonden 5000
 *   npm run spanning -- --minimum 0.5,0.75,1
 */
import { PAKKETTEN } from '../src/lib/content/packs';
import { standaardVragen } from '../src/lib/content/keuze';
import type { Ronde } from '../src/lib/content/types';
import { maakTeams } from '../src/lib/server/teams';
import { vermenigvuldigers, vermenigvuldigerVan } from '../src/lib/server/vermenigvuldiger';
import { berekenBonussen, PUNT_WAARDE, type BonusVraag } from '../src/lib/server/bonus';
import { eersteGeheimeRonde } from '../src/lib/shared/bonus';
import { isAfrekening } from '../src/lib/shared/state';

/* ---- De aannames: wie weet wat, en hoe snel ------------------------------ */

const SPELERS = ['Joris', 'Rik', 'Eva', 'Liz', 'Bastiaan'] as const;
type Naam = (typeof SPELERS)[number];

/** Nieuwskennis, zoals NIEUWS in packs.ts. */
const NIEUWS: Record<Naam, number> = { Joris: 4, Rik: 3, Eva: 2, Liz: 1, Bastiaan: 1 };

/** Kans op goed per niveau van nieuwskennis. */
const KANS = {
  /** Waar of niet waar: wie het niet weet, gokt nog altijd de helft goed. */
  waarnietwaar: { 4: 0.82, 3: 0.76, 2: 0.66, 1: 0.58 } as Record<number, number>,
  /** Een open nieuwsvraag, per persoon; een team heeft het goed als één het weet. */
  openNieuws: { 4: 0.5, 3: 0.42, 2: 0.3, 1: 0.2 } as Record<number, number>,
};
/** Muziek: alleen Joris en Rik zijn er echt goed in (MUZIEK in packs.ts). */
const MUZIEK: Record<Naam, number> = { Joris: 0.55, Rik: 0.55, Eva: 0.25, Liz: 0.25, Bastiaan: 0.25 };
/** Vragen over onszelf (de sportcompetitie): voor iedereen even moeilijk. */
const OVER_ONSZELF = 0.45;
/** Een voorspelling uit januari die uitkwam. */
const VOORSPELLING_UIT = 0.35;
/** Bij een stemvraag met de meerderheid meestemmen. */
const MET_DE_MEERDERHEID = 0.6;
/** Dichtstbij: kans dat het team met Joris en Rik het dichtst zit, en kans op precies goed. */
const DICHTSTBIJ_KENNERS = 0.55;
const PRECIES_GOED = 0.06;

/**
 * Hoe snel wie het goed heeft antwoordt, als deel van de klok (0 is meteen):
 * gemiddeld, met een spreiding. Wie het nieuws volgt, weet het sneller.
 */
const SNELHEID = {
  nieuws: { 4: 0.25, 3: 0.3, 2: 0.38, 1: 0.45 } as Record<number, number>,
  overOnszelf: 0.4,
  spreiding: 0.12,
};

/* ---- Instellingen ------------------------------------------------------- */

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i].startsWith('--')) args.set(process.argv[i].slice(2), process.argv[i + 1] ?? '');
}
const AVONDEN = Number(args.get('avonden') ?? 20_000);
const MINIMA = (args.get('minimum') ?? '0.5,0.75,1').split(',').map(Number);

/* ---- Toeval met een vaste start, zodat een run herhaalbaar is ------------ */

let zaad = 20261231;
function toeval(): number {
  // mulberry32
  zaad |= 0;
  zaad = (zaad + 0x6d2b79f5) | 0;
  let t = Math.imul(zaad ^ (zaad >>> 15), 1 | zaad);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const kans = (p: number) => toeval() < p;
function normaal(gem: number, sd: number): number {
  const u = Math.max(1e-9, toeval());
  const v = toeval();
  return gem + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const klem = (x: number) => Math.min(1, Math.max(0, x));

/* ---- De avond ------------------------------------------------------------ */

const pakket = PAKKETTEN.jaar2026;
const rondes: Ronde[] = pakket.rondes
  .map((r) => ({ ...r, vragen: standaardVragen(r).map((i) => r.vragen[i]) }))
  .filter((r) => r.vragen.length > 0);
const spelers = SPELERS.map((naam, i) => ({ id: i + 1, naam }));
const naamVan = (id: number) => SPELERS[id - 1];

/** Welk soort kennis een ronde vraagt. */
function soortVan(r: Ronde): 'nieuws' | 'muziek' | 'onszelf' | 'voorspellingen' | 'stem' | 'dichtstbij' {
  if (isAfrekening(r)) return 'voorspellingen';
  if (r.type === 'stem') return 'stem';
  if (r.type === 'dichtstbij') return 'dichtstbij';
  if (r.cijfers === 'sport' || r.cijfers === 'taart') return 'onszelf';
  if (r.kennis && Object.keys(r.kennis).length === 2 && r.kennis.Joris && r.kennis.Rik) return 'muziek';
  return 'nieuws';
}

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
    const soort = soortVan(r);
    if (soort === 'voorspellingen') {
      // Geen telefoons: wie het in januari goed voorspelde krijgt de punten.
      const punten: Record<number, number> = {};
      for (const s of spelers) {
        let n = 0;
        for (let q = 0; q < r.vragen.length; q++) if (kans(VOORSPELLING_UIT)) n += r.punten;
        punten[s.id] = n * PUNT_WAARDE;
      }
      uit.afrekening.set(ri, punten);
      return;
    }
    const teams = maakTeams(r, spelers, toeval);
    const duurMs = r.tijd * 1000;

    r.vragen.forEach((_, vi) => {
      const mult = vermenigvuldigerVan(v[ri], vi);
      const verdeling: Record<number, number> = {};
      const antwoorden: BonusVraag['antwoorden'] = [];
      let max = r.punten;

      if (soort === 'dichtstbij') {
        // Eén team zit het dichtst; soms precies goed (+2).
        const kenners = teams.find((t) => t.leden.includes(1) && t.leden.includes(2));
        const winnaar = kenners && kans(DICHTSTBIJ_KENNERS) ? kenners : teams[Math.floor(toeval() * teams.length)];
        const punten = kans(PRECIES_GOED) ? r.punten + 2 : r.punten;
        max = r.punten + 2;
        for (const id of winnaar.leden) verdeling[id] = punten;
        for (const t of teams) antwoorden.push({ inzender: t.id, isGoed: t === winnaar, naMs: duurMs * 0.6, leden: t.leden });
      } else if (r.teamModus === 'teams') {
        for (const t of teams) {
          const p = 1 - t.leden.reduce((rest, id) => {
            const naam = naamVan(id);
            const pi = soort === 'muziek' ? MUZIEK[naam] : KANS.openNieuws[NIEUWS[naam]];
            return rest * (1 - pi);
          }, 1);
          const goed = kans(p);
          if (goed) for (const id of t.leden) verdeling[id] = r.punten;
          antwoorden.push({ inzender: t.id, isGoed: goed, naMs: duurMs * 0.7, leden: t.leden });
        }
      } else {
        for (const s of spelers) {
          const niveau = NIEUWS[s.naam];
          const p =
            soort === 'stem' ? MET_DE_MEERDERHEID
              : soort === 'onszelf' ? OVER_ONSZELF
                : r.type === 'waarnietwaar' ? KANS.waarnietwaar[niveau]
                  : KANS.openNieuws[niveau];
          const goed = kans(p);
          const gem = soort === 'onszelf' ? SNELHEID.overOnszelf : SNELHEID.nieuws[niveau];
          const naMs = klem(normaal(gem, SNELHEID.spreiding)) * duurMs;
          if (goed) verdeling[s.id] = r.punten;
          antwoorden.push({ inzender: `s_${s.id}`, isGoed: goed, naMs, leden: [s.id] });
        }
      }

      uit.vragen.push({
        sleutel: `${ri}:${vi}`, type: r.type, teamModus: r.teamModus, verdeling, antwoorden, duurMs, vermenigvuldiger: mult,
      });
      uit.maxPerVraag.push(max * PUNT_WAARDE * mult);
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

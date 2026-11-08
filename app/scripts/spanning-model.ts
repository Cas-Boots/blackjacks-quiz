/**
 * Het model achter de spanningssimulaties (spanning.ts en volgorde.ts): wie
 * wat weet, hoe snel, en hoe een ronde daarmee uitpakt. De profielen zijn
 * aannames; bijstellen mag, dan rekenen beide scripts mee.
 */
import { PAKKETTEN } from '../src/lib/content/packs';
import { standaardVragen } from '../src/lib/content/keuze';
import type { Ronde } from '../src/lib/content/types';
import { maakTeams } from '../src/lib/server/teams';
import { PUNT_WAARDE, type BonusVraag } from '../src/lib/server/bonus';
import { isAfrekening } from '../src/lib/shared/state';
import { binnenSpeling } from '../src/lib/shared/eigengetal';

/* ---- De aannames: wie weet wat, en hoe snel ------------------------------ */

export const SPELERS = ['Joris', 'Rik', 'Eva', 'Liz', 'Bastiaan'] as const;
export type Naam = (typeof SPELERS)[number];

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
/**
 * Ieder zijn eigen getal (de week waarin je Cas inhaalt): hoe ver iemand er
 * naast zit. Een mix: in verhouding (wie een jaar nodig heeft, schat
 * ruwer) en een vaste onzekerheid (niemand weet het op de week). Ruim
 * gekozen: je eigen totaal staat er bewust niet bij, dus je schat ook je
 * eigen sporttempo. Zie ook scripts/marge.ts, dat de speling hiermee
 * vergelijkt.
 */
export const EIGEN_GOK = { deel: 0.35, weken: 3 };
/** Een gok op je eigen getal, volgens EIGEN_GOK, afgerond op hele getallen. */
export function gokEigen(doel: number, model = EIGEN_GOK): number {
  return Math.round(doel * Math.exp(normaal(0, model.deel)) + normaal(0, model.weken));
}
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

/* ---- Toeval met een vaste start, zodat een run herhaalbaar is ------------ */

let zaad = 20261231;
/** Zet het toeval op een vaste start, voor een herhaalbare run. */
export function zaai(z: number) {
  zaad = z;
}
export function toeval(): number {
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
/** De standaardavond: de rondes en vragen die standaard aangevinkt staan. */
export const rondes: Ronde[] = pakket.rondes
  .map((r) => ({ ...r, vragen: standaardVragen(r).map((i) => r.vragen[i]) }))
  .filter((r) => r.vragen.length > 0);
export const spelers = SPELERS.map((naam, i) => ({ id: i + 1, naam }));
const naamVan = (id: number) => SPELERS[id - 1];

/** Welk soort kennis een ronde vraagt. */
export function soortVan(r: Ronde): 'nieuws' | 'muziek' | 'onszelf' | 'voorspellingen' | 'stem' | 'dichtstbij' {
  if (isAfrekening(r)) return 'voorspellingen';
  if (r.type === 'stem') return 'stem';
  if (r.type === 'dichtstbij') return 'dichtstbij';
  if (r.cijfers === 'sport' || r.cijfers === 'taart') return 'onszelf';
  if (r.kennis && Object.keys(r.kennis).length === 2 && r.kennis.Joris && r.kennis.Rik) return 'muziek';
  return 'nieuws';
}


/** Eén gespeelde ronde: per vraag wat er gebeurde, zonder vermenigvuldiger. */
export interface GespeeldeRonde {
  /** De vragen, met vermenigvuldiger 1: de volgorde bepaalt later wat dubbel telt. */
  vragen: BonusVraag[];
  /** Per vraag: wat één speler hoogstens kon halen, zonder vermenigvuldiger. */
  max: number[];
  /** Bij de afrekening van de voorspellingen: de punten per speler, buiten de vragen om. */
  afrekening: Record<number, number> | null;
}

/** Speelt één ronde na volgens de profielen. `ri` geeft de vragen een unieke sleutel. */
export function speelRonde(r: Ronde, ri: number): GespeeldeRonde {
  const soort = soortVan(r);
  if (soort === 'voorspellingen') {
    // Geen telefoons: wie het in januari goed voorspelde krijgt de punten.
    const punten: Record<number, number> = {};
    for (const s of spelers) {
      let n = 0;
      for (let q = 0; q < r.vragen.length; q++) if (kans(VOORSPELLING_UIT)) n += r.punten;
      punten[s.id] = n * PUNT_WAARDE;
    }
    return { vragen: [], max: [], afrekening: punten };
  }
  const teams = maakTeams(r, spelers, toeval);
  const duurMs = r.tijd * 1000;
  const uit: GespeeldeRonde = { vragen: [], max: [], afrekening: null };

  r.vragen.forEach((_, vi) => {
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
      const eigen = r.vragen[vi].eigenGetal;
      for (const s of spelers) {
        const niveau = NIEUWS[s.naam];
        const doel = eigen?.[s.naam];
        const p = doel !== undefined ? (binnenSpeling(gokEigen(doel), doel) ? 1 : 0) :
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

    uit.vragen.push({ sleutel: `${ri}:${vi}`, type: r.type, teamModus: r.teamModus, verdeling, antwoorden, duurMs, vermenigvuldiger: 1 });
    uit.max.push(max * PUNT_WAARDE);
  });
  return uit;
}

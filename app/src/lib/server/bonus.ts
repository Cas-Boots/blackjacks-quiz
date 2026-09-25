/**
 * De bonuspunten: snelheid en reeksen.
 *
 * Bonussen worden nooit opgeslagen. Ze volgen uit wat er al vastligt — de
 * uitdeling per vraag, de antwoorden met hun tijd en de teamindeling — en
 * worden bij elke telling opnieuw afgeleid. Daardoor blijft de regel uit
 * scoring.ts overeind: corrigeert de quizmaster een vraag van twee rondes
 * terug, dan schuiven de reeksen daarna vanzelf mee, en een ongedaan gemaakte
 * uitdeling neemt zijn bonus mee.
 *
 * Beide bonussen werken ook in teamrondes, omdat punten altijd naar de
 * persoon gaan:
 * - Snelste vinger: het snelst ingeleverde goede antwoord krijgt er een punt
 *   bij. In een teamronde is dat het snelste team, en elk lid krijgt het punt.
 * - Op dreef: wie drie vragen of meer op rij punten pakt, krijgt vanaf de
 *   derde een punt extra per vraag. De reeks is van de persoon en loopt door
 *   over teamwissels heen.
 */
import type { Verdeling } from './scoring';
import { SNELHEIDSBONUS, REEKSBONUS, REEKS_VANAF } from '$lib/shared/bonus';

export { SNELHEIDSBONUS, REEKSBONUS, REEKS_VANAF };

/** Rondetypes waar snelheid niets zegt: een mening, of een gok die al een eigen bonus heeft. */
const ZONDER_SNELHEID = new Set(['stem', 'dichtstbij']);

export interface BonusVraag {
  sleutel: string;
  /** Het rondetype, voor de vraag of snelheid meetelt. */
  type: string;
  /** Bij 'samen' is er maar één team; snelheid is daar geen wedstrijd. */
  teamModus: string;
  /** De punten zonder bonus, of null als de quizmaster nog niets toekende. */
  verdeling: Verdeling | null;
  /** De ingeleverde antwoorden, met de leden van het team erachter. */
  antwoorden: { inzender: string; isGoed: boolean | null; naMs: number | null; leden: number[] }[];
}

export interface VraagBonus {
  /** Per speler: de snelheidsbonus. */
  snel: Verdeling;
  /** Per speler: de reeksbonus. */
  reeks: Verdeling;
  /** Per speler met punten: de hoeveelste vraag op rij dit is. */
  opRij: Record<number, number>;
}

export interface BonusUitslag {
  perVraag: Map<string, VraagBonus>;
  /** De lopende reeks per speler na de laatste gespeelde vraag. */
  lopend: Record<number, number>;
}

function heeftPunten(verdeling: Verdeling | null, id: number): boolean {
  return (verdeling?.[id] ?? 0) > 0;
}

/**
 * Rekent de bonussen uit voor de gespeelde vragen, in speelvolgorde.
 * Een vraag telt als gespeeld zodra er een uitdeling of een antwoord is;
 * een vraag waar iedereen fout zat breekt dus elke reeks, ook als de
 * quizmaster niets heeft aangeklikt.
 */
export function berekenBonussen(vragen: BonusVraag[]): BonusUitslag {
  const perVraag = new Map<string, VraagBonus>();
  const lopend: Record<number, number> = {};

  for (const v of vragen) {
    if (!v.verdeling && !v.antwoorden.length) continue;
    const bonus: VraagBonus = { snel: {}, reeks: {}, opRij: {} };

    // Snelste vinger. Alleen wie er echt punten voor kreeg, zodat een
    // weggehaalde uitdeling ook de bonus weghaalt.
    if (!ZONDER_SNELHEID.has(v.type) && v.teamModus !== 'samen') {
      const goed = v.antwoorden.filter(
        (a) => a.isGoed === true && a.naMs !== null && a.leden.some((id) => heeftPunten(v.verdeling, id)),
      );
      if (goed.length) {
        const snelste = Math.min(...goed.map((a) => a.naMs as number));
        for (const a of goed) {
          if (a.naMs !== snelste) continue;
          for (const id of a.leden) if (heeftPunten(v.verdeling, id)) bonus.snel[id] = SNELHEIDSBONUS;
        }
      }
    }

    // Reeksen. Wie bij deze vraag geen punten kreeg, begint opnieuw.
    for (const idTekst of Object.keys(lopend)) {
      const id = Number(idTekst);
      if (!heeftPunten(v.verdeling, id)) lopend[id] = 0;
    }
    for (const [idTekst, punten] of Object.entries(v.verdeling ?? {})) {
      if (!(punten > 0)) continue;
      const id = Number(idTekst);
      const n = (lopend[id] ?? 0) + 1;
      lopend[id] = n;
      bonus.opRij[id] = n;
      if (n >= REEKS_VANAF) bonus.reeks[id] = REEKSBONUS;
    }

    perVraag.set(v.sleutel, bonus);
  }

  return { perVraag, lopend };
}

/** De uitdeling van één vraag met de bonussen erbij opgeteld. */
export function metBonus(verdeling: Verdeling | null, bonus: VraagBonus | undefined): Verdeling {
  const uit: Verdeling = { ...(verdeling ?? {}) };
  if (!bonus) return uit;
  for (const deel of [bonus.snel, bonus.reeks]) {
    for (const [id, p] of Object.entries(deel)) uit[Number(id)] = (uit[Number(id)] ?? 0) + p;
  }
  return uit;
}

/**
 * Van uitdeling naar scorebord: snelheid, reeksen en vermenigvuldigers.
 *
 * Niets hiervan wordt opgeslagen. Het volgt uit wat er al vastligt — de
 * uitdeling per vraag (in de kleine punten van de vragen), de antwoorden met
 * hun tijd en de teamindeling — en wordt bij elke telling opnieuw afgeleid.
 * Daardoor blijft de regel uit scoring.ts overeind: corrigeert de quizmaster
 * een vraag van twee rondes terug, dan schuiven de reeksen daarna vanzelf
 * mee, en een ongedaan gemaakte uitdeling neemt alles mee terug.
 *
 * De telling, zoals bij Kahoot (de getallen staan in shared/bonus.ts):
 * - Elk punt uit de vraag is PUNT_WAARDE waard, maal het deel van de klok dat
 *   nog over was: meteen goed is alles, op de valreep de helft. In een
 *   teamronde telt de tijd van het team. Bij een stemvraag telt snelheid
 *   niet: dat is een mening, geen kennis.
 * - Op dreef: vanaf de tweede vraag op rij met punten komt er een oplopende
 *   bonus bij. De reeks is van de persoon en loopt door over teamwissels heen.
 * - Daarna de vermenigvuldiger: de slotrondes en de gouden kaart tellen
 *   dubbel, samen zelfs vier keer.
 */
import type { Verdeling } from './scoring';
import {
  PUNT_WAARDE, MINIMUM_DEEL, REEKS_VANAF, REEKS_STAP, REEKS_MAX, reeksBonus, snelheidsDeel,
} from '$lib/shared/bonus';

export { PUNT_WAARDE, MINIMUM_DEEL, REEKS_VANAF, REEKS_STAP, REEKS_MAX };

/** Rondetypes waar snelheid niets zegt. */
const ZONDER_SNELHEID = new Set(['stem']);

export interface BonusVraag {
  sleutel: string;
  /** Het rondetype, voor de vraag of snelheid meetelt. */
  type: string;
  teamModus: string;
  /** De punten zonder bonus, of null als de quizmaster nog niets toekende. */
  verdeling: Verdeling | null;
  /** De ingeleverde antwoorden, met de leden van het team erachter. */
  antwoorden: { inzender: string; isGoed: boolean | null; naMs: number | null; leden: number[] }[];
  /** Hoe lang de klok bij deze vraag liep. */
  duurMs: number;
  /** 1, of meer bij de slotrondes en de gouden kaart. */
  vermenigvuldiger: number;
}

export interface VraagBonus {
  /** Per speler: de punten op het scorebord, alles inbegrepen. */
  punten: Verdeling;
  /** Per speler: het deel daarvan dat van de reeks komt. */
  reeks: Verdeling;
  /** Per speler met punten: de hoeveelste vraag op rij dit is. */
  opRij: Record<number, number>;
  vermenigvuldiger: number;
}

export interface BonusUitslag {
  perVraag: Map<string, VraagBonus>;
  /** De lopende reeks per speler na de laatste gespeelde vraag. */
  lopend: Record<number, number>;
}

/** Een uitdeling zonder vraag erachter (de afrekening, een weggehaalde vraag): alleen de puntwaarde. */
export function opScorebord(verdeling: Verdeling): Verdeling {
  const uit: Verdeling = {};
  for (const [id, p] of Object.entries(verdeling)) uit[Number(id)] = Math.round(p * PUNT_WAARDE);
  return uit;
}

/**
 * Rekent de scorebordpunten uit voor de gespeelde vragen, in speelvolgorde.
 * Een vraag telt als gespeeld zodra er een uitdeling of een antwoord is;
 * een vraag waar iedereen fout zat breekt dus elke reeks, ook als de
 * quizmaster niets heeft aangeklikt.
 */
export function berekenBonussen(vragen: BonusVraag[]): BonusUitslag {
  const perVraag = new Map<string, VraagBonus>();
  const lopend: Record<number, number> = {};

  for (const v of vragen) {
    if (!v.verdeling && !v.antwoorden.length) continue;
    const bonus: VraagBonus = { punten: {}, reeks: {}, opRij: {}, vermenigvuldiger: v.vermenigvuldiger };

    // Reeksen. Wie bij deze vraag geen punten kreeg, begint opnieuw.
    for (const idTekst of Object.keys(lopend)) {
      const id = Number(idTekst);
      if (!((v.verdeling?.[id] ?? 0) > 0)) lopend[id] = 0;
    }

    for (const [idTekst, basis] of Object.entries(v.verdeling ?? {})) {
      const id = Number(idTekst);
      if (!(basis > 0)) {
        bonus.punten[id] = Math.round(basis * PUNT_WAARDE * v.vermenigvuldiger);
        continue;
      }
      const n = (lopend[id] ?? 0) + 1;
      lopend[id] = n;
      bonus.opRij[id] = n;

      // Zonder antwoord van de telefoon (de quizmaster kende het met de
      // hand toe) is er geen tijd: dan telt het als op de valreep.
      const antwoord = v.antwoorden.find((a) => a.leden.includes(id));
      const deel = ZONDER_SNELHEID.has(v.type) ? 1 : snelheidsDeel(antwoord?.naMs ?? null, v.duurMs);
      const reeks = reeksBonus(n) * v.vermenigvuldiger;
      bonus.punten[id] = Math.round(basis * PUNT_WAARDE * deel) * v.vermenigvuldiger + reeks;
      if (reeks > 0) bonus.reeks[id] = reeks;
    }

    perVraag.set(v.sleutel, bonus);
  }

  return { perVraag, lopend };
}

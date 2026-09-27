/**
 * De puntenregels, gedeeld: de server rekent ermee, de schermen leggen ze uit.
 * Zie server/bonus.ts.
 *
 * Het scorebord telt zoals Kahoot: grote getallen, en snelheid telt mee.
 * De vragen zelf houden hun kleine punten (1, 2, 3); pas op het scorebord
 * wordt elk punt PUNT_WAARDE waard, en daar gaan snelheid, reeks en de
 * vermenigvuldigers overheen.
 */

/** Eén punt uit de vragen op het scorebord. Een vraag van 2 punten is zo tot 1000 waard. */
export const PUNT_WAARDE = 500;

/** Wie op de laatste seconde goed antwoordt, houdt dit deel over; wie meteen antwoordt alles. */
export const MINIMUM_DEEL = 0.5;

/** Vanaf de hoeveelste goede vraag op rij de reeksbonus ingaat. */
export const REEKS_VANAF = 2;
/** De reeksbonus groeit met deze stap per vraag op rij… */
export const REEKS_STAP = 100;
/** …tot dit maximum. */
export const REEKS_MAX = 500;

/** Zoveel slotrondes tellen dubbel, zodat de avond tot het eind openligt. */
export const DUBBELE_SLOTRONDES = 2;

/** De gouden kaart: per ronde één willekeurige vraag die dubbel telt. */
export const GOUDEN_KAART = 2;

/** De reeksbonus bij zoveel goede vragen op rij, zonder vermenigvuldiger. */
export function reeksBonus(opRij: number): number {
  if (opRij < REEKS_VANAF) return 0;
  return Math.min(REEKS_MAX, (opRij - REEKS_VANAF + 1) * REEKS_STAP);
}

/** Het deel van de punten dat je overhoudt na zoveel milliseconden. */
export function snelheidsDeel(naMs: number | null, duurMs: number): number {
  if (naMs === null || !(duurMs > 0)) return MINIMUM_DEEL;
  const verstreken = Math.min(1, Math.max(0, naMs / duurMs));
  return 1 - (1 - MINIMUM_DEEL) * verstreken;
}

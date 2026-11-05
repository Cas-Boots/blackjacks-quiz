/**
 * De puntenregels, gedeeld: de server rekent ermee, de schermen leggen ze uit.
 * Zie server/bonus.ts.
 *
 * Het scorebord telt in grote getallen. De vragen zelf houden hun kleine
 * punten (1, 2, 3); pas op het scorebord wordt elk punt PUNT_WAARDE waard.
 * Ieder voor zich telt snelheid mee; in een teamronde niet, want daar hoort
 * overleg bij en niet haast. Daarna de vermenigvuldigers.
 */

/** Eén punt uit de vragen op het scorebord. Een vraag van 2 punten is zo tot 1000 waard. */
export const PUNT_WAARDE = 500;

/** Wie op de laatste seconde goed antwoordt, houdt dit deel over; wie meteen antwoordt alles. */
export const MINIMUM_DEEL = 0.5;

/**
 * Vanaf hoeveel goede vragen op rij de stand een vlammetje toont. Het levert
 * geen punten op: met teams die per ronde wisselen is een reeks niet eerlijk
 * te belonen.
 */
export const REEKS_VANAF = 2;

/** Zoveel slotrondes tellen dubbel, zodat de avond tot het eind openligt. */
export const DUBBELE_SLOTRONDES = 2;

/** De gouden kaart: per ronde één willekeurige vraag die dubbel telt. */
export const GOUDEN_KAART = 2;

/** Het deel van de punten dat je overhoudt na zoveel milliseconden. */
export function snelheidsDeel(naMs: number | null, duurMs: number): number {
  if (naMs === null || !(duurMs > 0)) return MINIMUM_DEEL;
  const verstreken = Math.min(1, Math.max(0, naMs / duurMs));
  return 1 - (1 - MINIMUM_DEEL) * verstreken;
}

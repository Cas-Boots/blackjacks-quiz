/**
 * De klok loopt niet langer door dan nodig.
 *
 * Zodra elk team (of in een ronde ieder voor zich: elke speler) heeft
 * ingeleverd, springt de klok naar de laatste seconden. Wachten op een klok
 * terwijl iedereen al klaar is, is het saaiste moment van een quiz.
 */

/** Zoveel blijft er over als iedereen binnen is. */
export const LAATSTE_MS = 5_000;

/**
 * Het nieuwe eindpunt van de klok. Staat er al minder dan LAATSTE_MS op, of
 * is nog niet iedereen binnen, dan verandert er niets.
 */
export function ingekort(
  eindigtOp: number,
  nu: number,
  teams: { id: string; leden: number[] }[],
  binnen: Set<string>,
): number {
  const moeten = teams.filter((t) => t.leden.length > 0);
  if (!moeten.length || !moeten.every((t) => binnen.has(t.id))) return eindigtOp;
  return Math.min(eindigtOp, nu + LAATSTE_MS);
}

/**
 * Ieder zijn eigen getal: een vraag waarop elke speler een ander antwoord
 * heeft, zoals "in welke week van 2027 haal jij Cas in?".
 *
 * Wie er een paar weken naast zit, zit er bij een klein getal ver naast en
 * bij een groot nauwelijks. Daarom groeit de speling mee: per vijf
 * weken één week, en altijd minstens twee. Zo heeft iedereen ongeveer
 * evenveel kans (zie `npm run marge`), en blijft de regel uit te leggen:
 *
 *   "Per vijf weken krijg je een week speling, en altijd minstens twee."
 */

export const SPELING = {
  /** Altijd minstens zoveel speling, in de eenheid van de vraag. */
  minimaal: 2,
  /** En anders dit deel van het juiste antwoord: een vijfde. */
  deel: 0.2,
} as const;

/** De speling bij dit juiste antwoord. */
export function spelingVoor(doel: number, regel: { minimaal: number; deel: number } = SPELING): number {
  return Math.max(regel.minimaal, regel.deel * Math.abs(doel));
}

/** Zit deze gok binnen de speling? */
export function binnenSpeling(gok: number, doel: number, regel: { minimaal: number; deel: number } = SPELING): boolean {
  return Math.abs(gok - doel) <= spelingVoor(doel, regel) + 1e-9;
}

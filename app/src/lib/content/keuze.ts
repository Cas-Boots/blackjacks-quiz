import type { Ronde } from './types';

/** Welke vragen van een ronde standaard meedoen: niets bij een optionele ronde, en nooit een reservevraag. */
export function standaardVragen(r: Ronde): number[] {
  if (r.optioneel) return [];
  return r.vragen.flatMap((v, i) => (v.reserve ? [] : [i]));
}

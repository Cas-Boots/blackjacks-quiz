/**
 * Vorige seizoenen, overgenomen uit resolution-recap
 * (`HISTORICAL_SEASONS` in src/lib/server/db.ts daar). Die staan niet in de
 * export, want de app begon pas in 2026; deze eindstanden zijn vast.
 *
 * 2025 was het eerste sportjaar, 2024 het taartjaar.
 */
export const SPORT_2025: Record<string, number> = {
  Cas: 147,
  Liz: 77,
  Bastiaan: 71,
  Joris: 67,
  Eva: 44,
  Rik: 20,
};

export const TAART_2024: Record<string, number | null> = {
  Joris: 33,
  Rik: 20,
  Cas: 19.5,
  Liz: 7,
  Eva: 1,
  Bastiaan: null,
};

/**
 * De knoppen van het geluidsbord op het hostscherm. De quizmaster drukt,
 * de televisie speelt. Vluchtig, net als een reactie: niets komt in de database.
 */
export const GELUIDSBORD = [
  { sleutel: 'applaus', label: 'Applaus', emoji: '👏' },
  { sleutel: 'roffel', label: 'Tromgeroffel', emoji: '🥁' },
  { sleutel: 'toeter', label: 'Toeter', emoji: '📯' },
  { sleutel: 'ooh', label: 'Ooooh', emoji: '😮' },
  { sleutel: 'ding', label: 'Ding!', emoji: '🔔' },
  { sleutel: 'zoemer', label: 'Zoemer', emoji: '❌' },
  { sleutel: 'wahwah', label: 'Wah-wah', emoji: '🎺' },
  { sleutel: 'fanfare', label: 'Fanfare', emoji: '🎉' },
] as const;

export type Bordgeluid = (typeof GELUIDSBORD)[number]['sleutel'];

export function isBordgeluid(x: unknown): x is Bordgeluid {
  return GELUIDSBORD.some((g) => g.sleutel === x);
}

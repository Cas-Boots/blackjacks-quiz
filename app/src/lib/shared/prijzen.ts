/** Het icoon bij elke prijs, voor televisie, telefoon en uitslagpagina. */
export const PRIJS_ICONEN: Record<string, string> = {
  scherpschutter: '🎯',
  snelste: '⚡',
  'beste-ronde': '🔥',
  reeks: '🔗',
  comeback: '🚀',
  'moeilijkste-vraag': '🧠',
};

export function prijsIcoon(sleutel: string): string {
  return PRIJS_ICONEN[sleutel] ?? '🏅';
}

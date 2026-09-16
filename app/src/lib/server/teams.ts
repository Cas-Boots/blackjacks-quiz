/**
 * Teamindeling per ronde.
 *
 * Teams wisselen, punten gaan naar de persoon. Daardoor blijft het klassement
 * eerlijk hoe vaak je ook herverdeelt.
 */
import type { Ronde } from '$lib/content/types';

export const TEAMNAMEN = [
  { naam: 'Schoppen', suit: '♠' },
  { naam: 'Harten', suit: '♥' },
  { naam: 'Ruiten', suit: '♦' },
  { naam: 'Klaveren', suit: '♣' },
];

export interface Team {
  id: string;
  naam: string;
  suit: string;
  leden: number[];
}

export interface Speler {
  id: number;
  naam: string;
}

/** Fisher-Yates met injecteerbare toevalsbron, zodat een test hem vast kan zetten. */
export function husselen<T>(lijst: T[], toeval: () => number = Math.random): T[] {
  const uit = lijst.slice();
  for (let i = uit.length - 1; i > 0; i--) {
    const j = Math.floor(toeval() * (i + 1));
    [uit[i], uit[j]] = [uit[j], uit[i]];
  }
  return uit;
}

export function maakTeams(
  ronde: Ronde,
  spelers: Speler[],
  toeval: () => number = Math.random,
): Team[] {
  const modus = ronde.teamModus ?? 'individueel';

  if (modus === 'individueel') {
    return spelers.map((s) => ({ id: `s_${s.id}`, naam: s.naam, suit: ronde.suit, leden: [s.id] }));
  }
  if (modus === 'samen') {
    return [{ id: 'allen', naam: 'Iedereen', suit: ronde.suit, leden: spelers.map((s) => s.id) }];
  }

  const gewenst = ronde.aantalTeams ?? 2;
  const aantal = Math.max(2, Math.min(gewenst, Math.max(2, spelers.length)));
  const teams: Team[] = Array.from({ length: aantal }, (_, i) => ({
    id: `t${i}`,
    naam: TEAMNAMEN[i % TEAMNAMEN.length].naam,
    suit: TEAMNAMEN[i % TEAMNAMEN.length].suit,
    leden: [],
  }));
  husselen(spelers, toeval).forEach((s, i) => teams[i % aantal].leden.push(s.id));
  return teams;
}

/** Schuift één speler naar het volgende team. Voor handmatig bijsturen. */
export function verplaats(teams: Team[], spelerId: number): Team[] {
  if (teams.length < 2) return teams;
  const uit = teams.map((t) => ({ ...t, leden: t.leden.filter((id) => id !== spelerId) }));
  let huidig = teams.findIndex((t) => t.leden.includes(spelerId));
  if (huidig < 0) huidig = -1;
  uit[(huidig + 1) % uit.length].leden.push(spelerId);
  return uit;
}

/** Wie levert er in voor deze ronde: iedere speler los, of één per team. */
export function inzendersVoor(teams: Team[], modus: string): string[] {
  if (modus === 'individueel') return teams.map((t) => t.id);
  return teams.map((t) => t.id);
}

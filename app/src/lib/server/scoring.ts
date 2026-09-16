/**
 * De puntentelling.
 *
 * Eén regel houdt de stand kloppend: elke vraag heeft precies één verdeling,
 * en die wordt bij een correctie in zijn geheel vervangen. Er wordt nooit
 * opgeteld bij een lopend totaal, dus dubbel toekennen of een correctie die
 * half blijft hangen kan niet bestaan.
 */
import type { Ronde, Vraag } from '$lib/content/types';
import { leesGetal } from './antwoord';

export type Verdeling = Record<number, number>;

export interface TeamIndeling {
  id: string;
  leden: number[];
}

export function vraagPunten(ronde: Ronde, vraag: Vraag): number {
  return vraag.punten ?? ronde.punten ?? 1;
}

export function vraagTijd(ronde: Ronde, vraag: Vraag): number {
  return vraag.tijd ?? ronde.tijd ?? 30;
}

/** Punten van winnende teams naar de personen erin. */
export function verdeelOverTeams(
  teams: TeamIndeling[],
  winnaars: string[],
  puntenPerTeam: Record<string, number>,
  standaard: number,
): Verdeling {
  const uit: Verdeling = {};
  for (const teamId of winnaars) {
    const team = teams.find((t) => t.id === teamId);
    if (!team) continue;
    const punten = puntenPerTeam[teamId] ?? standaard;
    for (const spelerId of team.leden) {
      uit[spelerId] = (uit[spelerId] ?? 0) + punten;
    }
  }
  return uit;
}

export interface Gissing {
  inzender: string;
  getal: number;
}

export interface DichtstbijUitslag {
  winnaars: string[];
  afstand: number;
  precies: boolean;
  puntenPerTeam: Record<string, number>;
}

/**
 * Dichtstbij wint: de kleinste afstand pakt de volle punten, precies goed
 * levert twee bonuspunten op. Bij een gelijke afstand delen ze allebei —
 * elk krijgt de volle punten, niet de helft.
 */
export function bepaalDichtstbij(
  gissingen: Gissing[],
  doel: number,
  punten: number,
): DichtstbijUitslag | null {
  const geldig = gissingen.filter((g) => Number.isFinite(g.getal));
  if (!geldig.length) return null;

  let beste = Infinity;
  for (const g of geldig) beste = Math.min(beste, Math.abs(g.getal - doel));

  const winnaars = geldig.filter((g) => Math.abs(g.getal - doel) === beste).map((g) => g.inzender);
  const precies = beste === 0;
  const waarde = precies ? punten + 2 : punten;
  const puntenPerTeam: Record<string, number> = {};
  for (const w of winnaars) puntenPerTeam[w] = waarde;

  return { winnaars, afstand: beste, precies, puntenPerTeam };
}

export function gissingenUitAntwoorden(rijen: { inzender: string; tekst: string }[]): Gissing[] {
  const uit: Gissing[] = [];
  for (const r of rijen) {
    const getal = leesGetal(r.tekst);
    if (getal !== null) uit.push({ inzender: r.inzender, getal });
  }
  return uit;
}

/** De stand: alle verdelingen plus de handmatige correcties, opgeteld. */
export function telStand(
  verdelingen: Verdeling[],
  correcties: { spelerId: number; punten: number }[] = [],
): Verdeling {
  const totaal: Verdeling = {};
  for (const v of verdelingen) {
    for (const [id, punten] of Object.entries(v)) {
      totaal[Number(id)] = (totaal[Number(id)] ?? 0) + punten;
    }
  }
  for (const c of correcties) {
    totaal[c.spelerId] = (totaal[c.spelerId] ?? 0) + c.punten;
  }
  return totaal;
}

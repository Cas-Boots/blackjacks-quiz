/**
 * Wie welk maatje heeft. Zie shared/dieren.ts voor de dieren zelf.
 *
 * Niemand krijgt vanzelf een dier: ieder kiest zijn eigen maatje op de
 * telefoon, en tot dan heeft hij er geen. Twee mensen in hetzelfde spel
 * hebben nooit hetzelfde dier. De quizmaster kan er op het beheerscherm een
 * dobbelen.
 */
import { and, eq, ne } from 'drizzle-orm';
import { db } from './db/index';
import { spelers, deelnemers } from './db/schema';
import { isDier, schoneDierNaam, vrijDier } from '$lib/shared/dieren';

/**
 * Zorgt dat niemand in dit spel hetzelfde dier heeft als een ander. Dat kan
 * gebeuren als iemand zijn dier van een vorige avond meeneemt, terwijl een
 * ander het intussen koos: wie het eerst in dit spel zat, houdt het; de
 * ander kiest opnieuw.
 */
export function ontdubbelDieren(spelId: number) {
  const rijen = db
    .select({ id: spelers.id, dier: spelers.dier, sinds: deelnemers.id })
    .from(deelnemers)
    .innerJoin(spelers, eq(deelnemers.spelerId, spelers.id))
    .where(eq(deelnemers.spelId, spelId))
    .all()
    .sort((a, b) => a.sinds - b.sinds);
  const gezien = new Set<string>();
  for (const r of rijen) {
    if (!r.dier) continue;
    if (gezien.has(r.dier)) db.update(spelers).set({ dier: null }).where(eq(spelers.id, r.id)).run();
    else gezien.add(r.dier);
  }
}

/** Een ander dier voor deze speler, willekeurig uit wat er nog vrij is. */
export function dobbelDier(spelerId: number, toeval: () => number = Math.random): string | null {
  const speler = db.select().from(spelers).where(eq(spelers.id, spelerId)).get();
  if (!speler) return null;
  const bezet = db.select({ id: spelers.id, dier: spelers.dier }).from(spelers).all()
    .filter((r) => r.id !== spelerId)
    .map((r) => r.dier);
  const dier = vrijDier(bezet, speler.naam, toeval, speler.dier);
  db.update(spelers).set({ dier }).where(eq(spelers.id, spelerId)).run();
  return dier;
}

/**
 * Een speler geeft zijn maatje een naam (of haalt hem weg met een lege).
 * De naam blijft bij je als je van dier wisselt: het is jouw maatje.
 */
export function noemDier(spelerId: number, naam: unknown): string | null {
  const schoon = schoneDierNaam(naam);
  db.update(spelers).set({ dierNaam: schoon }).where(eq(spelers.id, spelerId)).run();
  return schoon;
}

/**
 * Een speler kiest zelf zijn maatje. Mag niet als iemand anders in hetzelfde
 * spel het al heeft; wie van een vorige avond hetzelfde dier had en niet
 * meedoet, telt niet (schuift hij later aan, dan ontdubbelt voegDeelnemerToe).
 */
export function kiesDier(spelerId: number, sleutel: unknown, spelId: number | null): { ok: true } | { ok: false; reden: string } {
  if (!isDier(sleutel)) return { ok: false, reden: 'onbekend dier' };
  // In een spel telt wie meedoet; zonder spel telt iedereen.
  const bezet =
    spelId !== null
      ? db
          .select({ naam: spelers.naam })
          .from(deelnemers)
          .innerJoin(spelers, eq(deelnemers.spelerId, spelers.id))
          .where(and(eq(deelnemers.spelId, spelId), ne(spelers.id, spelerId), eq(spelers.dier, sleutel)))
          .get()
      : db
          .select({ naam: spelers.naam })
          .from(spelers)
          .where(and(ne(spelers.id, spelerId), eq(spelers.dier, sleutel)))
          .get();
  if (bezet) return { ok: false, reden: `al gekozen door ${bezet.naam}` };
  db.update(spelers).set({ dier: sleutel }).where(eq(spelers.id, spelerId)).run();
  return { ok: true };
}

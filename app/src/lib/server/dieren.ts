/**
 * Wie welk maatje heeft. Zie shared/dieren.ts voor de dieren zelf.
 *
 * Iedereen zonder dier krijgt er één dat nog vrij is, zodat er aan tafel
 * geen twee lama's zitten. Op de telefoon kiest ieder daarna zijn eigen
 * maatje; de quizmaster kan er op het beheerscherm een dobbelen.
 */
import { and, eq, isNull, ne } from 'drizzle-orm';
import { db } from './db/index';
import { spelers, deelnemers } from './db/schema';
import { isDier, vrijDier } from '$lib/shared/dieren';

/** Geeft iedereen zonder dier een vrij dier. Idempotent en goedkoop. */
export function zorgVoorDieren() {
  const zonder = db.select().from(spelers).where(isNull(spelers.dier)).all();
  if (!zonder.length) return;
  const bezet = db.select({ dier: spelers.dier }).from(spelers).all().map((r) => r.dier);
  for (const s of zonder) {
    const dier = vrijDier(bezet, s.naam);
    db.update(spelers).set({ dier }).where(eq(spelers.id, s.id)).run();
    bezet.push(dier);
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
 * Een speler kiest zelf zijn maatje. Mag niet als iemand anders in hetzelfde
 * spel het al heeft; wie van een vorige avond hetzelfde dier had, telt niet.
 */
export function kiesDier(spelerId: number, sleutel: unknown, spelId: number | null): { ok: true } | { ok: false; reden: string } {
  if (!isDier(sleutel)) return { ok: false, reden: 'onbekend dier' };
  if (spelId !== null) {
    const bezet = db
      .select({ naam: spelers.naam })
      .from(deelnemers)
      .innerJoin(spelers, eq(deelnemers.spelerId, spelers.id))
      .where(and(eq(deelnemers.spelId, spelId), ne(spelers.id, spelerId), eq(spelers.dier, sleutel)))
      .get();
    if (bezet) return { ok: false, reden: `al gekozen door ${bezet.naam}` };
  }
  db.update(spelers).set({ dier: sleutel }).where(eq(spelers.id, spelerId)).run();
  return { ok: true };
}

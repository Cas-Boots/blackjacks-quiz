/**
 * Wie welk geestdier heeft. Zie shared/dieren.ts voor de dieren zelf.
 *
 * Iedereen zonder dier krijgt er één dat nog vrij is, zodat er aan tafel
 * geen twee lama's zitten. Opnieuw dobbelen kan altijd, vanaf de telefoon.
 */
import { eq, isNull } from 'drizzle-orm';
import { db } from './db/index';
import { spelers } from './db/schema';
import { vrijDier } from '$lib/shared/dieren';

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

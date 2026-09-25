/**
 * Zet de vaste vriendengroep en een leeg spel klaar.
 *
 * Idempotent: het draait bij elke start en verandert niets aan wat er al is.
 */
import { eq } from 'drizzle-orm';
import { db } from './db/index';
import { spelers, spellen, deelnemers } from './db/schema';
import { standaardSamenstelling } from './spel';
import { zorgVoorDieren } from './dieren';

export const VASTE_SPELERS = ['Liz', 'Bastiaan', 'Joris', 'Rik', 'Eva'];
export const QUIZMASTER = 'Cas';

export function zorgVoorBasis() {
  for (const naam of VASTE_SPELERS) {
    const bestaat = db.select().from(spelers).where(eq(spelers.naam, naam)).get();
    if (!bestaat) db.insert(spelers).values({ naam }).run();
  }
  const qm = db.select().from(spelers).where(eq(spelers.naam, QUIZMASTER)).get();
  if (!qm) db.insert(spelers).values({ naam: QUIZMASTER, isQuizmaster: true }).run();
  zorgVoorDieren();

  const actief = db.select().from(spellen).where(eq(spellen.isActief, true)).get();
  if (!actief) maakSpel('jaar2026');
}

export function maakSpel(pakketId: string) {
  db.update(spellen).set({ isActief: false }).where(eq(spellen.isActief, true)).run();
  const rij = db
    .insert(spellen)
    .values({
      pakket: pakketId,
      naam: 'Blackjack Quiz 26/27',
      samenstelling: standaardSamenstelling(pakketId),
    })
    .returning()
    .get();

  // De vaste groep doet mee; de quizmaster niet, en een gast van een vorige
  // avond ook niet — die schuift desgewenst opnieuw aan.
  const alle = db.select().from(spelers).all();
  for (const s of alle) {
    if (s.isQuizmaster || s.isGast) continue;
    db.insert(deelnemers).values({ spelId: rij.id, spelerId: s.id }).run();
  }
  return rij;
}

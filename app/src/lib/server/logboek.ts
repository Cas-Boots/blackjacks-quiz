/**
 * Het logboek van de quizmaster, met een terugweg.
 *
 * Elke handeling op het hostscherm krijgt een regel, en bij de handelingen
 * die de stand of de plek in de quiz veranderen gaat er een momentopname van
 * vóór de handeling mee. Terugdraaien is dan niets meer dan die momentopname
 * terugzetten — geen omgekeerde logica per opdracht, dus ook geen manier om
 * de stand half terug te draaien.
 */
import { and, eq, desc } from 'drizzle-orm';
import { db } from './db/index';
import { spellen, antwoorden, uitdelingen, teams, correcties, logboek } from './db/schema';
import type { LogRegel } from '$lib/shared/state';
import { sleutelVan } from './spel';

type SpelRij = typeof spellen.$inferSelect;

export interface Momentopname {
  spel: Pick<SpelRij, 'fase' | 'rondeIndex' | 'vraagIndex' | 'klokEindigtOp' | 'klokDuurMs' | 'klokLoopt' | 'klokRestMs' | 'mediaSpeelt' | 'samenstelling' | 'geeindigdOp'>;
  /** De vraag die open stond, met haar uitdeling en vinkjes. */
  sleutel: string;
  uitdeling: string | null;
  isGoed: Record<number, boolean | null>;
  /** De teamindeling van de ronde waar het spel stond. */
  teams: { rondeIndex: number; rijen: { teamKey: string; naam: string; suit: string; leden: string }[] };
  /** Een correctie die bij deze handeling is toegevoegd, om weer weg te halen. */
  correctieId?: number;
}

/** Legt vast hoe het spel er nu voor staat, vóór een handeling. */
export function momentopname(spel: SpelRij): Momentopname {
  const sleutel = sleutelVan(spel.rondeIndex, spel.vraagIndex);
  const uitdeling = db
    .select()
    .from(uitdelingen)
    .where(and(eq(uitdelingen.spelId, spel.id), eq(uitdelingen.vraagSleutel, sleutel)))
    .get();
  const antwoordRijen = db
    .select({ id: antwoorden.id, isGoed: antwoorden.isGoed })
    .from(antwoorden)
    .where(and(eq(antwoorden.spelId, spel.id), eq(antwoorden.vraagSleutel, sleutel)))
    .all();
  const teamRijen = db
    .select({ teamKey: teams.teamKey, naam: teams.naam, suit: teams.suit, leden: teams.leden })
    .from(teams)
    .where(and(eq(teams.spelId, spel.id), eq(teams.rondeIndex, spel.rondeIndex)))
    .all();
  return {
    spel: {
      fase: spel.fase, rondeIndex: spel.rondeIndex, vraagIndex: spel.vraagIndex,
      klokEindigtOp: spel.klokEindigtOp, klokDuurMs: spel.klokDuurMs, klokLoopt: spel.klokLoopt,
      klokRestMs: spel.klokRestMs, mediaSpeelt: spel.mediaSpeelt, samenstelling: spel.samenstelling,
      geeindigdOp: spel.geeindigdOp,
    },
    sleutel,
    uitdeling: uitdeling?.verdeling ?? null,
    isGoed: Object.fromEntries(antwoordRijen.map((r) => [r.id, r.isGoed])),
    teams: { rondeIndex: spel.rondeIndex, rijen: teamRijen },
  };
}

export function schrijfLog(spelId: number, opdracht: string, omschrijving: string, vorige: Momentopname | null) {
  db.insert(logboek)
    .values({ spelId, opdracht, omschrijving, vorige: vorige ? JSON.stringify(vorige) : null, aangemaaktOp: Date.now() })
    .run();
}

export function logboekVan(spelId: number, aantal = 12): LogRegel[] {
  return db
    .select()
    .from(logboek)
    .where(eq(logboek.spelId, spelId))
    .orderBy(desc(logboek.id))
    .limit(aantal)
    .all()
    .map((r) => ({
      id: r.id,
      opdracht: r.opdracht,
      omschrijving: r.omschrijving,
      terugTeDraaien: r.vorige !== null && !r.isOngedaan,
      isOngedaan: r.isOngedaan,
      aangemaaktOp: r.aangemaaktOp,
    }));
}

/**
 * Draait de laatste handeling terug die dat toelaat. Geeft de omschrijving
 * van die handeling terug, of null als er niets terug te draaien was.
 */
export function draaiTerug(spelId: number): string | null {
  const laatste = db
    .select()
    .from(logboek)
    .where(and(eq(logboek.spelId, spelId), eq(logboek.isOngedaan, false)))
    .orderBy(desc(logboek.id))
    .all()
    .find((r) => r.vorige !== null);
  if (!laatste || !laatste.vorige) return null;

  let m: Momentopname;
  try {
    m = JSON.parse(laatste.vorige);
  } catch {
    return null;
  }

  db.update(spellen).set(m.spel).where(eq(spellen.id, spelId)).run();

  db.delete(uitdelingen).where(and(eq(uitdelingen.spelId, spelId), eq(uitdelingen.vraagSleutel, m.sleutel))).run();
  if (m.uitdeling !== null) {
    db.insert(uitdelingen).values({ spelId, vraagSleutel: m.sleutel, verdeling: m.uitdeling }).run();
  }
  for (const [id, isGoed] of Object.entries(m.isGoed)) {
    db.update(antwoorden).set({ isGoed }).where(and(eq(antwoorden.id, Number(id)), eq(antwoorden.spelId, spelId))).run();
  }
  if (m.teams.rijen.length) {
    db.delete(teams).where(and(eq(teams.spelId, spelId), eq(teams.rondeIndex, m.teams.rondeIndex))).run();
    for (const t of m.teams.rijen) {
      db.insert(teams).values({ spelId, rondeIndex: m.teams.rondeIndex, ...t }).run();
    }
  }
  if (m.correctieId !== undefined) {
    db.delete(correcties).where(and(eq(correcties.id, m.correctieId), eq(correcties.spelId, spelId))).run();
  }

  db.update(logboek).set({ isOngedaan: true }).where(eq(logboek.id, laatste.id)).run();
  return laatste.omschrijving;
}

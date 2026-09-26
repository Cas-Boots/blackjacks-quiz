import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Het kiezen van een maatje, tegen een echte database in het geheugen: dat
 * twee mensen aan tafel niet hetzelfde dier hebben is een databaseregel.
 */
process.env.DATABASE_PATH = ':memory:';
process.env.NODE_ENV = 'test';

type Dieren = typeof import('../src/lib/server/dieren');
let dieren: Dieren;
let db: typeof import('../src/lib/server/db/index').db;
let schema: typeof import('../src/lib/server/db/schema');
let spelId: number;

beforeAll(async () => {
  const { zorgVoorMigraties } = await import('../src/lib/server/db/migrate');
  const { zorgVoorBasis } = await import('../src/lib/server/seed');
  zorgVoorMigraties();
  zorgVoorBasis();
  dieren = await import('../src/lib/server/dieren');
  ({ db } = await import('../src/lib/server/db/index'));
  schema = await import('../src/lib/server/db/schema');
  const { actiefSpel } = await import('../src/lib/server/spel');
  spelId = actiefSpel()!.id;
});

function spelersNu() {
  return db.select().from(schema.spelers).all();
}

describe('maatjes op de server', () => {
  it('geeft iedereen bij de start een eigen dier', () => {
    const lijst = spelersNu();
    expect(lijst.every((s) => s.dier)).toBe(true);
    expect(new Set(lijst.map((s) => s.dier)).size).toBe(lijst.length);
  });

  it('laat je een vrij dier kiezen, maar niet dat van een ander aan tafel', () => {
    const [a, b] = spelersNu().filter((s) => !s.isQuizmaster);
    expect(dieren.kiesDier(a.id, 'draak', spelId)).toEqual({ ok: false, reden: 'onbekend dier' });
    expect(dieren.kiesDier(a.id, b.dier, spelId)).toEqual({ ok: false, reden: `al gekozen door ${b.naam}` });

    const vrij = ['das', 'konijn', 'worm'].find((d) => !spelersNu().some((s) => s.dier === d))!;
    expect(dieren.kiesDier(a.id, vrij, spelId)).toEqual({ ok: true });
    expect(spelersNu().find((s) => s.id === a.id)!.dier).toBe(vrij);
    // Je eigen dier nog eens kiezen mag gewoon.
    expect(dieren.kiesDier(a.id, vrij, spelId)).toEqual({ ok: true });
  });

  it('dobbelt voor de quizmaster altijd een ander dier', () => {
    const a = spelersNu().find((s) => !s.isQuizmaster)!;
    const nieuw = dieren.dobbelDier(a.id, () => 0.5);
    expect(nieuw).not.toBe(a.dier);
  });

  it('laat je je maatje een naam geven, die blijft als je van dier wisselt', () => {
    const a = spelersNu().find((s) => !s.isQuizmaster)!;
    expect(dieren.noemDier(a.id, '  Knabbel\n  de   Derde ')).toBe('Knabbel de Derde');
    expect(spelersNu().find((s) => s.id === a.id)!.dierNaam).toBe('Knabbel de Derde');
    dieren.dobbelDier(a.id, () => 0.3);
    expect(spelersNu().find((s) => s.id === a.id)!.dierNaam).toBe('Knabbel de Derde');
    // Leeg haalt de naam weg.
    expect(dieren.noemDier(a.id, '   ')).toBeNull();
    expect(spelersNu().find((s) => s.id === a.id)!.dierNaam).toBeNull();
  });
});

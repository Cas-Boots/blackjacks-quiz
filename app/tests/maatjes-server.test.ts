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
let spel: typeof import('../src/lib/server/spel');

beforeAll(async () => {
  const { zorgVoorMigraties } = await import('../src/lib/server/db/migrate');
  const { zorgVoorBasis } = await import('../src/lib/server/seed');
  zorgVoorMigraties();
  zorgVoorBasis();
  dieren = await import('../src/lib/server/dieren');
  ({ db } = await import('../src/lib/server/db/index'));
  schema = await import('../src/lib/server/db/schema');
  spel = await import('../src/lib/server/spel');
  spelId = spel.actiefSpel()!.id;
});

function spelersNu() {
  return db.select().from(schema.spelers).all();
}

describe('maatjes op de server', () => {
  it('geeft niemand bij de start al een dier: ieder kiest zelf', () => {
    expect(spelersNu().every((s) => s.dier === null)).toBe(true);
  });

  it('laat je een vrij dier kiezen, maar niet dat van een ander aan tafel', () => {
    const [a, b] = spelersNu().filter((s) => !s.isQuizmaster);
    expect(dieren.kiesDier(a.id, 'draak', spelId)).toEqual({ ok: false, reden: 'onbekend dier' });
    expect(dieren.kiesDier(b.id, 'lama', spelId)).toEqual({ ok: true });
    expect(dieren.kiesDier(a.id, 'lama', spelId)).toEqual({ ok: false, reden: `al gekozen door ${b.naam}` });

    expect(dieren.kiesDier(a.id, 'das', spelId)).toEqual({ ok: true });
    expect(spelersNu().find((s) => s.id === a.id)!.dier).toBe('das');
    // Je eigen dier nog eens kiezen mag gewoon.
    expect(dieren.kiesDier(a.id, 'das', spelId)).toEqual({ ok: true });
  });

  it('laat wie zijn dier van een vorige avond meeneemt opnieuw kiezen als een ander het nu heeft', () => {
    const { voegDeelnemerToe, actiefSpel } = spel;
    const [a] = spelersNu().filter((s) => !s.isQuizmaster && s.dier);
    // Een gast van vroeger die toevallig hetzelfde dier nog heeft.
    const gast = db.insert(schema.spelers).values({ naam: 'Oudgast', isGast: true, dier: a.dier }).returning().get();
    voegDeelnemerToe(actiefSpel()!, 'Oudgast');
    expect(spelersNu().find((s) => s.id === gast.id)!.dier).toBeNull();
    expect(spelersNu().find((s) => s.id === a.id)!.dier).toBe(a.dier);
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

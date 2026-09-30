import { describe, it, expect, beforeAll } from 'vitest';
import type { Pakketten } from '../src/lib/content/types';

/**
 * Het beheerscherm draait op een echte, lege database in het geheugen: de
 * regels die er toe doen (een speler met een avond mag niet weg, het actieve
 * spel weggooien laat de schermen niet zonder spel) zijn databaseregels, en
 * die test je niet met een nep-database.
 */
process.env.DATABASE_PATH = ':memory:';
process.env.NODE_ENV = 'test';

type Beheer = typeof import('../src/lib/server/beheer');
type Spel = typeof import('../src/lib/server/spel');
let beheer: Beheer;
let spel: Spel;

beforeAll(async () => {
  const { zorgVoorMigraties } = await import('../src/lib/server/db/migrate');
  const { zorgVoorBasis } = await import('../src/lib/server/seed');
  zorgVoorMigraties();
  zorgVoorBasis();
  beheer = await import('../src/lib/server/beheer');
  spel = await import('../src/lib/server/spel');
});

describe('apparaatId', () => {
  it('is vast, kort en geeft het token niet prijs', () => {
    const id = beheer.apparaatId('geheim-token-1234');
    expect(id).toBe(beheer.apparaatId('geheim-token-1234'));
    expect(id).toHaveLength(16);
    expect(id).not.toContain('geheim');
    expect(beheer.apparaatId('ander')).not.toBe(id);
  });
});

describe('controleerMedia', () => {
  const pakketten: Pakketten = {
    proef: {
      naam: 'Proef',
      beschrijving: '',
      rondes: [
        {
          naam: 'Beeld', suit: '♠', thema: '', type: 'open', tijd: 30, punten: 1, teamModus: 'individueel', uitleg: '',
          vragen: [
            { v: 'Wie?', a: 'A', media: { soort: 'beeld', bron: 'foto-1.jpg' } },
            { v: 'Wat?', a: 'B', media: { soort: 'muziek', bron: 'lied-1.mp3' } },
            { v: 'Ingebakken', a: 'C', media: { soort: 'beeld', bron: 'data:image/png;base64,AAAA' } },
            { v: 'Zonder', a: 'D' },
          ],
        },
      ],
    },
  };

  it('zet ontbrekende bestanden apart en telt ingebakken fragmenten niet mee', () => {
    const c = beheer.controleerMedia(pakketten, ['foto-1.jpg', 'README.md', 'los.mp4'], '/media', true);
    expect(c.verwacht.map((v) => [v.bron, v.aanwezig])).toEqual([['foto-1.jpg', true], ['lied-1.mp3', false]]);
    expect(c.ontbrekend).toBe(1);
    expect(c.ongebruikt).toEqual(['los.mp4']);
  });

  it('meldt een map die er niet is zonder om te vallen', () => {
    const c = beheer.controleerMedia(pakketten, [], '/nergens', false);
    expect(c.mapBestaat).toBe(false);
    expect(c.ontbrekend).toBe(2);
  });
});

describe('telInhoud', () => {
  it('telt rondes, vragen, levende en nog te vullen vragen', () => {
    const uit = beheer.telInhoud({
      p: {
        naam: 'P', beschrijving: '',
        rondes: [
          { naam: 'r1', suit: '♠', thema: '', type: 'open', tijd: 1, punten: 1, teamModus: 'individueel', uitleg: '', vragen: [{ v: 'a', a: 'x' }, { v: 'b', a: '', teVullen: true }] },
          { naam: 'r2', suit: '♥', thema: '', type: 'open', tijd: 1, punten: 1, teamModus: 'individueel', uitleg: '', vragen: [{ v: 'c', a: 'y', live: 'sport.meeste' }] },
        ],
      },
    });
    expect(uit).toEqual([{ id: 'p', naam: 'P', rondes: 2, vragen: 3, teVullen: 1, live: 1 }]);
  });
});

describe('schoneNaam', () => {
  it('haalt dubbele spaties weg en weigert leeg of te lang', () => {
    expect(beheer.schoneNaam('  Tom   van  Dijk ')).toBe('Tom van Dijk');
    expect(() => beheer.schoneNaam('   ')).toThrow(/naam/i);
    expect(() => beheer.schoneNaam('x'.repeat(40))).toThrow(/hooguit/);
  });
});

describe('spelers', () => {
  it('begint met de vaste groep en de quizmaster, die niet weg kan', () => {
    const lijst = beheer.beheerSpelers();
    expect(lijst.map((s) => s.naam)).toContain('Cas');
    const cas = lijst.find((s) => s.naam === 'Cas')!;
    expect(cas.isQuizmaster).toBe(true);
    expect(cas.verwijderbaar).toBe(false);
    expect(() => beheer.verwijderSpeler(cas.id)).toThrow(/quizmaster/);
  });

  it('laat een speler die aan een avond meedeed niet weghalen, wel gast maken', () => {
    const liz = beheer.beheerSpelers().find((s) => s.naam === 'Liz')!;
    expect(liz.doetNuMee).toBe(true);
    expect(liz.verwijderbaar).toBe(false);
    expect(() => beheer.verwijderSpeler(liz.id)).toThrow(/meedeed|avond/);
    beheer.zetGast(liz.id, true);
    expect(beheer.beheerSpelers().find((s) => s.id === liz.id)!.isGast).toBe(true);
    beheer.zetGast(liz.id, false);
  });

  it('voegt een vaste speler toe die meteen aanschuift in de lobby, en haalt hem daarna alleen weg als hij nergens aan meedeed', () => {
    const nieuw = beheer.voegSpelerToe('  Tom ');
    expect(nieuw.naam).toBe('Tom');
    expect(nieuw.isGast).toBe(false);
    const tom = beheer.beheerSpelers().find((s) => s.id === nieuw.id)!;
    expect(tom.doetNuMee).toBe(true);
    expect(tom.verwijderbaar).toBe(false);
    expect(() => beheer.voegSpelerToe('Tom')).toThrow(/al/);

    const los = beheer.voegSpelerToe('Nergens');
    // Deelname aan het spel weghalen door een nieuw spel te beginnen zonder hem: hij is vast, dus hij komt mee.
    // Daarom hier direct: hij kan pas weg als er geen deelname is.
    expect(beheer.beheerSpelers().find((s) => s.id === los.id)!.verwijderbaar).toBe(false);
  });

  it('hernoemt een speler en weigert een bezette naam', () => {
    const rik = beheer.beheerSpelers().find((s) => s.naam === 'Rik')!;
    expect(() => beheer.hernoemSpeler(rik.id, 'Eva')).toThrow(/al/);
    beheer.hernoemSpeler(rik.id, 'Rik B.');
    expect(beheer.beheerSpelers().find((s) => s.id === rik.id)!.naam).toBe('Rik B.');
    beheer.hernoemSpeler(rik.id, 'Rik');
  });

  it('zet en verwijdert een portret, en weigert een adres naar elders', () => {
    const eva = beheer.beheerSpelers().find((s) => s.naam === 'Eva')!;
    expect(() => beheer.zetFoto(eva.id, 'https://elders/foto.jpg')).toThrow(/afbeelding/);
    beheer.zetFoto(eva.id, 'data:image/png;base64,iVBORw0KGgo=');
    expect(beheer.beheerSpelers().find((s) => s.id === eva.id)!.foto).toMatch(/^data:image\/png/);
    beheer.zetFoto(eva.id, null);
    expect(beheer.beheerSpelers().find((s) => s.id === eva.id)!.foto).toBeNull();
  });
});

describe('spellen', () => {
  it('maakt een eerder spel weer actief', () => {
    const eerste = spel.actiefSpel()!;
    const { maakSpel } = { maakSpel: (p: string) => import('../src/lib/server/seed').then((m) => m.maakSpel(p)) };
    return maakSpel('jaar2026').then((tweede) => {
      expect(spel.actiefSpel()!.id).toBe(tweede.id);
      beheer.activeerSpel(eerste.id);
      expect(spel.actiefSpel()!.id).toBe(eerste.id);
      const lijst = beheer.beheerSpellen();
      expect(lijst.filter((s) => s.isActief)).toHaveLength(1);
      expect(lijst.find((s) => s.id === tweede.id)!.isActief).toBe(false);
    });
  });

  it('hernoemt een spel', () => {
    const actief = spel.actiefSpel()!;
    beheer.hernoemSpel(actief.id, '  Proefavond  ');
    expect(beheer.beheerSpellen().find((s) => s.id === actief.id)!.naam).toBe('Proefavond');
    expect(() => beheer.hernoemSpel(actief.id, '')).toThrow(/naam/i);
  });

  it('laat de schermen nooit zonder spel: na het weggooien van het actieve spel is het jongste actief, of er komt een nieuw', () => {
    const actief = spel.actiefSpel()!;
    const ander = beheer.beheerSpellen().find((s) => !s.isActief)!;
    beheer.verwijderSpel(actief.id);
    expect(spel.actiefSpel()!.id).toBe(ander.id);

    // Alles weg: er komt vanzelf een leeg spel met hetzelfde pakket.
    for (const s of beheer.beheerSpellen()) beheer.verwijderSpel(s.id);
    const nieuw = spel.actiefSpel();
    expect(nieuw).toBeDefined();
    expect(nieuw!.pakket).toBe('jaar2026');
    expect(beheer.beheerSpellen()).toHaveLength(1);
  });

  it('weigert een onbekend spel', () => {
    expect(() => beheer.activeerSpel(999_999)).toThrow(/onbekend/i);
    expect(() => beheer.verwijderSpel(999_999)).toThrow(/onbekend/i);
  });
});

describe('apparaten', () => {
  it('koppelt een telefoon los, maar nooit het eigen scherm, en vergeet oude apparaten', () => {
    const liz = beheer.beheerSpelers().find((s) => s.naam === 'Liz')!;
    spel.raakApparaatAan('token-liz', 'speler', liz.id, 'Liz');
    spel.raakApparaatAan('token-host', 'quizmaster', null, 'Quizmaster');
    const lijst = beheer.beheerApparaten('token-host');
    const eigen = lijst.find((a) => a.ditApparaat)!;
    const vanLiz = lijst.find((a) => a.spelerNaam === 'Liz')!;
    expect(eigen.rol).toBe('quizmaster');
    expect(lijst.some((a) => a.id.includes('token'))).toBe(false);

    expect(() => beheer.koppelLos(eigen.id, 'token-host')).toThrow(/nu op zit/);
    beheer.koppelLos(vanLiz.id, 'token-host');
    expect(beheer.beheerApparaten('token-host').some((a) => a.spelerNaam === 'Liz')).toBe(false);
    expect(() => beheer.koppelLos(vanLiz.id, 'token-host')).toThrow(/onbekend/i);

    // Opruimen laat het eigen scherm staan, hoe oud ook.
    spel.raakApparaatAan('token-oud', 'gast', null, 'Televisie');
    expect(beheer.ruimApparatenOp('token-host', 0)).toBe(1);
    expect(beheer.beheerApparaten('token-host').map((a) => a.rol)).toEqual(['quizmaster']);
  });
});

describe('export', () => {
  it('bevat alle tabellen behalve de apparaten', () => {
    const uit = beheer.exportVanAlles();
    expect(uit.spelers.length).toBeGreaterThan(0);
    expect(uit.spellen.length).toBe(1);
    expect(Object.keys(uit)).not.toContain('apparaten');
    expect(uit.exportSchemaVersion).toBe(1);
  });
});

describe('overzicht', () => {
  it('komt in één keer compleet terug', () => {
    const o = beheer.beheerOverzicht(undefined);
    expect(o.server.tabellen).toBeGreaterThan(5);
    expect(o.server.productie).toBe(false);
    expect(o.inhoud.map((p) => p.id)).toContain('jaar2026');
    expect(o.media).toHaveProperty('verwacht');
    expect(o.spelers.length).toBeGreaterThan(0);
    expect(o.spellen.length).toBe(1);
  });
});

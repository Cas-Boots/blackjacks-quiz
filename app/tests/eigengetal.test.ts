import { describe, it, expect } from 'vitest';
import { binnenSpeling, spelingVoor, SPELING } from '../src/lib/shared/eigengetal';
import { bepaalEigenGetal } from '../src/lib/server/scoring';
import { beoordeel } from '../src/lib/server/antwoord';
import { analyseer, type RecapExport } from '../src/lib/server/recap/analyse';
import { beantwoord, verlevendig } from '../src/lib/server/recap/vragen';
import { PAKKETTEN } from '../src/lib/content/packs';
import type { Ronde } from '../src/lib/content/types';

describe('de speling bij ieder zijn eigen getal', () => {
  it('is altijd minstens twee, en anders een vijfde', () => {
    expect(SPELING).toEqual({ minimaal: 2, deel: 0.2 });
    expect(spelingVoor(5)).toBe(2);
    expect(spelingVoor(10)).toBe(2);
    expect(spelingVoor(25)).toBe(5);
    expect(spelingVoor(-15)).toBe(3);
  });
  it('rekent de rand mee als raak', () => {
    expect(binnenSpeling(7, 5)).toBe(true);
    expect(binnenSpeling(8, 5)).toBe(false);
    expect(binnenSpeling(30, 25)).toBe(true);
    expect(binnenSpeling(31, 25)).toBe(false);
    // 20% van 28,5 is 5,7: drijvende komma mag de rand niet kosten.
    expect(binnenSpeling(22.8, 28.5)).toBe(true);
  });
});

describe('bepaalEigenGetal', () => {
  const spelers = [
    { naam: 'Liz', inzender: 's_1' },
    { naam: 'Rik', inzender: 's_2' },
    { naam: 'Gast', inzender: 's_3' },
    { naam: 'Eva', inzender: 's_4' },
  ];
  const doelen = { Liz: 5, Rik: 29, Eva: 15, Cas: 0 };

  it('kijkt elke gok na tegen het eigen getal', () => {
    const { uitslag, winnaars } = bepaalEigenGetal(doelen, spelers, [
      { inzender: 's_1', tekst: '7' },
      { inzender: 's_2', tekst: 'ongeveer 24 weken' },
      { inzender: 's_3', tekst: '3' },
    ]);
    expect(winnaars).toEqual(['s_1', 's_2']);
    // Kleinste achterstand eerst; de gast zonder getal en Cas (speelt niet) staan er niet in.
    expect(uitslag.map((u) => u.naam)).toEqual(['Liz', 'Eva', 'Rik']);
    expect(uitslag.find((u) => u.naam === 'Eva')).toMatchObject({ gok: null, goed: false, speling: 3 });
    expect(uitslag.find((u) => u.naam === 'Rik')).toMatchObject({ gok: 24, goed: true });
  });

  it('wie er net buiten zit, scoort niet', () => {
    const { winnaars } = bepaalEigenGetal(doelen, spelers, [{ inzender: 's_1', tekst: '8' }, { inzender: 's_2', tekst: '35' }]);
    expect(winnaars).toEqual([]);
  });
});

describe('beoordeel bij ieder zijn eigen getal', () => {
  const ronde: Ronde = { naam: 'r', suit: '♠', thema: 't', type: 'open', tijd: 30, punten: 2, teamModus: 'individueel', uitleg: '', vragen: [] };
  const vraag = { v: 'Hoeveel weken?', a: 'Liz 5 · Rik 29 weken', eigenGetal: { Liz: 5, Rik: 29 } };
  it('laat het oordeel aan de machine bij de onthulling, niet aan de tekst', () => {
    expect(beoordeel(ronde, vraag, 'Liz 5 · Rik 29 weken')).toMatchObject({ automatisch: false, reden: '5' });
    expect(beoordeel(ronde, vraag, 'geen idee')).toMatchObject({ automatisch: false, reden: 'geen getal' });
  });
});

describe('sport.achterstand', () => {
  const data: RecapExport = {
    exportedAt: '2026-06-15T10:00:00.000Z',
    seasons: [{ id: 1, year: 2026, name: '2026', is_active: 1 }],
    people: [
      { id: 1, name: 'An', emoji: '', is_active: 1 },
      { id: 2, name: 'Bo', emoji: '', is_active: 1 },
    ],
    metrics: [{ id: 1, name: 'Sporting' }, { id: 2, name: 'Cakes Eaten' }],
    entries: [
      { id: 1, season_id: 1, person_id: 1, metric_id: 1, entry_date: '2026-01-05', deleted_at: null, tags: 'gym' },
      { id: 2, season_id: 1, person_id: 1, metric_id: 1, entry_date: '2026-01-06', deleted_at: null, tags: 'gym' },
      { id: 3, season_id: 1, person_id: 1, metric_id: 1, entry_date: '2026-01-07', deleted_at: null, tags: 'gym' },
      { id: 4, season_id: 1, person_id: 2, metric_id: 1, entry_date: '2026-02-01', deleted_at: null, tags: 'padel' },
      { id: 5, season_id: 1, person_id: 2, metric_id: 1, entry_date: '2026-02-03', deleted_at: null, tags: 'padel' },
    ],
    goals: [],
    countries_visited: [],
  };
  const analyse = analyseer(data);

  it('meet hoeveel weken eerder de haas al op jouw totaal stond', () => {
    // Bo staat op 2; An stond daar al op 6 januari, 23 weken voor 15 juni.
    const uit = beantwoord('sport.achterstand:An', analyse);
    expect(uit).toMatchObject({ eigenGetal: { Bo: 23 }, eenheid: 'weken', a: 'Bo 23 weken' });
    expect(uit?.v).toContain('An');
  });

  it('zonder naam is de haas wie het vaakst sportte', () => {
    expect(beantwoord('sport.achterstand', analyse)?.eigenGetal).toEqual({ Bo: 23 });
  });

  it('wie vóór de haas ligt, krijgt een negatief getal', () => {
    expect(beantwoord('sport.achterstand:Bo', analyse)?.eigenGetal).toEqual({ An: -23 });
  });

  it('komt in de vraag terecht bij het verlevendigen', () => {
    const v = verlevendig({ v: 'x', a: 'y', live: 'sport.achterstand:An', eigenGetal: { Bo: 1 } }, analyse);
    expect(v.eigenGetal).toEqual({ Bo: 23 });
    expect(v.eenheid).toBe('weken');
  });

  it('staat in de sportronde, ieder voor zich', () => {
    const r = PAKKETTEN.jaar2026.rondes.find((x) => x.naam === 'Onze Sportcompetitie')!;
    const v = r.vragen.find((x) => x.live?.startsWith('sport.achterstand'));
    expect(r.teamModus).toBe('individueel');
    expect(v && !v.reserve).toBe(true);
    expect(Object.keys(v!.eigenGetal ?? {}).sort()).toEqual(['Bastiaan', 'Eva', 'Joris', 'Liz', 'Rik']);
  });
});

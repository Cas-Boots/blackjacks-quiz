import { describe, it, expect } from 'vitest';
import snapshot from './fixtures/recap-2026-09-18.json';
import { analyseer, type RecapExport } from '../src/lib/server/recap/analyse';
import { opvallend } from '../src/lib/server/recap/opvallend';
import { aantalStappen, cijfersVoor } from '../src/lib/server/recap/cijfers';

/** Datums op de gegeven weekdagen (maandag = 0), vanaf maandag 5 januari 2026, een aantal weken lang. */
function dagen(weekdagen: number[], weken: number, vanafWeek = 0): string[] {
  const uit: string[] = [];
  for (let w = vanafWeek; w < vanafWeek + weken; w++) {
    for (const d of weekdagen) uit.push(new Date(Date.UTC(2026, 0, 5 + w * 7 + d)).toISOString().slice(0, 10));
  }
  return uit;
}

/** Een verzonnen jaar: per persoon een lijst [datum, sport]. */
function jaar(personen: Record<string, [string, string][]>): RecapExport {
  const namen = Object.keys(personen);
  let id = 0;
  return {
    exportedAt: '2026-11-05T00:00:00.000Z',
    seasons: [{ id: 1, year: 2026, name: '2026', is_active: 1 }],
    people: namen.map((name, i) => ({ id: i + 1, name, emoji: '', is_active: 1 })),
    metrics: [{ id: 1, name: 'Sporting' }, { id: 2, name: 'Cakes Eaten' }],
    entries: namen.flatMap((naam, i) =>
      personen[naam].map(([entry_date, tags]) => ({
        id: ++id, season_id: 1, person_id: i + 1, metric_id: 1, entry_date, deleted_at: null, tags,
      })),
    ),
    goals: [],
    countries_visited: [],
  };
}

const met = (sport: string) => (d: string): [string, string] => [d, sport];

describe('opvallend', () => {
  it('ziet wie nooit zonder een ander sportte', () => {
    const samen = dagen([0, 2], 20).map(met('gym'));
    const feiten = opvallend(analyseer(jaar({
      Bo: samen,
      An: [...samen, ...dagen([4], 6).map(met('running'))],
    })));
    const f = feiten.find((x) => x.kop === 'Nooit zonder An');
    expect(f?.tekst).toBe('Bo sportte dit jaar op 40 dagen, en op elk daarvan sportte An ook. An ging wel zes keer zonder Bo.');
    expect(f?.namen).toEqual(['Bo', 'An']);
  });

  it('noemt de ene dag als het er bijna nooit zonder was', () => {
    const samen = dagen([0, 2], 20).map(met('gym'));
    const feiten = opvallend(analyseer(jaar({
      Bo: [...samen, ['2026-03-13', 'running']],
      An: [...samen, ...dagen([4], 6).map(met('running'))],
    })));
    expect(feiten.find((x) => x.kop === 'Bijna nooit zonder An')?.tekst).toBe(
      'Bo sportte dit jaar op 41 dagen. Op één na sportte An die dag ook: alleen op vrijdag 13 maart niet.',
    );
  });

  it('zegt niets over twee die gewoon vaak samen gaan', () => {
    const feiten = opvallend(analyseer(jaar({
      An: [...dagen([0, 2], 20).map(met('gym')), ...dagen([4], 3).map(met('running'))],
      Bo: [...dagen([0, 2], 20).map(met('gym')), ...dagen([1], 3).map(met('running'))],
    })));
    expect(feiten.filter((x) => x.kop.includes('zonder'))).toEqual([]);
  });

  it('vindt de lege weekdag en zet wie dezelfde heeft bij elkaar', () => {
    const week = [0, 1, 2, 3, 4, 6];
    const feiten = opvallend(analyseer(jaar({
      An: dagen(week, 7).map(met('gym')),
      Bo: dagen(week, 8, 10).map(met('running')),
    })));
    expect(feiten).toContainEqual({
      emoji: '🚫',
      kop: 'Nooit op zaterdag',
      tekst: 'An en Bo sportten dit jaar 42 en 48 keer, en geen van beiden ooit op een zaterdag.',
      namen: ['An', 'Bo'],
    });
  });

  it('noemt de datum van die ene keer', () => {
    const feiten = opvallend(analyseer(jaar({
      Rik: [...dagen([0, 2, 3, 4, 5, 6], 7).map(met('padel')), ['2026-04-21', 'padel']],
    })));
    expect(feiten.find((x) => x.kop === 'Eén dinsdag')?.tekst).toBe('Rik sportte dit jaar 43 keer. Op een dinsdag maar één keer: 21 april.');
  });

  it('ziet een lievelingssport die op één doordeweekse dag nooit gebeurt', () => {
    const feiten = opvallend(analyseer(jaar({
      Joris: [...dagen([0, 1, 2, 3, 5, 6], 6).map(met('gym')), ...dagen([4], 6).map(met('running'))],
    })));
    expect(feiten.find((x) => x.kop === 'Nooit sportschool op vrijdag')?.tekst).toBe(
      'Joris ging dit jaar 36 keer naar de sportschool, maar nooit op een vrijdag. Wel zes keer iets anders.',
    );
  });

  it('laat de dia weg als er niets opvalt', () => {
    const a = analyseer(jaar({ An: dagen([0, 1, 2, 3, 4, 5, 6], 2).map(met('gym')) }));
    expect(opvallend(a)).toEqual([]);
    expect(aantalStappen('sport', a)).toBe(2);
    expect(cijfersVoor('sport', a, 1, { analyse: a, aantalSpelers: 1 }).opvallend).toBeUndefined();
  });

  it('zet de weetjes als laatste stap achter de sportcijfers, niet achter de taart', () => {
    const a = analyseer(snapshot as unknown as RecapExport);
    expect(opvallend(a).length).toBeGreaterThan(0);
    const stappen = aantalStappen('sport', a);
    expect(stappen).toBe(a.personen.length + 2);
    expect(cijfersVoor('sport', a, stappen - 1, { analyse: a, aantalSpelers: 6 }).opvallend?.length).toBeGreaterThan(0);
    expect(cijfersVoor('taart', a, 99, { analyse: a, aantalSpelers: 6 }).opvallend).toBeUndefined();
    expect(aantalStappen('taart', a)).toBe(a.personen.length + 1);
  });
});

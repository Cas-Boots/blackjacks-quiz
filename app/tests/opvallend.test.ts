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
function jaar(personen: Record<string, [string, string][]>, peildatum = '2026-11-05', taart: Record<string, string[]> = {}): RecapExport {
  const namen = Object.keys(personen);
  let id = 0;
  return {
    exportedAt: `${peildatum}T00:00:00.000Z`,
    seasons: [{ id: 1, year: 2026, name: '2026', is_active: 1 }],
    people: namen.map((name, i) => ({ id: i + 1, name, emoji: '', is_active: 1 })),
    metrics: [{ id: 1, name: 'Sporting' }, { id: 2, name: 'Cakes Eaten' }],
    entries: namen.flatMap((naam, i) => [
      ...personen[naam].map(([entry_date, tags]) => ({
        id: ++id, season_id: 1, person_id: i + 1, metric_id: 1, entry_date, deleted_at: null, tags,
      })),
      ...(taart[naam] ?? []).map((entry_date) => ({
        id: ++id, season_id: 1, person_id: i + 1, metric_id: 2, entry_date, deleted_at: null, tags: null,
      })),
    ]),
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
    const f = feiten.find((x) => x.kop === 'Bo nooit zonder An');
    expect(f?.tekst).toBe('Bo sportte dit jaar op 40 dagen, en op elk daarvan sportte An ook. An ging wel zes keer zonder Bo.');
    expect(f?.namen).toEqual(['Bo', 'An']);
  });

  it('noemt de ene dag als het er bijna nooit zonder was', () => {
    const samen = dagen([0, 2], 20).map(met('gym'));
    const feiten = opvallend(analyseer(jaar({
      Bo: [...samen, ['2026-03-13', 'running']],
      An: [...samen, ...dagen([4], 6).map(met('running'))],
    })));
    expect(feiten.find((x) => x.kop === 'Bo bijna nooit zonder An')?.tekst).toBe(
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

  it('noemt Bastiaan Bas, maar houdt de volledige naam voor het portret', () => {
    const samen = dagen([0, 2], 20).map(met('gym'));
    const feiten = opvallend(analyseer(jaar({
      Bastiaan: samen,
      Liz: [...samen, ...dagen([4], 6).map(met('running'))],
    })));
    expect(feiten[0].kop).toBe('Bas nooit zonder Liz');
    expect(feiten[0].tekst).toBe('Bas sportte dit jaar op 40 dagen, en op elk daarvan sportte Liz ook. Liz ging wel zes keer zonder Bas.');
    expect(feiten[0].namen).toEqual(['Bastiaan', 'Liz']);
  });

  it('zegt niets over een sport die op één weekdag nooit gebeurt', () => {
    const feiten = opvallend(analyseer(jaar({
      Joris: [...dagen([0, 1, 2, 3, 5, 6], 6).map(met('gym')), ...dagen([4], 6).map(met('running'))],
    })));
    expect(feiten.filter((f) => f.kop.includes('vrijdag') || f.kop.includes('sportschool'))).toEqual([]);
  });

  it('zet niemand twee keer achter elkaar, en zet de verklaring erbij', () => {
    // Bas en Liz: altijd samen, nooit op zaterdag. Rik: één dinsdag.
    const week = [0, 1, 2, 3, 4, 6];
    const samen = dagen(week, 7).map(met('gym'));
    const feiten = opvallend(analyseer(jaar({
      Bastiaan: samen,
      Liz: [...samen, ...dagen([0], 4, 10).map(met('running'))],
      Rik: [...dagen([0, 2, 3, 4, 5, 6], 7).map(met('padel')), ['2026-04-21', 'padel']],
    })));
    expect(feiten.map((f) => f.kop).slice(0, 3)).toEqual(['Bas nooit zonder Liz', 'Eén dinsdag', 'Nooit op zaterdag']);
    expect(feiten[2].bij).toBe('Op zaterdag klussen ze.');
    expect(feiten[0].bij).toBeUndefined();
  });

  it('ziet een vrijdag de dertiende zonder sport, en noemt wat nog komt', () => {
    const feiten = opvallend(analyseer(jaar({ An: [['2026-02-12', 'gym'], ['2026-03-14', 'gym']] })));
    expect(feiten.find((f) => f.kop === 'Vrijdag de dertiende')?.tekst).toBe(
      'Op 13 februari en 13 maart sportte niemand van ons. Allebei vrijdag de dertiende. En 13 november moet nog komen.',
    );
    const wel = opvallend(analyseer(jaar({ An: [['2026-03-13', 'gym']] })));
    expect(wel.find((f) => f.kop === 'Vrijdag de dertiende')).toBeUndefined();
  });

  it('ziet wie op een bijzondere dag alleen sportte, en waar niemand sportte', () => {
    const feiten = opvallend(analyseer(jaar({ Eva: [['2026-02-14', 'gym'], ['2026-07-19', 'padel']], Rik: [['2026-07-19', 'padel']] })));
    expect(feiten.find((f) => f.kop === 'Valentijnsdag')).toMatchObject({ tekst: 'Op Valentijnsdag sportte er maar één van ons: Eva.', namen: ['Eva'] });
    expect(feiten.find((f) => f.kop === 'Niemand sportte')?.tekst).toBe('Op Koningsdag sportte niemand van ons.');
  });

  it('ziet wie de dag na een taart nooit sportte', () => {
    const taart = ['2026-02-03', '2026-02-19', '2026-03-15', '2026-07-23'];
    const sport = dagen([0, 2], 30).map(met('gym')).filter(([d]) => !['2026-02-04', '2026-02-20', '2026-03-16', '2026-07-24'].includes(d));
    const feiten = opvallend(analyseer(jaar({ Joris: sport }, '2026-11-05', { Joris: taart })));
    expect(feiten.find((f) => f.kop === 'Nooit de dag na de taart')?.tekst).toBe(
      'Joris at dit jaar op vier dagen taart, en sportte de dag erna geen enkele keer.',
    );
    const welErna = opvallend(analyseer(jaar({ Joris: dagen([0, 2], 30).map(met('gym')) }, '2026-11-05', { Joris: taart })));
    expect(welErna.find((f) => f.kop === 'Nooit de dag na de taart')).toBeUndefined();
  });

  it('noemt een sport die maar één keer gedaan is, zolang dat zo blijft', () => {
    const feiten = opvallend(analyseer(jaar({ Cas: [...dagen([0], 3).map(met('gym')), ['2026-04-16', 'cycling']] })));
    expect(feiten.find((f) => f.kop === 'Eén keer gefietst')?.tekst).toBe('Cas sportte dit jaar 4 keer. Fietsen: één keer, op 16 april.');
    const twee = opvallend(analyseer(jaar({ Cas: [['2026-04-16', 'cycling'], ['2026-05-16', 'cycling']] })));
    expect(twee.find((f) => f.kop === 'Eén keer gefietst')).toBeUndefined();
  });

  it('laat de dia weg als er niets opvalt', () => {
    const a = analyseer(jaar({ An: dagen([0, 1, 2, 3, 4, 5, 6], 2).map(met('gym')) }, '2026-01-20'));
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

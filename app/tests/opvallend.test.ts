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
function jaar(personen: Record<string, [string, string][]>, peildatum = '2026-11-05'): RecapExport {
  const namen = Object.keys(personen);
  let id = 0;
  return {
    exportedAt: `${peildatum}T00:00:00.000Z`,
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
    const f = feiten.find((x) => x.kop === 'Bo nooit zonder An');
    expect(f?.tekst).toBe('Op 40 dagen sportte Bo dit jaar. Elke keer was An er ook. An ging wel zes keer zonder Bo.');
    expect(f?.namen).toEqual(['Bo', 'An']);
  });

  it('noemt de ene dag als het er bijna nooit zonder was', () => {
    const samen = dagen([0, 2], 20).map(met('gym'));
    const feiten = opvallend(analyseer(jaar({
      Bo: [...samen, ['2026-03-13', 'running']],
      An: [...samen, ...dagen([4], 6).map(met('running'))],
    })));
    expect(feiten.find((x) => x.kop === 'Bo bijna nooit zonder An')?.tekst).toBe(
      'Op 41 dagen sportte Bo dit jaar. Op één na was An er elke keer ook: alleen op vrijdag 13 maart niet.',
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
      tekst: 'An en Bo: samen 90 keer gesport, nul keer op zaterdag.',
      namen: ['An', 'Bo'],
    });
  });

  it('noemt de datum van die ene keer', () => {
    const feiten = opvallend(analyseer(jaar({
      Rik: [...dagen([0, 2, 3, 4, 5, 6], 7).map(met('padel')), ['2026-04-21', 'padel']],
    })));
    expect(feiten.find((x) => x.kop === 'Eén dinsdag')?.tekst).toBe('43 keer gesport, en één keer op een dinsdag: 21 april. Rik, wat was er die dag?');
  });

  it('noemt Bastiaan Bas, maar houdt de volledige naam voor het portret', () => {
    const samen = dagen([0, 2], 20).map(met('gym'));
    const feiten = opvallend(analyseer(jaar({
      Bastiaan: samen,
      Liz: [...samen, ...dagen([4], 6).map(met('running'))],
    })));
    expect(feiten[0].kop).toBe('Bas nooit zonder Liz');
    expect(feiten[0].tekst).toBe('Op 40 dagen sportte Bas dit jaar. Elke keer was Liz er ook. Liz ging wel zes keer zonder Bas.');
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
    expect(feiten[2].bij).toBe('Dan klussen ze.');
    expect(feiten[0].bij).toBeUndefined();
  });

  it('ziet een vrijdag de dertiende zonder sport, en noemt wat nog komt', () => {
    const feiten = opvallend(analyseer(jaar({ An: [['2026-02-12', 'gym'], ['2026-03-14', 'gym']] })));
    expect(feiten.find((f) => f.kop === 'Vrijdag de dertiende')?.tekst).toBe(
      'Vrijdag 13 februari en vrijdag 13 maart: niemand van ons kwam van de bank. Op 13 november zien we wie het durft.',
    );
    // Sporten op een eerdere vrijdag de dertiende breekt de reeks.
    const wel = opvallend(analyseer(jaar({ An: [['2026-02-13', 'gym']] })));
    expect(wel.find((f) => f.kop === 'Vrijdag de dertiende')).toBeUndefined();
  });

  it('ziet wie na een sport de dag erna altijd rust nam', () => {
    // Hardlopen op maandag, sportschool op woensdag en zaterdag: nooit iets op dinsdag.
    const sport = [...dagen([0], 16).map(met('running')), ...dagen([2, 5], 16).map(met('gym'))];
    const feiten = opvallend(analyseer(jaar({ Joris: sport })));
    expect(feiten.find((f) => f.kop === 'Na het hardlopen: rust')?.tekst).toBe(
      'Joris liep 16 keer hard. En de dag erna? Nooit iets.',
    );
    const welErna = opvallend(analyseer(jaar({ Joris: [...sport, ['2026-01-06', 'gym']] })));
    expect(welErna.find((f) => f.kop === 'Na het hardlopen: rust')).toBeUndefined();
  });

  it('noemt geen feestdagen meer', () => {
    const feiten = opvallend(analyseer(jaar({ Eva: [['2026-02-14', 'gym'], ['2026-03-02', 'gym']] })));
    expect(feiten.map((f) => f.kop)).not.toContain('Valentijnsdag');
    expect(feiten.map((f) => f.kop)).not.toContain('Niemand sportte');
  });

  it('ziet wie verreweg het vaakst helemaal alleen sportte', () => {
    const feiten = opvallend(analyseer(jaar({
      Cas: dagen([0, 1, 2, 3], 10).map(met('gym')),
      Joris: dagen([0], 10).map(met('gym')),
    })));
    expect(feiten.find((f) => f.kop === 'Helemaal alleen')).toMatchObject({
      tekst: 'Op 30 dagen sportte ik in mijn eentje. Niemand anders.',
      namen: ['Cas'],
    });
    const gelijk = opvallend(analyseer(jaar({
      Cas: dagen([0, 1, 2, 3], 10).map(met('gym')),
      Joris: dagen([4, 5, 6], 10).map(met('gym')),
    })));
    expect(gelijk.find((f) => f.kop === 'Helemaal alleen')).toBeUndefined();
  });

  it('ziet wie een sport inruilde voor een andere', () => {
    const feiten = opvallend(analyseer(jaar({
      Eva: [...dagen([0, 2], 15).map(met('gym')), ...dagen([0, 2, 4], 6, 30).map(met('padel'))],
    })));
    expect(feiten.find((f) => f.kop === 'Van de sportschool naar padel')?.tekst).toBe(
      '30 keer naar de sportschool, en sinds 15 april niet meer. Wel achttien keer padel. Eva, opgezegd?',
    );
    const nogBezig = opvallend(analyseer(jaar({
      Eva: [...dagen([0, 2], 15).map(met('gym')), ...dagen([0, 2, 4], 6, 30).map(met('padel')), ['2026-10-30', 'gym']],
    })));
    expect(nogBezig.find((f) => f.kop.startsWith('Van de sportschool'))).toBeUndefined();
  });

  it('zegt "ik" als de quizmaster zelf helemaal alleen sportte, en noemt anders de naam', () => {
    const cas = opvallend(analyseer(jaar({ Cas: dagen([0, 1, 2, 3], 10).map(met('gym')), Joris: dagen([4], 5).map(met('gym')) })));
    expect(cas.find((f) => f.kop === 'Helemaal alleen')?.tekst).toBe('Op 40 dagen sportte ik in mijn eentje. Niemand anders. Joris komt op vijf.');
    const joris = opvallend(analyseer(jaar({ Joris: dagen([0, 1, 2, 3], 10).map(met('gym')), Cas: dagen([4], 5).map(met('gym')) })));
    expect(joris.find((f) => f.kop === 'Helemaal alleen')?.tekst).toBe('Op 40 dagen sportte Joris helemaal alleen. Niemand anders. Ik kom op vijf.');
  });

  it('maakt van vrijdag 13 november de clou als daar toch iemand sportte', () => {
    const een = opvallend(analyseer(jaar({ Joris: [['2026-11-13', 'running']] }, '2026-12-31')));
    expect(een.find((f) => f.kop === 'Vrijdag de dertiende')?.tekst).toBe(
      'Vrijdag 13 februari en vrijdag 13 maart: niemand van ons kwam van de bank. Op 13 november durfde alleen Joris het aan.',
    );
    const ik = opvallend(analyseer(jaar({ Cas: [['2026-11-13', 'gym']] }, '2026-12-31')));
    expect(ik.find((f) => f.kop === 'Vrijdag de dertiende')?.tekst).toContain('Op 13 november durfde ik het aan.');
    const niemand = opvallend(analyseer(jaar({ Joris: [['2026-11-12', 'running']] }, '2026-12-31')));
    expect(niemand.find((f) => f.kop === 'Vrijdag de dertiende')?.tekst).toBe(
      'Vrijdag 13 februari, vrijdag 13 maart en vrijdag 13 november: niemand van ons kwam van de bank.',
    );
    const drie = opvallend(analyseer(jaar({ An: [['2026-11-13', 'gym']], Bo: [['2026-11-13', 'gym']], Cy: [['2026-11-13', 'gym']] }, '2026-12-31')));
    expect(drie.find((f) => f.kop === 'Vrijdag de dertiende')).toBeUndefined();
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

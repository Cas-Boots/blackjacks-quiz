import { describe, it, expect } from 'vitest';
import snapshot from '../src/lib/content/recap-snapshot.json';
import { analyseer, opsomming, telwoord, datumTekst, landNaam, vlag, zoekSportTag, type RecapExport } from '../src/lib/server/recap/analyse';
import { beantwoord, LIVE_SLEUTELS, verlevendig } from '../src/lib/server/recap/vragen';
import { beoordeelVoorspellingen } from '../src/lib/server/recap/voorspellingen';
import { cijfersVoor } from '../src/lib/server/recap/cijfers';
import { PAKKETTEN } from '../src/lib/content/packs';

const data = snapshot as unknown as RecapExport;
const analyse = analyseer(data);

/** Een klein verzonnen jaar, om de randgevallen van de vragen te raken. */
function klein(overschrijf: Partial<RecapExport> = {}): RecapExport {
  return {
    exportedAt: '2026-06-15T10:00:00.000Z',
    seasons: [{ id: 1, year: 2026, name: '2026', is_active: 1 }],
    people: [
      { id: 1, name: 'An', emoji: '', is_active: 1 },
      { id: 2, name: 'Bo', emoji: '', is_active: 1 },
      { id: 3, name: 'Cy', emoji: '', is_active: 0 },
    ],
    metrics: [{ id: 1, name: 'Sporting' }, { id: 2, name: 'Cakes Eaten' }],
    entries: [
      { id: 1, season_id: 1, person_id: 1, metric_id: 1, entry_date: '2026-01-05', deleted_at: null, tags: 'gym' },
      { id: 2, season_id: 1, person_id: 1, metric_id: 1, entry_date: '2026-01-06', deleted_at: null, tags: 'gym' },
      { id: 3, season_id: 1, person_id: 1, metric_id: 1, entry_date: '2026-01-07', deleted_at: null, tags: 'skating' },
      { id: 4, season_id: 1, person_id: 2, metric_id: 1, entry_date: '2026-02-01', deleted_at: null, tags: 'padel' },
      { id: 5, season_id: 1, person_id: 2, metric_id: 1, entry_date: '2026-02-03', deleted_at: null, tags: 'skating' },
      { id: 6, season_id: 1, person_id: 2, metric_id: 1, entry_date: '2026-02-04', deleted_at: '2026-02-05', tags: 'gym' },
      { id: 7, season_id: 1, person_id: 1, metric_id: 2, entry_date: '2026-03-01', deleted_at: null, tags: null },
      { id: 8, season_id: 1, person_id: 1, metric_id: 2, entry_date: '2026-03-01', deleted_at: null, tags: null },
      { id: 9, season_id: 1, person_id: 3, metric_id: 1, entry_date: '2026-03-01', deleted_at: null, tags: 'gym' },
    ],
    goals: [
      { id: 1, season_id: 1, person_id: 1, metric_id: 1, target: 2 },
      { id: 2, season_id: 1, person_id: 2, metric_id: 1, target: 50 },
    ],
    countries_visited: [
      { id: 1, season_id: 1, person_id: 1, country_code: 'NL', country_name: 'Netherlands', visited_at: '2026-01-02 10:00:00' },
      { id: 2, season_id: 1, person_id: 1, country_code: 'DE', country_name: 'Germany', visited_at: '2026-05-10 10:00:00' },
      { id: 3, season_id: 1, person_id: 1, country_code: 'AT', country_name: 'Austria', visited_at: '2026-05-10 11:00:00' },
      { id: 4, season_id: 1, person_id: 2, country_code: 'NL', country_name: 'Netherlands', visited_at: '2026-01-02 10:00:00' },
    ],
    ...overschrijf,
  };
}

describe('analyseer', () => {
  it('telt per persoon, zonder verwijderde regels en zonder inactieve mensen', () => {
    const a = analyseer(klein());
    expect(a.personen.map((p) => p.naam)).toEqual(['An', 'Bo']);
    expect(a.personen[0].sport.totaal).toBe(3);
    expect(a.personen[1].sport.totaal).toBe(2);
    expect(a.personen[0].taart.totaal).toBe(2);
    expect(a.personen[0].taart.dagen['2026-03-01']).toBe(2);
    expect(a.peildatum).toBe('2026-06-15');
  });
  it('trekt oude sportnamen gelijk en vertaalt ze', () => {
    const a = analyseer(klein());
    expect(a.personen[0].sport.soorten).toEqual([
      { naam: 'Sportschool', emoji: '🏋️', aantal: 2 },
      { naam: 'Schaatsen', emoji: '⛸️', aantal: 1 },
    ]);
    expect(a.sporten.get('ice-skating')).toBe(2);
  });
  it('kent de langste reeks', () => {
    expect(analyseer(klein()).personen[0].sport.langsteReeks).toBe(3);
  });
  it('vertaalt landen en maakt vlaggen', () => {
    expect(landNaam('SA', 'Saudi Arabia')).toBe('Saoedi-Arabië');
    expect(landNaam('ZZ', 'Atlantis')).toBe('Atlantis');
    expect(vlag('NL')).toBe('🇳🇱');
    expect(analyseer(klein()).personen[0].landen.map((l) => l.naam)).toEqual(['Nederland', 'Duitsland', 'Oostenrijk']);
  });
  it('werkt op de echte momentopname', () => {
    expect(analyse.personen.length).toBe(6);
    expect(analyse.jaar).toBe(2026);
    const cas = analyse.personen.find((p) => p.naam === 'Cas');
    expect(cas?.landen.length).toBe(12);
  });
});

describe('taal', () => {
  it('somt op', () => {
    expect(opsomming([])).toBe('niemand');
    expect(opsomming(['Eva'])).toBe('Eva');
    expect(opsomming(['Eva', 'Liz', 'Bastiaan'])).toBe('Eva, Liz en Bastiaan');
  });
  it('schrijft telwoorden', () => {
    expect(telwoord(12)).toBe('twaalf');
    expect(telwoord(13, true)).toBe('Dertien');
    expect(telwoord(46)).toBe('46');
    expect(datumTekst('2026-01-30')).toBe('30 januari');
  });
  it('vindt een sport op naam of tag', () => {
    expect(zoekSportTag('fysio')).toBe('physio');
    expect(zoekSportTag('physio')).toBe('physio');
    expect(zoekSportTag('skating')).toBe('ice-skating');
  });
});

describe('levende vragen', () => {
  it('kent elke sleutel die in de pakketten wordt gebruikt', () => {
    const gebruikt = new Set<string>();
    for (const p of Object.values(PAKKETTEN)) for (const r of p.rondes) for (const v of r.vragen) if (v.live) gebruikt.add(v.live.split(':')[0]);
    for (const s of gebruikt) expect(LIVE_SLEUTELS, `sleutel ${s}`).toContain(s);
  });
  it('geeft op de momentopname overal een antwoord', () => {
    const uitslag = beoordeelVoorspellingen({ analyse, aantalSpelers: 6 });
    for (const p of Object.values(PAKKETTEN)) {
      for (const r of p.rondes) {
        for (const v of r.vragen) {
          if (!v.live) continue;
          const uit = verlevendig(v, analyse, uitslag);
          expect(uit.teVullen, v.live).toBe(false);
          expect(uit.a, v.live).not.toContain('nog invullen');
          expect(uit.v.length, v.live).toBeGreaterThan(10);
        }
      }
    }
  });
  it('rekent de bekende cijfers uit', () => {
    expect(beantwoord('sport.meeste', analyse)?.a).toBe('Cas — 105 keer');
    expect(beantwoord('sport.geenGym', analyse)?.a).toBe('Rik');
    expect(beantwoord('sport.favorietVan', analyse)?.a).toMatch(/^Padel — \d+ keer$/);
    expect(beantwoord('sport.gezamenlijk', analyse)?.a).toBe('Klimmen');
    expect(beantwoord('sport.enige:pilates', analyse)?.a).toBe('Liz');
    expect(beantwoord('sport.aantal:physio', analyse)).toMatchObject({ v: 'Wie noteerde er twaalf keer fysio?', a: 'Eva' });
    expect(beantwoord('sport.hoogsteDoel', analyse)?.a).toBe('Cas — 162 keer sporten');
    expect(beantwoord('sport.doelBinnen', analyse)).toMatchObject({ v: 'Wie hadden hun jaardoel in september al binnen?', a: 'Eva, Liz en Bastiaan' });
    expect(beantwoord('taart.totaal', analyse)?.a).toBe('46');
    expect(beantwoord('taart.meeste', analyse)).toMatchObject({ v: 'Wie at daar in zijn eentje precies de helft van?', a: 'Cas — 23 taarten' });
    expect(beantwoord('taart.minste', analyse)?.a).toBe('Bastiaan');
    expect(beantwoord('taart.drukste', analyse)).toMatchObject({ v: 'Op welke dag gingen er vijf taarten doorheen — de drukste taartdag van het jaar?', a: '30 januari' });
    expect(beantwoord('landen.meeste', analyse)?.a).toBe('Cas — twaalf stuks');
    expect(beantwoord('landen.samen', analyse)?.a).toBe('Dertien');
    expect(beantwoord('landen.opEenDag', analyse)).toMatchObject({
      v: 'Cas deed op één dag in augustus drie landen aan. Welke?',
      a: 'Saoedi-Arabië, de Verenigde Arabische Emiraten en Kroatië',
    });
    expect(beantwoord('landen.thuisblijvers', analyse)?.a).toBe('Liz en Bastiaan');
  });
  it('past de tekst aan als de cijfers anders liggen', () => {
    const a = analyseer(klein());
    // Bo stond nooit in de sportschool; An wel.
    expect(beantwoord('sport.geenGym', a)?.a).toBe('Bo');
    expect(beantwoord('sport.favorietVan', a)?.v).toContain('Bo');
    // Niemand heeft precies één gezamenlijke sport; schaatsen deden ze allebei.
    expect(beantwoord('sport.gezamenlijk', a)?.a).toBe('Schaatsen');
    // An haalde haar doel van 2, Bo niet.
    expect(beantwoord('sport.doelBinnen', a)).toMatchObject({ v: 'Wie had zijn jaardoel in juni al binnen?', a: 'An' });
    // Bo at niets.
    expect(beantwoord('taart.minste', a)).toMatchObject({ v: 'Wie at het hele jaar geen enkele taart?', a: 'Bo' });
    expect(beantwoord('taart.meeste', a)?.v).toBe('Wie at daar in zijn eentje meer dan de helft van?');
    expect(beantwoord('landen.opEenDag', a)).toMatchObject({ v: 'An deed op één dag in mei twee landen aan. Welke?', a: 'Duitsland en Oostenrijk' });
    expect(beantwoord('landen.thuisblijvers', a)).toMatchObject({ v: 'Wie van ons kwam het hele jaar niet buiten Nederland?', a: 'Bo' });
  });
  it('geeft null bij een onbekende sleutel en laat de vraag dan met rust', () => {
    expect(beantwoord('bestaat.niet', analyse)).toBeNull();
    const v = { v: 'x', a: 'y', live: 'bestaat.niet' };
    expect(verlevendig(v, analyse)).toBe(v);
  });
});

describe('voorspellingen', () => {
  it('beoordeelt ja/nee, getallen en namen tegen de uitkomst', () => {
    const u = beoordeelVoorspellingen({ analyse, aantalSpelers: 6 });
    const wk = u.vragen.find((v) => v.nr === 6)!;
    expect(wk.open).toBe(false);
    expect(wk.antwoorden.filter((a) => a.goed).map((a) => a.naam)).toEqual(['Joris', 'Eva', 'Rik']);
    const goud = u.vragen.find((v) => v.nr === 5)!;
    expect(goud.antwoorden.filter((a) => a.goed).map((a) => a.naam)).toEqual(['Joris']);
  });
  it('rekent de recap- en quizuitkomsten zelf uit', () => {
    const u = beoordeelVoorspellingen({ analyse, aantalSpelers: 6 });
    const landen = u.vragen.find((v) => v.nr === 9)!;
    expect(landen.uitkomst).toBe('12');
    expect(landen.antwoorden.filter((a) => a.goed).map((a) => a.naam)).toEqual(['Cas']);
    const spelers = u.vragen.find((v) => v.nr === 7)!;
    expect(spelers.antwoorden.filter((a) => a.goed).map((a) => a.naam)).toEqual(['Joris', 'Bastiaan', 'Cas']);
    const eigen = u.vragen.find((v) => v.nr === 10)!;
    // In september is Liz over haar eigen getal heen; Cas nog niet, maar het jaar loopt nog.
    expect(eigen.voorlopig).toBe(true);
    expect(eigen.antwoorden.find((a) => a.naam === 'Cas')?.goed).toBeNull();
    expect(eigen.antwoorden.find((a) => a.naam === 'Cas')?.werkelijk).toBe('105 keer');
    expect(eigen.antwoorden.find((a) => a.naam === 'Liz')?.goed).toBe(true);
    // Is het jaar om, dan is niet gehaald echt mis.
    const eind = analyseer({ ...data, exportedAt: '2026-12-31T20:00:00.000Z' });
    const u2 = beoordeelVoorspellingen({ analyse: eind, aantalSpelers: 6 });
    const eigen2 = u2.vragen.find((v) => v.nr === 10)!;
    expect(eigen2.voorlopig).toBe(false);
    expect(eigen2.antwoorden.find((a) => a.naam === 'Cas')?.goed).toBe(false);
  });
  it('laat open wat nog niet beslist is, en telt dat niet mee', () => {
    const u = beoordeelVoorspellingen({ analyse, aantalSpelers: null });
    expect(u.vragen.find((v) => v.nr === 7)?.open).toBe(true);
    expect(u.vragen.find((v) => v.nr === 3)?.open).toBe(true);
    expect(u.open).toBeGreaterThan(0);
    const joris = u.stand.find((s) => s.naam === 'Joris')!;
    expect(joris.goed + joris.fout + joris.open).toBe(14);
  });
  it('laat de laatste voorspelling afhangen van de rest', () => {
    const u = beoordeelVoorspellingen({ analyse, aantalSpelers: 6 });
    const meta = u.vragen.find((v) => v.nr === 14)!;
    expect(meta.open).toBe(false);
    expect(meta.uitkomst).toBeTruthy();
  });
  it('vult de vragen van de ronde', () => {
    const u = beoordeelVoorspellingen({ analyse, aantalSpelers: 6 });
    expect(beantwoord('voorspellingen.meesteGoed', analyse, u)?.a).toMatch(/goed, \d+ punten/);
    expect(beantwoord('voorspellingen.nogOpen', analyse, u)?.a).toContain('nummer');
    expect(beantwoord('voorspellingen.meesteGoed', analyse)).toBeNull();
  });
});

describe('cijfers voor de televisie', () => {
  it('zet het overzicht voorop en dan iedereen op volgorde', () => {
    const c = cijfersVoor('sport', analyse, 0, { analyse, aantalSpelers: 6 });
    expect(c.stappen).toBe(7);
    expect(c.personen[0].naam).toBe('Cas');
    expect(c.personen.map((p) => p.naam)).toEqual(['Cas', 'Liz', 'Eva', 'Bastiaan', 'Joris', 'Rik']);
    expect(c.voorspellingen).toBeUndefined();
  });
  it('houdt de stap binnen de grenzen', () => {
    expect(cijfersVoor('taart', analyse, 99, { analyse, aantalSpelers: 6 }).stap).toBe(6);
  });
  it('geeft bij de voorspellingen één stap per voorspelling', () => {
    const c = cijfersVoor('voorspellingen', analyse, 3, { analyse, aantalSpelers: 6 });
    expect(c.stappen).toBe(15);
    expect(c.voorspellingen?.vragen.length).toBe(14);
  });
});

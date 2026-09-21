import { describe, it, expect } from 'vitest';
import snapshot from '../src/lib/content/recap-snapshot.json';
import { analyseer, type RecapExport } from '../src/lib/server/recap/analyse';
import {
  splits, aantalBalken, eigenMaand, maandenInDeFilm, aantalDias, maandenTeVullen, jaaroverzichtVoor,
} from '../src/lib/server/jaaroverzicht';
import { JAAROVERZICHT } from '../src/lib/content/jaaroverzicht';
import { PAKKETTEN } from '../src/lib/content/packs';

const analyse = analyseer(snapshot as unknown as RecapExport);

/** Een klein verzonnen jaar, om per maand te kunnen tellen. */
function klein(overschrijf: Partial<RecapExport> = {}): RecapExport {
  return {
    exportedAt: '2026-09-18T10:00:00.000Z',
    seasons: [{ id: 1, year: 2026, name: '2026', is_active: 1 }],
    people: [
      { id: 1, name: 'An', emoji: '', is_active: 1 },
      { id: 2, name: 'Bo', emoji: '', is_active: 1 },
    ],
    metrics: [{ id: 1, name: 'Sporting' }, { id: 2, name: 'Cakes Eaten' }],
    entries: [
      { id: 1, season_id: 1, person_id: 1, metric_id: 1, entry_date: '2026-01-05', deleted_at: null, tags: 'gym' },
      { id: 2, season_id: 1, person_id: 1, metric_id: 1, entry_date: '2026-01-06', deleted_at: null, tags: 'gym' },
      { id: 3, season_id: 1, person_id: 2, metric_id: 1, entry_date: '2026-01-07', deleted_at: null, tags: 'padel' },
      { id: 4, season_id: 1, person_id: 2, metric_id: 1, entry_date: '2026-02-03', deleted_at: null, tags: 'padel' },
      { id: 5, season_id: 1, person_id: 1, metric_id: 2, entry_date: '2026-01-30', deleted_at: null, tags: null },
      { id: 6, season_id: 1, person_id: 1, metric_id: 2, entry_date: '2026-03-02', deleted_at: null, tags: null },
    ],
    goals: [],
    countries_visited: [
      { id: 1, season_id: 1, person_id: 1, country_code: 'NL', country_name: 'Netherlands', visited_at: '2026-01-01 10:00:00' },
      { id: 2, season_id: 1, person_id: 2, country_code: 'NL', country_name: 'Netherlands', visited_at: '2026-01-01 10:00:00' },
      { id: 3, season_id: 1, person_id: 1, country_code: 'HR', country_name: 'Croatia', visited_at: '2026-08-14 10:00:00' },
      { id: 4, season_id: 1, person_id: 2, country_code: 'HR', country_name: 'Croatia', visited_at: '2026-08-20 10:00:00' },
    ],
    ...overschrijf,
  };
}

describe('de balken', () => {
  it('houdt het antwoord binnen zolang de balk ligt', () => {
    const delen = splits('[[Bulgarije]] wint het Songfestival.', false);
    expect(delen).toEqual([
      { tekst: '', balk: true, lengte: 9 },
      { tekst: ' wint het Songfestival.', balk: false, lengte: 0 },
    ]);
    // Nergens in het pakketje staat het woord zelf.
    expect(JSON.stringify(delen)).not.toContain('Bulgarije');
  });
  it('geeft na afloop dezelfde regel mét de antwoorden', () => {
    expect(splits('[[Bulgarije]] wint.', true).map((d) => d.tekst).join('')).toBe('Bulgarije wint.');
  });
  it('kan meerdere balken in één regel aan, en tekst ertussen', () => {
    const delen = splits('Op [[19]] juli wint [[Spanje]].', false);
    expect(delen.filter((d) => d.balk)).toHaveLength(2);
    expect(delen.map((d) => d.tekst).join('')).toBe('Op  juli wint .');
  });
  it('laat een regel zonder haken met rust', () => {
    expect(splits('Gewoon een regel.', false)).toEqual([{ tekst: 'Gewoon een regel.', balk: false, lengte: 0 }]);
  });
});

describe('de tijdlijn', () => {
  it('heeft twaalf maanden, op volgorde', () => {
    expect(JAAROVERZICHT.maanden.map((m) => m.nr)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
  it('legt in elke geschreven maand minstens één balk', () => {
    const zonder = JAAROVERZICHT.maanden
      .filter((m) => m.momenten.some((x) => !x.teVullen) && aantalBalken(m) === 0)
      .map((m) => m.nr);
    // Maand 9 en 12 zijn overgangsmaanden zonder feit uit de quiz.
    expect(zonder).toEqual([9, 12]);
  });
  it('vertelt niets wat de quiz niet ook vraagt', () => {
    // Elk antwoord onder een balk moet ergens in de vragen terugkomen; anders
    // staat er een feit op het scherm dat nooit gecontroleerd is.
    const quiz = JSON.stringify(PAKKETTEN).toLowerCase();
    const missers: string[] = [];
    for (const m of JAAROVERZICHT.maanden) {
      for (const moment of m.momenten) {
        for (const stuk of `${moment.tekst} ${moment.bij ?? ''}`.matchAll(/\[\[(.+?)\]\]/g)) {
          const woord = stuk[1].toLowerCase();
          // Getallen en losse woorden komen in de vragen soms voluit voor.
          if (!quiz.includes(woord)) missers.push(`${m.nr}: ${stuk[1]}`);
        }
      }
    }
    expect(missers).toEqual([]);
  });
  it('wijst de maanden aan die nog geschreven moeten worden', () => {
    expect(maandenTeVullen().map((m) => m.nr)).toEqual([10, 11, 12]);
  });
});

describe('onze eigen maand', () => {
  const a = analyseer(klein());

  it('telt sport en taart per maand', () => {
    expect(eigenMaand(a, 1).sport).toBe(3);
    expect(eigenMaand(a, 1).taart).toBe(1);
    expect(eigenMaand(a, 2).sport).toBe(1);
    expect(eigenMaand(a, 3).taart).toBe(1);
    expect(eigenMaand(a, 4).sport).toBe(0);
  });
  it('wijst de koploper van de maand aan, en laat hem weg als niemand iets deed', () => {
    expect(eigenMaand(a, 1).koploper).toEqual({ naam: 'An', aantal: 2 });
    expect(eigenMaand(a, 4).koploper).toBeNull();
  });
  it('noemt een land alleen de maand waarin het voor het eerst op de lijst kwam', () => {
    expect(eigenMaand(a, 8).landen.map((l) => l.naam)).toEqual(['Kroatië']);
    expect(eigenMaand(a, 8).landen[0].wie).toBe('An');
    expect(eigenMaand(a, 9).landen).toEqual([]);
  });
  it('houdt de landen van de eerste dagen apart — die zijn in één keer ingevoerd', () => {
    // Nederland staat op 1 januari bij allebei: dat is de lijst die het jaar
    // begon, geen uitje. Het telt wel mee in het totaal.
    expect(eigenMaand(a, 1).landen).toEqual([]);
    expect(eigenMaand(a, 1).bijStart).toBe(1);
    expect(eigenMaand(a, 1).totaal.landen).toBe(1);
    expect(eigenMaand(a, 8).bijStart).toBe(0);
  });
  it('kort een rij namen in als er te veel bij staan', () => {
    const velen = analyseer(
      klein({
        people: ['An', 'Bo', 'Cy', 'Di'].map((name, i) => ({ id: i + 1, name, emoji: '', is_active: 1 })),
        countries_visited: ['An', 'Bo', 'Cy', 'Di'].map((_, i) => ({
          id: i + 1, season_id: 1, person_id: i + 1,
          country_code: 'HR', country_name: 'Croatia', visited_at: '2026-08-14 10:00:00',
        })),
      }),
    );
    expect(eigenMaand(velen, 8).landen[0].wie).toBe('4 van ons');
  });
  it('houdt per persoon bij wat die maand deed, voor op de eigen telefoon', () => {
    expect(eigenMaand(a, 1).perPersoon).toEqual([
      { naam: 'An', sport: 2, taart: 1, landen: ['🇳🇱'] },
      { naam: 'Bo', sport: 1, taart: 0, landen: ['🇳🇱'] },
    ]);
  });
  it('laat de stand van het jaar meelopen tot en met die maand', () => {
    expect(eigenMaand(a, 1).totaal).toEqual({ sport: 3, taart: 1, landen: 1 });
    expect(eigenMaand(a, 3).totaal).toEqual({ sport: 4, taart: 2, landen: 1 });
    expect(eigenMaand(a, 8).totaal).toEqual({ sport: 4, taart: 2, landen: 2 });
  });
});

describe('de dia’s', () => {
  it('laat een maand weg zolang er niets van te vertellen valt', () => {
    // In dit verzonnen jaar staat er voor oktober en november niets
    // geschreven en hebben we ook zelf niets gedaan.
    const maanden = maandenInDeFilm(analyseer(klein()));
    expect(maanden).not.toContain(10);
    expect(maanden).not.toContain(11);
    // December heeft zijn eigen slotregel en blijft dus staan.
    expect(maanden).toContain(12);
  });
  it('neemt een maand wél mee zodra onze eigen cijfers er staan', () => {
    const metOktober = klein({
      entries: [
        ...klein().entries,
        { id: 99, season_id: 1, person_id: 1, metric_id: 1, entry_date: '2026-10-08', deleted_at: null, tags: 'gym' },
      ],
    });
    expect(maandenInDeFilm(analyseer(metOktober))).toContain(10);
  });
  it('telt een titelkaart en een slotkaart bij de maanden op', () => {
    const a = analyseer(klein());
    expect(aantalDias(a)).toBe(maandenInDeFilm(a).length + 2);
  });
  it('begint met de titelkaart en eindigt met het jaar in getallen', () => {
    const a = analyseer(klein());
    const eerste = jaaroverzichtVoor(a, 0, false);
    expect(eerste.soort).toBe('titel');
    expect(eerste.titel).toBe('2026');
    expect(eerste.maand).toBeNull();

    const laatste = jaaroverzichtVoor(a, aantalDias(a) - 1, false);
    expect(laatste.soort).toBe('slot');
    expect(laatste.jaartotaal).toEqual({ sport: 4, taart: 2, landen: 2, dagen: 4 });
  });
  it('geeft elke maand zijn eigen kaart, met regels en cijfers', () => {
    const a = analyseer(klein());
    const dia = jaaroverzichtVoor(a, 1, false);
    expect(dia.soort).toBe('maand');
    expect(dia.maand).toBe(1);
    expect(dia.titel).toBe('januari');
    expect(dia.regels.length).toBeGreaterThan(0);
    expect(dia.eigen?.sport).toBe(3);
    expect(dia.seconden).toBeGreaterThanOrEqual(8);
  });
  it('laat regels weg die nog op invulling wachten', () => {
    const a = analyseer(klein());
    const december = jaaroverzichtVoor(a, aantalDias(a) - 2, false);
    expect(december.maand).toBe(12);
    expect(december.regels.every((r) => r.delen.map((d) => d.tekst).join('').trim() !== 'Wat gebeurde er in december?')).toBe(true);
  });
  it('houdt de stap binnen de film', () => {
    const a = analyseer(klein());
    expect(jaaroverzichtVoor(a, -5, false).stap).toBe(0);
    expect(jaaroverzichtVoor(a, 99, false).stap).toBe(aantalDias(a) - 1);
  });
  it('houdt alle antwoorden buiten het pakketje zolang de balken liggen', () => {
    const a = analyseer(klein());
    // Alles wat in de tijdlijn onder een balk staat, per maand.
    const verborgen = new Map<number, string[]>(
      JAAROVERZICHT.maanden.map((m) => [
        m.nr,
        [...`${m.momenten.map((x) => `${x.tekst} ${x.bij ?? ''}`).join(' ')}`.matchAll(/\[\[(.+?)\]\]/g)].map((x) => x[1]),
      ]),
    );
    for (let stap = 0; stap < aantalDias(a); stap++) {
      const dia = jaaroverzichtVoor(a, stap, false);
      const pakketje = JSON.stringify(dia);
      for (const woord of verborgen.get(dia.maand ?? 0) ?? []) {
        expect(pakketje, `dia ${stap} lekt "${woord}"`).not.toContain(woord);
      }
      // En de balk weet wél hoe breed hij moet zijn.
      for (const regel of dia.regels) {
        for (const deel of regel.delen) {
          if (deel.balk) expect(deel.lengte).toBeGreaterThan(0);
        }
      }
    }
    const open = JSON.stringify(jaaroverzichtVoor(a, aantalDias(a) - 1, true));
    expect(open).toContain('zonder balken');
  });
  it('draait op de echte momentopname van resolution-recap', () => {
    const dia = jaaroverzichtVoor(analyse, 1, false);
    expect(dia.maand).toBe(1);
    expect(dia.eigen?.perPersoon.length).toBe(analyse.personen.length);
    expect(dia.strook.length).toBeGreaterThanOrEqual(9);
  });
});

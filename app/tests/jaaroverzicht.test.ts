import { describe, it, expect } from 'vitest';
import snapshot from '../src/lib/content/recap-snapshot.json';
import { analyseer, type RecapExport } from '../src/lib/server/recap/analyse';
import {
  splits, aantalBalken, eigenMaand, voorDeTrailer, inDeTrailer, maandenInDeFilm, aantalDias, maandenTeVullen,
  jaaroverzichtVoor,
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
      { tekst: '', balk: true },
      { tekst: ' wint het Songfestival.', balk: false },
    ]);
    // Nergens in het pakketje staat het woord zelf.
    expect(JSON.stringify(delen)).not.toContain('Bulgarije');
  });
  it('maakt elke balk even breed: de lengte gaat niet mee', () => {
    // Anders telt de kamer de letters: zeven is Marokko.
    const kort = splits('[[19]]', false)[0];
    const lang = splits('[[MetLife Stadium]]', false)[0];
    expect(kort).toEqual(lang);
    expect(Object.keys(kort).sort()).toEqual(['balk', 'tekst']);
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
    expect(splits('Gewoon een regel.', false)).toEqual([{ tekst: 'Gewoon een regel.', balk: false }]);
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
  it('zegt in de trailer geen antwoord van de quiz hardop', () => {
    // Alles wat de trailer laat zien: de titel- en slotkaart en de regels
    // zonder haken. Daarin mag geen antwoord van de quiz letterlijk staan.
    const open = [
      JAAROVERZICHT.titel, JAAROVERZICHT.inleiding, JAAROVERZICHT.slot,
      ...JAAROVERZICHT.maanden.flatMap((m) =>
        m.momenten.filter(inDeTrailer).flatMap((x) => [x.tekst, x.bij ?? '', x.emoji ?? '']),
      ),
    ].map((t) => t.toLowerCase());

    const antwoorden = new Set<string>();
    for (const pakket of Object.values(PAKKETTEN)) {
      for (const ronde of pakket.rondes) {
        for (const vraag of ronde.vragen) {
          if (vraag.teVullen) continue;
          const goedeOptie = typeof vraag.goed === 'number' ? vraag.opties?.[vraag.goed] : undefined;
          for (const antwoord of [vraag.a, goedeOptie]) {
            if (!antwoord) continue;
            // "Marokko — na strafschoppen, bij 1-1" is drie antwoorden in één.
            for (const stuk of antwoord.split(/\s+—\s+|,\s+|\s+en\s+/)) {
              const kaal = stuk.replace(/^(de|het|een|in|met|na)\s+/i, '').trim().toLowerCase();
              if (kaal.length >= 4) antwoorden.add(kaal);
            }
          }
          if (typeof vraag.getal === 'number' && vraag.getal >= 10) antwoorden.add(String(vraag.getal));
        }
      }
    }

    const woordgrens = (w: string) => new RegExp(`(^|[^\\p{L}\\d])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}\\d])`, 'u');
    const gevonden: string[] = [];
    for (const antwoord of antwoorden) {
      for (const tekst of open) if (woordgrens(antwoord).test(tekst)) gevonden.push(`"${antwoord}" in "${tekst}"`);
    }
    expect(gevonden).toEqual([]);
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

describe('de trailer', () => {
  const a = analyseer(klein());
  const trailer = () =>
    Array.from({ length: aantalDias(analyse) }, (_, stap) => jaaroverzichtVoor(analyse, stap, false));

  it('neemt alleen regels zonder haken, en niets wat voor de film bewaard is', () => {
    expect(inDeTrailer({ tekst: 'We gaan met z’n allen naar zee.' })).toBe(true);
    expect(inDeTrailer({ tekst: '[[Bulgarije]] wint.' })).toBe(false);
    expect(inDeTrailer({ tekst: 'Er wint iemand.', bij: 'Het was [[Bulgarije]].' })).toBe(false);
    expect(inDeTrailer({ tekst: 'Daarmee evenaart hij het record.', pasNaAfloop: true })).toBe(false);
    expect(inDeTrailer({ tekst: 'Nog in te vullen.', teVullen: true })).toBe(false);
  });
  it('stuurt geen enkele regel met een antwoord mee, ook niet de tekst eromheen', () => {
    // Van elke regel die alleen in de film hoort, de open stukken tekst.
    const alleenFilm = JAAROVERZICHT.maanden.flatMap((m) =>
      m.momenten
        .filter((x) => !x.teVullen && !inDeTrailer(x))
        .flatMap((x) => `${x.tekst} ${x.bij ?? ''}`.split(/\[\[.+?\]\]/))
        .map((stuk) => stuk.trim())
        .filter((stuk) => stuk.length >= 10),
    );
    for (const dia of trailer()) {
      const pakketje = JSON.stringify(dia);
      expect(dia.regels.flatMap((r) => [...r.delen, ...(r.bij ?? [])]).some((d) => d.balk)).toBe(false);
      for (const stuk of alleenFilm) expect(pakketje, `${dia.titel} bevat "${stuk}"`).not.toContain(stuk);
    }
  });
  it('laat de maandkop weg: die noemt het onderwerp', () => {
    for (const dia of trailer()) if (dia.soort === 'maand') expect(dia.kop).toBe('');
    const film = jaaroverzichtVoor(analyse, 1, true);
    expect(film.kop).toBe(JAAROVERZICHT.maanden.find((m) => m.nr === film.maand)?.kop);
  });
  it('slaat een maand over waar alleen regels voor de film staan', () => {
    const metTrailerregel = JAAROVERZICHT.maanden.filter((m) => m.momenten.some(inDeTrailer)).map((m) => m.nr);
    expect(maandenInDeFilm(analyse)).toEqual(metTrailerregel);
    // De film heeft alles waar iets van te vertellen valt.
    expect(maandenInDeFilm(analyse, true).length).toBeGreaterThan(metTrailerregel.length);
  });
  it('laat van onze eigen maand alleen staan hoe vaak er gesport is', () => {
    expect(voorDeTrailer(eigenMaand(a, 1))).toEqual({
      sport: 3, taart: null, landen: [], bijStart: null, koploper: null, perPersoon: [], totaal: null,
    });
    // Op de echte cijfers: geen land, geen vlag en geen naam in het pakketje.
    const landen = analyse.personen.flatMap((p) => p.landen.flatMap((l) => [l.naam, l.vlag]));
    for (const dia of trailer()) {
      expect(dia.jaartotaal).toBeNull();
      if (!dia.eigen) continue;
      const pakketje = JSON.stringify(dia.eigen);
      for (const land of landen) expect(pakketje, `${dia.titel} lekt ${land}`).not.toContain(land);
      for (const p of analyse.personen) expect(pakketje, `${dia.titel} lekt ${p.naam}`).not.toContain(p.naam);
    }
  });
});

describe('de film na de uitslag', () => {
  it('geeft alles: de kop, elke regel, onze cijfers en het jaar in getallen', () => {
    const juli = jaaroverzichtVoor(analyse, maandenInDeFilm(analyse, true).indexOf(7) + 1, true);
    expect(juli.maand).toBe(7);
    expect(juli.kop).not.toBe('');
    const tekst = juli.regels.map((r) => r.delen.map((d) => d.tekst).join('')).join(' ');
    expect(tekst).toContain('Marokko');
    expect(typeof juli.eigen?.taart).toBe('number');
    expect(juli.eigen?.totaal).not.toBeNull();
    expect(juli.eigen?.perPersoon.length).toBe(analyse.personen.length);
    const slot = jaaroverzichtVoor(analyse, aantalDias(analyse, true) - 1, true);
    expect(slot.jaartotaal?.taart).toBeGreaterThan(0);
  });
  it('heeft een eigen titel en inleiding', () => {
    expect(jaaroverzichtVoor(analyse, 0, false).kop).toBe(JAAROVERZICHT.titel);
    expect(jaaroverzichtVoor(analyse, 0, true).kop).toBe(JAAROVERZICHT.titelNaAfloop);
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
  it('neemt in de film een maand wél mee zodra onze eigen cijfers er staan', () => {
    const metOktober = klein({
      entries: [
        ...klein().entries,
        { id: 99, season_id: 1, person_id: 1, metric_id: 1, entry_date: '2026-10-08', deleted_at: null, tags: 'gym' },
      ],
    });
    expect(maandenInDeFilm(analyseer(metOktober), true)).toContain(10);
  });
  it('telt een titelkaart en een slotkaart bij de maanden op', () => {
    const a = analyseer(klein());
    expect(aantalDias(a)).toBe(maandenInDeFilm(a).length + 2);
    expect(aantalDias(a, true)).toBe(maandenInDeFilm(a, true).length + 2);
  });
  it('begint met de titelkaart en bewaart het jaar in getallen voor na de uitslag', () => {
    const a = analyseer(klein());
    const eerste = jaaroverzichtVoor(a, 0, false);
    expect(eerste.soort).toBe('titel');
    expect(eerste.titel).toBe('2026');
    expect(eerste.maand).toBeNull();

    const laatste = jaaroverzichtVoor(a, aantalDias(a) - 1, false);
    expect(laatste.soort).toBe('slot');
    expect(laatste.jaartotaal).toBeNull();

    const naAfloop = jaaroverzichtVoor(a, aantalDias(a, true) - 1, true);
    expect(naAfloop.soort).toBe('slot');
    expect(naAfloop.jaartotaal).toEqual({ sport: 4, taart: 2, landen: 2, dagen: 4 });
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
  it('houdt alle antwoorden buiten het pakketje zolang de avond loopt', () => {
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
      // En ook niet hoe lang het woord is.
      expect(pakketje).not.toContain('lengte');
    }
    const open = JSON.stringify(jaaroverzichtVoor(a, aantalDias(a, true) - 1, true));
    expect(open).toContain(JAAROVERZICHT.slotNaAfloop);
  });
  it('draait op de echte momentopname van resolution-recap', () => {
    const dia = jaaroverzichtVoor(analyse, 1, false);
    expect(dia.maand).toBe(1);
    expect(dia.eigen?.sport).toBeGreaterThan(0);
    expect(jaaroverzichtVoor(analyse, 1, true).strook.length).toBeGreaterThanOrEqual(9);
  });
});

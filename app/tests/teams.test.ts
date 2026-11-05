import { describe, it, expect } from 'vitest';
import { maakTeams, verplaats, husselen } from '../src/lib/server/teams';
import type { Ronde } from '../src/lib/content/types';

const spelers = [
  { id: 1, naam: 'Liz' }, { id: 2, naam: 'Bastiaan' }, { id: 3, naam: 'Joris' },
  { id: 4, naam: 'Rik' }, { id: 5, naam: 'Eva' },
];
const ronde = (over: Partial<Ronde> = {}): Ronde => ({
  naam: 'r', suit: '♠', thema: 't', type: 'open', tijd: 30, punten: 2,
  teamModus: 'teams', uitleg: '', vragen: [], ...over,
});

/** Voorspelbare toevalsbron, zodat de indeling in een test vastligt. */
const vast = (reeks: number[]) => {
  let i = 0;
  return () => reeks[i++ % reeks.length];
};

describe('maakTeams', () => {
  it('geeft bij individueel iedereen een eigen team', () => {
    const teams = maakTeams(ronde({ teamModus: 'individueel' }), spelers);
    expect(teams).toHaveLength(5);
    expect(teams.every((t) => t.leden.length === 1)).toBe(true);
    expect(teams.map((t) => t.naam)).toEqual(['Liz', 'Bastiaan', 'Joris', 'Rik', 'Eva']);
  });

  it('zet bij samen iedereen in één team', () => {
    const teams = maakTeams(ronde({ teamModus: 'samen' }), spelers);
    expect(teams).toHaveLength(1);
    expect(teams[0].leden).toHaveLength(5);
  });

  it('verdeelt vijf spelers over twee teams als drie en twee', () => {
    const teams = maakTeams(ronde({ aantalTeams: 2 }), spelers, vast([0]));
    expect(teams).toHaveLength(2);
    expect(teams.map((t) => t.leden.length).sort()).toEqual([2, 3]);
  });

  it('laat niemand buiten de boot vallen en niemand dubbel meedoen', () => {
    for (let poging = 0; poging < 50; poging++) {
      const teams = maakTeams(ronde({ aantalTeams: 2 }), spelers);
      const alle = teams.flatMap((t) => t.leden).sort();
      expect(alle).toEqual([1, 2, 3, 4, 5]);
    }
  });

  it('vraagt een ronde nooit meer teams dan er spelers zijn', () => {
    const teams = maakTeams(ronde({ aantalTeams: 9 }), spelers.slice(0, 3));
    expect(teams.length).toBeLessThanOrEqual(3);
    expect(teams.flatMap((t) => t.leden).sort()).toEqual([1, 2, 3]);
  });

  it('geeft teams kaartkleuren als naam', () => {
    const teams = maakTeams(ronde({ aantalTeams: 2 }), spelers);
    expect(teams.map((t) => t.naam)).toEqual(['Schoppen', 'Harten']);
  });
});

describe('kennis', () => {
  const vijf = [
    { id: 1, naam: 'Joris' }, { id: 2, naam: 'Rik' }, { id: 3, naam: 'Eva' },
    { id: 4, naam: 'Liz' }, { id: 5, naam: 'Bastiaan' },
  ];
  const sterkte: Record<number, number> = { 1: 4, 2: 3, 3: 2, 4: 1, 5: 1 };
  const nieuws = ronde({ aantalTeams: 2, kennis: { Joris: 4, rik: 3, Eva: 2, Liz: 1, Bastiaan: 1 } });

  it('maakt de teams even sterk, en laat ze toch wisselen', () => {
    const indelingen = new Set<string>();
    for (let k = 0; k < 200; k++) {
      const teams = maakTeams(nieuws, vijf);
      const totalen = teams.map((t) => t.leden.reduce((n, id) => n + sterkte[id], 0));
      expect(Math.abs(totalen[0] - totalen[1])).toBeLessThanOrEqual(1);
      expect(teams.map((t) => t.leden.length).sort()).toEqual([2, 3]);
      // Joris en Rik samen is nooit eerlijk.
      expect(teams.some((t) => t.leden.includes(1) && t.leden.includes(2))).toBe(false);
      indelingen.add(teams.map((t) => t.leden.slice().sort().join(',')).sort().join(' | '));
    }
    expect(indelingen.size).toBeGreaterThan(1);
  });

  it('houdt twee kenners uit elkaar als alleen zij genoemd zijn', () => {
    const muziek = ronde({ aantalTeams: 2, kennis: { Joris: 3, Rik: 3 } });
    for (let k = 0; k < 50; k++) {
      const teams = maakTeams(muziek, vijf);
      expect(teams.some((t) => t.leden.includes(1) && t.leden.includes(2))).toBe(false);
    }
  });

  it('laat niemand vallen, ook geen gast die niet in de lijst staat', () => {
    const teams = maakTeams(nieuws, [...vijf, { id: 6, naam: 'Gast' }], vast([0.3, 0.7, 0.1]));
    expect(teams.flatMap((t) => t.leden).sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('verplaats', () => {
  it('schuift een speler naar het volgende team', () => {
    const teams = [
      { id: 't0', naam: 'Schoppen', suit: '♠', leden: [1, 2] },
      { id: 't1', naam: 'Harten', suit: '♥', leden: [3] },
    ];
    const uit = verplaats(teams, 1);
    expect(uit[0].leden).toEqual([2]);
    expect(uit[1].leden).toEqual([3, 1]);
  });

  it('brengt een speler na een rondje weer terug', () => {
    let teams = [
      { id: 't0', naam: 'Schoppen', suit: '♠', leden: [1] },
      { id: 't1', naam: 'Harten', suit: '♥', leden: [] as number[] },
    ];
    teams = verplaats(teams, 1);
    teams = verplaats(teams, 1);
    expect(teams[0].leden).toEqual([1]);
    expect(teams[1].leden).toEqual([]);
  });
});

describe('husselen', () => {
  it('houdt alle elementen over', () => {
    const uit = husselen([1, 2, 3, 4, 5]);
    expect(uit.sort()).toEqual([1, 2, 3, 4, 5]);
  });
  it('laat het origineel met rust', () => {
    const bron = [1, 2, 3];
    husselen(bron);
    expect(bron).toEqual([1, 2, 3]);
  });
});

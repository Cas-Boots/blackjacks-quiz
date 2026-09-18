import { describe, it, expect } from 'vitest';
import {
  verdeelOverTeams, bepaalDichtstbij, telStand, gissingenUitAntwoorden, vraagPunten, vraagTijd, bepaalStem,
} from '../src/lib/server/scoring';
import type { Ronde, Vraag } from '../src/lib/content/types';

const ronde: Ronde = {
  naam: 'r', suit: '♠', thema: 't', type: 'open', tijd: 30, punten: 2,
  teamModus: 'teams', uitleg: '', vragen: [],
};
const teams = [
  { id: 't0', leden: [1, 2, 3] },
  { id: 't1', leden: [4, 5] },
];

describe('puntwaarden', () => {
  it('neemt die van de ronde, tenzij de vraag het overschrijft', () => {
    expect(vraagPunten(ronde, { v: 'x' })).toBe(2);
    expect(vraagPunten(ronde, { v: 'x', punten: 5 })).toBe(5);
    expect(vraagTijd(ronde, { v: 'x' })).toBe(30);
    expect(vraagTijd(ronde, { v: 'x', tijd: 10 })).toBe(10);
  });
});

describe('verdeelOverTeams', () => {
  it('geeft elk lid van een winnend team de volle punten', () => {
    expect(verdeelOverTeams(teams, ['t0'], {}, 2)).toEqual({ 1: 2, 2: 2, 3: 2 });
  });
  it('kan twee teams tegelijk belonen', () => {
    expect(verdeelOverTeams(teams, ['t0', 't1'], {}, 1)).toEqual({ 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 });
  });
  it('negeert een team dat niet bestaat', () => {
    expect(verdeelOverTeams(teams, ['weg'], {}, 3)).toEqual({});
  });
  it('geeft niemand punten als er niemand wint', () => {
    expect(verdeelOverTeams(teams, [], {}, 3)).toEqual({});
  });
});

describe('bepaalDichtstbij', () => {
  const gissingen = [
    { inzender: 't0', getal: 300 },
    { inzender: 't1', getal: 340 },
  ];
  it('kiest de kleinste afstand', () => {
    const uit = bepaalDichtstbij(gissingen, 330, 3)!;
    expect(uit.winnaars).toEqual(['t1']);
    expect(uit.afstand).toBe(10);
    expect(uit.precies).toBe(false);
    expect(uit.puntenPerTeam).toEqual({ t1: 3 });
  });
  it('geeft bonuspunten bij precies goed', () => {
    const uit = bepaalDichtstbij([{ inzender: 't0', getal: 330 }], 330, 3)!;
    expect(uit.precies).toBe(true);
    expect(uit.puntenPerTeam).toEqual({ t0: 5 });
  });
  it('laat een gelijke afstand allebei de volle punten houden', () => {
    const uit = bepaalDichtstbij(
      [{ inzender: 't0', getal: 320 }, { inzender: 't1', getal: 340 }], 330, 3,
    )!;
    expect(uit.winnaars.sort()).toEqual(['t0', 't1']);
    expect(uit.puntenPerTeam).toEqual({ t0: 3, t1: 3 });
  });
  it('geeft null als er niets is ingevuld', () => {
    expect(bepaalDichtstbij([], 330, 3)).toBeNull();
  });
});

describe('gissingenUitAntwoorden', () => {
  it('slaat onleesbare invoer over in plaats van er nul van te maken', () => {
    const uit = gissingenUitAntwoorden([
      { inzender: 't0', tekst: '330' },
      { inzender: 't1', tekst: 'geen idee' },
    ]);
    expect(uit).toEqual([{ inzender: 't0', getal: 330 }]);
  });
});

describe('telStand', () => {
  it('telt verdelingen en correcties bij elkaar op', () => {
    expect(telStand([{ 1: 2, 2: 2 }, { 1: 3 }], [{ spelerId: 2, punten: -1 }]))
      .toEqual({ 1: 5, 2: 1 });
  });
  it('is leeg als er nog niets is uitgedeeld', () => {
    expect(telStand([])).toEqual({});
  });

  it('een vervangen verdeling verandert de stand volledig, zonder resten', () => {
    // Dit is de eigenschap waar de hele telling op rust: een correctie
    // vervangt de verdeling van die vraag, hij telt er niet bij op.
    const eerste = { 1: 2, 2: 2, 3: 2 };  // per ongeluk het hele team
    const hersteld = { 1: 2 };            // alleen speler 1 had het goed
    expect(telStand([hersteld])).toEqual({ 1: 2 });
    expect(telStand([eerste])).not.toEqual(telStand([hersteld]));
  });
});

describe('bepaalStem', () => {
  it('geeft null zonder stemmen', () => {
    expect(bepaalStem([])).toBeNull();
    expect(bepaalStem([{ inzender: 's_1', tekst: '  ' }])).toBeNull();
  });

  it('laat de meerderheid winnen en telt hoofdletters niet mee', () => {
    const uitslag = bepaalStem([
      { inzender: 's_1', tekst: 'Rik' },
      { inzender: 's_2', tekst: 'rik' },
      { inzender: 's_3', tekst: 'Eva' },
    ]);
    expect(uitslag?.gekozen).toEqual(['Rik']);
    expect(uitslag?.winnaars).toEqual(['s_1', 's_2']);
    expect(uitslag?.telling.map((t) => [t.naam, t.aantal])).toEqual([['Rik', 2], ['Eva', 1]]);
  });

  it('deelt bij een gelijke stand bovenaan', () => {
    const uitslag = bepaalStem([
      { inzender: 's_1', tekst: 'Rik' },
      { inzender: 's_2', tekst: 'Eva' },
    ]);
    expect(uitslag?.gekozen).toEqual(['Eva', 'Rik']);
    expect(uitslag?.winnaars.sort()).toEqual(['s_1', 's_2']);
  });
});

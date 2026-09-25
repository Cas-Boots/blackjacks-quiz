import { describe, it, expect } from 'vitest';
import { berekenBonussen, metBonus, REEKS_VANAF, type BonusVraag } from '../src/lib/server/bonus';
import { ingekort, LAATSTE_MS } from '../src/lib/server/klok';

/** Een vraag in een teamronde: team a is 1+2, team b is 3+4. */
function teamvraag(sleutel: string, winnaars: ('a' | 'b')[], tijden: { a?: number; b?: number } = {}): BonusVraag {
  const leden = { a: [1, 2], b: [3, 4] };
  const verdeling: Record<number, number> = {};
  for (const w of winnaars) for (const id of leden[w]) verdeling[id] = 1;
  return {
    sleutel,
    type: 'open',
    teamModus: 'teams',
    verdeling,
    antwoorden: (['a', 'b'] as const)
      .filter((t) => tijden[t] !== undefined)
      .map((t) => ({ inzender: t, isGoed: winnaars.includes(t), naMs: tijden[t]!, leden: leden[t] })),
  };
}

function solovraag(sleutel: string, goed: number[], tijden: Record<number, number> = {}, type = 'meerkeuze'): BonusVraag {
  return {
    sleutel,
    type,
    teamModus: 'individueel',
    verdeling: Object.fromEntries(goed.map((id) => [id, 1])),
    antwoorden: Object.entries(tijden).map(([id, naMs]) => ({
      inzender: `s_${id}`, isGoed: goed.includes(Number(id)), naMs, leden: [Number(id)],
    })),
  };
}

describe('snelste vinger', () => {
  it('geeft het snelste goede antwoord een punt extra', () => {
    const { perVraag } = berekenBonussen([solovraag('0:0', [1, 2], { 1: 4000, 2: 2500, 3: 1000 })]);
    // 3 was sneller maar fout.
    expect(perVraag.get('0:0')!.snel).toEqual({ 2: 1 });
  });

  it('geeft in een teamronde elk lid van het snelste team het punt', () => {
    const { perVraag } = berekenBonussen([teamvraag('0:0', ['a', 'b'], { a: 9000, b: 3000 })]);
    expect(perVraag.get('0:0')!.snel).toEqual({ 3: 1, 4: 1 });
  });

  it('deelt bij een gelijke tijd', () => {
    const { perVraag } = berekenBonussen([solovraag('0:0', [1, 2], { 1: 2000, 2: 2000 })]);
    expect(perVraag.get('0:0')!.snel).toEqual({ 1: 1, 2: 1 });
  });

  it('telt niet bij stemmen, dichtstbij of samen spelen', () => {
    const stem = solovraag('0:0', [1], { 1: 1000 }, 'stem');
    const dicht = solovraag('0:1', [1], { 1: 1000 }, 'dichtstbij');
    const samen = { ...solovraag('0:2', [1], { 1: 1000 }), teamModus: 'samen' };
    const { perVraag } = berekenBonussen([stem, dicht, samen]);
    for (const k of ['0:0', '0:1', '0:2']) expect(perVraag.get(k)!.snel).toEqual({});
  });

  it('verdwijnt als de quizmaster de punten weghaalt', () => {
    const v = solovraag('0:0', [], { 1: 1000 });
    v.antwoorden[0].isGoed = true; // het vinkje staat nog, de punten niet
    expect(berekenBonussen([v]).perVraag.get('0:0')!.snel).toEqual({});
  });
});

describe('op dreef', () => {
  it(`geeft vanaf de ${REEKS_VANAF}e vraag op rij een punt extra`, () => {
    const vragen = [0, 1, 2, 3].map((i) => solovraag(`0:${i}`, [1]));
    const { perVraag, lopend } = berekenBonussen(vragen);
    expect(perVraag.get('0:1')!.reeks).toEqual({});
    expect(perVraag.get('0:2')!.reeks).toEqual({ 1: 1 });
    expect(perVraag.get('0:3')!.reeks).toEqual({ 1: 1 });
    expect(perVraag.get('0:3')!.opRij[1]).toBe(4);
    expect(lopend[1]).toBe(4);
  });

  it('breekt bij een fout, ook als de quizmaster niets aanklikte', () => {
    const fout: BonusVraag = { ...solovraag('0:2', [], { 1: 1000 }), verdeling: null };
    const vragen = [solovraag('0:0', [1]), solovraag('0:1', [1]), fout, solovraag('0:3', [1])];
    const { perVraag, lopend } = berekenBonussen(vragen);
    expect(perVraag.get('0:3')!.reeks).toEqual({});
    expect(lopend[1]).toBe(1);
  });

  it('slaat vragen over die niet gespeeld zijn', () => {
    const leeg: BonusVraag = { sleutel: '0:1', type: 'open', teamModus: 'individueel', verdeling: null, antwoorden: [] };
    const vragen = [solovraag('0:0', [1]), leeg, solovraag('0:2', [1]), solovraag('1:0', [1])];
    expect(berekenBonussen(vragen).perVraag.get('1:0')!.reeks).toEqual({ 1: 1 });
  });

  it('loopt door over teamwissels heen, want de reeks is van de persoon', () => {
    const vragen = [
      teamvraag('0:0', ['a']), // 1 en 2 samen
      teamvraag('0:1', ['a']),
      // Nieuwe ronde, andere teams: 1 zit nu bij 3.
      { ...teamvraag('1:0', []), verdeling: { 1: 1, 3: 1 } },
    ];
    const { perVraag } = berekenBonussen(vragen);
    expect(perVraag.get('1:0')!.reeks).toEqual({ 1: 1 });
  });

  it('telt de bonus zelf niet als reden voor een reeks', () => {
    const { perVraag } = berekenBonussen([solovraag('0:0', [], { 1: 1000 })]);
    expect(perVraag.get('0:0')!.opRij).toEqual({});
  });
});

describe('metBonus', () => {
  it('telt beide bonussen op bij de gewone punten', () => {
    const vragen = [
      solovraag('0:0', [1]),
      solovraag('0:1', [1]),
      solovraag('0:2', [1, 2], { 1: 1500, 2: 3000 }),
    ];
    const { perVraag } = berekenBonussen(vragen);
    expect(metBonus({ 1: 1, 2: 1 }, perVraag.get('0:2'))).toEqual({ 1: 3, 2: 1 });
  });
});

describe('de klok bij een volle tafel', () => {
  const teams = [{ id: 'a', leden: [1] }, { id: 'b', leden: [2] }, { id: 'leeg', leden: [] }];

  it('springt naar de laatste seconden als iedereen binnen is', () => {
    expect(ingekort(100_000, 10_000, teams, new Set(['a', 'b']))).toBe(10_000 + LAATSTE_MS);
  });

  it('wacht zolang er nog iemand ontbreekt', () => {
    expect(ingekort(100_000, 10_000, teams, new Set(['a']))).toBe(100_000);
  });

  it('verlengt nooit', () => {
    expect(ingekort(12_000, 10_000, teams, new Set(['a', 'b']))).toBe(12_000);
  });
});

import { describe, it, expect } from 'vitest';
import { berekenBonussen, opScorebord, PUNT_WAARDE, telSnelheid, type BonusVraag } from '../src/lib/server/bonus';
import { vermenigvuldigers, vermenigvuldigerVan } from '../src/lib/server/vermenigvuldiger';
import { eersteGeheimeRonde } from '../src/lib/shared/bonus';
import { ingekort, LAATSTE_MS } from '../src/lib/server/klok';
import type { Ronde } from '../src/lib/content/types';

const DUUR = 30_000;

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
    duurMs: DUUR,
    vermenigvuldiger: 1,
    antwoorden: (['a', 'b'] as const)
      .filter((t) => tijden[t] !== undefined)
      .map((t) => ({ inzender: t, isGoed: winnaars.includes(t), naMs: tijden[t]!, leden: leden[t] })),
  };
}

/** Een vraag ieder voor zich; wie goed is antwoordde standaard meteen. */
function solovraag(sleutel: string, goed: number[], tijden: Record<number, number> = {}, type = 'meerkeuze'): BonusVraag {
  const alleTijden: Record<number, number> = { ...Object.fromEntries(goed.map((id) => [id, 0])), ...tijden };
  return {
    sleutel,
    type,
    teamModus: 'individueel',
    verdeling: Object.fromEntries(goed.map((id) => [id, 1])),
    duurMs: DUUR,
    vermenigvuldiger: 1,
    antwoorden: Object.entries(alleTijden).map(([id, naMs]) => ({
      inzender: `s_${id}`, isGoed: goed.includes(Number(id)), naMs, leden: [Number(id)],
    })),
  };
}

describe('snelheid, ieder voor zich', () => {
  it('geeft wie meteen antwoordt de volle punten en wie op de valreep antwoordt de helft', () => {
    const { perVraag } = berekenBonussen([solovraag('0:0', [1, 2, 3], { 1: 0, 2: DUUR / 2, 3: DUUR })]);
    expect(perVraag.get('0:0')!.punten).toEqual({ 1: PUNT_WAARDE, 2: 0.75 * PUNT_WAARDE, 3: 0.5 * PUNT_WAARDE });
  });

  it('schaalt met de punten van de vraag', () => {
    const v = { ...solovraag('0:0', [1]), verdeling: { 1: 2 } };
    expect(berekenBonussen([v]).perVraag.get('0:0')!.punten).toEqual({ 1: 2 * PUNT_WAARDE });
  });

  it('zakt niet onder de helft als de klok werd verlengd', () => {
    const { perVraag } = berekenBonussen([solovraag('0:0', [1], { 1: DUUR * 2 })]);
    expect(perVraag.get('0:0')!.punten).toEqual({ 1: 0.5 * PUNT_WAARDE });
  });

  it('telt in een teamronde niet: overleggen kost nooit punten', () => {
    const { perVraag } = berekenBonussen([teamvraag('0:0', ['a', 'b'], { a: 0, b: DUUR })]);
    expect(perVraag.get('0:0')!.punten).toEqual({ 1: 500, 2: 500, 3: 500, 4: 500 });
  });

  it('geeft een team ook zonder antwoord van de telefoon de volle punten', () => {
    const { perVraag } = berekenBonussen([teamvraag('0:0', ['a'])]);
    expect(perVraag.get('0:0')!.punten).toEqual({ 1: 500, 2: 500 });
  });

  it('weet per vraag of snelheid meetelt', () => {
    expect(telSnelheid({ type: 'meerkeuze', teamModus: 'individueel' })).toBe(true);
    expect(telSnelheid({ type: 'meerkeuze', teamModus: 'teams' })).toBe(false);
    expect(telSnelheid({ type: 'stem', teamModus: 'individueel' })).toBe(false);
  });

  it('telt een toekenning zonder antwoord als op de valreep', () => {
    const v = { ...solovraag('0:0', [1]), antwoorden: [] };
    expect(berekenBonussen([v]).perVraag.get('0:0')!.punten).toEqual({ 1: 0.5 * PUNT_WAARDE });
  });

  it('laat snelheid weg bij een stemvraag', () => {
    const { perVraag } = berekenBonussen([solovraag('0:0', [1], { 1: DUUR }, 'stem')]);
    expect(perVraag.get('0:0')!.punten).toEqual({ 1: PUNT_WAARDE });
  });

  it('geeft niets als de quizmaster de punten weghaalt, ook met een vinkje', () => {
    const v = solovraag('0:0', [], { 1: 1000 });
    v.antwoorden[0].isGoed = true;
    expect(berekenBonussen([v]).perVraag.get('0:0')!.punten).toEqual({});
  });
});

describe('reeksen: bijgehouden, maar zonder punten', () => {
  it('telt hoeveel vragen op rij goed, en geeft daar niets extra voor', () => {
    const vragen = Array.from({ length: 9 }, (_, i) => solovraag(`0:${i}`, [1]));
    const { perVraag, lopend } = berekenBonussen(vragen);
    for (const v of vragen) expect(perVraag.get(v.sleutel)!.punten).toEqual({ 1: PUNT_WAARDE });
    expect(perVraag.get('0:3')!.opRij[1]).toBe(4);
    expect(lopend[1]).toBe(9);
  });

  it('breekt bij een fout, ook als de quizmaster niets aanklikte', () => {
    const fout: BonusVraag = { ...solovraag('0:2', [], { 1: 1000 }), verdeling: null };
    const vragen = [solovraag('0:0', [1]), solovraag('0:1', [1]), fout, solovraag('0:3', [1])];
    const { perVraag, lopend } = berekenBonussen(vragen);
    expect(perVraag.get('0:3')!.opRij[1]).toBe(1);
    expect(lopend[1]).toBe(1);
  });

  it('slaat vragen over die niet gespeeld zijn', () => {
    const leeg: BonusVraag = { ...solovraag('0:1', []), verdeling: null, antwoorden: [] };
    const vragen = [solovraag('0:0', [1]), leeg, solovraag('1:0', [1])];
    expect(berekenBonussen(vragen).perVraag.get('1:0')!.opRij[1]).toBe(2);
  });
});

describe('vermenigvuldigers', () => {
  it('vermenigvuldigt de punten na de snelheid', () => {
    const vragen = [solovraag('0:0', [1]), { ...solovraag('0:1', [1], { 1: DUUR / 2 }), vermenigvuldiger: 4 }];
    const { perVraag } = berekenBonussen(vragen);
    expect(perVraag.get('0:1')!.punten).toEqual({ 1: 0.75 * PUNT_WAARDE * 4 });
  });

  const ronde = (naam: string, n: number, cijfers?: Ronde['cijfers']): Ronde => ({
    naam, suit: '♠', thema: '', type: 'open', tijd: 30, punten: 2, teamModus: 'individueel', uitleg: '',
    cijfers, vragen: Array.from({ length: n }, (_, i) => ({ v: `v${i}`, a: 'a' })),
  });

  it('laat de laatste twee echte rondes dubbel tellen, niet de afrekening', () => {
    const rondes = [ronde('a', 5), ronde('b', 5), ronde('c', 5), ronde('voorsp', 5, 'voorspellingen')];
    const v = vermenigvuldigers(7, rondes);
    expect(v.map((r) => r.dubbel)).toEqual([false, true, true, false]);
    expect(v[3].goud).toBeNull();
  });

  it('verdubbelt niet alles als er maar twee rondes zijn', () => {
    expect(vermenigvuldigers(1, [ronde('a', 3), ronde('b', 3)]).some((r) => r.dubbel)).toBe(false);
  });

  it('legt per ronde één gouden kaart, vast per spel', () => {
    const rondes = [ronde('a', 5), ronde('b', 6), ronde('c', 4)];
    const eerste = vermenigvuldigers(3, rondes);
    expect(vermenigvuldigers(3, rondes)).toEqual(eerste);
    eerste.forEach((r, i) => {
      expect(r.goud).toBeGreaterThanOrEqual(0);
      expect(r.goud).toBeLessThan(rondes[i].vragen.length);
    });
    // Over veel avonden valt de kaart niet steeds op dezelfde vraag.
    const plekken = new Set(Array.from({ length: 40 }, (_, id) => vermenigvuldigers(id, rondes)[0].goud));
    expect(plekken.size).toBeGreaterThan(2);
  });

  it('legt geen gouden kaart in een ronde van één of twee vragen', () => {
    expect(vermenigvuldigers(5, [ronde('a', 1), ronde('b', 2)]).map((r) => r.goud)).toEqual([null, null]);
  });

  it('stapelt: gouden kaart in een slotronde telt vier keer', () => {
    expect(vermenigvuldigerVan({ dubbel: true, goud: 2 }, 2)).toBe(4);
    expect(vermenigvuldigerVan({ dubbel: true, goud: 2 }, 1)).toBe(2);
    expect(vermenigvuldigerVan({ dubbel: false, goud: 2 }, 2)).toBe(2);
    expect(vermenigvuldigerVan(undefined, 0)).toBe(1);
  });
});

describe('opScorebord', () => {
  it('rekent een uitdeling zonder vraag om tegen de puntwaarde', () => {
    expect(opScorebord({ 1: 3, 2: 0 })).toEqual({ 1: 3 * PUNT_WAARDE, 2: 0 });
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

describe('de geheime stand aan het eind', () => {
  it('houdt het laatste kwart tot derde van de avond geheim', () => {
    // 8 rondes: de laatste 2 (25%); 9 of 10 rondes: de laatste 3 (33% en 30%).
    expect(eersteGeheimeRonde(8, -1)).toBe(6);
    expect(eersteGeheimeRonde(9, -1)).toBe(6);
    expect(eersteGeheimeRonde(10, -1)).toBe(7);
  });

  it('houdt in elk geval de dubbele slotrondes geheim', () => {
    // De afrekening als laatste ronde: de slotrondes staan daarvoor.
    expect(eersteGeheimeRonde(8, 5)).toBe(5);
    expect(eersteGeheimeRonde(10, 8)).toBe(7);
  });

  it('houdt niets geheim bij een heel korte avond', () => {
    expect(eersteGeheimeRonde(2, -1)).toBe(-1);
    expect(eersteGeheimeRonde(1, 0)).toBe(-1);
  });
});

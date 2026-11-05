import { describe, it, expect } from 'vitest';
import { standaardVragen } from '../src/lib/content/keuze';
import { PAKKETTEN } from '../src/lib/content/packs';
import type { Ronde } from '../src/lib/content/types';

const ronde = (over: Partial<Ronde> = {}): Ronde => ({
  naam: 'r', suit: '♠', thema: 't', type: 'open', tijd: 30, punten: 2, teamModus: 'individueel', uitleg: '',
  vragen: [{ v: 'a', a: '1' }, { v: 'b', a: '2', reserve: true }, { v: 'c', a: '3' }], ...over,
});

describe('standaardVragen', () => {
  it('laat een reservevraag standaard uit', () => {
    expect(standaardVragen(ronde())).toEqual([0, 2]);
  });
  it('laat een optionele ronde helemaal uit', () => {
    expect(standaardVragen(ronde({ optioneel: true }))).toEqual([]);
  });
  it('houdt de hoofdquiz binnen twee uur, met praattijd (zie CLAUDE.md)', () => {
    // Bovenop de klok: 1 min per snelle vraag, 1½ per open nieuwsvraag,
    // 2 per vraag over onszelf, 2 per ronde, en 20 voor begin en einde.
    const overOnszelf = new Set(['Onze Sportcompetitie', 'Taart & Verre Landen', 'De Voorspellingen', 'Wie van de Blackjacks?', 'Hoger of Lager']);
    let seconden = 20 * 60;
    for (const r of PAKKETTEN.jaar2026.rondes) {
      const gekozen = standaardVragen(r);
      if (!gekozen.length) continue;
      seconden += 120;
      for (const i of gekozen) {
        const extra = overOnszelf.has(r.naam) ? 120 : r.type === 'waarnietwaar' || r.type === 'meerkeuze' ? 60 : 90;
        seconden += (r.vragen[i].tijd ?? r.tijd) + extra;
      }
    }
    expect(seconden / 60).toBeLessThanOrEqual(125);
  });
});

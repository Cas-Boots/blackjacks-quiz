import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DIEREN, dierVan, vrijDier, dierenroep, gangVan, isDier } from '../src/lib/shared/dieren';

describe('geestdieren', () => {
  it('heeft unieke sleutels en elk dier heeft iets te roepen', () => {
    expect(new Set(DIEREN.map((d) => d.sleutel)).size).toBe(DIEREN.length);
    for (const d of DIEREN) {
      expect(d.goed.length).toBeGreaterThan(0);
      expect(d.fout.length).toBeGreaterThan(0);
      expect(d.entree).not.toBe('');
    }
  });

  it('heeft voor elke beweging en gang een animatie in app.css', () => {
    const css = readFileSync(resolve(__dirname, '../src/app.css'), 'utf8');
    for (const d of DIEREN) {
      expect(css, d.beweging).toContain(`.dier[data-beweging="${d.beweging}"]`);
      expect(css, gangVan(d.beweging)).toContain(`.dierenparade[data-gang="${gangVan(d.beweging)}"]`);
    }
    for (const stemming of ['feest', 'sip']) expect(css).toContain(`.dier[data-beweging="${stemming}"]`);
  });

  it('valt zonder geldige sleutel terug op een vast dier per naam', () => {
    expect(dierVan('lama', 'Liz').sleutel).toBe('lama');
    expect(dierVan('bestaat-niet', 'Liz')).toBe(dierVan(null, 'Liz'));
    expect(isDier('lama')).toBe(true);
    expect(isDier('draak')).toBe(false);
  });

  it('kiest een vrij dier, zodat er geen twee dezelfde aan tafel zitten', () => {
    const bezet: string[] = [];
    for (let i = 0; i < DIEREN.length; i++) bezet.push(vrijDier(bezet, `speler${i}`));
    expect(new Set(bezet).size).toBe(DIEREN.length);
    // Allemaal op: dan mag er dubbel, maar er komt altijd een dier uit.
    expect(isDier(vrijDier(bezet, 'nog een'))).toBe(true);
  });

  it('dobbelt altijd een ander dier dan je had', () => {
    for (const toeval of [0, 0.5, 0.999]) {
      expect(vrijDier([], 'Liz', () => toeval, 'lama')).not.toBe('lama');
    }
  });

  it('roept op elk scherm hetzelfde bij dezelfde vraag', () => {
    expect(dierenroep('kip', 'Rik', 'goed', '1:2')).toBe(dierenroep('kip', 'Rik', 'goed', '1:2'));
    expect(dierVan('kip').goed).toContain(dierenroep('kip', 'Rik', 'goed', '1:2'));
    expect(dierVan('kip').fout).toContain(dierenroep('kip', 'Rik', 'fout', '1:2'));
  });
});

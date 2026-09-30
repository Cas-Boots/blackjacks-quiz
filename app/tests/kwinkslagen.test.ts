import { describe, it, expect } from 'vitest';
import { hash, kies, kanteling, metNaam, TROOST, BEGROETINGEN } from '../src/lib/shared/kwinkslagen';

describe('kwinkslagen', () => {
  it('kiest voor dezelfde sleutel altijd dezelfde zin', () => {
    expect(kies(TROOST, '3:1')).toBe(kies(TROOST, '3:1'));
    expect(hash('a')).toBe(hash('a'));
  });
  it('spreidt de keuze over de lijst', () => {
    const gezien = new Set(Array.from({ length: 60 }, (_, i) => kies(TROOST, `${i}`)));
    expect(gezien.size).toBeGreaterThan(2);
  });
  it('kantelt binnen de grens en nooit precies hetzelfde voor alle kaarten', () => {
    const hoeken = Array.from({ length: 30 }, (_, i) => kanteling(`0:${i}`));
    for (const h of hoeken) expect(Math.abs(h)).toBeLessThanOrEqual(0.9);
    expect(new Set(hoeken).size).toBeGreaterThan(5);
  });
  it('vult de naam in', () => {
    expect(metNaam(BEGROETINGEN[1], 'Rik')).toBe('Rik heeft de wifi gevonden.');
  });
});

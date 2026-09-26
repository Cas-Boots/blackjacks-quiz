import { describe, it, expect } from 'vitest';
import { DIEREN } from '../src/lib/shared/dieren';
import { BRON, SPRITES, lagenVan } from '../src/lib/shared/pixeldieren';

describe('pixeldieren', () => {
  it('heeft voor elk dier een sprite van 16 bij 16, met alleen kleuren uit het palet', () => {
    for (const d of DIEREN) {
      const s = SPRITES[d.sleutel];
      expect(s, d.sleutel).toBeDefined();
      expect(s.rijen, d.sleutel).toHaveLength(BRON);
      s.rijen.forEach((r, i) => expect(r.length, `${d.sleutel} rij ${i}`).toBe(BRON));
      for (const t of new Set(s.rijen.join(''))) {
        expect('.kwo'.includes(t) || t in s.palet, `${d.sleutel}: ${t}`).toBe(true);
      }
    }
    // Geen sprite zonder dier: dan staat er een tekening die niemand kan kiezen.
    expect(Object.keys(SPRITES).sort()).toEqual(DIEREN.map((d) => d.sleutel).sort());
  });

  it('geeft elk dier ogen die dicht kunnen', () => {
    for (const d of DIEREN) {
      const l = lagenVan(d.sleutel);
      expect(l.ogenOpen.length, d.sleutel).toBeGreaterThan(0);
      expect(l.ogenDicht.length, d.sleutel).toBeGreaterThan(0);
    }
  });

  it('laat dieren met poten echt stappen: om en om een andere poot van de grond', () => {
    for (const d of DIEREN) {
      if (!SPRITES[d.sleutel].poten) continue;
      const l = lagenVan(d.sleutel);
      const d0 = (x: typeof l.potenRust) => x.map((p) => p.d).join('');
      expect(d0(l.potenA), d.sleutel).not.toBe(d0(l.potenRust));
      expect(d0(l.potenB), d.sleutel).not.toBe(d0(l.potenRust));
      expect(d0(l.potenA), d.sleutel).not.toBe(d0(l.potenB));
    }
  });

  it('laat vleugels omhoog klappen zonder van het scherm te vallen', () => {
    for (const d of DIEREN) {
      const l = lagenVan(d.sleutel);
      if (!l.vleugelNeer.length) continue;
      expect(l.vleugelOp.length, d.sleutel).toBeGreaterThan(0);
      for (const p of l.vleugelOp) expect(p.d).not.toMatch(/M-/);
    }
  });
});

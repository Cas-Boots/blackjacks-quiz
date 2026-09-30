import { describe, it, expect } from 'vitest';
import { DIEREN } from '../src/lib/shared/dieren';
import { BRON, MAAT, SPRITES, lagenVan } from '../src/lib/shared/pixeldieren';

describe('pixeldieren', () => {
  it('heeft voor elk dier een vierkante sprite (16 of 32), met alleen kleuren uit het palet', () => {
    for (const d of DIEREN) {
      const s = SPRITES[d.sleutel];
      expect(s, d.sleutel).toBeDefined();
      // Grof (16×16, wordt opgeschaald) of fijn (32×32, al op maat), maar altijd vierkant.
      expect([BRON, MAAT], d.sleutel).toContain(s.rijen.length);
      s.rijen.forEach((r, i) => expect(r.length, `${d.sleutel} rij ${i}`).toBe(s.rijen.length));
      for (const t of new Set(s.rijen.join(''))) {
        expect('.kwo'.includes(t) || t in s.palet, `${d.sleutel}: ${t}`).toBe(true);
      }
    }
    // Geen sprite zonder dier: dan staat er een tekening die niemand kan kiezen.
    expect(Object.keys(SPRITES).sort()).toEqual(DIEREN.map((d) => d.sleutel).sort());
  });

  it('geeft elk dier ogen die dicht kunnen, en blije ogen die anders zijn dan slapende', () => {
    let boogjes = 0;
    for (const d of DIEREN) {
      const l = lagenVan(d.sleutel);
      expect(l.ogenOpen.length, d.sleutel).toBeGreaterThan(0);
      expect(l.ogenDicht.length, d.sleutel).toBeGreaterThan(0);
      expect(l.ogenBlij.length, d.sleutel).toBeGreaterThan(0);
      if (JSON.stringify(l.ogenBlij) !== JSON.stringify(l.ogenDicht)) boogjes++;
    }
    // Alleen een oog van twee pixels breed heeft geen ruimte voor een boogje.
    expect(boogjes).toBeGreaterThan(DIEREN.length * 0.8);
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

  it('laat de aap met zijn armen juichen: omhoog, allebei naar buiten', () => {
    const l = lagenVan('aap');
    expect(l.armNeer.length).toBeGreaterThan(0);
    expect(l.armOp.length).toBeGreaterThan(0);
    const xs = l.armOp.flatMap((p) => [...p.d.matchAll(/M(\d+) /g)].map((m) => Number(m[1])));
    expect(Math.min(...xs)).toBeLessThan(10);
    expect(Math.max(...xs)).toBeGreaterThan(22);
  });

  it('laat een vleugel die opklapt niet zijn omlijning op het lijf achter (geen twee vleugels)', () => {
    const l = lagenVan('kip');
    // De lijn tussen vleugel en lijf gaat mee met de vleugel.
    const rand = l.vleugelNeer.flatMap((p) => p.d.split('z')).filter(Boolean).length;
    const vul = SPRITES.kip.rijen.join('').split('').filter((t) => t === 'v').length;
    expect(rand).toBeGreaterThan(vul);
  });

  it('laat de worm kruipen als een slinky: twee ingeknepen lijven, de kop op zijn plek', () => {
    const l = lagenVan('worm');
    expect(l.romp1.length).toBeGreaterThan(0);
    expect(l.romp2.length).toBeGreaterThan(0);
    const minX = (laag: typeof l.lijf) => Math.min(...laag.flatMap((p) => [...p.d.matchAll(/M(\d+) /g)].map((m) => Number(m[1]))));
    expect(minX(l.romp1)).toBeGreaterThan(minX(l.lijf));
    expect(minX(l.romp2)).toBeGreaterThan(minX(l.romp1));
    expect(lagenVan('hond').romp1).toEqual([]);
  });
});

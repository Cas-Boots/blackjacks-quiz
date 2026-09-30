import { describe, it, expect } from 'vitest';
import { ICOONMAAT, icoonVan } from '../src/lib/shared/pixeliconen';
import { ALGEMEEN_BLIJ, ALGEMEEN_SIP, OPWARMERS, EINDE_SIP } from '../src/lib/shared/dieren';

describe('pixeliconen', () => {
  it('geeft de algemene tekens een pixelplaatje met omlijning, binnen de maat', () => {
    for (const teken of ['❤️', '🎵', '✨', '💧', '💦', '💤', '❗', '❓', '💨', '🫧', '💢', '🎉']) {
      const paden = icoonVan(teken);
      expect(paden, teken).not.toBeNull();
      expect(paden!.length, teken).toBeGreaterThan(1);
      for (const p of paden!) {
        for (const [, x, y] of p.d.matchAll(/M(-?\d+) (-?\d+)/g)) {
          expect(+x).toBeGreaterThanOrEqual(-1);
          expect(+y).toBeLessThanOrEqual(ICOONMAAT);
        }
      }
    }
  });

  it('laat de rest een gewone emoji', () => {
    expect(icoonVan('🧁')).toBeNull();
  });

  it('heeft een plaatje voor alles wat elk dier algemeen kan laten verschijnen, behalve voorwerpen', () => {
    const voorwerpen = new Set(['👋']);
    for (const a of [...ALGEMEEN_BLIJ, ...ALGEMEEN_SIP, ...OPWARMERS.blij, ...OPWARMERS.sip, EINDE_SIP]) {
      if (a.ding && !voorwerpen.has(a.ding)) expect(icoonVan(a.ding), a.ding).not.toBeNull();
    }
  });
});

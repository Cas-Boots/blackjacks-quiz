import { describe, it, expect } from 'vitest';
import { DIEREN } from '../src/lib/shared/dieren';
import { RAND, aai, houdingVan, nieuweBewoner, stapWei, type Bewoner, type Doen } from '../src/lib/client/wei';

/** Een vaste toevalsbron, zodat de test elke keer hetzelfde ziet. */
function zaadje(n = 42) {
  return () => ((n = (n * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
}

describe('de wei', () => {
  it('laat een hele kudde minutenlang rondscharrelen, binnen de wei, en doet van alles', () => {
    const toeval = zaadje();
    const wei: Bewoner[] = DIEREN.slice(-10).map((d, i) => nieuweBewoner({ id: i, naam: `s${i}`, dier: d.sleutel }, toeval));
    const gezien = new Set<Doen>();
    for (let t = 0; t < 5 * 60_000; t += 50) {
      stapWei(wei, 50, toeval);
      for (const b of wei) {
        expect(b.x).toBeGreaterThanOrEqual(RAND);
        expect(b.x).toBeLessThanOrEqual(100 - RAND);
        gezien.add(b.doen);
        const h = houdingVan(b);
        expect(h.pose).toBeTruthy();
      }
    }
    for (const doen of ['loop', 'ren', 'staan', 'snuffel', 'slaap', 'spring', 'kunstje', 'groet', 'jaag', 'vlucht', 'graaf', 'onder', 'op'] as Doen[]) {
      expect(gezien, doen).toContain(doen);
    }
  });

  it('laat twee dieren die elkaar tegenkomen elkaar groeten', () => {
    const a = nieuweBewoner({ id: 1, naam: 'A', dier: 'lama' }, () => 0.5);
    const b = nieuweBewoner({ id: 2, naam: 'B', dier: 'hond' }, () => 0.5);
    for (const x of [a, b]) {
      x.doen = 'staan';
      x.tot = 5000;
      x.groetPauze = 0;
    }
    b.x = a.x + 3;
    stapWei([a, b], 16, () => 0.5);
    expect(a.doen).toBe('groet');
    expect(b.doen).toBe('groet');
    expect(a.richting).toBe(1);
    expect(b.richting).toBe(-1);
  });

  it('doet een kunstje als je erop tikt, en wordt wakker als hij sliep', () => {
    const b = nieuweBewoner({ id: 1, naam: 'A', dier: 'kip' }, () => 0.5);
    aai(b, () => 0);
    expect(b.doen).toBe('kunstje');
    expect(b.actie).not.toBeNull();
    b.doen = 'slaap';
    aai(b);
    expect(b.doen).toBe('schrik');
  });
});

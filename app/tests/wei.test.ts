import { describe, it, expect } from 'vitest';
import { DIEREN } from '../src/lib/shared/dieren';
import { MAX_DRUK, RAND, aai, drukte, maakWereld, houdingVan, nieuweBewoner, stapWei, type Bewoner, type Doen } from '../src/lib/client/wei';

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
    for (const doen of ['loop', 'ren', 'staan', 'snuffel', 'slaap', 'spring', 'kunstje', 'groet', 'jaag', 'vlucht', 'graaf', 'onder', 'op', 'eet'] as Doen[]) {
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

  it('laat het karakter tellen: de snelle haas, de trage slak, de luiaard die vaker slaapt', () => {
    const kijk = (dier: string) => {
      const toeval = zaadje(7);
      const b = nieuweBewoner({ id: 1, naam: 'A', dier }, toeval);
      let slaap = 0;
      let afstand = 0;
      for (let t = 0; t < 10 * 60_000; t += 50) {
        const x = b.x;
        stapWei([b], 50, toeval);
        afstand += Math.abs(b.x - x);
        if (b.doen === 'slaap') slaap += 50;
      }
      return { slaap, afstand };
    };
    const hond = kijk('hond');
    const slak = kijk('slak');
    const luiaard = kijk('luiaard');
    expect(hond.afstand).toBeGreaterThan(slak.afstand * 1.5);
    expect(luiaard.slaap).toBeGreaterThan(hond.slaap * 2);
  });

  it('houdt het rustig: hooguit een paar dieren tegelijk doen iets geks', () => {
    const toeval = zaadje(3);
    const wei: Bewoner[] = DIEREN.slice(0, 12).map((d, i) => nieuweBewoner({ id: i, naam: `s${i}`, dier: d.sleutel }, toeval));
    let meest = 0;
    let rustig = 0;
    let tellen = 0;
    for (let t = 0; t < 5 * 60_000; t += 50) {
      stapWei(wei, 50, toeval);
      if (t < 2000) continue; // de binnenkomst telt niet
      const nu = drukte(wei);
      meest = Math.max(meest, nu);
      rustig += wei.length - nu;
      tellen += wei.length;
    }
    expect(meest).toBeLessThanOrEqual(MAX_DRUK);
    // De meeste tijd scharrelt de kudde gewoon wat rond.
    expect(rustig / tellen).toBeGreaterThan(0.75);
  });
});

describe('de wereld in de wei', () => {
  const kudde = (sleutels: string[], toeval: () => number) =>
    sleutels.map((dier, i) => nieuweBewoner({ id: i, naam: `s${i}`, dier }, toeval));

  it('zet alleen het decor neer dat de dieren van nu nodig hebben, zonder overlap, en laat staan wat er al stond', () => {
    const toeval = zaadje(11);
    const w1 = maakWereld(['aap', 'goudvis', 'bij', 'das', 'hond'], 30, [], toeval);
    expect(w1.map((d) => d.soort).sort()).toEqual(['bananenboom', 'bloemen', 'hol', 'hol', 'vijver']);
    for (const a of w1) for (const b of w1) if (a !== b) expect(a.x + a.breed <= b.x || b.x + b.breed <= a.x).toBe(true);
    // Een luiaard erbij: de boom komt erbij, de rest blijft op zijn plek.
    const w2 = maakWereld(['aap', 'goudvis', 'bij', 'das', 'hond', 'luiaard'], 30, w1, toeval);
    for (const d of w1) expect(w2).toContainEqual(d);
    expect(w2.some((d) => d.soort === 'boom')).toBe(true);
    // Zonder dieren die iets meenemen: een lege wei.
    expect(maakWereld(['hond', 'lama'], 30, w2, toeval)).toEqual([]);
  });

  it('laat grond, water en lucht samenwerken: vissen in de vijver, de aap in de bananenboom, de bij bij de bloemen', () => {
    const toeval = zaadje(5);
    const sleutels = ['aap', 'goudvis', 'bij', 'das', 'hond', 'krokodil', 'kikker', 'luiaard', 'uil'];
    const wereld = maakWereld(sleutels, 34, [], toeval);
    const wei = kudde(sleutels, toeval);
    const vijver = wereld.find((d) => d.soort === 'vijver')!;
    const gezien = new Set<string>();
    for (let t = 0; t < 8 * 60_000; t += 50) {
      stapWei(wei, 50, toeval, wereld);
      for (const b of wei) {
        if (b.sleutel === 'goudvis' && t > 100) {
          expect(b.nat).toBe(true);
          expect(b.x).toBeGreaterThanOrEqual(vijver.x);
          expect(b.x).toBeLessThanOrEqual(vijver.x + vijver.breed);
        }
        // Wie niet vliegt of zwemt en toch bij de vijver is, loopt erachter langs, over de oever.
        if (b.soort !== 'lucht' && !b.nat && b.x > vijver.x + 1 && b.x < vijver.x + vijver.breed - 1 && b.hoog < 1) {
          expect(b.hoog, `${b.sleutel} ${b.doen}`).toBeGreaterThan(0);
        }
        if (b.sleutel === 'aap' && b.doen === 'inboom') gezien.add('aap in de boom');
        if (b.sleutel === 'aap' && b.actie?.ding === '🍌') gezien.add('banaan');
        if (b.sleutel === 'luiaard' && b.doen === 'inboom' && b.actie?.lijf === 'ondersteboven') gezien.add('luiaard hangt');
        if (b.sleutel === 'uil' && b.doen === 'inboom') gezien.add('uil in de boom');
        if (b.sleutel === 'bij' && b.doen === 'bestuif') gezien.add('bij bij de bloemen');
        if (b.sleutel === 'krokodil' && b.doen === 'bad' && b.nat) gezien.add('krokodil in bad');
        if (b.sleutel === 'kikker' && b.doen === 'plons') gezien.add('plons');
        if (b.sleutel === 'hond' && b.doen === 'drink') gezien.add('hond drinkt');
        if (b.sleutel === 'das' && b.doen === 'op' && wereld.some((d) => d.soort === 'hol' && Math.abs(d.x + d.breed / 2 - b.x) < 0.01)) gezien.add('das uit een hol');
      }
    }
    for (const iets of ['aap in de boom', 'banaan', 'luiaard hangt', 'uil in de boom', 'bij bij de bloemen', 'krokodil in bad', 'plons', 'hond drinkt', 'das uit een hol']) {
      expect(gezien, iets).toContain(iets);
    }
  });
});

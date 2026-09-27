import { describe, it, expect } from 'vitest';
import { DIEREN } from '../src/lib/shared/dieren';
import { MAX_DECOR, MAX_DRUK, RAND, aai, drukte, nieuweWereld, houdingVan, nieuweBewoner, stapWei, type Bewoner, type Doen } from '../src/lib/client/wei';

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

  it('zet decor pas neer als een dier het nodig heeft, hooguit twee tegelijk, en haalt het weer weg', () => {
    const toeval = zaadje(11);
    const wereld = nieuweWereld(34);
    const wei = kudde(['aap', 'bij', 'luiaard', 'konijn', 'kameel', 'hond'], toeval);
    const soorten = new Set<string>();
    let meest = 0;
    let weggegaan = 0;
    let vorige = new Set<number>();
    for (let t = 0; t < 10 * 60_000; t += 50) {
      stapWei(wei, 50, toeval, wereld);
      meest = Math.max(meest, wereld.decor.length);
      for (const d of wereld.decor) soorten.add(d.soort);
      const nu = new Set(wereld.decor.map((d) => d.id));
      for (const id of vorige) if (!nu.has(id)) weggegaan++;
      vorige = nu;
      for (const a of wereld.decor) for (const b of wereld.decor) {
        if (a !== b) expect(a.x + a.breed <= b.x || b.x + b.breed <= a.x).toBe(true);
      }
    }
    expect(meest).toBeLessThanOrEqual(MAX_DECOR);
    // Elk stuk krijgt zijn beurt: niet steeds dezelfde boom.
    expect(soorten.size).toBeGreaterThanOrEqual(5);
    expect(weggegaan).toBeGreaterThan(5);
  });

  it('laat grond, water en lucht samenwerken: vissen in de vijver, de aap in de bananenboom, de bij bij de bloemen', () => {
    const gezien = new Set<string>();
    const draai = (sleutels: string[], zaad: number) => {
      const toeval = zaadje(zaad);
      const wereld = nieuweWereld(34);
      const wei = kudde(sleutels, toeval);
      for (let t = 0; t < 10 * 60_000; t += 50) {
        stapWei(wei, 50, toeval, wereld);
        const vijver = wereld.decor.find((d) => d.soort === 'vijver');
        for (const b of wei) {
          if (b.sleutel === 'goudvis' && b.nat) {
            expect(vijver).toBeDefined();
            expect(b.x).toBeGreaterThanOrEqual(vijver!.x);
            expect(b.x).toBeLessThanOrEqual(vijver!.x + vijver!.breed);
          }
          if (b.sleutel === 'goudvis' && b.nat) gezien.add('vis in de vijver');
          if (b.sleutel === 'aap' && b.doen === 'inboom') gezien.add('aap in de boom');
          if (b.sleutel === 'aap' && b.actie?.ding === '🍌') gezien.add('banaan');
          if (b.sleutel === 'luiaard' && b.doen === 'inboom' && b.actie?.lijf === 'ondersteboven') gezien.add('luiaard hangt');
          if (b.sleutel === 'uil' && b.doen === 'inboom') gezien.add('uil in de boom');
          if (b.sleutel === 'bij' && b.doen === 'bestuif') gezien.add('bij bij de bloemen');
          if (b.sleutel === 'krokodil' && b.doen === 'bad' && b.nat) gezien.add('krokodil in bad');
          if (b.sleutel === 'kikker' && b.doen === 'plons') gezien.add('plons');
          if (b.sleutel === 'hond' && b.doen === 'drink') gezien.add('hond drinkt');
          if (b.sleutel === 'das' && b.doen === 'graaf' && wereld.decor.some((d) => d.soort === 'hol')) gezien.add('das in een hol');
        }
      }
    };
    draai(['aap', 'bij', 'luiaard', 'das'], 5);
    draai(['goudvis', 'krokodil', 'kikker', 'hond', 'uil'], 6);
    for (const iets of ['vis in de vijver', 'aap in de boom', 'banaan', 'luiaard hangt', 'uil in de boom', 'bij bij de bloemen', 'krokodil in bad', 'plons', 'hond drinkt', 'das in een hol']) {
      expect(gezien, iets).toContain(iets);
    }
  });
});

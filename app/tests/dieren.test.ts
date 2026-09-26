import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DIEREN, ALGEMEEN_BLIJ, ALGEMEEN_SIP, OPWARMERS, EINDE_SIP, actiesVan, kiesActie, kiesRoutine, poseVan, dierVan,
  vrijDier, dierenroep, gangVan, isDier, schoneDierNaam, maatjeVoluit, MAX_DIERNAAM,
} from '../src/lib/shared/dieren';

describe('maatjes', () => {
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
    expect(css).toContain('.dierenparade[data-gang="sip"]');
  });

  it('geeft elk dier een handvol kunstjes, blij en sip, en elk kunstje bestaat in app.css', () => {
    const css = readFileSync(resolve(__dirname, '../src/app.css'), 'utf8');
    const alle = [...ALGEMEEN_BLIJ, ...ALGEMEEN_SIP, ...OPWARMERS.blij, ...OPWARMERS.sip, EINDE_SIP];
    for (const d of DIEREN) {
      const blij = actiesVan(d, 'blij');
      const sip = actiesVan(d, 'sip');
      expect(blij.length, d.sleutel).toBeGreaterThanOrEqual(3);
      expect(sip.length, d.sleutel).toBeGreaterThanOrEqual(3);
      alle.push(...blij, ...sip);
    }
    for (const a of alle) {
      expect(css, a.lijf).toContain(`.actie[data-lijf="${a.lijf}"]`);
      expect(css, a.lijf).toContain(`@keyframes kunst-${a.lijf}`);
      if (a.ding) expect(css, a.dingGaat).toContain(`.ding[data-gaat="${a.dingGaat}"]`);
    }
  });

  it('kiest een kunstje uit de kunstjes van dat dier', () => {
    const lama = dierVan('lama');
    for (const t of [0, 0.3, 0.7, 0.999]) {
      expect(actiesVan(lama, 'blij')).toContain(kiesActie(lama, 'blij', () => t));
      expect(actiesVan(lama, 'sip')).toContain(kiesActie(lama, 'sip', () => t));
    }
  });

  it('geeft een optreden van drie tellen: opwarmen en twee verschillende kunstjes', () => {
    for (const d of DIEREN) {
      for (const t of [0, 0.25, 0.5, 0.75, 0.999]) {
        const blij = kiesRoutine(d, 'blij', () => t);
        expect(blij).toHaveLength(3);
        expect(OPWARMERS.blij).toContain(blij[0]);
        expect(actiesVan(d, 'blij')).toContain(blij[1]);
        expect(actiesVan(d, 'blij')).toContain(blij[2]);
        expect(blij[2]).not.toBe(blij[1]);
        const sip = kiesRoutine(d, 'sip', () => t);
        expect([...actiesVan(d, 'sip'), EINDE_SIP]).toContain(sip[2]);
        for (const a of sip) expect(poseVan(a.lijf, 'sip')).not.toBe('blij');
      }
    }
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

  it('maakt de naam van een maatje netjes: getrimd, kort, zonder stuurtekens', () => {
    expect(schoneDierNaam('  Knabbel ')).toBe('Knabbel');
    expect(schoneDierNaam('Sir\u0000  Tok\tTok')).toBe('Sir Tok Tok');
    expect(schoneDierNaam('x'.repeat(50))).toHaveLength(MAX_DIERNAAM);
    expect(schoneDierNaam('🦙'.repeat(30))).toBe('🦙'.repeat(MAX_DIERNAAM));
    expect(schoneDierNaam('   ')).toBeNull();
    expect(schoneDierNaam(42)).toBeNull();
    expect(maatjeVoluit(dierVan('kip'), 'Knabbel')).toBe('Knabbel, de Paniekkip');
    expect(maatjeVoluit(dierVan('kip'), null)).toBe('de Paniekkip');
  });
});

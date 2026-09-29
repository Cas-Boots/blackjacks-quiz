import { describe, it, expect } from 'vitest';
import { DIEREN, JUICH, OPDRACHTEN, actieVoor, dierVan, isOpdracht, kiesRoutine, knopVan } from '../src/lib/shared/dieren';
import { icoonVan } from '../src/lib/shared/pixeliconen';
import { doeOpdracht, houdingVan, nieuweBewoner, stapWei } from '../src/lib/client/wei';

describe('je maatje iets laten doen', () => {
  it('kent alleen de vijf opdrachten', () => {
    for (const o of OPDRACHTEN) expect(isOpdracht(o)).toBe(true);
    for (const x of ['vlieg', '', null, 3, { opdracht: 'dans' }]) expect(isOpdracht(x)).toBe(false);
  });

  it('geeft elk dier bij elke opdracht een knop en een kunstje', () => {
    for (const d of DIEREN) {
      for (const o of OPDRACHTEN) {
        const k = knopVan(d, o);
        expect(k.woord, `${d.sleutel} ${o}`).toBeTruthy();
        expect(k.uitleg, `${d.sleutel} ${o}`).toBeTruthy();
        expect(actieVoor(d, o).lijf, `${d.sleutel} ${o}`).toBeTruthy();
      }
    }
  });

  it('voert een dier zijn eigen lievelingshapje, en een kunstje is er één van hemzelf', () => {
    const kip = dierVan('kip');
    expect(actieVoor(kip, 'voer').ding).toBe(kip.hapje.ding);
    expect(knopVan(kip, 'voer').teken).toBe(kip.hapje.ding);
    for (const t of [0, 0.5, 0.99]) expect(kip.acties.blij).toContainEqual(actieVoor(kip, 'kunstje', () => t));
  });

  it('heeft pixelplaatjes op de vaste knoppen', () => {
    for (const o of ['zwaai', 'dans', 'kunstje', 'feest'] as const) expect(icoonVan(knopVan(DIEREN[0], o).teken), o).not.toBeNull();
  });

  it('laat het dier in de wei het meteen doen, ook als het sliep, en daarna weer gewoon verder', () => {
    const b = nieuweBewoner({ id: 1, naam: 'Anna', dier: 'luiaard' }, () => 0.5);
    b.doen = 'slaap';
    doeOpdracht(b, 'dans', () => 0);
    expect(b.doen).toBe('kunstje');
    expect(b.actie?.lijf).toBe('dans');
    expect(houdingVan(b).pose).toBe('blij');

    doeOpdracht(b, 'voer');
    expect(b.doen).toBe('eet');
    expect(b.actie?.ding).toBe(dierVan('luiaard').hapje.ding);

    const beurt = b.beurt;
    stapWei([b], 2000, () => 0.5);
    expect(b.beurt).toBeGreaterThan(beurt);
    expect(b.doen).not.toBe('eet');
  });

  it('laat een winnaar afsluiten met het feest, en een gewone blije optocht niet altijd', () => {
    for (const d of DIEREN) {
      expect(actieVoor(d, 'feest')).toEqual(JUICH);
      expect(kiesRoutine(d, 'blij', () => 0.3, true).at(-1)).toEqual(JUICH);
      expect(kiesRoutine(d, 'sip', () => 0.3, true).at(-1)).not.toEqual(JUICH);
      expect(kiesRoutine(d, 'blij', () => 0.3).at(-1)).not.toEqual(JUICH);
    }
  });
});

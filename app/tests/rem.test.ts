import { describe, it, expect } from 'vitest';
import { Rem } from '../src/lib/server/rem';

/** Een klok die je zelf vooruitzet. */
function klok(start = 1_000_000) {
  let nu = start;
  return { nu: () => nu, verder: (ms: number) => (nu += ms) };
}

describe('Rem', () => {
  it('laat een handvol missers door en gaat dan op slot', () => {
    const k = klok();
    const rem = new Rem({ maxMissers: 3, vensterMs: 60_000, blokkadeMs: 300_000 }, k.nu);
    expect(rem.misser('a')).toBeNull();
    expect(rem.misser('a')).toBeNull();
    expect(rem.geblokkeerdTot('a')).toBeNull();
    expect(rem.misser('a')).toBe(k.nu() + 300_000);
    expect(rem.geblokkeerdTot('a')).toBe(k.nu() + 300_000);
  });

  it('houdt sleutels uit elkaar', () => {
    const rem = new Rem({ maxMissers: 2 });
    rem.misser('a');
    rem.misser('a');
    expect(rem.geblokkeerdTot('a')).not.toBeNull();
    expect(rem.geblokkeerdTot('b')).toBeNull();
  });

  it('vergeet missers die buiten het venster vallen', () => {
    const k = klok();
    const rem = new Rem({ maxMissers: 3, vensterMs: 60_000 }, k.nu);
    rem.misser('a');
    rem.misser('a');
    k.verder(61_000);
    expect(rem.misser('a')).toBeNull();
    expect(rem.geblokkeerdTot('a')).toBeNull();
  });

  it('laat de blokkade vanzelf aflopen', () => {
    const k = klok();
    const rem = new Rem({ maxMissers: 1, blokkadeMs: 10_000 }, k.nu);
    rem.misser('a');
    expect(rem.geblokkeerdTot('a')).not.toBeNull();
    k.verder(10_000);
    expect(rem.geblokkeerdTot('a')).toBeNull();
    expect(rem.aantalSleutels).toBe(0);
  });

  it('maakt de teller leeg na een geslaagde poging', () => {
    const rem = new Rem({ maxMissers: 2 });
    rem.misser('a');
    rem.gelukt('a');
    expect(rem.misser('a')).toBeNull();
  });

  it('ruimt verlopen sleutels op zodat het geheugen niet volloopt', () => {
    const k = klok();
    const rem = new Rem({ maxMissers: 5, vensterMs: 1_000, blokkadeMs: 1_000 }, k.nu);
    for (let i = 0; i < 100; i++) rem.misser(`adres-${i}`);
    expect(rem.aantalSleutels).toBe(100);
    k.verder(2_000);
    rem.misser('nieuw');
    expect(rem.aantalSleutels).toBe(1);
  });
});

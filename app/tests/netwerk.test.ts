import { describe, it, expect } from 'vitest';
import { adresUrl, lanAdressen, lijktAfgeschermd, type Netwerkkaarten } from '../src/lib/server/netwerk';

/** Een laptop op de wifi, met een Docker-brug en een VirtualBox-kaart ernaast — zoals een echte pc eruitziet. */
const kaarten: Netwerkkaarten = {
  lo: [
    { family: 'IPv4', internal: true, address: '127.0.0.1' },
    { family: 'IPv6', internal: true, address: '::1' },
  ],
  'vEthernet (WSL)': [{ family: 'IPv4', internal: false, address: '172.28.16.1' }],
  'Wi-Fi': [
    { family: 'IPv6', internal: false, address: 'fe80::1' },
    { family: 'IPv4', internal: false, address: '192.168.1.10' },
  ],
  Ethernet: [{ family: 'IPv4', internal: false, address: '169.254.12.7' }],
  'VirtualBox Host-Only': [{ family: 'IPv4', internal: false, address: '10.0.75.1' }],
};

describe('lanAdressen', () => {
  it('zet de wifi voorop en de virtuele kaarten erachter', () => {
    expect(lanAdressen(kaarten).map((a) => a.adres)).toEqual(['192.168.1.10', '10.0.75.1', '172.28.16.1']);
  });

  it('laat de lus naar zichzelf, IPv6 en een kaart zonder router weg', () => {
    const adressen = lanAdressen(kaarten).map((a) => a.adres);
    expect(adressen).not.toContain('127.0.0.1');
    expect(adressen).not.toContain('::1');
    expect(adressen).not.toContain('fe80::1');
    expect(adressen).not.toContain('169.254.12.7');
  });

  it('onthoudt de naam van de kaart, zodat je weet welk adres de wifi is', () => {
    expect(lanAdressen(kaarten)[0]).toEqual({ naam: 'Wi-Fi', adres: '192.168.1.10' });
  });

  it('begrijpt ook family als getal, zoals oudere Node-versies dat geven', () => {
    expect(lanAdressen({ eth0: [{ family: 4, internal: false, address: '192.168.2.5' }] })).toEqual([
      { naam: 'eth0', adres: '192.168.2.5' },
    ]);
  });

  it('geeft een lege lijst als er geen netwerk is', () => {
    expect(lanAdressen({})).toEqual([]);
    expect(lanAdressen({ lo: [{ family: 'IPv4', internal: true, address: '127.0.0.1' }] })).toEqual([]);
  });

  it('sorteert kaarten met dezelfde rang op naam, zodat de lijst niet wisselt', () => {
    const twee: Netwerkkaarten = {
      'Wi-Fi 2': [{ family: 'IPv4', internal: false, address: '192.168.1.11' }],
      'Wi-Fi': [{ family: 'IPv4', internal: false, address: '192.168.1.10' }],
    };
    expect(lanAdressen(twee).map((a) => a.naam)).toEqual(['Wi-Fi', 'Wi-Fi 2']);
  });
});

describe('lijktAfgeschermd', () => {
  it('waarschuwt in WSL zonder gespiegeld netwerk, waar alleen een 172-adres te zien is', () => {
    expect(lijktAfgeschermd([{ naam: 'eth0', adres: '172.28.16.5' }], true)).toBe(true);
    expect(lijktAfgeschermd([], true)).toBe(true);
  });

  it('zwijgt in WSL zodra het wifi-adres van Windows te zien is', () => {
    expect(lijktAfgeschermd([{ naam: 'eth0', adres: '192.168.1.10' }], true)).toBe(false);
  });

  it('zwijgt buiten WSL, ook met een 172-adres', () => {
    expect(lijktAfgeschermd([{ naam: 'eth0', adres: '172.28.16.5' }], false)).toBe(false);
  });
});

describe('adresUrl', () => {
  it('bouwt het adres dat je op de televisie tikt', () => {
    expect(adresUrl('192.168.1.10', 3000, '/tv')).toBe('http://192.168.1.10:3000/tv');
    expect(adresUrl('192.168.1.10', '3000')).toBe('http://192.168.1.10:3000/');
  });
});

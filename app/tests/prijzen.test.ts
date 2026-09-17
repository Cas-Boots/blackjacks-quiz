import { describe, it, expect } from 'vitest';
import { bepaalPrijzen } from '../src/lib/server/prijzen';

const spelers = [
  { id: 1, naam: 'Liz' }, { id: 2, naam: 'Bastiaan' }, { id: 3, naam: 'Joris' },
];
const rondeNamen = ['Warmdraaien', 'Sport'];

describe('bepaalPrijzen', () => {
  it('geeft niets als er niets gespeeld is', () => {
    expect(bepaalPrijzen({ spelers, uitdelingen: [], goedeAntwoorden: [], rondeNamen })).toEqual([]);
  });

  it('kroont wie de meeste vragen goed had, niet wie de meeste punten heeft', () => {
    const prijzen = bepaalPrijzen({
      spelers,
      uitdelingen: [
        { vraagSleutel: '0:0', verdeling: { 1: 1 } },
        { vraagSleutel: '0:1', verdeling: { 1: 1 } },
        { vraagSleutel: '1:0', verdeling: { 2: 5 } }, // Bastiaan heeft meer punten, Liz meer goede vragen
      ],
      goedeAntwoorden: [],
      rondeNamen,
    });
    const scherp = prijzen.find((p) => p.sleutel === 'scherpschutter');
    expect(scherp?.namen).toEqual(['Liz']);
    expect(scherp?.detail).toBe('2 vragen goed');
  });

  it('slaat een prijs over als bijna iedereen hem deelt', () => {
    const prijzen = bepaalPrijzen({
      spelers,
      uitdelingen: [{ vraagSleutel: '0:0', verdeling: { 1: 1, 2: 1, 3: 1 } }],
      goedeAntwoorden: [],
      rondeNamen,
    });
    expect(prijzen.some((p) => p.sleutel === 'scherpschutter')).toBe(false);
    expect(prijzen.some((p) => p.sleutel === 'beste-ronde')).toBe(false);
  });

  it('deelt een prijs bij een gelijkspel', () => {
    const prijzen = bepaalPrijzen({
      spelers,
      uitdelingen: [{ vraagSleutel: '0:0', verdeling: { 1: 1, 3: 1 } }],
      goedeAntwoorden: [],
      rondeNamen,
    });
    expect(prijzen.find((p) => p.sleutel === 'scherpschutter')?.namen).toEqual(['Liz', 'Joris']);
  });

  it('vindt het snelste goede antwoord en noemt het hele team', () => {
    const prijzen = bepaalPrijzen({
      spelers,
      uitdelingen: [],
      goedeAntwoorden: [
        { spelerIds: [1], naMs: 4200 },
        { spelerIds: [2, 3], naMs: 1750 },
        { spelerIds: [1], naMs: null }, // zonder klok telt niet mee
      ],
      rondeNamen,
    });
    const snel = prijzen.find((p) => p.sleutel === 'snelste');
    expect(snel?.namen).toEqual(['Bastiaan', 'Joris']);
    expect(snel?.detail).toBe('goed in 1,8 seconden');
  });

  it('slaat de snelste vinger over als geen enkel antwoord een tijd heeft', () => {
    const prijzen = bepaalPrijzen({
      spelers,
      uitdelingen: [{ vraagSleutel: '0:0', verdeling: { 1: 1 } }],
      goedeAntwoorden: [{ spelerIds: [1], naMs: null }],
      rondeNamen,
    });
    expect(prijzen.some((p) => p.sleutel === 'snelste')).toBe(false);
  });

  it('kiest de beste ronde op punten binnen één ronde', () => {
    const prijzen = bepaalPrijzen({
      spelers,
      uitdelingen: [
        { vraagSleutel: '0:0', verdeling: { 1: 1 } },
        { vraagSleutel: '0:1', verdeling: { 1: 1 } },
        { vraagSleutel: '1:0', verdeling: { 3: 3 } },
        { vraagSleutel: '1:1', verdeling: { 3: 3 } },
      ],
      goedeAntwoorden: [],
      rondeNamen,
    });
    const beste = prijzen.find((p) => p.sleutel === 'beste-ronde');
    expect(beste?.namen).toEqual(['Joris']);
    expect(beste?.detail).toBe('6 punten in Sport');
  });
});

describe('de nieuwe prijzen', () => {
  it('deelt de snelste vinger bij een gelijke tijd en slaat hem over als te veel mensen delen', () => {
    const gedeeld = bepaalPrijzen({
      spelers,
      uitdelingen: [],
      goedeAntwoorden: [{ spelerIds: [1], naMs: 900 }, { spelerIds: [2], naMs: 900 }, { spelerIds: [3], naMs: 1200 }],
      rondeNamen,
    });
    expect(gedeeld.find((p) => p.sleutel === 'snelste')?.namen).toEqual(['Liz', 'Bastiaan']);

    const teVeel = bepaalPrijzen({
      spelers,
      uitdelingen: [],
      goedeAntwoorden: [{ spelerIds: [1], naMs: 900 }, { spelerIds: [2], naMs: 900 }, { spelerIds: [3], naMs: 900 }],
      rondeNamen,
    });
    expect(teVeel.some((p) => p.sleutel === 'snelste')).toBe(false);
  });

  const vragen = ['0:0', '0:1', '0:2', '1:0', '1:1'].map((sleutel, i) => ({ sleutel, tekst: `Vraag ${i + 1}`, inzenders: 3 }));

  it('vindt de langste reeks, en pas vanaf drie op rij', () => {
    const prijzen = bepaalPrijzen({
      spelers,
      uitdelingen: [
        { vraagSleutel: '0:0', verdeling: { 1: 1, 2: 1 } },
        { vraagSleutel: '0:1', verdeling: { 1: 1 } },
        { vraagSleutel: '0:2', verdeling: { 1: 1, 2: 1 } },
        { vraagSleutel: '1:0', verdeling: { 2: 1 } },
        { vraagSleutel: '1:1', verdeling: { 1: 1, 3: 1 } },
      ],
      goedeAntwoorden: [],
      rondeNamen,
      vragen,
    });
    const reeks = prijzen.find((p) => p.sleutel === 'reeks');
    expect(reeks?.namen).toEqual(['Liz']);
    expect(reeks?.detail).toBe('3 vragen op rij goed');

    const kort = bepaalPrijzen({
      spelers,
      uitdelingen: [{ vraagSleutel: '0:0', verdeling: { 1: 1 } }, { vraagSleutel: '0:1', verdeling: { 1: 1 } }],
      goedeAntwoorden: [],
      rondeNamen,
      vragen,
    });
    expect(kort.some((p) => p.sleutel === 'reeks')).toBe(false);
  });

  it('kroont de comeback: van onderaan na ronde één naar bovenaan aan het eind', () => {
    const prijzen = bepaalPrijzen({
      spelers,
      uitdelingen: [
        { vraagSleutel: '0:0', verdeling: { 1: 2, 2: 1 } }, // na ronde 1: Liz, Bastiaan, Joris
        { vraagSleutel: '1:0', verdeling: { 3: 5 } }, // eind: Joris, Liz, Bastiaan
      ],
      goedeAntwoorden: [],
      rondeNamen,
      vragen,
    });
    const comeback = prijzen.find((p) => p.sleutel === 'comeback');
    expect(comeback?.namen).toEqual(['Joris']);
    expect(comeback?.detail).toBe('van plek 3 naar plek 1');
  });

  it('geeft geen comeback als niemand meer dan één plek klom', () => {
    const prijzen = bepaalPrijzen({
      spelers,
      uitdelingen: [
        { vraagSleutel: '0:0', verdeling: { 1: 3, 2: 1 } },
        { vraagSleutel: '1:0', verdeling: { 3: 2 } }, // Joris klimt één plek
      ],
      goedeAntwoorden: [],
      rondeNamen,
      vragen,
    });
    expect(prijzen.some((p) => p.sleutel === 'comeback')).toBe(false);
  });

  it('noemt de moeilijkste vraag: de minste goed, bij gelijke stand de meeste pogingen', () => {
    const prijzen = bepaalPrijzen({
      spelers,
      uitdelingen: [
        { vraagSleutel: '0:0', verdeling: { 1: 1, 2: 1, 3: 1 } },
        { vraagSleutel: '0:1', verdeling: {} },
        { vraagSleutel: '0:2', verdeling: {} },
      ],
      goedeAntwoorden: [],
      rondeNamen,
      vragen: [
        { sleutel: '0:0', tekst: 'Makkelijk', inzenders: 3 },
        { sleutel: '0:1', tekst: 'Niemand probeerde het', inzenders: 1 },
        { sleutel: '0:2', tekst: 'Iedereen probeerde het', inzenders: 3 },
      ],
    });
    const moeilijk = prijzen.find((p) => p.sleutel === 'moeilijkste-vraag');
    expect(moeilijk?.detail).toContain('Iedereen probeerde het');
    expect(moeilijk?.detail).toContain('niemand had hem goed');
  });

  it('slaat de moeilijkste vraag over als iedereen alles goed had', () => {
    const prijzen = bepaalPrijzen({
      spelers,
      uitdelingen: [{ vraagSleutel: '0:0', verdeling: { 1: 1, 2: 1, 3: 1 } }],
      goedeAntwoorden: [],
      rondeNamen,
      vragen: [{ sleutel: '0:0', tekst: 'Makkelijk', inzenders: 3 }],
    });
    expect(prijzen.some((p) => p.sleutel === 'moeilijkste-vraag')).toBe(false);
  });
});

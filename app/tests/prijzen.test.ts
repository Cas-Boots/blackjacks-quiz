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

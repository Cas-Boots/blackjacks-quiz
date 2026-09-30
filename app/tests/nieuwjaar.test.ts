import { describe, it, expect } from 'vitest';
import { middernachtVan, nieuwjaarRond, leesNieuwjaarOp, aftelTekst, nogTekst } from '../src/lib/shared/nieuwjaar';

describe('middernachtVan', () => {
  it('is 23:00 UTC op oudejaarsdag, want Nederland zit dan op wintertijd', () => {
    expect(new Date(middernachtVan(2027)).toISOString()).toBe('2026-12-31T23:00:00.000Z');
  });
});

describe('nieuwjaarRond', () => {
  it('kijkt op oudejaarsavond vooruit naar het nieuwe jaar', () => {
    const nu = Date.parse('2026-12-31T22:45:00+01:00');
    expect(nieuwjaarRond(nu)).toEqual({ op: middernachtVan(2027), jaar: 2027 });
  });

  it('houdt vlak na middernacht de middernacht die net geweest is', () => {
    const nu = Date.parse('2027-01-01T00:30:00+01:00');
    expect(nieuwjaarRond(nu)).toEqual({ op: middernachtVan(2027), jaar: 2027 });
  });

  it('kijkt twee uur na middernacht weer naar het volgende jaar', () => {
    const nu = Date.parse('2027-01-01T02:00:00+01:00');
    expect(nieuwjaarRond(nu).jaar).toBe(2028);
  });

  it('rekent in Nederlandse tijd, niet in UTC', () => {
    // 23:30 UTC op oudejaarsdag is in Amsterdam al half een op nieuwjaarsdag.
    const nu = Date.parse('2026-12-31T23:30:00Z');
    expect(nieuwjaarRond(nu)).toEqual({ op: middernachtVan(2027), jaar: 2027 });
  });

  it('wijst in september naar de komende jaarwisseling', () => {
    expect(nieuwjaarRond(Date.parse('2026-09-23T12:00:00Z')).jaar).toBe(2027);
  });
});

describe('leesNieuwjaarOp', () => {
  const nu = Date.parse('2026-12-28T20:00:00+01:00');
  it('leest minuten vanaf nu', () => {
    expect(leesNieuwjaarOp('+10', nu)).toBe(nu + 600_000);
  });
  it('leest een tijdstip', () => {
    expect(leesNieuwjaarOp('2026-12-28T21:00:00+01:00', nu)).toBe(nu + 3_600_000);
  });
  it('negeert leeg en onzin', () => {
    expect(leesNieuwjaarOp(undefined, nu)).toBeNull();
    expect(leesNieuwjaarOp('', nu)).toBeNull();
    expect(leesNieuwjaarOp('morgen', nu)).toBeNull();
  });
});

describe('teksten', () => {
  it('telt af in minuten en seconden', () => {
    expect(aftelTekst(247_000)).toBe('4:07');
    expect(aftelTekst(3_729_000)).toBe('1:02:09');
    expect(aftelTekst(-5)).toBe('0:00');
  });
  it('zegt hoe lang het nog duurt', () => {
    expect(nogTekst(12 * 60_000)).toBe('nog 12 minuten');
    expect(nogTekst(60_000)).toBe('nog 1 minuut');
    expect(nogTekst(40_000)).toBe('nog 40 seconden');
  });
});

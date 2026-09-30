import { describe, it, expect } from 'vitest';
import { normaliseer, lijktOp, beoordeel, leesGetal } from '../src/lib/server/antwoord';
import type { Ronde, Vraag } from '../src/lib/content/types';

const ronde = (type: Ronde['type']): Ronde => ({
  naam: 'test', suit: '♠', thema: 't', type, tijd: 30, punten: 2,
  teamModus: 'individueel', uitleg: '', vragen: [],
});

describe('normaliseer', () => {
  it('haalt accenten, hoofdletters en leestekens weg', () => {
    expect(normaliseer('Pogačar!')).toBe('pogacar');
    expect(normaliseer('Cortina d’Ampezzo')).toBe('cortina d ampezzo'.replace(/\s+/g, ' '));
  });
  it('negeert lidwoorden', () => {
    expect(normaliseer('De Herfst')).toBe('herfst');
  });
});

describe('lijktOp', () => {
  it('accepteert accent- en hoofdletterverschillen', () => {
    expect(lijktOp('pogacar', 'Pogačar')).toBe(true);
  });
  it('accepteert een achternaam zonder voornaam', () => {
    expect(lijktOp('Torres', 'Ferran Torres')).toBe(true);
    expect(lijktOp('Ferran Torres', 'Torres')).toBe(true);
  });
  it('accepteert één helft van een samengesteld antwoord', () => {
    expect(lijktOp('Bangaranga', 'Bangaranga — Dara')).toBe(true);
    expect(lijktOp('Dara', 'Bangaranga — Dara')).toBe(true);
  });
  it('keurt een ander antwoord af', () => {
    expect(lijktOp('Evenepoel', 'Ferran Torres')).toBe(false);
    expect(lijktOp('', 'Spanje')).toBe(false);
  });
  it('laat bij een opsomming geen halve of hagelschot-antwoorden door', () => {
    const drie = 'Eva, Liz en Bastiaan';
    expect(lijktOp('Liz', drie)).toBe(false);
    expect(lijktOp('Cas Liz Eva Bastiaan Rik Joris', drie)).toBe(false);
    expect(lijktOp('Cas, Liz, Eva en Bastiaan', drie)).toBe(false);
    expect(lijktOp('liz, bastiaan en eva', drie)).toBe(true);
    expect(lijktOp('Bastiaan & Liz & Eva', drie)).toBe(true);
    expect(lijktOp('Kroatië', 'Saoedi-Arabië, de Verenigde Arabische Emiraten en Kroatië')).toBe(false);
    expect(lijktOp('6 minuten', '6 minuten en 26 seconden')).toBe(false);
  });
  it('splitst niet op een gewoon streepje en laat geen getal weg', () => {
    expect(lijktOp('0', '1-0')).toBe(false);
    expect(lijktOp('1', '1-0')).toBe(false);
    expect(lijktOp('1-0', '1-0')).toBe(true);
    expect(lijktOp('Saoedi', 'Saoedi-Arabië')).toBe(true);
  });
  it('keurt de uitleg achter het streepje niet goed als antwoord', () => {
    expect(lijktOp('keer', 'Cas — 105 keer')).toBe(false);
    expect(lijktOp('Cas', 'Cas — 105 keer')).toBe(true);
    expect(lijktOp('Cas, 105 keer', 'Cas — 105 keer')).toBe(true);
    expect(lijktOp('twee', 'Twee — 2010 en 2026')).toBe(true);
  });
  it('keurt een typefout af in plaats van hem goed te praten', () => {
    // Bewust geen fuzzy match: dat zou het verkeerde antwoord kunnen goedkeuren.
    expect(lijktOp('Pogacer', 'Pogačar')).toBe(false);
  });
});

describe('beoordeel — waar of niet waar', () => {
  const v: Vraag = { v: 'stelling', goed: true };
  it('herkent bevestigende vormen', () => {
    for (const t of ['waar', 'Waar', 'ja', 'A', 'true']) {
      expect(beoordeel(ronde('waarnietwaar'), v, t)).toMatchObject({ automatisch: true, goed: true });
    }
  });
  it('herkent ontkennende vormen', () => {
    for (const t of ['niet waar', 'nee', 'B', 'onwaar']) {
      expect(beoordeel(ronde('waarnietwaar'), v, t)).toMatchObject({ automatisch: true, goed: false });
    }
  });
  it('laat onzin aan de quizmaster', () => {
    expect(beoordeel(ronde('waarnietwaar'), v, 'misschien').automatisch).toBe(false);
  });
});

describe('beoordeel — meerkeuze', () => {
  const v: Vraag = { v: 'vraag', opties: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], goed: 2 };
  it('accepteert de letter', () => {
    expect(beoordeel(ronde('meerkeuze'), v, 'C')).toMatchObject({ automatisch: true, goed: true });
    expect(beoordeel(ronde('meerkeuze'), v, 'a')).toMatchObject({ automatisch: true, goed: false });
  });
  it('accepteert de uitgeschreven optie', () => {
    expect(beoordeel(ronde('meerkeuze'), v, 'canberra')).toMatchObject({ automatisch: true, goed: true });
  });
  it('wijst een keuze buiten de opties terug', () => {
    expect(beoordeel(ronde('meerkeuze'), v, 'Brisbane').automatisch).toBe(false);
  });
});

describe('beoordeel — open', () => {
  const v: Vraag = { v: 'vraag', a: 'Ferran Torres' };
  it('keurt een treffer automatisch goed', () => {
    expect(beoordeel(ronde('open'), v, 'torres')).toMatchObject({ automatisch: true, goed: true });
  });
  it('legt twijfel bij de quizmaster in plaats van fout te rekenen', () => {
    const o = beoordeel(ronde('open'), v, 'Lamine Yamal');
    expect(o.automatisch).toBe(false);
    expect(o.goed).toBe(false);
  });
  it('rekent leeg meteen fout', () => {
    expect(beoordeel(ronde('open'), v, '   ')).toMatchObject({ automatisch: true, goed: false });
  });
});

describe('leesGetal', () => {
  it('leest gewone en rommelige invoer', () => {
    expect(leesGetal('330')).toBe(330);
    expect(leesGetal('ongeveer 330 meter')).toBe(330);
    expect(leesGetal('1,5')).toBe(1.5);
  });
  it('leest getallen zoals Nederlanders ze schrijven', () => {
    expect(leesGetal('1.000')).toBe(1000);
    expect(leesGetal('12.500 punten')).toBe(12500);
    expect(leesGetal('1.234,5')).toBe(1234.5);
    expect(leesGetal('1.5')).toBe(1.5);
    expect(leesGetal('1,000,000')).toBe(1_000_000);
  });
  it('pakt het eerste getal, ook achter een afkorting', () => {
    expect(leesGetal('ca. 400')).toBe(400);
    expect(leesGetal('10-12')).toBe(10);
    expect(leesGetal('-5')).toBe(-5);
    expect(leesGetal('ongeveer 450.')).toBe(450);
  });
  it('geeft null bij iets dat geen getal is', () => {
    expect(leesGetal('geen idee')).toBeNull();
  });
});

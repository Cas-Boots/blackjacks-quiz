/**
 * Beoordeling van ingetikte antwoorden.
 *
 * De vuistregel: de machine doet een voorstel, de quizmaster beslist. Bij
 * waar/niet waar, meerkeuze en dichtstbij is het antwoord eenduidig en durven
 * we automatisch te oordelen. Bij open vragen typen mensen "Pogacar",
 * "pogačar" of "Tadej Pogačar" en is een voorstel het hoogst haalbare.
 */
import type { Ronde, Vraag } from '$lib/content/types';

/** Kleine woorden die er voor de vergelijking niet toe doen. */
const RUIS = new Set(['de', 'het', 'een', 'en', 'van', 'in', 'op', 'the', 'a', 'of']);

/**
 * Alleen opschonen: kleine letters, accenten eraf, leestekens eruit.
 * Houdt korte antwoorden als "A" en "B" heel — die zijn bij meerkeuze
 * en waar/niet waar juist het antwoord.
 */
export function eenvoudig(tekst: string): string {
  return String(tekst)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ')
    .trim();
}

/**
 * Opschonen én ruiswoorden weglaten. Alleen voor het vergelijken van open
 * antwoorden, waar "de" en "een" er niet toe doen.
 */
export function normaliseer(tekst: string): string {
  return eenvoudig(tekst)
    .split(' ')
    .filter((w) => w && !RUIS.has(w))
    .join(' ')
    .trim();
}

/** Losse betekenisdragende woorden van een antwoord. */
function woorden(tekst: string): string[] {
  return normaliseer(tekst).split(' ').filter(Boolean);
}

/**
 * De delen van een opsomming: "Eva, Liz en Bastiaan" wordt drie namen.
 * Gesplitst vóór het opschonen, want daarna is "en" als ruiswoord weg.
 */
function opsomming(tekst: string): string[] {
  return tekst.split(/,|\s+(?:en|and|&)\s+/i).map(normaliseer).filter(Boolean);
}

/**
 * Eén naam of term tegen één naam of term. Een deel mag ("Pogačar" hoort bij
 * "Tadej Pogačar"), maar een getal nooit weglaten: "0" is niet "1-0". En een
 * hagelschot telt niet: wie er een paar namen bij gooit, zit er niet op.
 */
function lijktOpEen(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const wa = woorden(a);
  const wb = woorden(b);
  if (!wa.length || !wb.length) return false;
  if (wb.some((w) => /\d/.test(w) && !wa.includes(w))) return false;
  const inB = wa.every((w) => wb.includes(w));
  const inA = wb.every((w) => wa.includes(w)) && wa.length <= wb.length + 1;
  return inB || inA;
}

/**
 * Lijkt het ingetikte antwoord genoeg op het juiste? Bewust geen
 * typefout-tolerantie: dat zou het verkeerde antwoord kunnen goedkeuren.
 * Wel: hoofdletters, accenten, leestekens, lidwoorden en een deelverzameling
 * ("Pogačar" hoort bij "Tadej Pogačar").
 *
 * Bij een opsomming ("Eva, Liz en Bastiaan") moet alles erin en niets
 * erbij; een halve opsomming legt de machine bij de quizmaster.
 */
export function lijktOp(ingetikt: string, juist: string): boolean {
  const a = normaliseer(ingetikt);
  const b = normaliseer(juist);
  if (!a || !b) return false;
  if (a === b) return true;

  // Een juist antwoord draagt vaak een toevoeging achter een gedachtestreepje
  // of een schuine streep ("Bangaranga — Dara"). Elk los deel telt als
  // volwaardig antwoord. Een gewoon streepje ("1-0", "Saoedi-Arabië") hoort
  // bij het antwoord zelf.
  const delen = juist.split(/\s[—–-]\s|—|–|\//).map((d) => d.trim()).filter(Boolean);
  if (delen.some((deel) => normaliseer(deel) === a)) return true;

  // Alleen het eerste deel is het eigenlijke antwoord; de rest is uitleg.
  const kern = delen[0] ?? juist;
  const items = opsomming(kern);
  if (items.length < 2) return lijktOpEen(a, normaliseer(kern));

  const gegeven = opsomming(ingetikt);
  if (gegeven.length !== items.length) return false;
  const over = [...gegeven];
  for (const item of items) {
    const i = over.findIndex((g) => lijktOpEen(g, item));
    if (i < 0) return false;
    over.splice(i, 1);
  }
  return true;
}

export interface Oordeel {
  /** Zeker genoeg om zonder tussenkomst te tellen. */
  automatisch: boolean;
  goed: boolean;
  /** Toelichting voor het hostscherm. */
  reden: string;
}

const ZEGT_WAAR = new Set(['waar', 'ja', 'true', 'w', 'a', 'wel waar']);
const ZEGT_NIET = new Set(['niet waar', 'nietwaar', 'nee', 'false', 'n', 'b', 'onwaar']);

export function beoordeel(ronde: Ronde, vraag: Vraag, ingetikt: string): Oordeel {
  const tekst = String(ingetikt ?? '').trim();
  if (!tekst) return { automatisch: true, goed: false, reden: 'niets ingevuld' };

  if (ronde.type === 'waarnietwaar') {
    const n = eenvoudig(tekst);
    const waar = ZEGT_WAAR.has(n);
    const niet = ZEGT_NIET.has(n);
    if (!waar && !niet) return { automatisch: false, goed: false, reden: 'onduidelijk' };
    return {
      automatisch: true,
      goed: waar === (vraag.goed === true),
      reden: waar ? 'waar' : 'niet waar',
    };
  }

  if (ronde.type === 'meerkeuze' && vraag.opties) {
    const n = eenvoudig(tekst);
    let gekozen = -1;
    if (/^[a-d]$/.test(n)) gekozen = n.charCodeAt(0) - 97;
    else gekozen = vraag.opties.findIndex((o) => lijktOp(tekst, o));
    if (gekozen < 0 || gekozen >= vraag.opties.length) {
      return { automatisch: false, goed: false, reden: 'geen geldige keuze' };
    }
    return {
      automatisch: true,
      goed: gekozen === vraag.goed,
      reden: String.fromCharCode(65 + gekozen),
    };
  }

  if (ronde.type === 'stem') {
    // Wie de meerderheid heeft blijkt pas als alles binnen is; hier alleen vastleggen.
    return { automatisch: false, goed: false, reden: `stemt op ${tekst}` };
  }

  if (ronde.type === 'dichtstbij') {
    const getal = leesGetal(tekst);
    if (getal === null) return { automatisch: false, goed: false, reden: 'geen getal' };
    // Wie het dichtst zit blijkt pas als alles binnen is; hier alleen vastleggen.
    return { automatisch: false, goed: false, reden: String(getal) };
  }

  if (vraag.a && lijktOp(tekst, vraag.a)) {
    return { automatisch: true, goed: true, reden: 'komt overeen' };
  }
  return { automatisch: false, goed: false, reden: 'beoordeel zelf' };
}

/**
 * Het getal uit een dichtstbij-antwoord, of null.
 *
 * Let op de lege-tekenreeks: Number('') is 0, dus zonder deze controle zou
 * "geen idee" een gok van nul worden — die bij een klein juist antwoord zelfs
 * de ronde kan winnen.
 *
 * Nederlands geschreven: "1.000" is duizend en "1,5" anderhalf. Staan er
 * meer getallen ("ca. 400", "10-12"), dan telt het eerste.
 */
export function leesGetal(tekst: string): number | null {
  const m = String(tekst ?? '').match(/-?\d[\d.,]*/);
  if (!m) return null;
  let t = m[0].replace(/[.,]+$/, '');
  if (t.includes('.') && t.includes(',')) {
    // 1.234,5: punten scheiden duizendtallen, de komma is de decimaal.
    t = t.replace(/\./g, '').replace(',', '.');
  } else if (t.includes(',')) {
    // 1,5 is anderhalf; 1,000,000 (Engels) is een miljoen.
    t = /^-?\d{1,3}(,\d{3}){2,}$/.test(t) ? t.replace(/,/g, '') : t.replace(',', '.');
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) {
    // 1.000 en 12.500: duizendtallen.
    t = t.replace(/\./g, '');
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

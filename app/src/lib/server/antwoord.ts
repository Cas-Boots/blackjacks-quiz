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
 * Lijkt het ingetikte antwoord genoeg op het juiste? Bewust geen
 * typefout-tolerantie: dat zou het verkeerde antwoord kunnen goedkeuren.
 * Wel: hoofdletters, accenten, leestekens, lidwoorden en een deelverzameling
 * ("Pogačar" hoort bij "Tadej Pogačar").
 */
export function lijktOp(ingetikt: string, juist: string): boolean {
  const a = normaliseer(ingetikt);
  const b = normaliseer(juist);
  if (!a || !b) return false;
  if (a === b) return true;

  // Een juist antwoord draagt vaak een toevoeging achter een gedachtestreepje
  // ("Bangaranga — Dara"). Elk los deel telt als volwaardig antwoord.
  const delen = juist
    .split(/[—–-]|,|\//)
    .map(normaliseer)
    .filter(Boolean);
  if (delen.some((deel) => deel === a)) return true;

  const wa = woorden(a);
  const wb = woorden(b);
  if (!wa.length || !wb.length) return false;

  const inB = wa.every((w) => wb.includes(w));
  const inA = wb.every((w) => wa.includes(w));
  return inB || inA;
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
 */
export function leesGetal(tekst: string): number | null {
  const schoon = String(tekst ?? '')
    .replace(/[^0-9,.-]/g, '')
    .replace(',', '.');
  if (!/\d/.test(schoon)) return null;
  const n = Number(schoon);
  return Number.isFinite(n) ? n : null;
}

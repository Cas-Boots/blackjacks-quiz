/**
 * Waar de punten dubbel tellen: de slotrondes en de gouden kaart.
 *
 * Allebei zijn er om de avond tot het eind open te houden. Wie na zeven
 * rondes achterstaat, kan het in de laatste twee nog goedmaken, en de gouden
 * kaart valt op een willekeurige vraag per ronde, dus ook op een vraag waar
 * toevallig net de achterblijver het antwoord op weet.
 *
 * 'Willekeurig' is hier wel vast per spel: dezelfde avond geeft steeds
 * dezelfde gouden kaarten. De stand wordt bij elke telling opnieuw
 * afgeleid, dus een kaart die bij elke telling verhuisde zou punten laten
 * verspringen.
 */
import type { Ronde } from '$lib/content/types';
import { isAfrekening } from '$lib/shared/state';
import { DUBBELE_SLOTRONDES, GOUDEN_KAART } from '$lib/shared/bonus';

const MINSTE_VRAGEN_VOOR_GOUD = 3;

/** Een klein, vast getal uit een tekst (FNV-1a). */
function hash(tekst: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < tekst.length; i++) {
    h ^= tekst.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface RondeVermenigvuldiger {
  /** Een slotronde: alles telt dubbel. */
  dubbel: boolean;
  /** De vraag met de gouden kaart, of null. */
  goud: number | null;
}

/** Per ronde van de samenstelling: telt hij dubbel, en waar ligt de gouden kaart. */
export function vermenigvuldigers(spelId: number, rondes: Ronde[]): RondeVermenigvuldiger[] {
  // De afrekening van de voorspellingen heeft geen vragen: die telt niet mee.
  const speelbaar = rondes.map((r, ri) => ({ r, ri })).filter(({ r }) => !isAfrekening(r));
  // Met maar een paar rondes zou 'dubbel' gewoon alles verdubbelen.
  const slot = new Set(
    speelbaar.length > DUBBELE_SLOTRONDES ? speelbaar.slice(-DUBBELE_SLOTRONDES).map(({ ri }) => ri) : [],
  );
  return rondes.map((r, ri) => ({
    dubbel: slot.has(ri),
    // Bij één of twee vragen zou de kaart de halve ronde zijn: dan geen kaart.
    goud: isAfrekening(r) || r.vragen.length < MINSTE_VRAGEN_VOOR_GOUD ? null : hash(`${spelId}:${ri}:${r.naam}`) % r.vragen.length,
  }));
}

/** De vermenigvuldiger van één vraag. */
export function vermenigvuldigerVan(v: RondeVermenigvuldiger | undefined, vraagIndex: number): number {
  if (!v) return 1;
  return (v.dubbel ? 2 : 1) * (v.goud === vraagIndex ? GOUDEN_KAART : 1);
}

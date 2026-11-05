/**
 * De puntenregels, gedeeld: de server rekent ermee, de schermen leggen ze uit.
 * Zie server/bonus.ts.
 *
 * Het scorebord telt in grote getallen. De vragen zelf houden hun kleine
 * punten (1, 2, 3); pas op het scorebord wordt elk punt PUNT_WAARDE waard.
 * Ieder voor zich telt snelheid mee; in een teamronde niet, want daar hoort
 * overleg bij en niet haast. Daarna de vermenigvuldigers.
 */

/** Eén punt uit de vragen op het scorebord. Een vraag van 2 punten is zo tot 1000 waard. */
export const PUNT_WAARDE = 500;

/** Wie op de laatste seconde goed antwoordt, houdt dit deel over; wie meteen antwoordt alles. */
export const MINIMUM_DEEL = 0.5;

/**
 * Vanaf hoeveel goede vragen op rij de stand een vlammetje toont. Het levert
 * geen punten op: met teams die per ronde wisselen is een reeks niet eerlijk
 * te belonen.
 */
export const REEKS_VANAF = 2;

/** Zoveel slotrondes tellen dubbel, zodat de avond tot het eind openligt. */
export const DUBBELE_SLOTRONDES = 2;

/** De gouden kaart: per ronde één willekeurige vraag die dubbel telt. */
export const GOUDEN_KAART = 2;

/**
 * Het deel van de punten dat je overhoudt na zoveel milliseconden. `minimum`
 * is er voor de simulatie (scripts/spanning.ts); de app gebruikt MINIMUM_DEEL.
 */
export function snelheidsDeel(naMs: number | null, duurMs: number, minimum = MINIMUM_DEEL): number {
  if (naMs === null || !(duurMs > 0)) return minimum;
  const verstreken = Math.min(1, Math.max(0, naMs / duurMs));
  return 1 - (1 - minimum) * verstreken;
}

/**
 * Het laatste stuk van de quiz blijft de stand geheim, zodat het tot de
 * uitslag spannend is wie er wint: ongeveer dit deel van de rondes (afgerond,
 * zodat het bij acht tot tien rondes op 25 tot 33 procent uitkomt).
 */
export const GEHEIM_DEEL = 0.3;

/**
 * De eerste ronde waarin de stand geheim is. Minstens de dubbele slotrondes,
 * en anders het laatste GEHEIM_DEEL van de avond. -1 als er niets geheim is
 * (een avond van één of twee rondes).
 *
 * @param rondeAantal  hoeveel rondes de avond telt
 * @param eersteDubbel de index van de eerste dubbele slotronde, of -1
 */
export function eersteGeheimeRonde(rondeAantal: number, eersteDubbel: number): number {
  if (rondeAantal < 3) return -1;
  const vanaf = rondeAantal - Math.max(1, Math.round(rondeAantal * GEHEIM_DEEL));
  return eersteDubbel >= 0 ? Math.min(vanaf, eersteDubbel) : vanaf;
}

/**
 * De kwinkslagen: korte zinnen voor de momenten waarop de avond even gek
 * mag doen.
 *
 * Alles wordt gekozen op basis van een sleutel (meestal de vraag), niet op
 * toeval. Zo zeggen de televisie en alle telefoons hetzelfde, en verandert
 * de zin niet bij elke binnenkomende momentopname.
 */

/** Een kleine, stabiele hash: dezelfde tekst geeft altijd hetzelfde getal. */
export function hash(tekst: string): number {
  let h = 2166136261;
  for (let i = 0; i < tekst.length; i++) {
    h ^= tekst.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function kies<T>(lijst: readonly T[], sleutel: string): T {
  return lijst[hash(sleutel) % lijst.length];
}

/** Een kaart die op tafel wordt gelegd ligt nooit precies recht. */
export function kanteling(sleutel: string, maxGraden = 0.9): number {
  const n = (hash(sleutel) % 1000) / 1000; // 0..1
  return Math.round((n * 2 - 1) * maxGraden * 100) / 100;
}

export const BEGROETINGEN = [
  'Daar is {naam}. Het feest kan beginnen.',
  '{naam} heeft de wifi gevonden.',
  '{naam} is binnen. Telefoon op stil, graag.',
  'Kijk, {naam}. Wat een verrassing.',
  '{naam} meldt zich. Beter laat dan nooit.',
  '{naam} zit erbij. Nu nog opletten.',
] as const;

export const WACHTZINNEN = [
  'De quizmaster zoekt zijn bril…',
  'Er wordt nog een stoel gehaald.',
  'Telefoons opladen mag nu nog.',
  'Wie het laatst binnenkomt, schenkt in.',
  'Geen gegoogel. We zien het.',
  'De kaarten zijn geschud. Denkbeeldig.',
  'Even de spelregels: de quizmaster heeft gelijk.',
] as const;

export const RONDEZINNEN = [
  'Telefoons op tafel, ogen op het scherm.',
  'Gokken mag. Gokken loont zelfs.',
  'Denk eraan: de quizmaster heeft altijd gelijk.',
  'Overleggen is toegestaan, fluisteren aanbevolen.',
  'Bij twijfel: kies B.',
  'Dit is de ronde waar het om gaat. Zeggen we elke ronde.',
] as const;

export const NIEMAND = [
  'Niemand? Echt niemand?',
  'Het bleef stil. Heel stil.',
  'De telefoons deden het toch?',
] as const;

export const IEDEREEN_FOUT = [
  'Iedereen fout. Prachtig.',
  'Een collectieve prestatie.',
  'Dit gaan we nooit meer over hebben.',
  'Goed nieuws: niemand loopt uit.',
] as const;

export const IEDEREEN_GOED = [
  'Allemaal goed. Te makkelijk dus.',
  'Verdacht. Heel verdacht.',
  'De volgende wordt moeilijker. Beloofd.',
] as const;

export const JUICH = [
  'Boem!',
  'Kijk jou eens.',
  'Goed gegokt? Telt ook.',
  'Zo hoort het.',
  'Onhoudbaar vanavond.',
  'De rest zag het ook.',
] as const;

export const TROOST = [
  'Dichtbij. Nou ja, niet echt.',
  'Volgende keer beter. Of niet.',
  'Een prima antwoord op een andere vraag.',
  'Niemand hoeft dit te weten. Behalve iedereen hier.',
  'Ach.',
  'Het was de moeite van het proberen waard. Toch?',
] as const;

export const NIETS_INGELEVERD = [
  'Niets ingeleverd. Bewuste keuze?',
  'Je telefoon lag vast op tafel.',
  'Onthouding. Ook een antwoord.',
] as const;

export const VER_ERNAAST = ['Ver ernaast', 'Andere planeet', 'Bijna. Niet.', 'Ruim mis'] as const;

export const LANTAARN = [
  'Er is nog hoop. Een beetje.',
  'Van hieruit kan het alleen maar beter.',
  'De rode lantaarn staat je goed.',
] as const;

export const POEDEL = [
  'voor de morele overwinning',
  'voor de moed',
  'voor het meedoen, dat telt ook',
  'hier is over nagedacht',
  'volgend jaar gaat het anders',
] as const;

/** Vult {naam} in. */
export function metNaam(zin: string, naam: string): string {
  return zin.replaceAll('{naam}', naam);
}

/** De emoji's die vanaf een telefoon naar de televisie mogen. */
export const REACTIES = ['🤣', '😱', '🔥', '💩', '👏', '😴'] as const;
export type Reactie = (typeof REACTIES)[number];

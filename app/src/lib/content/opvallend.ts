/**
 * Wat Cas met de hand bijdraagt aan de dia "Opvallend" na de sportcijfers.
 *
 * De app rekent de weetjes zelf na op de laatste cijfers
 * (`server/recap/opvallend.ts`). Klopt iets hieronder niet meer, dan valt
 * het weetje vanzelf weg; je hoeft hier niets voor op te ruimen.
 */

/**
 * De verklaring bij een weetje, als losse regel eronder. De sleutel is de
 * kop, een dubbele punt en de volledige namen op alfabet, met ' + '
 * ertussen.
 */
export const VERKLARING: Record<string, string> = {
  'Nooit op zaterdag: Bastiaan + Liz': 'Op zaterdag klussen ze.',
};

/**
 * Dagen waarvan het opvalt als niemand, of maar één van ons, sportte.
 * Sportten er twee of meer, dan zegt de dag niets en valt hij weg.
 */
export const BIJZONDERE_DAGEN: { datum: string; naam: string; emoji: string }[] = [
  { datum: '2026-02-14', naam: 'Valentijnsdag', emoji: '💘' },
  { datum: '2026-04-27', naam: 'Koningsdag', emoji: '👑' },
  { datum: '2026-07-19', naam: 'de dag van de WK-finale', emoji: '⚽' },
];

/**
 * Een sport die iemand maar één keer deed, en waarvan dat opvalt. Gaat
 * diegene er nog een keer op uit, dan valt het weetje weg.
 */
export const EEN_KEER: { wie: string; sport: string; kop: string }[] = [
  { wie: 'Cas', sport: 'cycling', kop: 'Eén keer gefietst' },
];

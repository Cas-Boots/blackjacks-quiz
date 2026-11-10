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
  'Nooit op zaterdag: Bastiaan + Liz': 'Dan klussen ze.',
};

/**
 * Een sport die iemand maar één keer deed, en waarvan dat opvalt. Gaat
 * diegene er nog een keer op uit, dan valt het weetje weg.
 */
export const EEN_KEER: { wie: string; sport: string; kop: string }[] = [
  // Cas en fietsen stond hier; Cas koos liever "helemaal alleen".
];

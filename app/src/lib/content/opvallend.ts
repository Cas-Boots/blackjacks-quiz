/**
 * De verklaring bij een opvallend weetje uit de sportcijfers.
 *
 * De app vindt de weetjes zelf (`server/recap/opvallend.ts`); wat erachter
 * zit, weet alleen Cas. Een verklaring komt als losse regel onder het
 * weetje. De sleutel is de kop, een dubbele punt en de volledige namen op
 * alfabet, met ' + ' ertussen. Verdwijnt het weetje, dan blijft de
 * verklaring gewoon ongebruikt liggen.
 */
export const VERKLARING: Record<string, string> = {
  'Nooit op zaterdag: Bastiaan + Liz': 'Op zaterdag klussen ze.',
};

/**
 * Wat de omgeving moet meebrengen voordat dit ergens anders draait dan op de
 * keukentafel.
 *
 * Bewust niet gecontroleerd bij het laden van deze module: die code draait ook
 * tijdens `vite build`, waar HOST_PIN er niet is en ook niet hoeft te zijn. Een
 * controle dáár zou het bouwen van de container breken in plaats van een fout
 * te vinden. De controle hoort bij het bedienen van verzoeken, en `/api/health`
 * rapporteert hem — zo weigert de container gezond te worden en ziet Dokploy
 * meteen dat er iets ontbreekt.
 */

/** Een code die in de repository te lezen staat is geen code. */
export const VOORBEELD_PIN = '2627';

/** Draait dit als echte uitrol, of op een laptop? */
export function inProductie(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Wat er mis is en niet mag doorgaan.
 *
 * Alleen de pincode staat hier: zonder eigen code staat het hostscherm open
 * voor iedereen die het adres kent, en dan kan een vreemde de avond bedienen.
 */
export function omgevingsFouten(): string[] {
  if (!inProductie()) return [];
  const fouten: string[] = [];
  const pin = process.env.HOST_PIN ?? '';
  if (!pin) {
    fouten.push('HOST_PIN is niet gezet.');
  } else if (pin === VOORBEELD_PIN) {
    fouten.push('HOST_PIN staat nog op de voorbeeldcode uit .env.example.');
  }
  return fouten;
}

/**
 * Wat beter kan, maar de avond niet tegenhoudt.
 *
 * Zonder ORIGIN weet de app achter een omgekeerde proxy zijn eigen adres niet:
 * hij ziet het adres van de proxy en niet dat van de browser. De quiz werkt
 * dan gewoon — de televisie stuurt zijn eigen adres mee voor de QR-code — maar
 * koekjes krijgen niet de markering `Secure`.
 */
export function omgevingsWaarschuwingen(): string[] {
  if (!inProductie()) return [];
  const waarschuwingen: string[] = [];
  if (!process.env.ORIGIN) {
    waarschuwingen.push('ORIGIN is niet gezet; zet hem op het adres waarop de quiz te bereiken is.');
  }
  return waarschuwingen;
}

/**
 * De pincode van de quizmaster.
 *
 * Op een laptop mag hij ontbreken — dan is het de voorbeeldcode, zodat
 * `npm run dev` en de nepspelers meteen werken. In productie wordt hij
 * afgedwongen door `omgevingsFouten`.
 */
export function hostPin(): string {
  return process.env.HOST_PIN ?? VOORBEELD_PIN;
}

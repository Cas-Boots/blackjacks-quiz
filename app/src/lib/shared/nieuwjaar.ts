/**
 * Middernacht op oudejaarsavond, Nederlandse tijd.
 *
 * De quiz loopt op oudejaarsavond, en om twaalf uur gaat alles even stil:
 * aftellen, proosten, vuurwerk kijken. Het hostscherm waarschuwt op tijd, de
 * televisie telt af als de quizmaster daarvoor pauzeert, en daarna gaat de
 * quiz gewoon verder waar hij was.
 *
 * Op 1 januari geldt in Nederland altijd wintertijd (CET, UTC+1). Er is dus
 * geen tijdzonedatabase nodig: middernacht in Amsterdam is 23:00 UTC op
 * 31 december.
 */

const UUR_MS = 3_600_000;
const MINUUT_MS = 60_000;

/** Hoe lang na middernacht het nog "net nieuwjaar" is: zo lang blijft die middernacht de relevante. */
export const NA_MIDDERNACHT_MS = 2 * UUR_MS;

/** Vanaf hier waarschuwt het hostscherm. */
export const WAARSCHUW_VANAF_MS = 30 * MINUUT_MS;
/** Vanaf hier wordt de waarschuwing dringend, en ziet ook de televisie het. */
export const DRINGEND_VANAF_MS = 10 * MINUUT_MS;

export interface Nieuwjaar {
  /** Unix-ms van middernacht, Nederlandse tijd. */
  op: number;
  /** Het jaar dat om middernacht begint. */
  jaar: number;
}

/** Middernacht aan het begin van `jaar`, Nederlandse tijd. */
export function middernachtVan(jaar: number): number {
  return Date.UTC(jaar, 0, 1) - UUR_MS;
}

/**
 * De middernacht waar het vanavond om draait: de eerstvolgende, of de vorige
 * zolang die minder dan twee uur geleden is — dan valt er nog na te proosten.
 */
export function nieuwjaarRond(nu: number): Nieuwjaar {
  // Het jaar zoals het in Nederland is: de UTC-tijd plus een uur (1 januari is altijd wintertijd).
  const jaarNu = new Date(nu + UUR_MS).getUTCFullYear();
  const vorige = middernachtVan(jaarNu);
  if (nu >= vorige && nu - vorige < NA_MIDDERNACHT_MS) return { op: vorige, jaar: jaarNu };
  return { op: middernachtVan(jaarNu + 1), jaar: jaarNu + 1 };
}

/**
 * Een verzonnen middernacht voor een generale repetitie, uit NIEUWJAAR_OP.
 *
 * Twee vormen: een tijdstip dat Date kan lezen (`2026-12-28T21:00:00+01:00`),
 * of `+10` voor tien minuten na het starten van de server. Onleesbaar of leeg
 * geeft null, en dan geldt de echte middernacht.
 */
export function leesNieuwjaarOp(waarde: string | undefined, nu: number): number | null {
  const tekst = (waarde ?? '').trim();
  if (!tekst) return null;
  const minuten = /^\+(\d+(?:\.\d+)?)$/.exec(tekst);
  if (minuten) return nu + Number(minuten[1]) * MINUUT_MS;
  const op = Date.parse(tekst);
  return Number.isFinite(op) ? op : null;
}

/** "4:07" of "1:02:09": wat er nog op de aftelklok staat. */
export function aftelTekst(ms: number): string {
  const totaal = Math.max(0, Math.ceil(ms / 1000));
  const uren = Math.floor(totaal / 3600);
  const minuten = Math.floor((totaal % 3600) / 60);
  const seconden = totaal % 60;
  const ss = String(seconden).padStart(2, '0');
  return uren > 0 ? `${uren}:${String(minuten).padStart(2, '0')}:${ss}` : `${minuten}:${ss}`;
}

/** "nog 12 minuten", "nog 1 minuut", "nog 40 seconden". */
export function nogTekst(ms: number): string {
  if (ms >= MINUUT_MS) {
    const minuten = Math.ceil(ms / MINUUT_MS);
    return `nog ${minuten} ${minuten === 1 ? 'minuut' : 'minuten'}`;
  }
  const seconden = Math.max(0, Math.ceil(ms / 1000));
  return `nog ${seconden} ${seconden === 1 ? 'seconde' : 'seconden'}`;
}

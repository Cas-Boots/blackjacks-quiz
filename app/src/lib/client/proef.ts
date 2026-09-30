/**
 * Een scherm van een proefrit.
 *
 * Staat er `?proef=<id>` in de adresregel, dan hoort dit scherm bij een
 * proefrit (zie src/lib/server/proef.ts) en gaat elk verzoek naar de server
 * met dat id erbij. `apparaat=telefoon-2` maakt van een kader op de
 * proefpagina een eigen telefoon; zonder apparaat is het deze browser zelf,
 * zoals een echte telefoon die de QR-code van de proefrit scant.
 */
function lees(): { id: string; apparaat: string | null } | null {
  if (typeof location === 'undefined') return null;
  const p = new URLSearchParams(location.search);
  const id = p.get('proef');
  return id ? { id, apparaat: p.get('apparaat') } : null;
}

export const proef = lees();

/** Het adres voor de server, met de proefrit erbij als dit scherm daarbij hoort. */
export function api(pad: string): string {
  if (!proef) return pad;
  const u = new URL(pad, location.origin);
  u.searchParams.set('proef', proef.id);
  if (proef.apparaat) u.searchParams.set('apparaat', proef.apparaat);
  return u.pathname + u.search;
}

/** Waar een telefoon van deze proefrit binnenkomt (het kiezen van een naam); een echte telefoon krijgt geen apparaatnaam. */
export function proefSpeelAdres(basis: string): string {
  if (!proef) return basis;
  const u = new URL('/', basis);
  u.searchParams.set('proef', proef.id);
  return u.href;
}

/** Een link naar een ander scherm van dezelfde proefrit, zonder apparaatnaam. */
export function metProef(href: string): string {
  if (!proef) return href;
  const u = new URL(href, location.origin);
  u.searchParams.set('proef', proef.id);
  return u.pathname + u.search;
}

/** Naar een ander scherm als hetzelfde apparaat: de telefoon na het kiezen van een naam. */
export function zelfde(href: string): string {
  return api(href);
}

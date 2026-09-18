import type { Handle } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { zorgVoorMigraties } from '$lib/server/db/migrate';
import { zorgVoorBasis } from '$lib/server/seed';
import { db } from '$lib/server/db/index';
import { apparaten } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

// Schema is kritiek: als dit faalt, moet het opstarten falen.
zorgVoorMigraties();

// De spelers en een leeg spel klaarzetten is onderhoud, en mag de site nooit
// platleggen als het misgaat.
try {
  zorgVoorBasis();
} catch (err) {
  console.error('[seed] basis klaarzetten mislukt — verder met wat er staat:', err);
}

export const TOKEN_COOKIE = 'bjq_token';

/** Methoden die iets veranderen; alleen die krijgen de herkomstcontrole. */
const SCHRIJFMETHODEN = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Of de verbinding echt over https loopt.
 *
 * adapter-node gokt 'https' zodra ORIGIN en PROTOCOL_HEADER allebei
 * ontbreken, en op de avond zelf (gewoon http op het thuisnetwerk) is die gok
 * fout. Alleen als de omgeving het protocol echt kent, geloven we het.
 */
function echtHttps(url: URL): boolean {
  if (url.protocol !== 'https:') return false;
  return !!process.env.ORIGIN || !!process.env.PROTOCOL_HEADER || process.env.NODE_ENV !== 'production';
}

export const handle: Handle = async ({ event, resolve }) => {
  const { url, request } = event;
  const isApi = url.pathname.startsWith('/api/');
  const https = echtHttps(url);

  // Opdrachten van een andere site worden geweigerd, ook als de browser het
  // cookie zou meesturen. De browser zet deze kop zelf; scripts en de
  // simulatie zonder de kop gaan gewoon door.
  if (isApi && SCHRIJFMETHODEN.has(request.method)) {
    if (request.headers.get('sec-fetch-site') === 'cross-site') {
      return json({ fout: 'verzoek van een andere site' }, { status: 403 });
    }
    const type = request.headers.get('content-type') ?? '';
    if (!type.toLowerCase().startsWith('application/json')) {
      return json({ fout: 'verwacht application/json' }, { status: 415 });
    }
  }

  let token = event.cookies.get(TOKEN_COOKIE);
  if (!token) {
    token = randomUUID();
    event.cookies.set(TOKEN_COOKIE, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      // Alleen 'secure' als de verbinding het ook is: op de avond zelf draait
      // dit over gewoon http op het thuisnetwerk, en een browser weigert een
      // secure-cookie over http (behalve op localhost). Dan zou geen enkele
      // telefoon zijn naam kunnen vasthouden.
      secure: https,
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  const rij = db.select().from(apparaten).where(eq(apparaten.token, token)).get();
  event.locals.rol = (rij?.rol as App.Locals['rol']) ?? 'gast';
  event.locals.spelerId = rij?.spelerId ?? null;

  const antwoord = await resolve(event);

  // Veiligheidskoppen op alles. De Content-Security-Policy voor de pagina's
  // komt uit svelte.config.js (met nonces); dit is de rest.
  antwoord.headers.set('x-content-type-options', 'nosniff');
  antwoord.headers.set('referrer-policy', 'same-origin');
  antwoord.headers.set('x-frame-options', 'DENY');
  antwoord.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  antwoord.headers.set('cross-origin-opener-policy', 'same-origin');
  antwoord.headers.set('cross-origin-resource-policy', 'same-origin');
  if (https) {
    antwoord.headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains');
  }
  // De stand mag nergens onderweg blijven hangen; de QR-code en de stroom
  // zetten hun eigen cache-kop.
  if (isApi && !antwoord.headers.has('cache-control')) {
    antwoord.headers.set('cache-control', 'no-store');
  }
  return antwoord;
};

import type { Handle } from '@sveltejs/kit';
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

export const handle: Handle = async ({ event, resolve }) => {
  let token = event.cookies.get(TOKEN_COOKIE);
  if (!token) {
    token = randomUUID();
    event.cookies.set(TOKEN_COOKIE, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  const rij = db.select().from(apparaten).where(eq(apparaten.token, token)).get();
  event.locals.rol = (rij?.rol as App.Locals['rol']) ?? 'gast';
  event.locals.spelerId = rij?.spelerId ?? null;

  return resolve(event);
};

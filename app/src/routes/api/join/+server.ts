import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { spelers } from '$lib/server/db/schema';
import { raakApparaatAan, bumpVersie, actiefSpel } from '$lib/server/spel';
import { TOKEN_COOKIE } from '../../../hooks.server';

/**
 * Een telefoon koppelt zich aan een naam, of het hostscherm meldt zich met de
 * pincode.
 *
 * Spelers hebben bewust geen pincode. Op de avond zelf is een vergeten code
 * een echt risico en de inzet is een quiz onder vrienden — de quizmaster ziet
 * bovendien in het hostscherm wie er op welke naam zit.
 */
export const POST: RequestHandler = async ({ request, cookies, locals }) => {
  const token = cookies.get(TOKEN_COOKIE);
  if (!token) error(400, 'geen apparaat-token');

  const body = await request.json().catch(() => ({}));
  const rol = String(body.rol ?? '');

  if (rol === 'quizmaster') {
    const pin = String(body.pin ?? '');
    const verwacht = process.env.HOST_PIN ?? '2627';
    if (pin !== verwacht) error(403, 'onjuiste pincode');
    raakApparaatAan(token, 'quizmaster', null, 'Quizmaster');
    const spel = actiefSpel();
    if (spel) bumpVersie(spel.id);
    return json({ rol: 'quizmaster' });
  }

  if (rol === 'speler') {
    const spelerId = Number(body.spelerId);
    const speler = db.select().from(spelers).where(eq(spelers.id, spelerId)).get();
    if (!speler) error(404, 'onbekende speler');
    raakApparaatAan(token, 'speler', speler.id, speler.naam);
    const spel = actiefSpel();
    if (spel) bumpVersie(spel.id);
    return json({ rol: 'speler', spelerId: speler.id, naam: speler.naam });
  }

  if (rol === 'tv') {
    raakApparaatAan(token, 'gast', null, 'Televisie');
    return json({ rol: 'gast' });
  }

  error(400, 'onbekende rol');
};

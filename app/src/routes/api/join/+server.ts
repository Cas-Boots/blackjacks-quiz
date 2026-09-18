import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { spelers } from '$lib/server/db/schema';
import { raakApparaatAan, bumpVersie, actiefSpel, voegDeelnemerToe, MAX_NAAM_TEKENS } from '$lib/server/spel';
import { schrijfLog } from '$lib/server/logboek';
import { TOKEN_COOKIE } from '../../../hooks.server';

/**
 * Een telefoon koppelt zich aan een naam, of het hostscherm meldt zich met de
 * pincode.
 *
 * Spelers hebben bewust geen pincode. Op de avond zelf is een vergeten code
 * een echt risico en de inzet is een quiz onder vrienden — de quizmaster ziet
 * bovendien in het hostscherm wie er op welke naam zit.
 *
 * Een gast die niet in de lijst staat tikt zijn naam in en schuift aan; ook
 * midden in een ronde.
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
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
    const spel = actiefSpel();
    let speler: { id: number; naam: string } | undefined;

    if (body.naam !== undefined) {
      if (!spel) error(409, 'geen actief spel');
      const naam = String(body.naam ?? '').trim();
      if (!naam) error(400, 'vul een naam in');
      if (naam.length > MAX_NAAM_TEKENS) error(400, `een naam is hooguit ${MAX_NAAM_TEKENS} tekens`);
      let nieuw = false;
      try {
        ({ speler, nieuw } = voegDeelnemerToe(spel, naam));
      } catch (e) {
        error(400, (e as Error).message);
      }
      if (nieuw) schrijfLog(spel.id, 'gast', `${speler.naam} schuift aan`, null);
    } else {
      const spelerId = Number(body.spelerId);
      speler = db.select().from(spelers).where(eq(spelers.id, spelerId)).get();
      if (!speler) error(404, 'onbekende speler');
    }

    raakApparaatAan(token, 'speler', speler.id, speler.naam);
    if (spel) bumpVersie(spel.id);
    return json({ rol: 'speler', spelerId: speler.id, naam: speler.naam });
  }

  if (rol === 'tv') {
    raakApparaatAan(token, 'gast', null, 'Televisie');
    return json({ rol: 'gast' });
  }

  error(400, 'onbekende rol');
};

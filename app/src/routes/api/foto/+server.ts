import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { spelers } from '$lib/server/db/schema';
import { actiefSpel, bumpVersie } from '$lib/server/spel';

/** Een portret mag nooit groter zijn dan dit: de telefoon verkleint het al tot 256 bij 256. */
const MAX_TEKENS = 200_000;

/**
 * Een speler zet zijn eigen portret, vanaf zijn eigen telefoon.
 *
 * Alleen je eigen foto: de speler-id komt uit het sessiecookie, niet uit het
 * verzoek. Een lege foto haalt het portret weer weg.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  if (locals.rol !== 'speler' || !locals.spelerId) error(403, 'niet als speler aangemeld');

  const body = await request.json().catch(() => ({}));
  const foto = body.foto == null ? null : String(body.foto);
  if (foto !== null) {
    if (foto.length > MAX_TEKENS) error(413, 'foto te groot');
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(foto)) error(400, 'geen geldige afbeelding');
  }

  db.update(spelers).set({ foto }).where(eq(spelers.id, locals.spelerId)).run();
  const spel = actiefSpel();
  if (spel) bumpVersie(spel.id);
  return json({ ok: true });
};

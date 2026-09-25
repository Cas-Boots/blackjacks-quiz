import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { actiefSpel, bumpVersie, raakApparaatAan, leverIn } from '$lib/server/spel';

/**
 * Een telefoon levert een antwoord in.
 *
 * Inleveren mag zolang de quizmaster het antwoord nog niet heeft onthuld, ook
 * als de klok al op nul staat. De servertijd wordt vastgelegd, zodat te laat
 * ingeleverde antwoorden zichtbaar zijn op het hostscherm in plaats van
 * geruisloos te verdwijnen — dat scheelt discussie aan tafel.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  if (locals.rol !== 'speler' || !locals.spelerId) error(403, 'niet als speler aangemeld');

  const spel = actiefSpel();
  if (!spel) error(409, 'geen actief spel');

  const body = await request.json().catch(() => ({}));
  const uitkomst = leverIn(spel, locals.spelerId, String(body.tekst ?? ''));
  if ('fout' in uitkomst) error(409, uitkomst.fout);

  raakApparaatAan(locals.token, 'speler', locals.spelerId, null);
  bumpVersie(spel.id);
  return json({ ok: true, ...uitkomst });
};

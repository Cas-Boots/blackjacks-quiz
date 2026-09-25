import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { actiefSpel, bumpVersie } from '$lib/server/spel';
import { dobbelDier } from '$lib/server/dieren';

/**
 * Een speler dobbelt een ander geestdier, vanaf zijn eigen telefoon.
 *
 * Net als bij de foto komt de speler-id uit het sessiecookie: je kunt alleen
 * je eigen dier wisselen, niet dat van de buurman.
 */
export const POST: RequestHandler = async ({ locals }) => {
  if (locals.rol !== 'speler' || !locals.spelerId) error(403, 'niet als speler aangemeld');
  const dier = dobbelDier(locals.spelerId);
  if (!dier) error(404, 'onbekende speler');
  const spel = actiefSpel();
  if (spel) bumpVersie(spel.id);
  return json({ ok: true, dier });
};

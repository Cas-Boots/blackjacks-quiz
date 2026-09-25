import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { actiefSpel, bumpVersie } from '$lib/server/spel';
import { kiesDier } from '$lib/server/dieren';

/**
 * Een speler kiest zijn maatje, vanaf zijn eigen telefoon.
 *
 * Net als bij de foto komt de speler-id uit het sessiecookie: je kiest
 * alleen je eigen dier, niet dat van de buurman. Een dier dat een ander aan
 * tafel al heeft, is bezet.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  if (locals.rol !== 'speler' || !locals.spelerId) error(403, 'niet als speler aangemeld');
  const body = await request.json().catch(() => ({}));
  const spel = actiefSpel();
  const uit = kiesDier(locals.spelerId, body.dier, spel?.id ?? null);
  if (!uit.ok) error(uit.reden === 'onbekend dier' ? 400 : 409, uit.reden);
  if (spel) bumpVersie(spel.id);
  return json({ ok: true, dier: body.dier });
};

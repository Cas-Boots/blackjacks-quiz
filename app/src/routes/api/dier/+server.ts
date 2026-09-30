import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { actiefSpel, bumpVersie } from '$lib/server/spel';
import { kiesDier, noemDier } from '$lib/server/dieren';

/**
 * Een speler kiest zijn maatje, of geeft het een naam, vanaf zijn eigen
 * telefoon. Met `dier` kies je een ander dier, met `naam` noem je het; allebei
 * mag ook.
 *
 * Net als bij de foto komt de speler-id uit het sessiecookie: je kiest
 * alleen je eigen dier, niet dat van de buurman. Een dier dat een ander aan
 * tafel al heeft, is bezet.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  if (locals.rol !== 'speler' || !locals.spelerId) error(403, 'niet als speler aangemeld');
  const body = await request.json().catch(() => ({}));
  const spel = actiefSpel();
  const metDier = 'dier' in body;
  const metNaam = 'naam' in body;
  if (!metDier && !metNaam) error(400, 'geen dier en geen naam');
  if (metDier) {
    const uit = kiesDier(locals.spelerId, body.dier, spel?.id ?? null);
    if (!uit.ok) error(uit.reden === 'onbekend dier' ? 400 : 409, uit.reden);
  }
  const naam = metNaam ? noemDier(locals.spelerId, body.naam) : undefined;
  if (spel) bumpVersie(spel.id);
  return json({ ok: true, ...(metDier ? { dier: body.dier } : {}), ...(metNaam ? { naam } : {}) });
};

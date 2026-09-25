import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { spelers } from '$lib/server/db/schema';
import { meldReactie } from '$lib/server/bus';
import { REACTIES } from '$lib/shared/kwinkslagen';

/** Niet vaker dan dit per telefoon, anders wordt het een emoji-regen. */
const MINSTE_TUSSENTIJD_MS = 400;
const laatsteVan = new Map<string, number>();
let teller = 0;

/**
 * Een telefoon stuurt een emoji naar de televisie.
 *
 * Vluchtig: niets hiervan komt in de database. Het gaat via de bus naar
 * iedereen die op dat moment naar de stroom kijkt en is daarna weg.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  if (locals.rol !== 'speler' || !locals.spelerId) error(403, 'niet als speler aangemeld');
  const token = locals.token ?? String(locals.spelerId);

  const nu = Date.now();
  if (nu - (laatsteVan.get(token) ?? 0) < MINSTE_TUSSENTIJD_MS) return json({ ok: true, genegeerd: true });
  laatsteVan.set(token, nu);

  const body = await request.json().catch(() => ({}));
  const emoji = String(body.emoji ?? '');
  if (!(REACTIES as readonly string[]).includes(emoji)) error(400, 'die emoji doet niet mee');

  const speler = db.select({ naam: spelers.naam }).from(spelers).where(eq(spelers.id, locals.spelerId)).get();
  meldReactie({ id: ++teller, emoji, naam: speler?.naam ?? '?', x: 8 + Math.round(Math.random() * 84) });
  return json({ ok: true });
};

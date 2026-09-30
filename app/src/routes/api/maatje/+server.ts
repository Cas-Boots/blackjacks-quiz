import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { spelers } from '$lib/server/db/schema';
import { meldMaatje } from '$lib/server/bus';
import { isOpdracht } from '$lib/shared/dieren';

/** Een kunstje duurt anderhalve seconde; sneller achter elkaar ziet niemand het nog. */
const MINSTE_TUSSENTIJD_MS = 1200;
const laatsteVan = new Map<string, number>();
let teller = 0;

/**
 * Een speler laat zijn maatje iets doen op de televisie: zwaaien, dansen,
 * een kunstje, eten of feestvieren.
 *
 * Vluchtig, net als een reactie: niets komt in de database. Het gaat via de
 * bus naar wie op dat moment kijkt. Je stuurt alleen je eigen maatje aan:
 * de speler komt uit het sessiecookie, niet uit het verzoek.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  if (locals.rol !== 'speler' || !locals.spelerId) error(403, 'niet als speler aangemeld');
  const token = locals.token ?? String(locals.spelerId);

  const body = await request.json().catch(() => ({}));
  const opdracht = body.opdracht;
  if (!isOpdracht(opdracht)) error(400, 'dat kan je maatje niet');

  const nu = Date.now();
  if (nu - (laatsteVan.get(token) ?? 0) < MINSTE_TUSSENTIJD_MS) return json({ ok: true, genegeerd: true });
  laatsteVan.set(token, nu);

  const speler = db
    .select({ naam: spelers.naam, dier: spelers.dier, dierNaam: spelers.dierNaam })
    .from(spelers)
    .where(eq(spelers.id, locals.spelerId))
    .get();
  if (!speler) error(404, 'speler niet gevonden');
  if (!speler.dier) error(409, 'kies eerst een maatje');

  meldMaatje({
    id: ++teller,
    spelerId: locals.spelerId,
    naam: speler.naam,
    dier: speler.dier,
    dierNaam: speler.dierNaam,
    opdracht,
    x: 8 + Math.round(Math.random() * 84),
  });
  return json({ ok: true });
};

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { antwoorden } from '$lib/server/db/schema';
import { actiefSpel, huidige, deelnemersVan, teamsVoorRonde, sleutelVan, bumpVersie, raakApparaatAan } from '$lib/server/spel';
import { TOKEN_COOKIE } from '../../../hooks.server';

/**
 * Een telefoon levert een antwoord in.
 *
 * Inleveren mag zolang de quizmaster het antwoord nog niet heeft onthuld, ook
 * als de klok al op nul staat. De servertijd wordt vastgelegd, zodat te laat
 * ingeleverde antwoorden zichtbaar zijn op het hostscherm in plaats van
 * geruisloos te verdwijnen — dat scheelt discussie aan tafel.
 */
export const POST: RequestHandler = async ({ request, locals, cookies }) => {
  if (locals.rol !== 'speler' || !locals.spelerId) error(403, 'niet als speler aangemeld');

  const spel = actiefSpel();
  if (!spel) error(409, 'geen actief spel');
  if (spel.fase !== 'vraag') error(409, 'er staat nu geen vraag open');

  const { ronde } = huidige(spel);
  if (!ronde) error(409, 'geen ronde');

  const body = await request.json().catch(() => ({}));
  const tekst = String(body.tekst ?? '').slice(0, 300);

  const lijst = deelnemersVan(spel.id);
  const teamLijst = teamsVoorRonde(spel.id, spel.rondeIndex, ronde, lijst);
  const mijnTeam = teamLijst.find((t) => t.leden.includes(locals.spelerId!));
  if (!mijnTeam) error(409, 'je zit niet in een team voor deze ronde');

  const sleutel = sleutelVan(spel.rondeIndex, spel.vraagIndex);
  const nu = Date.now();

  const bestaand = db
    .select()
    .from(antwoorden)
    .where(and(eq(antwoorden.spelId, spel.id), eq(antwoorden.vraagSleutel, sleutel), eq(antwoorden.inzender, mijnTeam.id)))
    .get();

  if (bestaand) {
    db.update(antwoorden)
      .set({ tekst, ingediendOp: nu, spelerId: locals.spelerId, isGoed: null })
      .where(eq(antwoorden.id, bestaand.id))
      .run();
  } else {
    db.insert(antwoorden)
      .values({ spelId: spel.id, vraagSleutel: sleutel, inzender: mijnTeam.id, spelerId: locals.spelerId, tekst, ingediendOp: nu })
      .run();
  }

  const token = cookies.get(TOKEN_COOKIE);
  if (token) raakApparaatAan(token, 'speler', locals.spelerId, null);
  bumpVersie(spel.id);

  const teLaat = spel.klokEindigtOp != null && nu > spel.klokEindigtOp;
  return json({ ok: true, inzender: mijnTeam.id, teLaat });
};

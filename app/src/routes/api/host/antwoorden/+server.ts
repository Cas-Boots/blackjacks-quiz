import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { antwoorden } from '$lib/server/db/schema';
import { actiefSpel, huidige, sleutelVan, beoordeel } from '$lib/server/spel';

/**
 * De ingeleverde antwoorden, met per antwoord een voorstel.
 *
 * Alleen voor het hostscherm: in de fase 'vraag' mag niemand anders zien wat
 * er al binnen is.
 */
export const GET: RequestHandler = ({ locals }) => {
  if (locals.rol !== 'quizmaster') error(403, 'alleen de quizmaster');
  const spel = actiefSpel();
  if (!spel) return json({ inzendingen: [] });

  const { ronde, vraag } = huidige(spel);
  const sleutel = sleutelVan(spel.rondeIndex, spel.vraagIndex);
  const rijen = db
    .select()
    .from(antwoorden)
    .where(and(eq(antwoorden.spelId, spel.id), eq(antwoorden.vraagSleutel, sleutel)))
    .all();

  return json({
    inzendingen: rijen
      .sort((a, b) => a.ingediendOp - b.ingediendOp)
      .map((r) => ({
        inzender: r.inzender,
        tekst: r.tekst,
        ingediendOp: r.ingediendOp,
        isGoed: r.isGoed,
        voorstel: ronde && vraag ? beoordeel(ronde, vraag, r.tekst) : null,
      })),
  });
};

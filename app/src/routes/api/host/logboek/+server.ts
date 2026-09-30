import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { actiefSpel } from '$lib/server/spel';
import { logboekVan } from '$lib/server/logboek';

/** De laatste handelingen van de quizmaster, nieuwste eerst. */
export const GET: RequestHandler = ({ locals }) => {
  if (locals.rol !== 'quizmaster') error(403, 'alleen de quizmaster');
  const spel = actiefSpel();
  return json({ regels: spel ? logboekVan(spel.id) : [] });
};

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exportVanAlles } from '$lib/server/beheer';

/**
 * Een back-up van de hele database als JSON, om mee te nemen op een usb-stick
 * vóór de avond. Alleen voor de quizmaster: er staan antwoorden en portretten in.
 */
export const GET: RequestHandler = ({ locals }) => {
  if (locals.rol !== 'quizmaster') error(403, 'alleen de quizmaster');
  const datum = new Date().toISOString().slice(0, 10);
  return json(exportVanAlles(), {
    headers: { 'content-disposition': `attachment; filename="blackjack-quiz-backup-${datum}.json"` },
  });
};

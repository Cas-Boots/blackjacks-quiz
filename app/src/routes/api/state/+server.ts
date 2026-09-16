import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bouwStaat, raakApparaatAan } from '$lib/server/spel';
import { TOKEN_COOKIE } from '../../../hooks.server';

/** Momentopname van de stand. Ook de terugvaloptie als de SSE-stroom wegvalt. */
export const GET: RequestHandler = ({ locals, cookies }) => {
  const token = cookies.get(TOKEN_COOKIE);
  if (token) raakApparaatAan(token, locals.rol, locals.spelerId, null);
  const staat = bouwStaat(locals.rol);
  return json({ rol: locals.rol, spelerId: locals.spelerId, staat });
};

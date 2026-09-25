import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { maakProef, stopProef, springNaar, zetInstellingen, onderdelen, proefOverzicht } from '$lib/server/proef';

/**
 * De bediening van de proefpagina. Alleen voor wie met de pincode op de
 * echte avond is aangemeld; een proefrit zelf geeft geen toegang tot deze
 * knoppen. Het id staat bewust niet in `proef=`: dit verzoek hoort bij de
 * echte avond, niet bij de proefrit die het bestuurt.
 */
export const GET: RequestHandler = ({ locals, url }) => {
  if (locals.rol !== 'quizmaster' || locals.proef) error(403, 'alleen de quizmaster');
  const id = url.searchParams.get('id') ?? '';
  const overzicht = proefOverzicht(id);
  if (!overzicht) error(410, 'Deze proefrit bestaat niet meer.');
  return json({ ...overzicht, onderdelen: onderdelen(id) });
};

export const POST: RequestHandler = async ({ locals, request }) => {
  if (locals.rol !== 'quizmaster' || locals.proef) error(403, 'alleen de quizmaster');
  const body = await request.json().catch(() => ({}));
  const id = String(body.id ?? '');
  switch (String(body.actie ?? '')) {
    case 'start': {
      const nieuw = maakProef({
        kansGoed: body.kansGoed !== undefined ? Number(body.kansGoed) : undefined,
        bots: body.bots !== undefined ? !!body.bots : undefined,
        gast: body.gast ? String(body.gast) : null,
      });
      return json({ id: nieuw });
    }
    case 'stop':
      stopProef(id);
      return json({ ok: true });
    case 'spring':
      if (!springNaar(id, String(body.onderdeel ?? ''))) error(409, 'Dat onderdeel bestaat niet (meer) in deze proefrit.');
      return json({ ok: true });
    case 'instellingen':
      if (!proefOverzicht(id)) error(410, 'Deze proefrit bestaat niet meer.');
      zetInstellingen(id, {
        kansGoed: body.kansGoed !== undefined ? Number(body.kansGoed) : undefined,
        bots: body.bots !== undefined ? !!body.bots : undefined,
        gast: body.gast ? String(body.gast) : undefined,
      });
      return json({ ok: true });
    default:
      error(400, 'onbekende actie');
  }
};

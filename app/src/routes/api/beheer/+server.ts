import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  beheerOverzicht, voegSpelerToe, hernoemSpeler, zetGast, zetFoto, wisselDier, wisDierNaam, verwijderSpeler,
  activeerSpel, hernoemSpel, verwijderSpel, koppelLos, ruimApparatenOp,
} from '$lib/server/beheer';

/**
 * De opdrachten van het beheerscherm.
 *
 * Dezelfde pincode als het hostscherm: er is één quizmaster en die regelt
 * ook de spelers en de oude spellen. Elke opdracht geeft het verse overzicht
 * terug, zodat het scherm na één rondreis weer klopt.
 */
export const GET: RequestHandler = ({ locals }) => {
  if (locals.rol !== 'quizmaster') error(403, 'alleen de quizmaster');
  return json(beheerOverzicht(locals.token));
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (locals.rol !== 'quizmaster') error(403, 'alleen de quizmaster');
  const eigenToken = locals.token;

  const body = await request.json().catch(() => ({}));
  const opdracht = String(body.opdracht ?? '');
  const id = Number(body.id);
  let melding = '';

  try {
    switch (opdracht) {
      case 'speler-toevoegen': {
        const s = voegSpelerToe(body.naam);
        melding = `${s.naam} staat erbij.`;
        break;
      }
      case 'speler-hernoemen': {
        const s = hernoemSpeler(id, body.naam);
        melding = `Heet nu ${s.naam}.`;
        break;
      }
      case 'speler-gast':
        zetGast(id, !!body.isGast);
        melding = body.isGast ? 'Is nu gast.' : 'Doet weer vanzelf mee.';
        break;
      case 'speler-foto':
        zetFoto(id, body.foto);
        melding = body.foto ? 'Portret gezet.' : 'Portret weggehaald.';
        break;
      case 'speler-dier':
        wisselDier(id);
        melding = 'Ander maatje gedobbeld.';
        break;
      case 'speler-dier-naam':
        wisDierNaam(id);
        melding = 'Naam van het maatje weggehaald.';
        break;
      case 'speler-verwijderen':
        verwijderSpeler(id);
        melding = 'Speler weggehaald.';
        break;
      case 'spel-activeren':
        activeerSpel(id);
        melding = `Spel #${id} is nu actief.`;
        break;
      case 'spel-hernoemen':
        hernoemSpel(id, body.naam);
        melding = 'Spel hernoemd.';
        break;
      case 'spel-verwijderen':
        verwijderSpel(id);
        melding = `Spel #${id} is weg.`;
        break;
      case 'apparaat-loskoppelen':
        koppelLos(String(body.id ?? ''), eigenToken);
        melding = 'Apparaat losgekoppeld; die telefoon kiest opnieuw een naam.';
        break;
      case 'apparaten-opruimen': {
        const n = ruimApparatenOp(eigenToken);
        melding = n ? `${n} ${n === 1 ? 'oud apparaat' : 'oude apparaten'} vergeten.` : 'Er was niets op te ruimen.';
        break;
      }
      default:
        error(400, `onbekende opdracht: ${opdracht}`);
    }
  } catch (e) {
    // Een fout uit beheer.ts is een leesbare reden voor het scherm; een fout
    // van SvelteKit zelf (error(...)) gaat gewoon door.
    if (e && typeof e === 'object' && 'status' in e) throw e;
    error(400, (e as Error).message);
  }

  return json({ ok: true, melding, overzicht: beheerOverzicht(eigenToken) });
};

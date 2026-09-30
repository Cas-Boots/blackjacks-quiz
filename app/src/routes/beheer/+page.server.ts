import type { PageServerLoad } from './$types';
import { beheerOverzicht } from '$lib/server/beheer';

/**
 * Het beheerscherm laadt op de server, zodat het overzicht er in één keer
 * staat. Zonder pincode krijgt de pagina alleen het aanmeldformulier.
 */
export const load: PageServerLoad = ({ locals }) => {
  if (locals.rol !== 'quizmaster') return { aangemeld: false as const, overzicht: null };
  return { aangemeld: true as const, overzicht: beheerOverzicht(locals.token) };
};

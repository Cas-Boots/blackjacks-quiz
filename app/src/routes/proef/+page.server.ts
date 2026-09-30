import type { PageServerLoad } from './$types';

/** De proefpagina is voor de quizmaster: dezelfde pincode als het hostscherm. */
export const load: PageServerLoad = ({ locals }) => ({
  aangemeld: locals.rol === 'quizmaster' && !locals.proef,
});

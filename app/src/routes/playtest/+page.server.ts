import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Hetzelfde als /proef, voor wie het Engelse woord intikt. */
export const load: PageServerLoad = () => redirect(307, '/proef');

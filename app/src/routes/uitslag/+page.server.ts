import type { PageServerLoad } from './$types';
import { alleUitslagen } from '$lib/server/uitslag';

export const load: PageServerLoad = () => ({ spellen: alleUitslagen() });

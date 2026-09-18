import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { uitslagVan } from '$lib/server/uitslag';

export const load: PageServerLoad = ({ params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) error(404, 'onbekende avond');
  const uitslag = uitslagVan(id);
  if (!uitslag) error(404, 'onbekende avond');
  return { uitslag };
};

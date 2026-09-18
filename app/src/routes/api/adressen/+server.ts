import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adresUrl, netwerkAdressen } from '$lib/server/netwerk';
import { inProductie } from '$lib/server/omgeving';

/**
 * De adressen waarop deze computer op het thuisnetwerk te vinden is.
 *
 * De televisie gebruikt dit als iemand hem per ongeluk via `localhost`
 * opende: dan kan hij zeggen wélk adres je in plaats daarvan moet tikken, in
 * plaats van alleen dat het misgaat. Op een echte server (productie) heeft
 * dat geen zin — daar is het adres het domein — en dan blijft de lijst leeg.
 */
export const GET: RequestHandler = ({ url }) => {
  const poort = url.port || (url.protocol === 'https:' ? '443' : '80');
  const adressen = inProductie() ? [] : netwerkAdressen();
  return json({
    poort,
    adressen: adressen.map((a) => ({ ...a, url: adresUrl(a.adres, poort) })),
  });
};

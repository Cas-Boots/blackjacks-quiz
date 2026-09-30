import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import QRCode from 'qrcode';

/**
 * De QR-code waarmee een telefoon de quiz opent.
 *
 * De televisie stuurt zijn eigen adres mee, want dat is het adres dat de
 * telefoons in dezelfde kamer ook kunnen bereiken. De server weet dat zelf
 * niet zeker: achter een omgekeerde proxy ziet hij een ander adres dan de
 * browser. Zonder parameter valt hij terug op het adres van dit verzoek.
 */
export const GET: RequestHandler = async ({ url }) => {
  const gewenst = url.searchParams.get('doel') ?? url.origin;
  let doel: URL;
  try {
    doel = new URL(gewenst);
  } catch {
    error(400, 'ongeldig adres');
  }
  if (doel.protocol !== 'http:' && doel.protocol !== 'https:') error(400, 'ongeldig adres');
  if (doel.href.length > 300) error(400, 'adres te lang');

  const svg = await QRCode.toString(doel.href, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: { dark: '#131f1a', light: '#fbf8ef' },
  });

  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml',
      'cache-control': 'public, max-age=3600',
    },
  });
};

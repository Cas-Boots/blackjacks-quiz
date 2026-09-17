import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createReadStream, statSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';
import { Readable } from 'node:stream';

/**
 * Foto's, filmpjes en muziek bij vragen, uit de map `media/` naast de app.
 *
 * Bewust niet via `static/`: die map wordt bij het bouwen ingebakken, en de
 * foto's van de avond komen er pas vlak van tevoren bij. Deze map lees je
 * op het moment zelf, dus een bestand erin zetten is genoeg.
 *
 * Bereikverzoeken (Range) worden bediend, anders kan Safari geen video
 * afspelen en kan geen enkele browser in een fragment vooruitspoelen.
 */
const TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.avif': 'image/avif',
  '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.ogg': 'audio/ogg',
  '.wav': 'audio/wav', '.flac': 'audio/flac',
};

function mediaMap(): string {
  return process.env.MEDIA_DIR ?? resolve(process.cwd(), 'media');
}

export const GET: RequestHandler = ({ params, request }) => {
  // Alleen een kale bestandsnaam; geen mappen, geen '..'.
  const naam = basename(params.bestand);
  if (!naam || naam !== params.bestand || naam.startsWith('.')) error(404, 'onbekend bestand');
  const type = TYPES[extname(naam).toLowerCase()];
  if (!type) error(404, 'onbekend bestandstype');

  const pad = resolve(mediaMap(), naam);
  let grootte: number;
  try {
    const st = statSync(pad);
    if (!st.isFile()) error(404, 'onbekend bestand');
    grootte = st.size;
  } catch {
    error(404, 'onbekend bestand');
  }

  const koppen: Record<string, string> = {
    'content-type': type,
    'accept-ranges': 'bytes',
    'cache-control': 'private, max-age=3600',
  };

  const bereik = request.headers.get('range');
  const m = bereik ? /^bytes=(\d*)-(\d*)$/.exec(bereik) : null;
  if (m && (m[1] || m[2])) {
    let begin = m[1] ? Number(m[1]) : Math.max(0, grootte - Number(m[2]));
    let eind = m[1] && m[2] ? Number(m[2]) : grootte - 1;
    eind = Math.min(eind, grootte - 1);
    if (begin > eind || begin >= grootte) {
      return new Response(null, { status: 416, headers: { 'content-range': `bytes */${grootte}` } });
    }
    const stroom = Readable.toWeb(createReadStream(pad, { start: begin, end: eind })) as ReadableStream;
    return new Response(stroom, {
      status: 206,
      headers: { ...koppen, 'content-range': `bytes ${begin}-${eind}/${grootte}`, 'content-length': String(eind - begin + 1) },
    });
  }

  const stroom = Readable.toWeb(createReadStream(pad)) as ReadableStream;
  return new Response(stroom, { headers: { ...koppen, 'content-length': String(grootte) } });
};

import type { RequestHandler } from './$types';
import { luister } from '$lib/server/bus';
import { bouwStaat, raakApparaatAan } from '$lib/server/spel';
import { TOKEN_COOKIE } from '../../../hooks.server';

/**
 * Live stroom met de stand, als server-sent events.
 *
 * Bewust SSE en geen websocket: EventSource maakt zelf opnieuw verbinding na
 * een haperende telefoonverbinding, en komt door elke proxy heen. De client
 * heeft daarnaast een terugval op /api/state, zodat een geblokkeerde stroom
 * de avond niet stillegt.
 */
export const GET: RequestHandler = ({ locals, cookies }) => {
  const rol = locals.rol;
  const token = cookies.get(TOKEN_COOKIE);
  if (token) raakApparaatAan(token, rol, locals.spelerId, null);

  let stop: (() => void) | null = null;
  let hartslag: ReturnType<typeof setInterval> | null = null;

  const stroom = new ReadableStream({
    start(controller) {
      const stuur = (naam: string, data: unknown) => {
        try {
          controller.enqueue(`event: ${naam}\ndata: ${JSON.stringify(data)}\n\n`);
        } catch {
          // Verbinding al dicht; opruimen gebeurt in cancel().
        }
      };

      stuur('staat', bouwStaat(rol));
      stop = luister(() => stuur('staat', bouwStaat(rol)));

      // Houdt tussenliggende proxies wakker en laat de client merken dat de
      // verbinding nog leeft.
      hartslag = setInterval(() => {
        if (token) raakApparaatAan(token, rol, locals.spelerId, null);
        stuur('hartslag', { t: Date.now() });
      }, 10_000);
    },
    cancel() {
      stop?.();
      if (hartslag) clearInterval(hartslag);
    },
  });

  return new Response(stroom, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  });
};

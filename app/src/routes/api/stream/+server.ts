import type { RequestHandler } from './$types';
import { luister, luisterReacties, luisterPorren, luisterGeluiden } from '$lib/server/bus';
import { bouwStaat, raakApparaatAan } from '$lib/server/spel';

/**
 * Live stroom met de stand, als server-sent events.
 *
 * Bewust SSE en geen websocket: EventSource maakt zelf opnieuw verbinding na
 * een haperende telefoonverbinding, en komt door elke proxy heen. De client
 * heeft daarnaast een terugval op /api/state, zodat een geblokkeerde stroom
 * de avond niet stillegt.
 */
export const GET: RequestHandler = ({ locals }) => {
  const rol = locals.rol;
  const spelerId = locals.spelerId;
  const token = locals.token;
  if (token) raakApparaatAan(token, rol, spelerId, null);

  let stop: (() => void) | null = null;
  let stopReacties: (() => void) | null = null;
  let stopPorren: (() => void) | null = null;
  let stopGeluiden: (() => void) | null = null;
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
      stopReacties = luisterReacties((bericht) => stuur('reactie', bericht));
      stopGeluiden = luisterGeluiden((bericht) => stuur('geluid', bericht));
      // Een por is alleen voor de telefoon waar hij voor bedoeld is.
      stopPorren = luisterPorren((por) => {
        if (spelerId !== null && por.spelerIds.includes(spelerId)) stuur('por', por);
      });

      // Houdt tussenliggende proxies wakker en laat de client merken dat de
      // verbinding nog leeft.
      hartslag = setInterval(() => {
        if (token) raakApparaatAan(token, rol, spelerId, null);
        stuur('hartslag', { t: Date.now() });
      }, 10_000);
    },
    cancel() {
      stop?.();
      stopReacties?.();
      stopPorren?.();
      stopGeluiden?.();
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

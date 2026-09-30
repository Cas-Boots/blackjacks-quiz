/**
 * Houdt de cijfers van resolution-recap bijna live: bij het opstarten één
 * keer, en daarna elke `RECAP_INTERVAL` seconden (standaard 60, 0 zet het
 * uit). Alleen als er een live bron is ingesteld; een bestand of de
 * ingebouwde momentopname verandert niet vanzelf.
 *
 * Zolang een ronde loopt die de cijfers gebruikt, of het jaaroverzicht,
 * slaan we een beurt over: vraag en antwoord mogen niet halverwege
 * verschuiven. Die rondes verversen zelf al bij hun begin.
 */
import { ververs, recapStatus } from './bron';

export interface AchtergrondOpties {
  /** Of er nu ververst mag worden. */
  mag: () => boolean;
  /** Na een verversing die iets veranderde, zodat de schermen opnieuw ophalen. */
  veranderd: () => void;
}

let timer: ReturnType<typeof setInterval> | null = null;

export function recapInterval(): number {
  const ruw = (process.env.RECAP_INTERVAL ?? '').trim();
  const s = ruw === '' ? 60 : Number(ruw);
  return Number.isFinite(s) && s > 0 ? Math.max(15, s) : 0;
}

export async function beurt(opties: AchtergrondOpties): Promise<boolean> {
  if (!recapStatus().liveAdres) return false;
  try {
    if (!opties.mag()) return false;
    const veranderd = await ververs();
    if (veranderd) opties.veranderd();
    return veranderd;
  } catch (err) {
    console.error('[recap] achtergrond verversen mislukt:', err);
    return false;
  }
}

export function startAchtergrond(opties: AchtergrondOpties) {
  if (timer || !recapStatus().liveAdres) return;
  void beurt(opties);
  const seconden = recapInterval();
  if (!seconden) return;
  timer = setInterval(() => void beurt(opties), seconden * 1000);
  timer.unref?.();
}

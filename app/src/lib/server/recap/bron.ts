/**
 * Waar de cijfers vandaan komen, en wanneer ze ververst worden.
 *
 * Drie bronnen, in deze volgorde:
 *
 * 1. Live: `RECAP_URL` plus `RECAP_TOKEN` — dezelfde `/api/export` en
 *    hetzelfde token als de dagelijkse back-up van resolution-recap gebruikt.
 * 2. Een bestand: `RECAP_BESTAND` wijst naar een export-JSON, bijvoorbeeld
 *    de laatste uit `resolution-recap/backups/`.
 * 3. De ingebouwde momentopname in `src/lib/content/recap-snapshot.json`,
 *    zodat de quiz ook zonder netwerk en zonder instellingen werkt.
 *
 * Verversen gebeurt bij het opstarten, als de quizmaster erom vraagt, en
 * telkens als een recap-ronde begint. Mislukt het, dan blijft de laatste
 * goede versie staan en meldt het hostscherm dat de bron onbereikbaar was.
 * Zolang een ronde loopt, verandert de stand niet vanzelf: vraag en
 * antwoord blijven de hele ronde hetzelfde.
 */
import { readFileSync } from 'node:fs';
import snapshot from '$lib/content/recap-snapshot.json';
import { analyseer, type Analyse, type RecapExport } from './analyse';

export type RecapBron = 'live' | 'bestand' | 'ingebouwd';

export interface RecapStatus {
  bron: RecapBron;
  /** Wanneer de export gemaakt is (de `exportedAt` uit resolution-recap). */
  exportedAt: string | null;
  /** Wanneer deze server hem voor het laatst succesvol binnenhaalde. */
  geladenOp: string | null;
  aantalEntries: number;
  personen: string[];
  /** Adres van de live bron zonder token, of null als die niet is ingesteld. */
  liveAdres: string | null;
  bezig: boolean;
  fout: string | null;
}

let analyse: Analyse | null = null;
let status: RecapStatus = {
  bron: 'ingebouwd',
  exportedAt: null,
  geladenOp: null,
  aantalEntries: 0,
  personen: [],
  liveAdres: liveAdres(),
  bezig: false,
  fout: null,
};
let lopend: Promise<boolean> | null = null;

function liveAdres(): string | null {
  const url = (process.env.RECAP_URL ?? '').trim().replace(/\/+$/, '');
  return url ? url : null;
}

function neem(data: RecapExport, bron: RecapBron) {
  const nieuw = analyseer(data);
  analyse = nieuw;
  status = {
    ...status,
    bron,
    exportedAt: data.exportedAt ?? null,
    geladenOp: new Date().toISOString(),
    aantalEntries: data.entries.filter((e) => !e.deleted_at).length,
    personen: nieuw.personen.map((p) => p.naam),
    fout: null,
  };
}

function laadIngebouwd() {
  neem(snapshot as unknown as RecapExport, 'ingebouwd');
}

function laadBestand(pad: string) {
  neem(JSON.parse(readFileSync(pad, 'utf8')) as RecapExport, 'bestand');
}

async function laadLive(adres: string): Promise<void> {
  const token = (process.env.RECAP_TOKEN ?? '').trim();
  if (!token) throw new Error('RECAP_TOKEN ontbreekt');
  const r = await fetch(`${adres}/api/export`, {
    headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!r.ok) throw new Error(`${adres} antwoordde ${r.status}`);
  const data = (await r.json()) as RecapExport;
  if (!Array.isArray(data.entries) || !Array.isArray(data.people)) throw new Error('geen export van resolution-recap');
  neem(data, 'live');
}

/** De analyse van dit moment. Bij de eerste vraag laden we synchroon wat er lokaal is. */
export function recapAnalyse(): Analyse {
  if (!analyse) {
    const bestand = (process.env.RECAP_BESTAND ?? '').trim();
    try {
      if (bestand) laadBestand(bestand);
      else laadIngebouwd();
    } catch (err) {
      console.error('[recap] bestand laden mislukt, terug naar de ingebouwde momentopname:', err);
      laadIngebouwd();
      status.fout = `${bestand}: ${(err as Error).message}`;
    }
  }
  return analyse as Analyse;
}

export function recapStatus(): RecapStatus {
  recapAnalyse();
  return { ...status, liveAdres: liveAdres() };
}

/**
 * Haalt de nieuwste cijfers binnen. Geeft true terug als er iets veranderd
 * is. Zonder live bron wordt het bestand opnieuw gelezen (dat kun je
 * tussendoor vervangen), en zonder bestand blijft de momentopname staan.
 */
export async function ververs(): Promise<boolean> {
  if (lopend) return lopend;
  lopend = (async () => {
    const vorige = status.exportedAt;
    status = { ...status, bezig: true };
    try {
      const adres = liveAdres();
      const bestand = (process.env.RECAP_BESTAND ?? '').trim();
      if (adres) await laadLive(adres);
      else if (bestand) laadBestand(bestand);
      else recapAnalyse();
      return status.exportedAt !== vorige;
    } catch (err) {
      const reden = (err as Error).message;
      console.error('[recap] verversen mislukt:', reden);
      recapAnalyse();
      status = { ...status, fout: reden };
      return false;
    } finally {
      status = { ...status, bezig: false };
      lopend = null;
    }
  })();
  return lopend;
}

/** Alleen voor tests: zet een eigen export neer. */
export function _zetVoorTest(data: RecapExport) {
  neem(data, 'bestand');
}

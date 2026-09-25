import { api } from './proef';
import type { PubliekeStaat, Rol, Por } from '$lib/shared/state';

/**
 * De live verbinding met de server.
 *
 * Drie dingen maken dit bestand bestand tegen een avond met wisselende wifi:
 *
 * 1. De SSE-stroom is de snelle weg, maar niet de enige. Valt hij weg, dan
 *    schakelt dit over op vragen om de twee seconden en blijft de quiz lopen.
 * 2. De klok telt af op basis van de servertijd die in elk pakketje meekomt.
 *    Een telefoon met een scheve klok loopt daardoor niet uit de pas.
 * 3. Pakketjes met een oudere versie worden genegeerd, zodat een laat
 *    binnengekomen antwoord de stand niet terugdraait.
 */
class Live {
  staat = $state<PubliekeStaat | null>(null);
  rol = $state<Rol>('gast');
  spelerId = $state<number | null>(null);
  verbonden = $state(false);
  /** Servertijd minus lokale tijd, in ms. */
  afwijking = $state(0);
  /** Waar de stand vandaan komt, voor het hostscherm. */
  bron = $state<'stroom' | 'navragen' | 'geen'>('geen');
  /** De punten zoals ze vóór de laatste wijziging stonden. Hiermee kan het
   *  scorebord van oud naar nieuw tellen in plaats van te springen. */
  vorigePunten = $state<Record<number, number>>({});
  /** Reacties van telefoons die nu over het scherm zweven. Vluchtig. */
  reacties = $state<{ id: number; emoji: string; naam: string; x: number }[]>([]);
  /** De laatste por van de quizmaster aan deze telefoon; verdwijnt vanzelf. */
  por = $state<Por | null>(null);
  #porTimer: ReturnType<typeof setTimeout> | null = null;

  #bron: EventSource | null = null;
  #pollTimer: ReturnType<typeof setInterval> | null = null;
  #mislukt = 0;

  start() {
    if (typeof window === 'undefined') return;
    this.#verbind();
    void this.#haalOp();
  }

  stop() {
    this.#bron?.close();
    this.#bron = null;
    if (this.#pollTimer) clearInterval(this.#pollTimer);
    this.#pollTimer = null;
  }

  #neem(pakket: { rol?: Rol; spelerId?: number | null; staat: PubliekeStaat | null } | PubliekeStaat | null) {
    if (!pakket) return;
    const staat = 'staat' in (pakket as never) ? (pakket as { staat: PubliekeStaat | null }).staat : (pakket as PubliekeStaat);
    if ('rol' in pakket && pakket.rol) this.rol = pakket.rol;
    if ('spelerId' in pakket) this.spelerId = pakket.spelerId ?? null;
    if (!staat) return;
    // Nooit terug in de tijd — binnen hetzelfde spel. Een nieuw spel begint
    // weer bij versie 1, en dat pakketje moet juist wél door.
    if (this.staat && staat.spelId === this.staat.spelId && staat.versie < this.staat.versie) return;

    // Bewaar de vorige punten zodra ze echt veranderen.
    if (this.staat) {
      const oud = Object.fromEntries(this.staat.stand.map((r) => [r.spelerId, r.punten]));
      const nieuw = Object.fromEntries(staat.stand.map((r) => [r.spelerId, r.punten]));
      const verschil = staat.stand.some((r) => (oud[r.spelerId] ?? 0) !== r.punten);
      if (verschil) this.vorigePunten = oud;
      else if (!Object.keys(this.vorigePunten).length) this.vorigePunten = nieuw;
    }

    this.afwijking = staat.serverTijd - Date.now();
    this.staat = staat;
  }

  #verbind() {
    try {
      const bron = new EventSource(api('/api/stream'));
      this.#bron = bron;

      bron.addEventListener('staat', (e) => {
        this.#mislukt = 0;
        this.verbonden = true;
        this.bron = 'stroom';
        this.#stopPollen();
        try {
          this.#neem(JSON.parse((e as MessageEvent).data));
        } catch {
          /* onvolledig pakketje: het volgende komt zo */
        }
      });

      bron.addEventListener('hartslag', () => {
        this.verbonden = true;
      });

      bron.addEventListener('reactie', (e) => {
        try {
          const r = JSON.parse((e as MessageEvent).data);
          this.reacties = [...this.reacties.slice(-24), r];
          // Na de zweefanimatie mag hij weg.
          setTimeout(() => (this.reacties = this.reacties.filter((x) => x.id !== r.id)), 3200);
        } catch {
          /* kapot pakketje, laat maar */
        }
      });

      bron.addEventListener('por', (e) => {
        try {
          const por = JSON.parse((e as MessageEvent).data) as Por;
          this.por = por;
          try {
            navigator.vibrate?.([80, 60, 80, 60, 160]);
          } catch {
            /* geen trilmotor */
          }
          if (this.#porTimer) clearTimeout(this.#porTimer);
          this.#porTimer = setTimeout(() => (this.por = null), 5000);
        } catch {
          /* kapot pakketje, laat maar */
        }
      });

      bron.onerror = () => {
        this.verbonden = false;
        this.#mislukt += 1;
        // EventSource probeert het zelf opnieuw. Blijft dat mislukken, dan
        // gaan we navragen in plaats van wachten.
        if (this.#mislukt >= 2) this.#startPollen();
      };
    } catch {
      this.#startPollen();
    }
  }

  #startPollen() {
    if (this.#pollTimer) return;
    this.bron = 'navragen';
    this.#pollTimer = setInterval(() => void this.#haalOp(), 2000);
  }

  #stopPollen() {
    if (!this.#pollTimer) return;
    clearInterval(this.#pollTimer);
    this.#pollTimer = null;
  }

  async #haalOp() {
    try {
      const r = await fetch(api('/api/state'), { cache: 'no-store' });
      if (!r.ok) return;
      this.#neem(await r.json());
      this.verbonden = true;
    } catch {
      this.verbonden = false;
    }
  }

  /** Milliseconden die er nog op de klok staan, gecorrigeerd voor de servertijd. */
  resterendMs(): number {
    const klok = this.staat?.klok;
    if (!klok?.loopt || !klok.eindigtOp) return 0;
    return Math.max(0, klok.eindigtOp - (Date.now() + this.afwijking));
  }

  async opdracht(opdracht: string, extra: Record<string, unknown> = {}) {
    const r = await fetch(api('/api/host'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ opdracht, ...extra }),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  async reageer(emoji: string) {
    await fetch(api('/api/reactie'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ emoji }),
    });
  }

  async meld(rol: string, extra: Record<string, unknown> = {}) {
    const r = await fetch(api('/api/join'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rol, ...extra }),
    });
    if (!r.ok) throw new Error(await r.text());
    const uit = await r.json();
    await this.#haalOp();
    return uit;
  }
}

export const live = new Live();

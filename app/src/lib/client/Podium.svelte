<script module lang="ts">
  /**
   * Het podium: drie treden in goud, zilver en brons, met de mensen erop.
   *
   * De treden rijzen één voor één uit de vloer, van drie naar één, zodat de
   * spanning oploopt tot de winnaar. Wie het tijdstip van de fanfare wil
   * afstemmen: de eerste trede staat na `WINNAAR_NA_MS`.
   */
  export const WINNAAR_NA_MS = 2400;
</script>

<script lang="ts">
  import Teller from '$lib/client/Teller.svelte';
  import Portret from '$lib/client/Portret.svelte';

  let {
    top3,
    vorigePunten = {},
    compact = false,
  }: {
    top3: { spelerId: number; naam: string; punten: number; foto: string | null; dier?: string | null }[];
    vorigePunten?: Record<number, number>;
    /** Voor de telefoon: kleiner, zonder tellende cijfers. */
    compact?: boolean;
  } = $props();

  /** Tweede, eerste, derde — zoals een echt podium staat. */
  let volgorde = $derived(top3.length === 3 ? [1, 0, 2] : top3.length === 2 ? [1, 0] : top3.map((_, i) => i));
  /** De derde trede komt eerst, de eerste als laatste. */
  const vertraging = [1700, 1000, 300];
</script>

<div class="podium" class:compact>
  {#each volgorde as idx (top3[idx].spelerId)}
    {@const r = top3[idx]}
    <div class="trede" data-plek={idx + 1} style="--vertraging:{compact ? vertraging[idx] / 2 : vertraging[idx]}ms">
      <div class="staander">
        <span class="kroonhouder" class:kroon={idx === 0}>
          <Portret naam={r.naam} foto={r.foto} dier={r.dier} maat={compact ? 'm' : 'l'} goud={idx === 0} />
        </span>
        <span class="naam">{r.naam}</span>
        <span class="punten">
          {#if compact}
            {r.punten}
          {:else}
            <Teller naar={r.punten} van={vorigePunten[r.spelerId] ?? r.punten} vertraging={vertraging[idx] + 500} />
          {/if}
          {r.punten === 1 ? 'punt' : 'punten'}
        </span>
      </div>
      <!-- De vloer houdt de hoogte van de trede al bezet voordat de trede
           er is: zo staat de opmaak van de dia meteen vast en hoeft het
           scherm niet mee te schuiven terwijl het podium opkomt. -->
      <div class="vloer">
        <div class="blok">
          <span class="cijfer">{idx + 1}</span>
        </div>
      </div>
    </div>
  {/each}
</div>

<style>
  .podium {
    --trede-1: clamp(150px, 24vh, 280px);
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: clamp(0.4rem, 1vw, 1rem);
    align-items: end;
    width: min(100%, 980px);
    padding: 0 clamp(0.5rem, 2vw, 2rem);
    border-bottom: 3px solid var(--rand);
    position: relative;
  }
  .podium.compact {
    --trede-1: 96px;
    width: 100%;
    gap: 0.4rem;
    padding: 0 0.4rem;
  }
  /* Een lichtstreep langs de vloer, alsof er een lamp op staat. */
  .podium::after {
    content: "";
    position: absolute;
    left: 10%;
    right: 10%;
    bottom: -3px;
    height: 3px;
    background: linear-gradient(90deg, transparent, var(--goud), transparent);
  }
  .trede {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 0;
  }
  .staander {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.45rem;
    padding-bottom: 0.7rem;
    max-width: 100%;
    animation: opkomen 0.55s var(--deal) both;
    animation-delay: calc(var(--vertraging) + 450ms);
  }
  .compact .staander {
    gap: 0.25rem;
    padding-bottom: 0.4rem;
  }
  .staander .naam {
    font-family: var(--display);
    font-size: calc(var(--fs-naam) * 0.9);
    line-height: 1.05;
    text-align: center;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .compact .staander .naam {
    font-size: 1.05rem;
  }
  .staander .punten {
    font-family: var(--mono);
    color: var(--goud-licht);
    font-size: calc(var(--fs-naam) * 0.55);
    white-space: nowrap;
  }
  .compact .staander .punten {
    font-size: 0.85rem;
  }

  /* ---- De treden ------------------------------------------------- */
  .vloer {
    width: 100%;
    height: var(--hoogte);
    display: flex;
    align-items: flex-end;
  }
  .blok {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 10px 10px 0 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    animation: oprijzen 0.8s var(--deal) both;
    animation-delay: var(--vertraging);
    box-shadow:
      inset 0 6px 0 rgba(255, 255, 255, 0.35),
      inset 0 -10px 24px rgba(0, 0, 0, 0.35),
      0 30px 50px -30px rgba(0, 0, 0, 0.9);
  }
  .trede[data-plek="1"] {
    --hoogte: var(--trede-1);
  }
  .trede[data-plek="1"] .blok {
    background: linear-gradient(180deg, #f6e3a1 0%, #c9a227 14%, #a3821a 60%, #7d6312 100%);
  }
  .trede[data-plek="2"] {
    --hoogte: calc(var(--trede-1) * 0.68);
  }
  .trede[data-plek="2"] .blok {
    background: linear-gradient(180deg, #f4f5f7 0%, #c3c8d0 14%, #98a0ab 60%, #6b727e 100%);
  }
  .trede[data-plek="3"] {
    --hoogte: calc(var(--trede-1) * 0.46);
  }
  .trede[data-plek="3"] .blok {
    background: linear-gradient(180deg, #f3c9a2 0%, #c8803f 14%, #a5642c 60%, #74451d 100%);
  }
  .cijfer {
    font-family: var(--display);
    font-weight: 700;
    font-size: calc(var(--hoogte) * 0.62);
    line-height: 1;
    color: rgba(20, 14, 4, 0.42);
    mix-blend-mode: multiply;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.25);
    user-select: none;
  }
  .compact .cijfer {
    font-size: calc(var(--hoogte) * 0.55);
  }
  /* De winnaar gloeit, en blijft dat doen. */
  .trede[data-plek="1"] .blok::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    animation: gloedTrede 2.6s ease-in-out infinite;
    animation-delay: calc(var(--vertraging) + 800ms);
  }
  @keyframes oprijzen {
    from {
      height: 0;
    }
  }
  @keyframes gloedTrede {
    50% {
      box-shadow: inset 0 0 60px rgba(255, 240, 180, 0.45);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .blok,
    .staander {
      animation-duration: 0.01ms;
      animation-delay: 0ms;
    }
    .trede[data-plek="1"] .blok::after {
      animation: none;
    }
  }
</style>

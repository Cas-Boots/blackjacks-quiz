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
    tijden = null,
  }: {
    top3: { spelerId: number; naam: string; punten: number; foto: string | null; dier?: string | null }[];
    vorigePunten?: Record<number, number>;
    /** Voor de telefoon: kleiner, zonder tellende cijfers. */
    compact?: boolean;
    /**
     * De ceremonie op de televisie: wanneer plek 1, 2 en 3 onthuld worden
     * (ms). De eerste trede rijst dan al tijdens de tromgeroffel, met een
     * dichte kaart erop die op het moment zelf omdraait.
     */
    tijden?: [number, number, number] | null;
  } = $props();
  /** Zo lang staat de dichte kaart op de eerste trede voordat hij omdraait. */
  const ROFFEL = 1700;

  /** Tweede, eerste, derde — zoals een echt podium staat. */
  let volgorde = $derived(top3.length === 3 ? [1, 0, 2] : top3.length === 2 ? [1, 0] : top3.map((_, i) => i));
  /** De top drie als hoge kaarten: aas, heer, vrouw. */
  const RANG = ['A', 'K', 'Q'];
  const KLEUR = ['♠', '♥', '♦'];
  /** De derde trede komt eerst, de eerste als laatste. */
  let vertraging = $derived(tijden ?? [1700, 1000, 300]);
</script>

<div class="podium" class:compact>
  {#each volgorde as idx (top3[idx].spelerId)}
    {@const r = top3[idx]}
    {@const geheim = !!tijden && idx === 0}
    <div
      class="trede"
      data-plek={idx + 1}
      style="--vertraging:{compact ? vertraging[idx] / 2 : vertraging[idx]}ms;--blok:{geheim ? vertraging[idx] - ROFFEL : compact ? vertraging[idx] / 2 : vertraging[idx]}ms"
    >
      {#if compact}
        <div class="staander">
          <span class="kroonhouder" class:kroon={idx === 0}>
            <Portret naam={r.naam} foto={r.foto} dier={r.dier} maat="m" goud={idx === 0} />
          </span>
          <span class="naam">{r.naam}</span>
          <span class="punten">{r.punten} {r.punten === 1 ? 'punt' : 'punten'}</span>
        </div>
      {:else}
        <!-- Op de televisie staat de top drie als speelkaart op zijn trede:
             de winnaar is de schoppenaas, dan de hartenheer en de ruitenvrouw.
             De aas ligt eerst dicht en draait om als de roffel stopt. -->
        <div class="speelkaart" class:geheim class:winnaar={idx === 0} data-rood={idx > 0}>
          <div class="voorkant">
            <span class="hoek boven" aria-hidden="true">{RANG[idx]}<i>{KLEUR[idx]}</i></span>
            <span class="hoek onder" aria-hidden="true">{RANG[idx]}<i>{KLEUR[idx]}</i></span>
            <span class="watermerk" aria-hidden="true">{KLEUR[idx]}</span>
            <span class="kroonhouder" class:kroon={idx === 0}>
              <Portret naam={r.naam} foto={r.foto} dier={r.dier} maat="l" goud={idx === 0} />
            </span>
            <span class="naam">{r.naam}</span>
            <span class="punten">
              <Teller naar={r.punten} van={vorigePunten[r.spelerId] ?? r.punten} vertraging={vertraging[idx] + 500} />
              {r.punten === 1 ? 'punt' : 'punten'}
            </span>
          </div>
          {#if geheim}
            <div class="achterkant" aria-hidden="true"><span>?</span></div>
          {/if}
        </div>
      {/if}
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
    position: relative;
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
    animation-delay: var(--blok, var(--vertraging));
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

  /* ===== Op de televisie: speelkaarten op art-decotreden ============ */
  .podium:not(.compact) {
    --trede-1: clamp(120px, 19vh, 240px);
    --kaart-b: clamp(160px, 15vw, 290px);
    width: min(100%, 1320px);
    gap: clamp(0.6rem, 1.6vw, 1.8rem);
    border-bottom: none;
  }
  .podium:not(.compact)::after {
    left: 0;
    right: 0;
    height: 4px;
    bottom: 0;
    background: linear-gradient(90deg, transparent, var(--goud-licht), var(--goud), var(--goud-licht), transparent);
    box-shadow: 0 0 24px var(--goud);
  }
  .speelkaart {
    position: relative;
    width: calc(var(--kaart-b) * 0.82);
    aspect-ratio: 5 / 7;
    margin-bottom: 0.9rem;
    perspective: 1200px;
    transform-style: preserve-3d;
    animation: kaartDelen 0.6s calc(var(--vertraging) + 350ms) var(--deal) both;
  }
  .speelkaart.winnaar {
    width: var(--kaart-b);
  }
  .voorkant,
  .achterkant {
    position: absolute;
    inset: 0;
    border-radius: clamp(10px, 1vw, 18px);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
  .voorkant {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 12% 10%;
    background: linear-gradient(170deg, #fffdf6, #efe4c8);
    color: #14110d;
    box-shadow:
      inset 0 0 0 2px #d9b45a,
      inset 0 0 0 7px transparent,
      inset 0 0 0 8px rgba(154, 117, 36, 0.5),
      0 24px 50px -12px rgba(0, 0, 0, 0.75);
  }
  .winnaar .voorkant {
    box-shadow:
      inset 0 0 0 3px #e6c46a,
      inset 0 0 0 8px transparent,
      inset 0 0 0 9px rgba(154, 117, 36, 0.6),
      0 0 0 3px rgba(255, 240, 189, 0.5),
      0 0 60px rgba(230, 196, 106, 0.55),
      0 30px 60px -12px rgba(0, 0, 0, 0.8);
  }
  .hoek {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: var(--display);
    font-weight: 900;
    font-size: calc(var(--kaart-b) * 0.14);
    line-height: 0.9;
    color: #17171c;
  }
  .hoek i {
    font-style: normal;
    font-size: 0.85em;
  }
  [data-rood="true"] .hoek,
  [data-rood="true"] .watermerk {
    color: #d42a3a;
  }
  .hoek.boven {
    left: 7%;
    top: 5%;
  }
  .hoek.onder {
    right: 7%;
    bottom: 5%;
    transform: rotate(180deg);
  }
  .watermerk {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: calc(var(--kaart-b) * 0.9);
    line-height: 1;
    color: #17171c;
    opacity: 0.06;
    pointer-events: none;
  }
  .voorkant .naam {
    position: relative;
    font-family: var(--display);
    font-weight: 900;
    /* Op de kleinere kaarten past ook "Bastiaan" nog op één regel. */
    font-size: calc(var(--kaart-b) * 0.125);
    line-height: 1;
    max-width: 100%;
    text-align: center;
    overflow-wrap: anywhere;
  }
  .winnaar .voorkant .naam {
    font-size: calc(var(--kaart-b) * 0.16);
  }
  /* Na het omdraaien blijft de aas zacht nagloeien. */
  .speelkaart.winnaar::before {
    content: "";
    position: absolute;
    inset: -18%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 230, 160, 0.45), transparent 65%);
    opacity: 0;
    animation: nagloeien 2.8s calc(var(--vertraging) + 700ms) ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes nagloeien {
    0%, 100% { opacity: 0.35; transform: scale(0.95); }
    50% { opacity: 1; transform: scale(1.05); }
  }
  .voorkant .punten {
    position: relative;
    font-family: var(--display);
    font-weight: 700;
    font-variant-numeric: tabular-nums lining-nums;
    font-size: calc(var(--kaart-b) * 0.075);
    color: #7d6312;
    white-space: nowrap;
  }
  .achterkant {
    display: grid;
    place-items: center;
    background:
      repeating-linear-gradient(45deg, rgba(230, 196, 106, 0.35) 0 4px, transparent 4px 12px),
      repeating-linear-gradient(-45deg, rgba(230, 196, 106, 0.35) 0 4px, transparent 4px 12px),
      #0d1530;
    box-shadow:
      inset 0 0 0 6px #fbf4e2,
      inset 0 0 0 8px #d9b45a,
      0 24px 50px -12px rgba(0, 0, 0, 0.75);
    transform: rotateY(180deg);
  }
  .achterkant span {
    display: grid;
    place-items: center;
    width: 46%;
    aspect-ratio: 1;
    border-radius: 50%;
    background: #fbf4e2;
    font-family: var(--display);
    font-weight: 900;
    font-size: calc(var(--kaart-b) * 0.26);
    color: #0d1530;
  }

  /* De aas: dicht neergelegd tijdens de roffel, dan omgedraaid. */
  .speelkaart.geheim {
    animation:
      kaartDelen 0.6s calc(var(--vertraging) - 1700ms) var(--deal) both,
      kaartTrilt 0.16s calc(var(--vertraging) - 800ms) ease-in-out 5;
  }
  .geheim .voorkant {
    animation: voorOm 0.8s var(--vertraging) var(--deal) both;
  }
  .geheim .achterkant {
    animation: achterOm 0.8s var(--vertraging) var(--deal) both;
  }
  @keyframes kaartDelen {
    from {
      opacity: 0;
      transform: translateY(-140px) rotate(-16deg) scale(1.15);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes kaartTrilt {
    50% {
      transform: rotate(2.5deg) scale(1.03);
    }
  }
  @keyframes voorOm {
    from {
      transform: rotateY(-180deg) scale(1.15);
    }
    60% {
      transform: rotateY(10deg) scale(1.18);
    }
    to {
      transform: none;
    }
  }
  @keyframes achterOm {
    from {
      transform: rotateY(0deg) scale(1.15);
    }
    to {
      transform: rotateY(180deg);
    }
  }

  /* De treden: zwart gelakt met een rand in goud, zilver of brons. */
  .podium:not(.compact) .trede[data-plek="1"] {
    --rand-kleur: #f3d77e;
  }
  .podium:not(.compact) .trede[data-plek="2"] {
    --rand-kleur: #dfe3ea;
  }
  .podium:not(.compact) .trede[data-plek="3"] {
    --rand-kleur: #dd9a5e;
  }
  .podium:not(.compact) .blok {
    border-radius: 6px 6px 0 0;
    background:
      repeating-linear-gradient(90deg, transparent 0 18%, rgba(230, 196, 106, 0.12) 18% calc(18% + 1px)),
      linear-gradient(180deg, #1c2650 0%, #0b1129 55%, #04060e 100%);
    border-top: 5px solid var(--rand-kleur);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.35),
      inset 3px 0 0 color-mix(in srgb, var(--rand-kleur) 45%, transparent),
      inset -3px 0 0 color-mix(in srgb, var(--rand-kleur) 45%, transparent),
      0 -6px 30px -6px color-mix(in srgb, var(--rand-kleur) 55%, transparent),
      0 30px 50px -30px rgba(0, 0, 0, 0.9);
  }
  .podium:not(.compact) .cijfer {
    font-family: "Bodoni Moda", var(--display);
    font-weight: 900;
    font-size: calc(var(--hoogte) * 0.7);
    color: transparent;
    background: linear-gradient(180deg, #fffbe8 0%, var(--rand-kleur) 45%, color-mix(in srgb, var(--rand-kleur) 55%, #000) 60%, var(--rand-kleur) 85%);
    -webkit-background-clip: text;
    background-clip: text;
    mix-blend-mode: normal;
    text-shadow: none;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6));
  }
  .podium:not(.compact) .trede[data-plek="1"] .blok::after {
    animation: none;
  }


  /* ---- Mooier: een galavloer, een stralenkrans en lichtplassen ---- */
  /* De vloer spiegelt: kaarten en treden staan op zwart glas. */
  .podium:not(.compact) {
    -webkit-box-reflect: below 2px linear-gradient(transparent 70%, rgba(255, 255, 255, 0.14));
  }
  /* Achter de aas draait een gouden stralenkrans, zodra hij is omgedraaid. */
  .podium:not(.compact) .trede[data-plek="1"]::before {
    content: "";
    position: absolute;
    left: 50%;
    bottom: calc(var(--hoogte) + var(--kaart-b) * 0.7);
    width: calc(var(--kaart-b) * 3.2);
    aspect-ratio: 1;
    margin: 0 0 calc(var(--kaart-b) * -1.6) calc(var(--kaart-b) * -1.6);
    border-radius: 50%;
    background: repeating-conic-gradient(rgba(255, 226, 150, 0.32) 0 4deg, transparent 4deg 12deg);
    -webkit-mask: radial-gradient(circle, #000 18%, transparent 68%);
    mask: radial-gradient(circle, #000 18%, transparent 68%);
    opacity: 0;
    animation:
      kransAan 1s var(--vertraging) var(--deal) forwards,
      kransDraait 40s var(--vertraging) linear infinite;
    pointer-events: none;
  }
  @keyframes kransAan {
    from { opacity: 0; scale: 0.4; }
    to { opacity: 1; scale: 1; }
  }
  @keyframes kransDraait {
    to { rotate: 360deg; }
  }
  /* Op elke trede valt een plas licht, alsof er een spot op staat. */
  .podium:not(.compact) .vloer {
    position: relative;
  }
  .podium:not(.compact) .vloer::before {
    content: "";
    position: absolute;
    left: 6%;
    right: 6%;
    top: -14px;
    height: 28px;
    border-radius: 50%;
    background: radial-gradient(ellipse, color-mix(in srgb, var(--rand-kleur) 70%, white) 0%, transparent 70%);
    opacity: 0;
    filter: blur(2px);
    animation: plasAan 0.8s calc(var(--vertraging) + 400ms) ease-out forwards;
    z-index: 1;
    pointer-events: none;
  }
  @keyframes plasAan {
    to { opacity: 0.85; }
  }
  /* Het portret in een gouden ovale lijst. */
  .voorkant .kroonhouder {
    position: relative;
    display: grid;
    place-items: center;
    width: 58%;
    aspect-ratio: 1;
    border-radius: 50%;
    padding: 5%;
    background:
      radial-gradient(circle, transparent 0 60%, #fbf4e2 61%),
      conic-gradient(from 200deg, #9a7524, #fff0bd, #d9b45a, #9a7524, #fff0bd, #9a7524);
    box-shadow:
      0 0 0 2px #d9b45a,
      0 6px 14px rgba(0, 0, 0, 0.3);
  }
  .voorkant .kroonhouder :global(.portret),
  .voorkant .kroonhouder :global(.avatar) {
    width: 100%;
    height: 100%;
  }
  .voorkant .kroonhouder :global(.avatar) {
    font-size: calc(var(--kaart-b) * 0.15);
    box-shadow: inset 0 0 0 3px #fbf4e2;
  }
  .voorkant .kroonhouder :global(.dierbadge) {
    font-size: calc(var(--kaart-b) * 0.09);
    right: -4%;
    bottom: -4%;
  }

  @media (prefers-reduced-motion: reduce) {
    .podium:not(.compact) .trede[data-plek="1"]::before {
      animation: none;
      opacity: 1;
    }
    .speelkaart,
    .voorkant,
    .achterkant {
      animation-duration: 0.01ms !important;
      animation-delay: 0ms !important;
    }
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

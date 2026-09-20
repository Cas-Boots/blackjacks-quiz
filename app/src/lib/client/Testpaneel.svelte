<script lang="ts">
  /**
   * Het bedieningspaneel van de testmodus: de lijst met dia's, de knoppen
   * die bij de dia horen en de sneltoetsen. Ligt als een la over de linkerkant
   * van het televisiescherm en klapt in met één toets, zodat je het scherm
   * ook eens zonder paneel bekijkt.
   */
  import { onMount } from 'svelte';
  import { live } from '$lib/client/live.svelte';
  import { testmodus, type Dia } from '$lib/client/testmodus.svelte';

  let acties = $derived.by(() => {
    void live.staat;
    return testmodus.acties();
  });

  /** De dia's per hoofdstuk, in de volgorde van de avond. */
  let hoofdstukken = $derived.by(() => {
    const uit: { naam: string; dias: { dia: Dia; index: number }[] }[] = [];
    testmodus.dias.forEach((dia, index) => {
      const laatste = uit[uit.length - 1];
      if (laatste && laatste.naam === dia.hoofdstuk) laatste.dias.push({ dia, index });
      else uit.push({ naam: dia.hoofdstuk, dias: [{ dia, index }] });
    });
    return uit;
  });

  function opToets(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const doel = e.target as HTMLElement | null;
    if (doel && /^(INPUT|TEXTAREA|SELECT)$/.test(doel.tagName)) return;
    const toets = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    if (toets === 'ArrowRight' || toets === ' ' || toets === 'Enter' || toets === 'PageDown') {
      e.preventDefault();
      testmodus.volgende();
    } else if (toets === 'ArrowLeft' || toets === 'PageUp') {
      e.preventDefault();
      testmodus.vorige();
    } else if (toets === 'R') {
      testmodus.opnieuw();
    } else if (toets === 'T') {
      testmodus.paneelOpen = !testmodus.paneelOpen;
    } else {
      const actie = acties.find((a) => a.toets === toets);
      if (actie) {
        e.preventDefault();
        actie.doe();
      }
    }
  }

  onMount(() => {
    window.addEventListener('keydown', opToets);
    return () => window.removeEventListener('keydown', opToets);
  });
</script>

<!-- Altijd zichtbaar, ook met het paneel dicht: dit is niet de echte avond. -->
<button class="testetiket" onclick={() => (testmodus.paneelOpen = !testmodus.paneelOpen)} title="Paneel tonen of verbergen (T)">
  <span class="stip"></span>
  Testmodus · {testmodus.index + 1} / {testmodus.dias.length}
</button>

{#if testmodus.paneelOpen}
  <aside class="testpaneel" aria-label="Testmodus">
    <header>
      <div>
        <p class="etiket stil" style="margin:0">Testmodus van de televisie</p>
        <p class="uitleg">Verzonnen spel, geen server, niets wordt bewaard. Loop de dia's door met <kbd>←</kbd> <kbd>→</kbd>.</p>
      </div>
      <button class="knop stil klein" onclick={() => (testmodus.paneelOpen = false)} title="Paneel verbergen (T)">Verberg</button>
    </header>

    <div class="nu">
      <p class="etiket stil" style="margin:0">{testmodus.dia.hoofdstuk}</p>
      <h3>{testmodus.dia.titel}</h3>
      <p class="let">{testmodus.dia.let}</p>
      <div class="knoprij" style="gap:.4rem">
        {#each acties as a (a.label)}
          <button class="knop klein" onclick={a.doe}>
            {a.label}{#if a.toets}<kbd>{a.toets}</kbd>{/if}
          </button>
        {/each}
        <button class="knop klein stil" onclick={() => testmodus.opnieuw()}>Speel opnieuw<kbd>R</kbd></button>
      </div>
    </div>

    <nav class="dias">
      {#each hoofdstukken as h (h.naam)}
        <p class="etiket stil hoofdstuk">{h.naam}</p>
        {#each h.dias as { dia, index } (dia.id)}
          <button class="dia" class:nu={index === testmodus.index} onclick={() => testmodus.ga(index)}>
            <span class="nr">{index + 1}</span>
            {dia.titel}
          </button>
        {/each}
      {/each}
    </nav>

    <footer>
      <span><kbd>T</kbd> paneel</span>
      <span><kbd>R</kbd> opnieuw</span>
      <a href="/tv">Terug naar het echte scherm</a>
    </footer>
  </aside>
{/if}

<style>
  .testetiket {
    position: fixed;
    top: clamp(10px, 1.4vw, 22px);
    right: clamp(10px, 1.4vw, 22px);
    z-index: 60;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.85rem;
    border-radius: 999px;
    border: 1px solid var(--rood);
    background: rgba(8, 21, 17, 0.85);
    color: var(--rood-licht);
    font-family: var(--mono);
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .testetiket .stip {
    background: var(--rood);
    box-shadow: 0 0 8px rgba(233, 123, 99, 0.8);
    animation: knipper 1.6s ease-in-out infinite;
  }
  @keyframes knipper {
    50% {
      opacity: 0.3;
    }
  }

  .testpaneel {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 55;
    width: min(360px, 88vw);
    display: flex;
    flex-direction: column;
    background: rgba(6, 15, 12, 0.92);
    border-right: 1px solid var(--rand);
    backdrop-filter: blur(8px);
    color: var(--ivoor-zacht);
    font-size: 0.9rem;
    box-shadow: 20px 0 60px -30px rgba(0, 0, 0, 0.9);
  }
  header,
  .nu,
  footer {
    padding: 0.9rem 1rem;
    border-bottom: 1px solid var(--rand);
  }
  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.6rem;
  }
  .uitleg {
    margin: 0.3rem 0 0;
    color: var(--salie);
    font-size: 0.82rem;
    line-height: 1.4;
  }
  .nu h3 {
    font-size: 1.25rem;
    margin: 0.1rem 0 0.35rem;
    color: var(--ivoor);
  }
  .let {
    margin: 0 0 0.7rem;
    color: var(--salie);
    font-size: 0.84rem;
    line-height: 1.45;
  }
  .knop.klein {
    padding: 0.45rem 0.75rem;
    font-size: 0.82rem;
    gap: 0.4rem;
  }
  kbd {
    font-family: var(--mono);
    font-size: 0.7em;
    padding: 0.05rem 0.35rem;
    border-radius: 5px;
    border: 1px solid var(--rand);
    background: rgba(255, 255, 255, 0.05);
    color: var(--salie);
  }
  .dias {
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 0.5rem 0.6rem 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }
  .hoofdstuk {
    margin: 0.7rem 0.4rem 0.25rem;
  }
  .dia {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    width: 100%;
    padding: 0.42rem 0.55rem;
    border: 1px solid transparent;
    border-radius: 9px;
    background: none;
    color: var(--ivoor-zacht);
    text-align: left;
    font-size: 0.88rem;
    cursor: pointer;
  }
  .dia:hover {
    background: var(--vilt-hoog);
    color: var(--ivoor);
  }
  .dia.nu {
    border-color: var(--goud-diep);
    background: rgba(201, 162, 39, 0.12);
    color: var(--goud-licht);
  }
  .dia .nr {
    font-family: var(--mono);
    font-size: 0.72rem;
    color: var(--salie);
    min-width: 1.4rem;
  }
  .dia.nu .nr {
    color: var(--goud);
  }
  footer {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 0.9rem;
    align-items: center;
    border-bottom: 0;
    border-top: 1px solid var(--rand);
    font-size: 0.8rem;
    color: var(--salie);
  }
  footer a {
    margin-left: auto;
    color: var(--salie);
  }
  footer a:hover {
    color: var(--ivoor);
  }
  @media (prefers-reduced-motion: reduce) {
    .testetiket .stip {
      animation: none;
    }
  }
</style>

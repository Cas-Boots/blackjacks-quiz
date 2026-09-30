<script lang="ts">
  /**
   * Een scherm op ware grootte, verkleind tot de breedte die het hier krijgt.
   * Zo zie je op de proefpagina precies wat de televisie of een telefoon
   * laat zien, alleen kleiner.
   */
  let { src, breedte, hoogte, titel }: { src: string; breedte: number; hoogte: number; titel: string } = $props();
  let ruimte = $state(0);
  let schaal = $derived(ruimte > 0 ? ruimte / breedte : 0);
</script>

<div class="kader" bind:clientWidth={ruimte} style="height:{Math.round(hoogte * schaal)}px">
  {#if schaal > 0}
    <iframe
      {src}
      title={titel}
      width={breedte}
      height={hoogte}
      style="transform:scale({schaal})"
      allow="autoplay"
    ></iframe>
  {/if}
</div>

<style>
  .kader {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 10px;
    border: 1px solid var(--rand);
    background: var(--vilt-diep);
  }
  iframe {
    position: absolute;
    top: 0;
    left: 0;
    border: 0;
    transform-origin: 0 0;
  }
</style>

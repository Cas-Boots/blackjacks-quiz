<script lang="ts">
  /** Wat er rond een maatje verschijnt: als pixelplaatje als dat er is, anders gewoon de emoji. */
  import { ICOONMAAT, icoonVan } from '$lib/shared/pixeliconen';

  let { teken }: { teken: string } = $props();
  let icoon = $derived(icoonVan(teken));
</script>

{#if icoon}
  <svg class="pixelicoon" viewBox="-1 -1 {ICOONMAAT + 2} {ICOONMAAT + 2}" shape-rendering="crispEdges" aria-hidden="true">
    {#each icoon as p (p.kleur)}<path fill={p.kleur} d={p.d} />{/each}
  </svg>
{:else}
  {teken}
{/if}

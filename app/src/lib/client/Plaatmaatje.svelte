<script lang="ts">
  /**
   * Het maatje dat op je naambordje staat, in de lobby op de televisie.
   *
   * Meestal staat het er gewoon: het knippert en ademt. Heel af en toe
   * (de regisseur op de tv-pagina kiest er steeds maar één) doet het een
   * kunstje, zodat de hele kamer het ziet, en dan is het weer rustig.
   */
  import Pixeldier from './Pixeldier.svelte';
  import Ding from './Ding.svelte';
  import { poseVan, type Actie } from '$lib/shared/dieren';

  let {
    sleutel,
    kunstje = null,
    beurt = 0,
    slaapt = false,
  }: {
    sleutel: string;
    /** Wie er nog niet is, heeft een maatje dat ligt te slapen. */
    slaapt?: boolean;
    /** Het kunstje van nu, of niets. */
    kunstje?: Actie | null;
    /** Telt op bij elk kunstje, zodat het ook twee keer hetzelfde kan doen. */
    beurt?: number;
  } = $props();
</script>

<span class="plaatmaatje" data-bezig={kunstje ? '' : null} aria-hidden="true">
  {#key beurt}
    <span class="actie" data-lijf={kunstje?.lijf ?? null}>
      <span class="adem">
        <Pixeldier {sleutel} pose={kunstje ? poseVan(kunstje.lijf, 'blij') : slaapt ? 'slaap' : 'staan'} />
      </span>
      {#if kunstje?.ding}
        {#each kunstje.dingGaat === 'op' || kunstje.dingGaat === 'val' ? [0, 1] : [0] as n (n)}
          <span class="ding" data-gaat={kunstje.dingGaat} style="--n:{n}"><Ding teken={kunstje.ding} /></span>
        {/each}
      {/if}
    </span>
  {/key}
</span>

<script lang="ts">
  /**
   * Een portret met maatje.
   *
   * De foto (of de initialen) blijft het portret; het maatje zit als klein,
   * stil figuurtje op de rand, zodat je ziet bij wie het hoort als het op de
   * grote momenten over het scherm rent (Dierenparade.svelte).
   */
  import { dierVan } from '$lib/shared/dieren';

  let {
    naam,
    foto = null,
    dier = null,
    maat = '',
    goud = false,
    stijl = '',
  }: {
    naam: string;
    foto?: string | null;
    dier?: string | null;
    maat?: '' | 'm' | 'l';
    goud?: boolean;
    /** Extra stijl voor het rondje zelf, voor de plekken die het kleiner willen. */
    stijl?: string;
  } = $props();

  let d = $derived(dierVan(dier, naam));
</script>

<span class="portret {maat}">
  {#if foto}
    <img class="avatar {maat}" class:goud src={foto} alt="" style={stijl} />
  {:else}
    <span class="avatar {maat}" class:goud style={stijl}>{naam.slice(0, 2)}</span>
  {/if}
  <span class="dierbadge" title={d.titel} aria-hidden="true">{d.emoji}</span>
</span>

<script lang="ts" module>
  /** Wie er binnenkomt: de speler en zijn maatje. */
  export interface Binnenkomer {
    id: number;
    naam: string;
    dier: string | null;
    dierNaam?: string | null;
  }
</script>

<script lang="ts">
  /**
   * De entree: wie binnenkomt, krijgt even het podium.
   *
   * Zijn maatje rent groot het beeld in, blijft staan in een zacht gouden
   * spotlicht, doet één kunstje, buigt, en is weer weg; eronder staat wie het
   * is. Eén tegelijk: komen er meer tegelijk binnen, dan wachten ze op hun
   * beurt (de tv-pagina houdt de rij bij).
   */
  import { onMount } from 'svelte';
  import Pixeldier from './Pixeldier.svelte';
  import Ding from './Ding.svelte';
  import { dierVan, kiesActie, maatjeVoluit, poseVan } from '$lib/shared/dieren';

  let { wie, klaar }: { wie: Binnenkomer; klaar?: () => void } = $props();

  const IN_MS = 900;
  const KUNST_MS = 2200;
  const BUIG_MS = 900;
  const UIT_MS = 700;

  // Het dier kan nog wisselen terwijl het binnenkomt (wie net binnen is, kiest vaak meteen een ander).
  let d = $derived(dierVan(wie.dier, wie.naam));
  let kunstje = $derived(kiesActie(d, 'blij'));
  let onderschrift = $derived(`${wie.naam} · ${maatjeVoluit(d, wie.dierNaam)}`);

  let fase = $state<'in' | 'kunst' | 'buig' | 'uit'>('in');
  onMount(() => {
    const t = [
      setTimeout(() => (fase = 'kunst'), IN_MS),
      setTimeout(() => (fase = 'buig'), IN_MS + KUNST_MS),
      setTimeout(() => (fase = 'uit'), IN_MS + KUNST_MS + BUIG_MS),
      setTimeout(() => klaar?.(), IN_MS + KUNST_MS + BUIG_MS + UIT_MS),
    ];
    return () => t.forEach(clearTimeout);
  });

  let actie = $derived(fase === 'kunst' ? kunstje : fase === 'buig' ? { lijf: 'zwaai' as const } : null);
  let pose = $derived(fase === 'in' ? 'loop' : actie ? poseVan(actie.lijf, 'blij') : 'staan');
</script>

<div class="spotlight" data-fase={fase} style="--in:{IN_MS}ms;--uit:{UIT_MS}ms" aria-hidden="true">
  <div class="spotlicht"></div>
  <div class="spotdier">
    {#key fase}
      <span class="actie" data-lijf={actie?.lijf ?? null} style="--tel:{fase === 'kunst' ? KUNST_MS : BUIG_MS}ms">
        <Pixeldier sleutel={d.sleutel} {pose} vlieg={d.beweging === 'vlieg'} />
        {#if actie && 'ding' in actie && actie.ding}
          {#each actie.dingGaat === 'op' || actie.dingGaat === 'val' ? [0, 1] : [0] as n (n)}
            <span class="ding" data-gaat={actie.dingGaat} style="--n:{n}"><Ding teken={actie.ding} /></span>
          {/each}
        {/if}
      </span>
    {/key}
  </div>
  <p class="spotnaam">{onderschrift}</p>
  <p class="spotentree">{d.entree}</p>
</div>

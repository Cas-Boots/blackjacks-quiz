<script lang="ts">
  import { live } from '$lib/client/live.svelte';
  import { onMount } from 'svelte';

  let { compact = false } = $props();
  let nu = $state(Date.now());

  onMount(() => {
    const t = setInterval(() => (nu = Date.now()), 200);
    return () => clearInterval(t);
  });

  // nu wordt gelezen zodat dit herberekent terwijl de klok loopt.
  let restMs = $derived.by(() => {
    void nu;
    return live.resterendMs();
  });
  let seconden = $derived(Math.ceil(restMs / 1000));
  let duur = $derived(live.staat?.klok?.duurMs ?? 0);
  let deel = $derived(duur > 0 ? Math.max(0, Math.min(1, restMs / duur)) : 0);
  let krap = $derived(seconden <= 5 && live.staat?.klok?.loopt === true);
</script>

{#if live.staat?.klok?.loopt}
  <div style="display:flex;flex-direction:column;gap:.4rem;{compact ? '' : 'min-width:6rem'}">
    <span class="klok" class:krap>{seconden}</span>
    <div class="balk" class:krap><i style="width:{deel * 100}%"></i></div>
  </div>
{:else if live.staat?.klok?.duurMs}
  <span class="klok" style="color:var(--salie-diep)">{Math.ceil((live.staat?.klok?.duurMs ?? 0) / 1000)}</span>
{:else}
  <span class="klok" style="color:var(--salie-diep)">—</span>
{/if}

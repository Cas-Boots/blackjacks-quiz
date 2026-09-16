<script lang="ts">
  import { live } from '$lib/client/live.svelte';
  import { onMount } from 'svelte';

  /** 'ring' voor de televisie, 'compact' voor telefoon en hostscherm. */
  let { vorm = 'ring' }: { vorm?: 'ring' | 'compact' } = $props();

  let nu = $state(Date.now());

  onMount(() => {
    // Tien keer per seconde: vloeiend genoeg voor de ring, goedkoop genoeg
    // om een telefoon niet leeg te trekken.
    const t = setInterval(() => (nu = Date.now()), 100);
    return () => clearInterval(t);
  });

  let restMs = $derived.by(() => {
    void nu;
    return live.resterendMs();
  });
  let duurMs = $derived(live.staat?.klok?.duurMs ?? 0);
  let loopt = $derived(live.staat?.klok?.loopt === true);
  let seconden = $derived(loopt ? Math.ceil(restMs / 1000) : Math.ceil(duurMs / 1000));
  let deel = $derived(duurMs > 0 && loopt ? Math.max(0, Math.min(1, restMs / duurMs)) : loopt ? 0 : 1);
  let krap = $derived(loopt && seconden <= 5);

  const R = 52;
  const OMTREK = 2 * Math.PI * R;
</script>

{#if vorm === 'ring'}
  <svg class="ring" class:krap class:stil={!loopt} viewBox="0 0 120 120" role="timer" aria-label="{seconden} seconden">
    <circle class="baan" cx="60" cy="60" r={R} />
    <circle
      class="voortgang"
      cx="60"
      cy="60"
      r={R}
      stroke-dasharray={OMTREK}
      stroke-dashoffset={OMTREK * (1 - deel)}
    />
    <text x="60" y="61">{duurMs ? seconden : '—'}</text>
  </svg>
{:else}
  <span class="klok-compact" class:krap class:stil={!loopt}>{duurMs ? seconden : '—'}</span>
{/if}

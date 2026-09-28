<script lang="ts">
  /**
   * De knoppen waarmee je je maatje iets laat doen: zwaaien, dansen, een
   * kunstje, of zijn lievelingshapje eten. Het doet het op de televisie, en
   * (via `kies`) meteen ook op je telefoon.
   *
   * Een kunstje duurt anderhalve seconde. Tot het klaar is wachten de knoppen
   * even, net als de server: anders stapelt het zich op en ziet niemand het.
   */
  import Ding from './Ding.svelte';
  import { OPDRACHTEN, knopVan, type Maatje, type Opdracht } from '$lib/shared/dieren';

  let {
    dier,
    kies,
    naam = '',
  }: {
    dier: Maatje;
    kies: (opdracht: Opdracht) => void;
    /** De naam van het maatje, voor wie een schermlezer gebruikt. */
    naam?: string;
  } = $props();

  const RUST_MS = 1200;
  let bezig = $state<Opdracht | null>(null);
  let rust: ReturnType<typeof setTimeout> | null = null;

  function druk(opdracht: Opdracht) {
    if (bezig) return;
    bezig = opdracht;
    kies(opdracht);
    try {
      navigator.vibrate?.(15);
    } catch { /* geen trilmotor */ }
    rust = setTimeout(() => (bezig = null), RUST_MS);
  }

  $effect(() => () => {
    if (rust) clearTimeout(rust);
  });
</script>

<div class="maatjesknoppen" role="group" aria-label={naam ? `Laat ${naam} iets doen op de televisie` : 'Laat je maatje iets doen op de televisie'}>
  {#each OPDRACHTEN as opdracht (opdracht)}
    {@const k = knopVan(dier, opdracht)}
    <button
      type="button"
      class:bezig={bezig === opdracht}
      aria-disabled={bezig !== null}
      aria-label={k.uitleg}
      onclick={() => druk(opdracht)}
    >
      <span class="teken"><Ding teken={k.teken} /></span>
      <span class="woord">{k.woord}</span>
    </button>
  {/each}
</div>

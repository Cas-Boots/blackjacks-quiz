<script lang="ts">
  import { onMount } from 'svelte';
  import { live } from '$lib/client/live.svelte';

  let pin = $state('');
  let fout = $state('');
  let spelers = $derived(live.staat?.spelers ?? []);

  onMount(() => {
    live.start();
    return () => live.stop();
  });

  async function alsSpeler(id: number) {
    fout = '';
    try {
      await live.meld('speler', { spelerId: id });
      location.href = '/play';
    } catch (e) {
      fout = 'Aanmelden lukte niet. Probeer het nog eens.';
    }
  }

  async function alsQuizmaster() {
    fout = '';
    try {
      await live.meld('quizmaster', { pin });
      location.href = '/host';
    } catch {
      fout = 'Die pincode klopt niet.';
    }
  }
</script>

<svelte:head><title>Blackjack Quiz 26/27</title></svelte:head>

<div class="scherm">
  <div class="romp" style="justify-content:center;max-width:720px">
    <p class="opschrift">Oud &amp; Nieuw</p>
    <h1 style="font-size:clamp(2.4rem,9vw,4.5rem);line-height:1">Blackjack Quiz 26/27</h1>
    <p class="lood">Kies je naam. Je telefoon wordt je antwoordblad.</p>

    {#if fout}<p class="waarschuwing" style="border-color:var(--rood)">{fout}</p>{/if}

    <div class="raster">
      {#each spelers as s (s.id)}
        <button class="knop groot" onclick={() => alsSpeler(s.id)}>
          {#if s.foto}<img class="avatar" src={s.foto} alt="" />{:else}<span class="avatar">{s.naam.slice(0, 2)}</span>{/if}
          {s.naam}
        </button>
      {:else}
        <p class="fijn">Verbinden met de quiz…</p>
      {/each}
    </div>

    <hr style="border:none;border-top:1px solid var(--rand-zacht);margin:1rem 0" />

    <p class="opschrift stil">Quizmaster</p>
    <div class="knoprij">
      <input
        type="password" inputmode="numeric" bind:value={pin} placeholder="Pincode"
        style="max-width:10rem" onkeydown={(e) => e.key === 'Enter' && alsQuizmaster()}
      />
      <button class="knop" onclick={alsQuizmaster}>Hostscherm</button>
      <a class="knop stil" href="/tv">Televisiescherm</a>
    </div>
  </div>
</div>

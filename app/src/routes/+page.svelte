<script lang="ts">
  import { onMount } from 'svelte';
  import { live } from '$lib/client/live.svelte';
  import { zelfde } from '$lib/client/proef';

  let pin = $state('');
  let fout = $state('');
  let gastNaam = $state('');
  let bezig = $state(false);
  let spelers = $derived(live.staat?.spelers ?? []);

  onMount(() => {
    live.start();
    return () => live.stop();
  });

  async function alsSpeler(id: number) {
    fout = '';
    try {
      await live.meld('speler', { spelerId: id });
      location.href = zelfde('/play');
    } catch (e) {
      fout = 'Aanmelden lukte niet. Probeer het nog eens.';
    }
  }

  /** Iemand die niet in de lijst staat: naam intikken en aanschuiven. */
  async function alsGast() {
    const naam = gastNaam.trim();
    if (!naam || bezig) return;
    fout = '';
    bezig = true;
    try {
      await live.meld('speler', { naam });
      location.href = zelfde('/play');
    } catch (e) {
      let reden = '';
      try {
        reden = JSON.parse(String((e as Error).message)).message ?? '';
      } catch { /* geen JSON */ }
      fout = reden || 'Aanschuiven lukte niet. Probeer het nog eens.';
    } finally {
      bezig = false;
    }
  }

  async function alsQuizmaster() {
    fout = '';
    try {
      await live.meld('quizmaster', { pin });
      location.href = zelfde('/host');
    } catch {
      fout = 'Die pincode klopt niet.';
    }
  }
</script>

<svelte:head><title>Blackjack Quiz 26/27</title></svelte:head>

<div class="scherm">
  <div class="romp" style="justify-content:center;max-width:720px">
    <p class="etiket">Oud &amp; Nieuw</p>
    <h1 class="mega" style="font-size:clamp(2.2rem,11vw,4rem)">Blackjack Quiz 26/27</h1>
    <p class="lood">Kies je naam. Je telefoon wordt je antwoordblad.</p>

    {#if fout}<p class="let-op" style="border-color:var(--rood)">{fout}</p>{/if}

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

    <p class="opschrift stil" style="margin-top:.6rem">Sta je er niet bij?</p>
    <div class="knoprij">
      <input
        type="text" bind:value={gastNaam} placeholder="Je naam" maxlength="24" autocomplete="off"
        style="max-width:14rem" onkeydown={(e) => e.key === 'Enter' && alsGast()} aria-label="Je naam"
      />
      <button class="knop" onclick={alsGast} disabled={bezig || !gastNaam.trim()}>Schuif aan</button>
    </div>

    <hr class="rule" style="margin:1rem 0" />

    <p class="opschrift stil">Quizmaster</p>
    <div class="knoprij">
      <input
        type="password" inputmode="numeric" bind:value={pin} placeholder="Pincode"
        style="max-width:10rem" onkeydown={(e) => e.key === 'Enter' && alsQuizmaster()}
      />
      <button class="knop" onclick={alsQuizmaster}>Hostscherm</button>
      <a class="knop stil" href="/tv">Televisiescherm</a>
      <a class="knop stil" href="/uitslag">Eerdere uitslagen</a>
      <a class="knop stil" href="/beheer">Beheer</a>
    </div>
  </div>
</div>

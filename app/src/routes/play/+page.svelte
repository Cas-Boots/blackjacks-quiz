<script lang="ts">
  import { onMount } from 'svelte';
  import { live } from '$lib/client/live.svelte';
  import Klok from '$lib/client/Klok.svelte';

  let antwoord = $state('');
  let verstuurd = $state(false);
  let bezig = $state(false);
  let melding = $state('');
  let laatsteSleutel = $state('');

  let staat = $derived(live.staat);
  let vraag = $derived(staat?.vraag ?? null);
  let sleutel = $derived(`${staat?.rondeIndex ?? 0}:${vraag?.index ?? 0}`);
  let mijnTeam = $derived(staat?.teams.find((t) => t.leden.includes(live.spelerId ?? -1)) ?? null);
  let alGestuurd = $derived(mijnTeam ? (staat?.ingeleverd ?? []).includes(mijnTeam.id) : false);
  let teamRonde = $derived((staat?.ronde?.teamModus ?? 'individueel') === 'teams');

  // Bij een nieuwe vraag het veld leegmaken.
  $effect(() => {
    if (sleutel !== laatsteSleutel) {
      laatsteSleutel = sleutel;
      antwoord = '';
      verstuurd = false;
      melding = '';
    }
  });

  onMount(() => {
    live.start();
    return () => live.stop();
  });

  async function stuur() {
    if (bezig) return;
    bezig = true;
    melding = '';
    try {
      const r = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tekst: antwoord }),
      });
      if (!r.ok) throw new Error(await r.text());
      const uit = await r.json();
      verstuurd = true;
      melding = uit.teLaat ? 'Verstuurd — maar de tijd was al om.' : 'Verstuurd. Je kunt nog aanpassen.';
    } catch {
      melding = 'Versturen lukte niet. Je antwoord staat er nog; probeer opnieuw.';
    } finally {
      bezig = false;
    }
  }
</script>

<svelte:head><title>Spelen — Blackjack Quiz 26/27</title></svelte:head>

<div class="scherm">
  <div class="romp" style="max-width:560px">
    <div style="display:flex;align-items:center;gap:.75rem">
      <div style="flex:1 1 auto;min-width:0">
        <p class="opschrift">{staat?.ronde?.naam ?? 'Blackjack Quiz 26/27'}</p>
        <p class="fijn">
          {#if mijnTeam && teamRonde}Team {mijnTeam.suit} {mijnTeam.naam} — samen op één telefoon{:else}Ieder voor zich{/if}
        </p>
      </div>
      <Klok compact />
    </div>

    <p class="verbinding">
      <span class="stip" class:aan={live.verbonden} class:uit={!live.verbonden}></span>
      {live.verbonden ? (live.bron === 'stroom' ? 'verbonden' : 'verbonden (navragen)') : 'geen verbinding — je antwoord blijft staan'}
    </p>

    {#if !staat}
      <p class="fijn">Verbinden…</p>
    {:else if staat.fase === 'lobby'}
      <div class="kaart"><p class="lood">Klaar om te beginnen. De quizmaster start zo.</p></div>
    {:else if staat.fase === 'ronde'}
      <div class="kaart">
        <p class="opschrift">{staat.ronde?.suit} Ronde {staat.rondeIndex + 1}</p>
        <h2>{staat.ronde?.naam}</h2>
        <p class="lood" style="margin-top:.5rem">{staat.ronde?.uitleg}</p>
      </div>
    {:else if staat.fase === 'vraag' && vraag}
      <div class="vraagkaart">
        <p class="opschrift">Vraag {vraag.index + 1} van {vraag.aantal} · {vraag.punten} punten</p>
        {#if vraag.emoji}<div class="emoji">{vraag.emoji}</div>{/if}
        {#if vraag.lyric}<p class="lyric">“{vraag.lyric}”</p>{/if}
        <p class="vraagtekst" style="font-size:clamp(1.1rem,4.5vw,1.6rem)">{vraag.tekst}</p>
        {#if vraag.opties}
          <div class="keuzes">
            {#each vraag.opties as optie, i}
              <button
                class="keuze" style="cursor:pointer;text-align:left"
                onclick={() => { antwoord = String.fromCharCode(65 + i); stuur(); }}
              >
                <span class="letter">{String.fromCharCode(65 + i)}</span><span>{optie}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      {#if vraag.type === 'waarnietwaar'}
        <div class="knoprij">
          <button class="knop groot" style="flex:1" onclick={() => { antwoord = 'Waar'; stuur(); }}>Waar</button>
          <button class="knop groot" style="flex:1" onclick={() => { antwoord = 'Niet waar'; stuur(); }}>Niet waar</button>
        </div>
      {:else if !vraag.opties}
        <input
          type={vraag.type === 'dichtstbij' ? 'number' : 'text'}
          inputmode={vraag.type === 'dichtstbij' ? 'numeric' : 'text'}
          bind:value={antwoord}
          placeholder={vraag.type === 'dichtstbij' ? 'Jullie getal' : 'Jullie antwoord'}
          onkeydown={(e) => e.key === 'Enter' && stuur()}
        />
        <button class="knop hoofd vol groot" onclick={stuur} disabled={bezig || !antwoord.trim()}>
          {alGestuurd || verstuurd ? 'Antwoord aanpassen' : 'Versturen'}
        </button>
      {/if}

      {#if melding}<p class="fijn">{melding}</p>{/if}
      {#if alGestuurd && !melding}<p class="fijn">Je antwoord staat genoteerd.</p>{/if}
    {:else if staat.fase === 'antwoord'}
      <div class="kaart" style="border-left:3px solid var(--groen)">
        <p class="opschrift stil">Het antwoord</p>
        <h2 style="color:var(--groen-licht)">{staat.onthulling?.antwoord}</h2>
        {#if staat.onthulling?.toelichting}<p class="lood" style="margin-top:.5rem">{staat.onthulling.toelichting}</p>{/if}
      </div>
    {:else if staat.fase === 'stand' || staat.fase === 'einde'}
      <div class="kaart">
        <p class="opschrift">{staat.fase === 'einde' ? 'Eindstand' : 'Tussenstand'}</p>
        <div class="stand">
          {#each staat.stand as r, i (r.spelerId)}
            <div class="standrij">
              <span style="font-family:var(--mono);color:var(--salie)">{i + 1}</span>
              {#if r.foto}<img class="avatar" src={r.foto} alt="" />{:else}<span class="avatar">{r.naam.slice(0, 2)}</span>{/if}
              <span class="standnaam">{r.naam}</span>
              <span class="standpunten">{r.punten}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

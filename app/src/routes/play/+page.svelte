<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { live } from '$lib/client/live.svelte';
  import Klok from '$lib/client/Klok.svelte';

  let antwoord = $state('');
  let verstuurd = $state(false);
  let bezig = $state(false);
  let melding = $state('');
  let laatsteSleutel = $state('');

  let staat = $derived(live.staat);
  let vraag = $derived(staat?.vraag ?? null);
  let ronde = $derived(staat?.ronde ?? null);
  let sleutel = $derived(`${staat?.rondeIndex ?? 0}:${vraag?.index ?? 0}`);
  let mijnTeam = $derived(staat?.teams.find((t) => t.leden.includes(live.spelerId ?? -1)) ?? null);
  let alGestuurd = $derived(mijnTeam ? (staat?.ingeleverd ?? []).includes(mijnTeam.id) : false);
  let teamRonde = $derived((ronde?.teamModus ?? 'individueel') === 'teams');

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

  async function stuur(tekst?: string) {
    if (bezig) return;
    if (tekst !== undefined) antwoord = tekst;
    if (!antwoord.trim()) return;
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

  function initialen(naam: string) {
    return naam.slice(0, 2);
  }
</script>

<svelte:head><title>Spelen — Blackjack Quiz 26/27</title></svelte:head>

<div class="scherm">
  <div class="romp" style="max-width:560px">
    <!-- Kop: waar zijn we, en hoeveel tijd is er nog -->
    <div style="display:flex;align-items:center;gap:.9rem">
      <span style="flex:1 1 auto;min-width:0">
        <p class="etiket">{ronde?.naam ?? 'Blackjack Quiz 26/27'}</p>
        <p class="fijn" style="margin-top:.15rem">
          {#if mijnTeam && teamRonde}
            Team {mijnTeam.suit} {mijnTeam.naam} — samen op één telefoon
          {:else}
            Ieder voor zich
          {/if}
        </p>
      </span>
      <Klok vorm="compact" />
    </div>

    <p class="verbinding">
      <span class="stip" class:aan={live.verbonden} class:uit={!live.verbonden}></span>
      {live.verbonden
        ? live.bron === 'stroom'
          ? 'verbonden'
          : 'verbonden (navragen)'
        : 'geen verbinding — je antwoord blijft staan'}
    </p>

    {#if !staat}
      <p class="fijn">Verbinden…</p>
    {:else if staat.fase === 'lobby'}
      <div class="paneel" in:fly={{ y: 16, duration: 420, easing: cubicOut }}>
        <p class="lood">Klaar om te beginnen. De quizmaster start zo.</p>
      </div>
    {:else if staat.fase === 'ronde'}
      <div class="paneel" in:fly={{ y: 16, duration: 420, easing: cubicOut }}>
        <p class="etiket">{ronde?.suit} Ronde {staat.rondeIndex + 1}</p>
        <h2 class="groot" style="font-size:1.6rem;margin-top:.4rem">{ronde?.naam}</h2>
        <p class="lood" style="font-size:1rem;margin-top:.6rem">{ronde?.uitleg}</p>
      </div>
    {:else if staat.fase === 'vraag' && vraag}
      {#key sleutel}
        <div class="tafelkaart" data-suit={ronde?.suit} style="padding:1.2rem">
          <p class="etiket">Vraag {vraag.index + 1} van {vraag.aantal} · {vraag.punten} {vraag.punten === 1 ? 'punt' : 'punten'}</p>
          {#if vraag.emoji}<div class="emoji" style="font-size:2.6rem">{vraag.emoji}</div>{/if}
          {#if vraag.lyric}<p class="lyric" style="font-size:1.25rem">“{vraag.lyric}”</p>{/if}
          <p class="vraagtekst" style="font-size:1.35rem">{vraag.tekst}</p>
        </div>
      {/key}

      {#if vraag.type === 'waarnietwaar'}
        <div class="knoprij" style="gap:.7rem">
          <button class="knop groot" style="flex:1" onclick={() => stuur('Waar')}>Waar</button>
          <button class="knop groot" style="flex:1" onclick={() => stuur('Niet waar')}>Niet waar</button>
        </div>
      {:else if vraag.opties}
        <div style="display:flex;flex-direction:column;gap:.6rem">
          {#each vraag.opties as optie, i}
            <button
              class="knop"
              style="justify-content:flex-start;gap:.9rem;padding:1rem;text-align:left;white-space:normal"
              onclick={() => stuur(String.fromCharCode(65 + i))}
            >
              <span class="letter" style="background:var(--goud);color:#1a1405;width:2rem;height:2rem;
                           display:grid;place-items:center;border-radius:50%;font-family:var(--mono);flex:0 0 auto">
                {String.fromCharCode(65 + i)}
              </span>
              <span>{optie}</span>
            </button>
          {/each}
        </div>
      {:else}
        <input
          type={vraag.type === 'dichtstbij' ? 'number' : 'text'}
          inputmode={vraag.type === 'dichtstbij' ? 'numeric' : 'text'}
          bind:value={antwoord}
          placeholder={vraag.type === 'dichtstbij' ? 'Jullie getal' : 'Jullie antwoord'}
          onkeydown={(e) => e.key === 'Enter' && stuur()}
        />
        <button class="knop hoofd vol groot" onclick={() => stuur()} disabled={bezig || !antwoord.trim()}>
          {alGestuurd || verstuurd ? 'Antwoord aanpassen' : 'Versturen'}
        </button>
      {/if}

      {#if melding}
        <p class="fijn" in:fade={{ duration: 220 }}>{melding}</p>
      {:else if alGestuurd}
        <p class="fijn" in:fade={{ duration: 220 }}>Je antwoord staat genoteerd.</p>
      {/if}
    {:else if staat.fase === 'antwoord'}
      <div class="onthulling" style="padding:1.2rem">
        <p class="etiket stil">Het antwoord</p>
        <p class="antwoordtekst" style="font-size:1.6rem">{staat.onthulling?.antwoord}</p>
        {#if staat.onthulling?.toelichting}
          <p class="toelichting" style="font-size:.95rem">{staat.onthulling.toelichting}</p>
        {/if}
      </div>
    {:else if staat.fase === 'stand' || staat.fase === 'einde'}
      <div class="paneel">
        <p class="etiket">{staat.fase === 'einde' ? 'Eindstand' : 'Tussenstand'}</p>
        <div class="stand" style="margin-top:.5rem">
          {#each staat.stand as r, i (r.spelerId)}
            <div class="standrij" style="--i:{i}">
              <span class="plek">{i + 1}</span>
              {#if r.foto}
                <img class="avatar" class:goud={i === 0} src={r.foto} alt="" />
              {:else}
                <span class="avatar" class:goud={i === 0}>{initialen(r.naam)}</span>
              {/if}
              <span class="naam" style="font-size:1.15rem">{r.naam}</span>
              <span class="standpunten" style="font-size:1.05rem">{r.punten}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

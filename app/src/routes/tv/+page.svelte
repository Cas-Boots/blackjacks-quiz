<script lang="ts">
  import { onMount } from 'svelte';
  import { live } from '$lib/client/live.svelte';
  import Klok from '$lib/client/Klok.svelte';

  let staat = $derived(live.staat);
  let vraag = $derived(staat?.vraag ?? null);

  onMount(() => {
    live.start();
    void live.meld('tv').catch(() => {});
    return () => live.stop();
  });
</script>

<svelte:head><title>Blackjack Quiz 26/27</title></svelte:head>

<div class="scherm">
  {#if staat && staat.fase !== 'lobby'}
    <header style="display:flex;align-items:center;gap:1.5rem;padding:1rem clamp(24px,4vw,80px);border-bottom:1px solid var(--rand-zacht)">
      <span style="font-size:2rem;color:var(--goud)">{staat.ronde?.suit}</span>
      <div style="flex:1 1 auto;min-width:0">
        <p class="opschrift stil">Ronde {staat.rondeIndex + 1} van {staat.rondeAantal}</p>
        <h2 style="font-size:clamp(1.2rem,2.4vw,2rem)">{staat.ronde?.naam}</h2>
      </div>
      {#if vraag}<span style="font-family:var(--mono);color:var(--salie)">Vraag {vraag.index + 1}/{vraag.aantal}</span>{/if}
      <Klok />
    </header>
  {/if}

  <div class="romp" style="justify-content:center">
    {#if !staat}
      <h1 style="text-align:center">Verbinden…</h1>
    {:else if staat.fase === 'lobby'}
      <div style="text-align:center;display:flex;flex-direction:column;gap:1.5rem;align-items:center">
        <p class="opschrift">Oud &amp; Nieuw</p>
        <h1 style="font-size:clamp(3rem,10vw,7rem);line-height:1">Blackjack Quiz 26/27</h1>
        <p class="lood" style="text-align:center">Pak je telefoon en kies je naam.</p>
        <div class="knoprij" style="justify-content:center">
          {#each staat.spelers as s (s.id)}
            <span class="kaart" style="display:flex;align-items:center;gap:.6rem;padding:.6rem 1rem">
              <span class="stip" class:aan={s.verbonden}></span>
              {#if s.foto}<img class="avatar" src={s.foto} alt="" />{:else}<span class="avatar">{s.naam.slice(0, 2)}</span>{/if}
              <strong>{s.naam}</strong>
            </span>
          {/each}
        </div>
      </div>
    {:else if staat.fase === 'ronde'}
      <div style="display:flex;flex-direction:column;gap:1.5rem">
        <p class="opschrift">{staat.ronde?.thema}</p>
        <h1 style="font-size:clamp(2.4rem,7vw,5rem)">{staat.ronde?.suit} {staat.ronde?.naam}</h1>
        <p class="lood" style="font-size:clamp(1rem,1.6vw,1.5rem)">{staat.ronde?.uitleg}</p>
        <div class="raster">
          {#each staat.teams as t (t.id)}
            <div class="kaart">
              <p style="font-family:var(--display);font-size:1.3rem;color:var(--goud-licht)">{t.suit} {t.naam}</p>
              <div class="knoprij" style="margin-top:.5rem">
                {#each t.leden as id}
                  {@const s = staat.spelers.find((x) => x.id === id)}
                  <span class="kaart" style="padding:.3rem .7rem;display:flex;align-items:center;gap:.4rem">
                    {#if s?.foto}<img class="avatar" style="width:1.6rem;height:1.6rem" src={s.foto} alt="" />{/if}
                    {s?.naam ?? '?'}
                  </span>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else if staat.fase === 'vraag' && vraag}
      <div class="vraagkaart">
        <p class="opschrift">Vraag {vraag.index + 1} · {vraag.punten} punten</p>
        {#if vraag.emoji}<div class="emoji">{vraag.emoji}</div>{/if}
        {#if vraag.lyric}<p class="lyric">“{vraag.lyric}”</p>{/if}
        <p class="vraagtekst">{vraag.tekst}</p>
        {#if vraag.opties}
          <div class="keuzes">
            {#each vraag.opties as optie, i}
              <div class="keuze"><span class="letter">{String.fromCharCode(65 + i)}</span><span>{optie}</span></div>
            {/each}
          </div>
        {/if}
      </div>
      <p class="fijn" style="text-align:center;margin-top:1rem">
        {staat.ingeleverd.length} van de {staat.teams.length} ingeleverd
      </p>
    {:else if staat.fase === 'antwoord' && vraag}
      <div style="display:flex;flex-direction:column;gap:1.5rem">
        <div class="vraagkaart">
          <p class="vraagtekst" style="font-size:clamp(1.1rem,2.2vw,1.8rem)">{vraag.tekst}</p>
          {#if vraag.opties}
            <div class="keuzes">
              {#each vraag.opties as optie, i}
                <div class="keuze" class:goed={i === staat.onthulling?.goedeOptie}>
                  <span class="letter">{String.fromCharCode(65 + i)}</span><span>{optie}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
        <div class="kaart" style="border-left:3px solid var(--groen)">
          <p class="opschrift stil">Het antwoord</p>
          <h1 style="color:var(--groen-licht);font-size:clamp(1.8rem,5vw,3.6rem)">{staat.onthulling?.antwoord}</h1>
          {#if staat.onthulling?.toelichting}<p class="lood" style="margin-top:.75rem">{staat.onthulling.toelichting}</p>{/if}
        </div>
      </div>
    {:else if staat.fase === 'stand' || staat.fase === 'einde'}
      <div style="display:flex;flex-direction:column;gap:1rem">
        <h1 style="font-size:clamp(2rem,6vw,4rem)">{staat.fase === 'einde' ? `${staat.stand[0]?.naam ?? ''} wint` : 'Tussenstand'}</h1>
        <div class="stand">
          {#each staat.stand as r, i (r.spelerId)}
            <div class="standrij">
              <span style="font-family:var(--mono);color:var(--salie)">{i + 1}</span>
              {#if r.foto}<img class="avatar groot" src={r.foto} alt="" />{:else}<span class="avatar groot">{r.naam.slice(0, 2)}</span>{/if}
              <span class="standnaam">{r.naam}</span>
              <span class="standpunten">{r.punten}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

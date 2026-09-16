<script lang="ts">
  import { onMount } from 'svelte';
  import { live } from '$lib/client/live.svelte';
  import Klok from '$lib/client/Klok.svelte';

  let inzendingen = $state<{ inzender: string; tekst: string; ingediendOp: number; isGoed: boolean | null; voorstel: { automatisch: boolean; goed: boolean; reden: string } | null }[]>([]);
  let gekozen = $state<Set<string>>(new Set());
  let bezig = $state(false);
  let fout = $state('');

  let staat = $derived(live.staat);
  let vraag = $derived(staat?.vraag ?? null);
  let dichtstbij = $derived(vraag?.type === 'dichtstbij');

  async function haalInzendingen() {
    if (!staat || (staat.fase !== 'vraag' && staat.fase !== 'antwoord')) {
      inzendingen = [];
      return;
    }
    try {
      const r = await fetch('/api/host/antwoorden', { cache: 'no-store' });
      if (!r.ok) return;
      const uit = await r.json();
      inzendingen = uit.inzendingen;
      gekozen = new Set(uit.inzendingen.filter((i: { isGoed: boolean | null }) => i.isGoed).map((i: { inzender: string }) => i.inzender));
    } catch { /* volgende keer weer */ }
  }

  // Bij elke wijziging van de stand de inzendingen opnieuw ophalen.
  $effect(() => {
    void staat?.versie;
    void haalInzendingen();
  });

  onMount(() => {
    live.start();
    return () => live.stop();
  });

  async function doe(opdracht: string, extra: Record<string, unknown> = {}) {
    if (bezig) return;
    bezig = true;
    fout = '';
    try {
      await live.opdracht(opdracht, extra);
    } catch (e) {
      fout = `Opdracht "${opdracht}" mislukte. Probeer opnieuw.`;
    } finally {
      bezig = false;
    }
  }

  function wissel(inzender: string) {
    const nieuw = new Set(gekozen);
    if (nieuw.has(inzender)) nieuw.delete(inzender);
    else nieuw.add(inzender);
    gekozen = nieuw;
    void doe('ken-toe', { inzenders: [...nieuw] });
  }

  function naamVan(inzender: string): string {
    const team = staat?.teams.find((t) => t.id === inzender);
    if (!team) return inzender;
    if (team.leden.length === 1) return team.naam;
    return `${team.suit} ${team.naam} (${team.leden.map((id) => staat?.spelers.find((s) => s.id === id)?.naam).join(', ')})`;
  }
</script>

<svelte:head><title>Hostscherm — Blackjack Quiz 26/27</title></svelte:head>

<div class="scherm">
  <div class="romp">
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
      <div style="flex:1 1 220px;min-width:0">
        <p class="etiket">Quizmaster · {staat?.fase ?? '…'}</p>
        <h2>{staat?.ronde?.naam ?? 'Blackjack Quiz 26/27'}</h2>
      </div>
      <Klok vorm="compact" />
      <p class="verbinding">
        <span class="stip" class:aan={live.verbonden} class:uit={!live.verbonden}></span>
        {live.bron === 'stroom' ? 'live' : live.bron === 'navragen' ? 'navragen' : 'geen verbinding'}
      </p>
    </div>

    {#if fout}<p class="let-op" style="border-color:var(--rood)">{fout}</p>{/if}

    <!-- Wie er op welke telefoon zit -->
    <div class="paneel">
      <p class="etiket stil">Telefoons</p>
      <div class="knoprij" style="margin-top:.5rem">
        {#each staat?.spelers ?? [] as s (s.id)}
          <span class="naamplaat" style="padding:.35rem .85rem">
            <span class="stip" class:aan={s.verbonden} class:uit={!s.verbonden}></span>
            {s.naam}
            {#if !s.verbonden && s.stilSinds !== null}<span class="fijn">{s.stilSinds}s stil</span>{/if}
            {#if s.stilSinds === null}<span class="fijn">nog niet gezien</span>{/if}
          </span>
        {/each}
      </div>
    </div>

    <!-- Bediening -->
    <div class="knoprij">
      {#if staat?.fase === 'lobby' || staat?.fase === 'ronde'}
        <button class="knop hoofd" onclick={() => doe('start-ronde')} disabled={bezig}>Start de ronde</button>
        <button class="knop" onclick={() => doe('herverdeel')} disabled={bezig}>Herverdeel teams</button>
      {:else if staat?.fase === 'vraag'}
        <button class="knop hoofd" onclick={() => doe('toon-antwoord')} disabled={bezig}>Toon het antwoord</button>
        <button class="knop" onclick={() => doe('klok-pauze')} disabled={bezig}>{staat.klok?.loopt ? 'Pauze' : 'Hervat'}</button>
        <button class="knop" onclick={() => doe('klok-verleng', { seconden: 30 })} disabled={bezig}>+30s</button>
      {:else if staat?.fase === 'antwoord'}
        {#if dichtstbij}
          <button class="knop" onclick={() => doe('bereken-dichtstbij')} disabled={bezig}>Bereken dichtstbij</button>
        {/if}
        <button class="knop hoofd" onclick={() => doe('volgende')} disabled={bezig}>Volgende vraag</button>
      {:else if staat?.fase === 'stand'}
        <button class="knop hoofd" onclick={() => doe('naar-ronde', { ronde: (staat?.rondeIndex ?? 0) + 1 })} disabled={bezig}>Volgende ronde</button>
        <button class="knop" onclick={() => doe('naar-einde')} disabled={bezig}>Naar de uitslag</button>
      {/if}
      <button class="knop stil" onclick={() => doe('vorige')} disabled={bezig}>← Terug</button>
    </div>

    <!-- Antwoorden beoordelen -->
    {#if staat?.fase === 'vraag' || staat?.fase === 'antwoord'}
      <div class="paneel">
        <p class="etiket stil">
          Ingeleverd — {inzendingen.length} van {staat.teams.length}
          {#if staat.fase === 'vraag'}<span class="fijn"> (antwoorden blijven verborgen tot je ze onthult)</span>{/if}
        </p>
        {#if staat.fase === 'antwoord'}
          <p class="fijn" style="margin:.5rem 0">Tik aan wie het goed had. De stand loopt meteen mee.</p>
          <div style="display:flex;flex-direction:column;gap:.4rem;margin-top:.5rem">
            {#each inzendingen as i (i.inzender)}
              <button
                class="inzending"
                class:goedgekeurd={gekozen.has(i.inzender)}
                onclick={() => wissel(i.inzender)}
              >
                <span class="vink">✓</span>
                <span>
                  <strong>{naamVan(i.inzender)}</strong><br />
                  <span class="tekst">{i.tekst || '— niets —'}</span>
                </span>
                {#if i.voorstel}
                  <span class="fijn" style="text-align:right">
                    {i.voorstel.automatisch ? (i.voorstel.goed ? 'lijkt goed' : 'lijkt fout') : i.voorstel.reden}
                  </span>
                {/if}
              </button>
            {:else}
              <p class="fijn">Niemand heeft iets ingeleverd.</p>
            {/each}
          </div>
        {:else}
          <div class="knoprij" style="margin-top:.5rem">
            {#each staat.teams as t (t.id)}
              <span class="naamplaat" style="padding:.35rem .85rem">
                <span class="stip" class:aan={staat.ingeleverd.includes(t.id)}></span>{t.naam}
              </span>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Stand -->
    <div class="paneel">
      <p class="etiket stil">Stand</p>
      <div class="stand">
        {#each staat?.stand ?? [] as r, i (r.spelerId)}
          <div class="standrij" class:leider={i === 0}>
            <span style="font-family:var(--mono);color:var(--salie)">{i + 1}</span>
            <span></span>
            <span class="naam" style="font-size:1.1rem">{r.naam}</span>
            <span style="display:flex;gap:.4rem;align-items:center">
              <button class="knop stil" onclick={() => doe('corrigeer', { spelerId: r.spelerId, punten: -1 })}>−</button>
              <span class="standpunten" style="font-size:1.1rem">{r.punten}</span>
              <button class="knop stil" onclick={() => doe('corrigeer', { spelerId: r.spelerId, punten: 1 })}>+</button>
            </span>
          </div>
        {/each}
      </div>
    </div>

    <div class="knoprij">
      <a class="knop stil" href="/tv" target="_blank" rel="noreferrer">Televisiescherm openen</a>
      <button class="knop stil" onclick={() => doe('naar-ronde', { ronde: 0 })} disabled={bezig}>Naar ronde 1</button>
    </div>
  </div>
</div>

<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { live } from '$lib/client/live.svelte';
  import Klok from '$lib/client/Klok.svelte';
  import { houdWakker } from '$lib/client/wakker';
  import type { LogRegel } from '$lib/shared/state';

  type Voorstel = { automatisch: boolean; goed: boolean; reden: string };
  type Inzending = { inzender: string; tekst: string; ingediendOp: number; isGoed: boolean | null; voorstel: Voorstel | null };
  type RondeInfo = {
    pakketIndex: number; speelIndex: number | null; naam: string; suit: string; thema: string; type: string;
    teamModus: string; tijd: number; punten: number; optioneel: boolean; teVullen: boolean; cijfers: string | null; gekozen: number[];
    vragen: { index: number; tekst: string; antwoord: string; teVullen: boolean; live: boolean; media: string | null; gekozen: boolean }[];
  };
  type RecapStatus = {
    bron: 'live' | 'bestand' | 'ingebouwd';
    exportedAt: string | null;
    geladenOp: string | null;
    aantalEntries: number;
    personen: string[];
    liveAdres: string | null;
    bezig: boolean;
    fout: string | null;
  };
  type RondesAntwoord = {
    pakket: string;
    pakketten: { id: string; naam: string; beschrijving: string }[];
    fase: string;
    rondes: RondeInfo[];
    recap: RecapStatus;
    huidige: { tekst: string; antwoord: string; toelichting: string | null } | null;
  };

  let inzendingen = $state<Inzending[]>([]);
  let gekozen = $state<Set<string>>(new Set());
  let bezig = $state(false);
  let fout = $state('');
  let rondesInfo = $state<RondesAntwoord | null>(null);
  /** De samenstelling zoals hij op het scherm staat; pas na 'Bewaar' gaat hij naar de server. */
  let keuze = $state<Record<number, Set<number>>>({});
  let keuzeGewijzigd = $state(false);
  let logboek = $state<LogRegel[]>([]);
  let gastNaam = $state('');
  let porMelding = $state('');

  let staat = $derived(live.staat);
  let vraag = $derived(staat?.vraag ?? null);
  let dichtstbij = $derived(vraag?.type === 'dichtstbij');
  let stemvraag = $derived(vraag?.type === 'stem');
  /** Wie er nog niets heeft ingeleverd bij de open vraag. */
  let achterblijvers = $derived((staat?.teams ?? []).filter((t) => !(staat?.ingeleverd ?? []).includes(t.id)));
  let laatsteTerug = $derived(logboek.find((r) => r.terugTeDraaien) ?? null);
  /** Zolang er niet gespeeld is, mag de samenstelling nog veranderen. */
  let samenstellingVrij = $derived(staat?.fase === 'lobby');
  /** Deze ronde eindigt met de cijfers van het jaar. */
  let metCijfers = $derived(!!staat?.ronde?.cijfers);
  let laatsteVraag = $derived(!!vraag && vraag.index + 1 >= vraag.aantal);
  let cijfersBezig = $state(false);

  /* ---- Het jaaroverzicht ----------------------------------------------
     De film loopt op de klok van de server. Dit scherm kijkt mee en tikt
     hem door zodra een dia afgelopen is; pauzeren is gewoon de klok
     pauzeren. Staat er geen hostscherm open, dan blijft de dia staan en
     kun je hem met de hand doorzetten — er gaat niets stuk. */
  let film = $derived(staat?.fase === 'jaaroverzicht' ? staat.jaaroverzicht : null);
  /** De laatste dia die dit scherm heeft doorgetikt, zodat het dat niet twee keer doet. */
  let doorgetikt = -1;
  onMount(() => {
    const t = setInterval(() => {
      const st = live.staat;
      const dia = st?.fase === 'jaaroverzicht' ? st.jaaroverzicht : null;
      if (!dia || !st?.klok?.loopt || bezig) return;
      if (live.resterendMs() > 0 || doorgetikt === dia.stap) return;
      doorgetikt = dia.stap;
      void doe('volgende', { stap: dia.stap });
    }, 250);
    return () => clearInterval(t);
  });

  async function verversCijfers() {
    cijfersBezig = true;
    try {
      await doe('ververs-cijfers');
      await haalRondes();
    } finally {
      cijfersBezig = false;
    }
  }
  function tijdstip(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  const bronNaam: Record<string, string> = { live: 'live uit resolution-recap', bestand: 'uit een bestand', ingebouwd: 'ingebouwde momentopname' };
  let lijktGoed = $derived(inzendingen.filter((i) => i.voorstel?.automatisch && i.voorstel.goed).map((i) => i.inzender));
  let nogTeVullen = $derived(
    (rondesInfo?.rondes ?? []).reduce((n, r) => n + r.vragen.filter((v) => v.teVullen && (keuze[r.pakketIndex]?.has(v.index) ?? false)).length, 0),
  );

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
      gekozen = new Set(uit.inzendingen.filter((i: Inzending) => i.isGoed).map((i: Inzending) => i.inzender));
    } catch { /* volgende keer weer */ }
  }

  async function haalRondes() {
    try {
      const r = await fetch('/api/host/rondes', { cache: 'no-store' });
      if (!r.ok) return;
      const uit: RondesAntwoord = await r.json();
      rondesInfo = uit;
      if (!keuzeGewijzigd) {
        keuze = Object.fromEntries(uit.rondes.map((rd) => [rd.pakketIndex, new Set(rd.gekozen)]));
      }
    } catch { /* volgende keer weer */ }
  }

  async function haalLogboek() {
    try {
      const r = await fetch('/api/host/logboek', { cache: 'no-store' });
      if (!r.ok) return;
      logboek = (await r.json()).regels;
    } catch { /* volgende keer weer */ }
  }

  // Bij elke wijziging van de stand de inzendingen, de rondes en het logboek opnieuw ophalen.
  $effect(() => {
    void staat?.versie;
    void haalInzendingen();
    void haalRondes();
    void haalLogboek();
  });

  onMount(() => {
    live.start();
    const laatSlapen = houdWakker();
    window.addEventListener('keydown', opToets);
    return () => {
      live.stop();
      laatSlapen();
      window.removeEventListener('keydown', opToets);
    };
  });

  /** Een por naar één speler, of naar iedereen die nog niets heeft ingeleverd. */
  async function por(spelerId?: number) {
    try {
      const uit = await live.opdracht('por', spelerId !== undefined ? { spelerId } : {});
      porMelding = uit.aantal ? `Por verstuurd naar ${uit.aantal} ${uit.aantal === 1 ? 'telefoon' : 'telefoons'}.` : 'Iedereen heeft al ingeleverd.';
    } catch {
      porMelding = 'Porren lukte niet.';
    }
    setTimeout(() => (porMelding = ''), 3000);
  }

  async function voegGastToe() {
    const naam = gastNaam.trim();
    if (!naam) return;
    await doe('voeg-speler-toe', { naam });
    if (!fout) gastNaam = '';
  }

  function tijdVan(ms: number) {
    return new Date(ms).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  async function doe(opdracht: string, extra: Record<string, unknown> = {}) {
    if (bezig) return;
    bezig = true;
    fout = '';
    try {
      await live.opdracht(opdracht, extra);
    } catch (e) {
      let reden = '';
      try {
        reden = JSON.parse(String((e as Error).message)).message ?? '';
      } catch { /* geen JSON */ }
      fout = reden || `Opdracht "${opdracht}" mislukte. Probeer opnieuw.`;
    } finally {
      bezig = false;
    }
  }

  /** De hoofdknop van dit moment — dezelfde die de spatiebalk indrukt. */
  function hoofdactie() {
    const f = staat?.fase;
    if (f === 'jaaroverzicht') return doe('volgende');
    if (f === 'lobby' || f === 'ronde') return doe('start-ronde');
    if (f === 'vraag') return doe('toon-antwoord');
    if (f === 'antwoord' || f === 'cijfers') return doe('volgende');
    if (f === 'stand') return doe('naar-ronde', { ronde: (staat?.rondeIndex ?? 0) + 1 });
  }

  /* Sneltoetsen, zoals in de losse quiz: spatie is 'verder', pijl-links is
     'terug'. Alleen als je niet in een invoerveld staat. */
  function opToets(e: KeyboardEvent) {
    const doel = e.target as HTMLElement | null;
    if (doel && (doel.tagName === 'INPUT' || doel.tagName === 'TEXTAREA' || doel.isContentEditable)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    switch (e.key) {
      case ' ':
      case 'Enter':
      case 'ArrowRight':
        e.preventDefault();
        void hoofdactie();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        void doe('vorige');
        break;
      case 'p':
      case 'P':
        if (staat?.fase === 'vraag' || staat?.fase === 'jaaroverzicht') void doe('klok-pauze');
        break;
      case 't':
      case 'T':
        if (staat?.fase === 'vraag') void doe('klok-verleng', { seconden: 30 });
        break;
      case 'm':
      case 'M':
        if (vraag?.media && vraag.media.soort !== 'beeld') void doe('media-wissel');
        break;
      case 'a':
      case 'A':
        if (staat?.fase === 'antwoord' && lijktGoed.length) neemVoorstellenOver();
        break;
      case 'z':
      case 'Z':
        if (laatsteTerug) void doe('ongedaan');
        break;
    }
  }

  function wissel(inzender: string) {
    const nieuw = new Set(gekozen);
    if (nieuw.has(inzender)) nieuw.delete(inzender);
    else nieuw.add(inzender);
    gekozen = nieuw;
    void doe('ken-toe', { inzenders: [...nieuw] });
  }

  /** Vinkt alles aan wat de machine met zekerheid goed vond. De rest blijft aan jou. */
  function neemVoorstellenOver() {
    const nieuw = new Set([...gekozen, ...lijktGoed]);
    gekozen = nieuw;
    void doe('ken-toe', { inzenders: [...nieuw] });
  }

  function naamVan(inzender: string): string {
    const team = staat?.teams.find((t) => t.id === inzender);
    if (!team) return inzender;
    if (team.leden.length === 1) return team.naam;
    return `${team.suit} ${team.naam} (${team.leden.map((id) => staat?.spelers.find((s) => s.id === id)?.naam).join(', ')})`;
  }

  function secondenNa(ms: number) {
    return `${(ms / 1000).toFixed(1)}s`;
  }

  /* ---- Samenstelling ---------------------------------------------- */
  function wisselRonde(r: RondeInfo) {
    const huidig = keuze[r.pakketIndex] ?? new Set<number>();
    const nieuw = huidig.size ? new Set<number>() : new Set(r.vragen.filter((v) => !v.teVullen).map((v) => v.index));
    // Een ronde die alleen uit te vullen vragen bestaat, zet je bewust in zijn geheel aan.
    if (!huidig.size && !nieuw.size) r.vragen.forEach((v) => nieuw.add(v.index));
    keuze = { ...keuze, [r.pakketIndex]: nieuw };
    keuzeGewijzigd = true;
  }
  function wisselVraag(r: RondeInfo, index: number) {
    const nieuw = new Set(keuze[r.pakketIndex] ?? []);
    if (nieuw.has(index)) nieuw.delete(index);
    else nieuw.add(index);
    keuze = { ...keuze, [r.pakketIndex]: nieuw };
    keuzeGewijzigd = true;
  }
  async function bewaarSamenstelling() {
    const uit: Record<string, number[]> = {};
    for (const [k, v] of Object.entries(keuze)) uit[k] = [...v].sort((a, b) => a - b);
    await doe('zet-samenstelling', { samenstelling: uit });
    keuzeGewijzigd = false;
    await haalRondes();
  }
  function herstelSamenstelling() {
    keuzeGewijzigd = false;
    void haalRondes();
  }
  async function nieuwSpel(pakket: string) {
    const naam = rondesInfo?.pakketten.find((p) => p.id === pakket)?.naam ?? pakket;
    if (!confirm(`Nieuw spel beginnen met "${naam}"? De huidige stand blijft bewaard, maar telt niet meer mee.`)) return;
    keuzeGewijzigd = false;
    await doe('nieuw-spel', { pakket });
  }

  const typeNaam: Record<string, string> = {
    waarnietwaar: 'waar of niet waar', meerkeuze: 'meerkeuze', open: 'open', dichtstbij: 'dichtstbij',
  };
</script>

<svelte:head><title>Hostscherm — Blackjack Quiz 26/27</title></svelte:head>

<div class="scherm">
  <div class="romp" style="max-width:1100px">
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
      <div style="flex:1 1 220px;min-width:0">
        <p class="etiket">Quizmaster · {staat?.fase ?? '…'}</p>
        <h2>{film ? `Het jaaroverzicht — ${film.soort === 'maand' ? film.titel : film.kop}` : (staat?.ronde?.naam ?? 'Blackjack Quiz 26/27')}</h2>
      </div>
      <Klok vorm="compact" />
      <p class="verbinding">
        <span class="stip" class:aan={live.verbonden} class:uit={!live.verbonden}></span>
        {live.bron === 'stroom' ? 'live' : live.bron === 'navragen' ? 'navragen' : 'geen verbinding'}
      </p>
    </div>

    {#if fout}<p class="let-op" style="border-color:var(--rood)" in:fade={{ duration: 200 }}>{fout}</p>{/if}

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
        <span class="knoprij" style="gap:.4rem">
          <input type="text" bind:value={gastNaam} placeholder="Gast toevoegen" maxlength="24" style="max-width:11rem;padding:.35rem .7rem" onkeydown={(e) => e.key === 'Enter' && voegGastToe()} aria-label="Naam van de gast" />
          <button class="knop stil" onclick={voegGastToe} disabled={bezig || !gastNaam.trim()}>+ Gast</button>
        </span>
      </div>
    </div>

    <!-- Waar de cijfers van resolution-recap vandaan komen -->
    {#if rondesInfo?.recap}
      {@const r = rondesInfo.recap}
      <div class="paneel" style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <div style="flex:1 1 260px;min-width:0">
          <p class="etiket stil">Cijfers van het jaar</p>
          <p style="margin:.3rem 0 0">
            <strong>{bronNaam[r.bron] ?? r.bron}</strong>
            <span class="fijn"> · export van {tijdstip(r.exportedAt)} · {r.aantalEntries} regels · {r.personen.join(', ')}</span>
          </p>
          {#if r.fout}
            <p class="fijn" style="color:var(--rood-licht);margin:.3rem 0 0">Verversen mislukte: {r.fout}. De vorige cijfers staan nog.</p>
          {:else if !r.liveAdres}
            <p class="fijn" style="margin:.3rem 0 0">Geen live bron ingesteld (RECAP_URL en RECAP_TOKEN). Zie app/README.md.</p>
          {/if}
        </div>
        <button class="knop" onclick={verversCijfers} disabled={bezig || cijfersBezig || r.bezig}>
          {cijfersBezig || r.bezig ? 'Bezig…' : r.liveAdres ? 'Ververs de cijfers' : 'Herlaad de cijfers'}
        </button>
      </div>
    {/if}

    <!-- De vraag die nu open staat, met een spiekbriefje dat je zelf openklapt -->
    {#if vraag && (staat?.fase === 'vraag' || staat?.fase === 'antwoord')}
      <div class="paneel host-vraag">
        <p class="etiket stil">Vraag {vraag.index + 1} van {vraag.aantal} · {typeNaam[vraag.type] ?? vraag.type} · {vraag.punten} {vraag.punten === 1 ? 'punt' : 'punten'}</p>
        {#if vraag.lyric}<p class="fijn" style="font-style:italic;margin-top:.4rem">“{vraag.lyric}”</p>{/if}
        <p class="host-vraagtekst">{vraag.emoji ? vraag.emoji + ' ' : ''}{vraag.tekst}</p>
        {#if vraag.opties}
          <p class="fijn" style="margin-top:.3rem">{vraag.opties.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('  ·  ')}</p>
        {/if}
        {#if vraag.media}<p class="fijn" style="margin-top:.3rem">Fragment: {vraag.media.soort}</p>{/if}
        {#if rondesInfo?.huidige}
          <details class="spiek" open={staat?.fase === 'antwoord'}>
            <summary>Spiekbriefje</summary>
            <p><strong>{rondesInfo.huidige.antwoord}</strong></p>
            {#if rondesInfo.huidige.toelichting}<p class="fijn">{rondesInfo.huidige.toelichting}</p>{/if}
          </details>
        {/if}
      </div>
    {/if}

    <!-- Bediening -->
    <div class="knoprij">
      {#if staat?.fase === 'jaaroverzicht' && film}
        <span class="fijn">
          {film.soort === 'titel' ? 'Titelkaart' : film.soort === 'slot' ? 'Slotkaart' : film.titel}
          · dia {film.stap + 1} van {film.stappen}
          · {film.onthuld ? 'de film' : 'de trailer'}
        </span>
        <button class="knop hoofd" onclick={() => doe('volgende')} disabled={bezig}>
          {film.stap + 1 < film.stappen ? 'Volgende dia' : film.onthuld ? 'Terug naar de uitslag' : 'Naar ronde 1'}
        </button>
        <button class="knop" onclick={() => doe('klok-pauze')} disabled={bezig}>
          {staat.klok?.loopt ? '⏸ Pauze' : '▶ Laat lopen'}
        </button>
        {#if !film.onthuld}
          <button class="knop stil" onclick={() => doe('naar-ronde', { ronde: 0 })} disabled={bezig || keuzeGewijzigd}>De trailer overslaan</button>
        {/if}
      {:else if staat?.fase === 'lobby' || staat?.fase === 'ronde'}
        {#if staat?.fase === 'lobby'}
          <button class="knop hoofd" onclick={() => doe('jaaroverzicht', { stap: 0 })} disabled={bezig || keuzeGewijzigd}>
            🎞 Start de trailer
          </button>
        {/if}
        <button class="knop" class:hoofd={staat?.fase === 'ronde'} onclick={() => doe('start-ronde')} disabled={bezig || keuzeGewijzigd}>Start de ronde</button>
        <button class="knop" onclick={() => doe('herverdeel')} disabled={bezig}>Herverdeel teams</button>
        {#if staat?.fase === 'lobby'}
          <button class="knop" onclick={() => doe('naar-ronde', { ronde: 0 })} disabled={bezig || keuzeGewijzigd}>Toon ronde 1</button>
        {/if}
      {:else if staat?.fase === 'vraag'}
        <button class="knop hoofd" onclick={() => doe('toon-antwoord')} disabled={bezig}>Toon het antwoord</button>
        <button class="knop" onclick={() => doe('klok-pauze')} disabled={bezig}>{staat.klok?.loopt ? 'Pauze' : 'Hervat'}</button>
        <button class="knop" onclick={() => doe('klok-verleng', { seconden: 30 })} disabled={bezig}>+30s</button>
        {#if vraag?.media && vraag.media.soort !== 'beeld'}
          <button class="knop" onclick={() => doe('media-wissel')} disabled={bezig}>
            {staat.mediaSpeelt ? '⏸ Fragment stoppen' : '▶ Fragment afspelen'}
          </button>
        {/if}
        {#if achterblijvers.length}
          <button class="knop" onclick={() => por()} disabled={bezig} title="Een trilling en een zin naar wie nog niets heeft ingeleverd">
            👉 Por de achterblijvers ({achterblijvers.length})
          </button>
        {/if}
      {:else if staat?.fase === 'antwoord'}
        {#if vraag?.media && vraag.media.soort !== 'beeld'}
          <button class="knop" onclick={() => doe('media-wissel')} disabled={bezig}>
            {staat.mediaSpeelt ? '⏸ Fragment stoppen' : '▶ Nog eens afspelen'}
          </button>
        {/if}
        {#if dichtstbij || stemvraag}
          <button class="knop" onclick={() => doe('bereken')} disabled={bezig}>Opnieuw berekenen</button>
        {/if}
        <button class="knop hoofd" onclick={() => doe('volgende')} disabled={bezig}>
          {!laatsteVraag ? 'Volgende vraag' : metCijfers ? 'Naar de cijfers' : 'Naar de tussenstand'}
        </button>
        {#if metCijfers && laatsteVraag}
          <button class="knop stil" onclick={() => doe('naar-stand')} disabled={bezig}>Cijfers overslaan</button>
        {/if}
      {:else if staat?.fase === 'cijfers' && staat.cijfers}
        <span class="fijn">
          {staat.cijfers.stap === 0 ? 'Overzicht' : staat.cijfers.soort === 'voorspellingen' ? `Voorspelling ${staat.cijfers.stap}` : staat.cijfers.personen[staat.cijfers.stap - 1]?.naam}
          · {staat.cijfers.stap + 1} van {staat.cijfers.stappen}
        </span>
        <button class="knop hoofd" onclick={() => doe('volgende')} disabled={bezig}>
          {staat.cijfers.stap + 1 < staat.cijfers.stappen ? 'Volgende' : 'Naar de tussenstand'}
        </button>
        {#if staat.cijfers.stap + 1 < staat.cijfers.stappen}
          <button class="knop stil" onclick={() => doe('naar-stand')} disabled={bezig}>Naar de tussenstand</button>
        {/if}
      {:else if staat?.fase === 'einde'}
        <button class="knop hoofd" onclick={() => doe('jaaroverzicht', { stap: 0 })} disabled={bezig}>
          🎞 De film: het hele jaar
        </button>
      {:else if staat?.fase === 'stand'}
        {#if (staat.rondeIndex ?? 0) + 1 < staat.rondeAantal}
          <button class="knop hoofd" onclick={() => doe('naar-ronde', { ronde: (staat?.rondeIndex ?? 0) + 1 })} disabled={bezig}>Volgende ronde</button>
        {/if}
        <button class="knop" class:hoofd={(staat.rondeIndex ?? 0) + 1 >= staat.rondeAantal} onclick={() => doe('naar-einde')} disabled={bezig}>Naar de uitslag</button>
      {/if}
      {#if staat?.fase !== 'lobby'}
        <button class="knop stil" onclick={() => doe('vorige')} disabled={bezig}>← Terug</button>
      {/if}
      {#if laatsteTerug}
        <button class="knop stil" onclick={() => doe('ongedaan')} disabled={bezig} title={laatsteTerug.omschrijving}>↶ Ongedaan: {laatsteTerug.omschrijving}</button>
      {/if}
      {#if metCijfers && staat?.fase !== 'cijfers' && staat?.fase !== 'lobby'}
        <button class="knop stil" onclick={() => doe('toon-cijfers', { stap: 0 })} disabled={bezig}>
          {staat?.ronde?.cijfers === 'voorspellingen' ? 'Toon de voorspellingen' : 'Toon de cijfers van het jaar'}
        </button>
      {/if}
    </div>
    {#if porMelding}<p class="fijn" in:fade={{ duration: 200 }}>{porMelding}</p>{/if}
    <p class="fijn">Sneltoetsen: <kbd>spatie</kbd> verder · <kbd>←</kbd> terug · <kbd>P</kbd> pauze · <kbd>T</kbd> +30s · <kbd>M</kbd> fragment · <kbd>A</kbd> vink aan wat goed lijkt · <kbd>Z</kbd> ongedaan</p>

    <!-- Antwoorden beoordelen -->
    {#if staat?.fase === 'vraag' || staat?.fase === 'antwoord'}
      <div class="paneel">
        <p class="etiket stil">
          Ingeleverd — {inzendingen.length} van {staat.teams.length}
          {#if staat.fase === 'vraag'}<span class="fijn"> (antwoorden blijven verborgen tot je ze onthult)</span>{/if}
        </p>
        {#if staat.fase === 'antwoord'}
          {#if dichtstbij}
            <p class="fijn" style="margin:.5rem 0">De machine heeft bij de onthulling uitgerekend wie het dichtst zat. Tik aan om zelf te corrigeren.</p>
          {:else if stemvraag}
            <p class="fijn" style="margin:.5rem 0">Wie met de meerderheid meestemde heeft de punten al. Tik aan om zelf te corrigeren.</p>
          {:else}
            <p class="fijn" style="margin:.5rem 0">Tik aan wie het goed had. De stand loopt meteen mee.</p>
          {/if}
          {#if lijktGoed.length && lijktGoed.some((id) => !gekozen.has(id))}
            <button class="knop" style="margin-bottom:.6rem" onclick={neemVoorstellenOver} disabled={bezig}>
              ✓ Vink de {lijktGoed.length} aan die goed lijken
            </button>
          {/if}
          <div style="display:flex;flex-direction:column;gap:.4rem;margin-top:.2rem">
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
                <span class="fijn" style="text-align:right">
                  {#if i.voorstel}
                    {i.voorstel.automatisch ? (i.voorstel.goed ? 'lijkt goed' : 'lijkt fout') : i.voorstel.reden}
                  {/if}
                  {#each staat.inzendingen.filter((p) => p.inzender === i.inzender && p.naMs !== null) as p (p.inzender)}
                    <br /><span style="font-family:var(--mono)">{secondenNa(p.naMs as number)}</span>
                  {/each}
                </span>
              </button>
            {:else}
              <p class="fijn">Niemand heeft iets ingeleverd.</p>
            {/each}
          </div>
        {:else}
          <div class="knoprij" style="margin-top:.5rem">
            {#each staat.teams as t (t.id)}
              {#if staat.ingeleverd.includes(t.id)}
                <span class="naamplaat" style="padding:.35rem .85rem">
                  <span class="stip aan"></span>{t.naam}
                </span>
              {:else}
                <button class="naamplaat" style="padding:.35rem .85rem;cursor:pointer" onclick={() => t.leden.forEach((id) => por(id))} title="Por {t.naam}">
                  <span class="stip"></span>{t.naam} 👉
                </button>
              {/if}
            {/each}
          </div>
          <p class="fijn" style="margin-top:.4rem">Tik op een naam om die telefoon te porren.</p>
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
              <button class="knop stil" onclick={() => doe('corrigeer', { spelerId: r.spelerId, punten: -1 })} aria-label="Een punt eraf voor {r.naam}">−</button>
              <span class="standpunten" style="font-size:1.1rem">{r.punten}</span>
              <button class="knop stil" onclick={() => doe('corrigeer', { spelerId: r.spelerId, punten: 1 })} aria-label="Een punt erbij voor {r.naam}">+</button>
            </span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Wat er tot nu toe gebeurde, met een terugweg -->
    {#if logboek.length}
      <details class="paneel">
        <summary><span class="etiket stil">Logboek</span> <span class="fijn">{logboek[0].omschrijving}</span></summary>
        <div class="logboek">
          {#each logboek as r (r.id)}
            <div class="logregel" class:ongedaan={r.isOngedaan}>
              <span class="tijd">{tijdVan(r.aangemaaktOp)}</span>
              <span>{r.omschrijving}</span>
            </div>
          {/each}
        </div>
      </details>
    {/if}

    <!-- De rondes: wat er meedoet, en waar je heen kunt springen -->
    {#if rondesInfo}
      <details class="paneel rondes" open={samenstellingVrij}>
        <summary>
          <span class="etiket stil">Rondes</span>
          <span class="fijn">
            {rondesInfo.rondes.filter((r) => (keuze[r.pakketIndex]?.size ?? 0) > 0).length} van {rondesInfo.rondes.length} doen mee
            {#if nogTeVullen}· <span style="color:var(--rood-licht)">{nogTeVullen} gekozen {nogTeVullen === 1 ? 'vraag mist' : 'vragen missen'} nog een antwoord</span>{/if}
          </span>
        </summary>
        {#if samenstellingVrij}
          <p class="fijn" style="margin:.5rem 0 .8rem">Vink aan welke rondes en vragen vanavond meedoen. Dit kan alleen vóór de eerste vraag.</p>
        {:else}
          <p class="fijn" style="margin:.5rem 0 .8rem">De samenstelling ligt vast zodra er gespeeld is. Spring hier naar een andere ronde.</p>
        {/if}
        <div class="rondelijst">
          {#each rondesInfo.rondes as r (r.pakketIndex)}
            {@const aantal = keuze[r.pakketIndex]?.size ?? 0}
            {@const doetMee = aantal > 0}
            <div class="ronderij" class:uit={!doetMee} class:nu={r.speelIndex !== null && r.speelIndex === staat?.rondeIndex && staat?.fase !== 'lobby'}>
              {#if samenstellingVrij}
                <input type="checkbox" checked={doetMee} onchange={() => wisselRonde(r)} aria-label="{r.naam} doet mee" />
              {:else}
                <span class="volgnummer">{r.speelIndex !== null ? r.speelIndex + 1 : '·'}</span>
              {/if}
              <details class="rondedetails">
                <summary>
                  <span class="suit" class:rood={r.suit === '♥' || r.suit === '♦'}>{r.suit}</span>
                  <strong>{r.naam}</strong>
                  <span class="fijn">{r.thema} · {typeNaam[r.type] ?? r.type} · {r.teamModus} · {aantal}/{r.vragen.length} vragen</span>
                  {#if r.teVullen || r.vragen.some((v) => v.teVullen)}<span class="badge rood">te vullen</span>{/if}
                  {#if r.cijfers}<span class="badge">{r.cijfers === 'voorspellingen' ? 'met de voorspellingen' : 'met de cijfers van het jaar'}</span>{/if}
                  {#if r.optioneel}<span class="badge">optioneel</span>{/if}
                </summary>
                <ol class="vragenlijst">
                  {#each r.vragen as v (v.index)}
                    <li class:teVullen={v.teVullen} class:uit={!(keuze[r.pakketIndex]?.has(v.index) ?? false)}>
                      {#if samenstellingVrij}
                        <input type="checkbox" checked={keuze[r.pakketIndex]?.has(v.index) ?? false} onchange={() => wisselVraag(r, v.index)} aria-label="Vraag {v.index + 1} doet mee" />
                      {/if}
                      <span>
                        {v.tekst}
                        {#if v.live}<span class="fijn" style="color:var(--groen-licht)"> · live</span>{/if}
                        {#if v.media}<span class="fijn"> [{v.media}]</span>{/if}
                        <br /><span class="fijn" style="color:{v.teVullen ? 'var(--rood-licht)' : 'var(--groen-licht)'}">{v.antwoord || '—'}</span>
                      </span>
                    </li>
                  {/each}
                </ol>
              </details>
              {#if !samenstellingVrij && r.speelIndex !== null}
                <button class="knop stil" onclick={() => doe('naar-ronde', { ronde: r.speelIndex })} disabled={bezig}>Ga →</button>
              {/if}
            </div>
          {/each}
        </div>
        {#if samenstellingVrij && keuzeGewijzigd}
          <div class="knoprij" style="margin-top:.8rem">
            <button class="knop hoofd" onclick={bewaarSamenstelling} disabled={bezig}>Bewaar samenstelling</button>
            <button class="knop stil" onclick={herstelSamenstelling} disabled={bezig}>Herstel</button>
          </div>
        {/if}
      </details>
    {/if}

    <div class="knoprij">
      <a class="knop stil" href="/tv" target="_blank" rel="noreferrer">Televisiescherm openen</a>
      <a class="knop stil" href="/uitslag" target="_blank" rel="noreferrer">Uitslagen</a>
      <a class="knop stil" href="/beheer">Beheer</a>
      {#if staat?.fase !== 'lobby'}
        <button class="knop stil" onclick={() => doe('naar-lobby')} disabled={bezig}>Terug naar de lobby</button>
      {/if}
      {#if rondesInfo}
        {#each rondesInfo.pakketten as p (p.id)}
          <button class="knop stil" onclick={() => nieuwSpel(p.id)} disabled={bezig}>Nieuw spel: {p.naam}</button>
        {/each}
      {/if}
    </div>
  </div>
</div>

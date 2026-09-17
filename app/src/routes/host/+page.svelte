<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { live } from '$lib/client/live.svelte';
  import Klok from '$lib/client/Klok.svelte';

  type Voorstel = { automatisch: boolean; goed: boolean; reden: string };
  type Inzending = { inzender: string; tekst: string; ingediendOp: number; isGoed: boolean | null; voorstel: Voorstel | null };
  type RondeInfo = {
    pakketIndex: number; speelIndex: number | null; naam: string; suit: string; thema: string; type: string;
    teamModus: string; tijd: number; punten: number; optioneel: boolean; teVullen: boolean; gekozen: number[];
    vragen: { index: number; tekst: string; antwoord: string; teVullen: boolean; media: string | null; gekozen: boolean }[];
  };
  type RondesAntwoord = {
    pakket: string;
    pakketten: { id: string; naam: string; beschrijving: string }[];
    fase: string;
    rondes: RondeInfo[];
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

  let staat = $derived(live.staat);
  let vraag = $derived(staat?.vraag ?? null);
  let dichtstbij = $derived(vraag?.type === 'dichtstbij');
  /** Zolang er niet gespeeld is, mag de samenstelling nog veranderen. */
  let samenstellingVrij = $derived(staat?.fase === 'lobby');
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

  // Bij elke wijziging van de stand de inzendingen en de rondes opnieuw ophalen.
  $effect(() => {
    void staat?.versie;
    void haalInzendingen();
    void haalRondes();
  });

  onMount(() => {
    live.start();
    window.addEventListener('keydown', opToets);
    return () => {
      live.stop();
      window.removeEventListener('keydown', opToets);
    };
  });

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
    if (f === 'lobby' || f === 'ronde') return doe('start-ronde');
    if (f === 'vraag') return doe('toon-antwoord');
    if (f === 'antwoord') return doe('volgende');
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
        if (staat?.fase === 'vraag') void doe('klok-pauze');
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
        <h2>{staat?.ronde?.naam ?? 'Blackjack Quiz 26/27'}</h2>
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
      </div>
    </div>

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
      {#if staat?.fase === 'lobby' || staat?.fase === 'ronde'}
        <button class="knop hoofd" onclick={() => doe('start-ronde')} disabled={bezig || keuzeGewijzigd}>Start de ronde</button>
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
      {:else if staat?.fase === 'antwoord'}
        {#if vraag?.media && vraag.media.soort !== 'beeld'}
          <button class="knop" onclick={() => doe('media-wissel')} disabled={bezig}>
            {staat.mediaSpeelt ? '⏸ Fragment stoppen' : '▶ Nog eens afspelen'}
          </button>
        {/if}
        {#if dichtstbij}
          <button class="knop" onclick={() => doe('bereken-dichtstbij')} disabled={bezig}>Bereken dichtstbij</button>
        {/if}
        <button class="knop hoofd" onclick={() => doe('volgende')} disabled={bezig}>
          {vraag && vraag.index + 1 < vraag.aantal ? 'Volgende vraag' : 'Naar de tussenstand'}
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
    </div>
    <p class="fijn">Sneltoetsen: <kbd>spatie</kbd> verder · <kbd>←</kbd> terug · <kbd>P</kbd> pauze · <kbd>T</kbd> +30s · <kbd>M</kbd> fragment · <kbd>A</kbd> vink aan wat goed lijkt</p>

    <!-- Antwoorden beoordelen -->
    {#if staat?.fase === 'vraag' || staat?.fase === 'antwoord'}
      <div class="paneel">
        <p class="etiket stil">
          Ingeleverd — {inzendingen.length} van {staat.teams.length}
          {#if staat.fase === 'vraag'}<span class="fijn"> (antwoorden blijven verborgen tot je ze onthult)</span>{/if}
        </p>
        {#if staat.fase === 'antwoord'}
          {#if dichtstbij}
            <p class="fijn" style="margin:.5rem 0">Druk op <em>Bereken dichtstbij</em>; de winnaar krijgt dan vanzelf de punten. Tik aan om zelf te corrigeren.</p>
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
              <button class="knop stil" onclick={() => doe('corrigeer', { spelerId: r.spelerId, punten: -1 })} aria-label="Een punt eraf voor {r.naam}">−</button>
              <span class="standpunten" style="font-size:1.1rem">{r.punten}</span>
              <button class="knop stil" onclick={() => doe('corrigeer', { spelerId: r.spelerId, punten: 1 })} aria-label="Een punt erbij voor {r.naam}">+</button>
            </span>
          </div>
        {/each}
      </div>
    </div>

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

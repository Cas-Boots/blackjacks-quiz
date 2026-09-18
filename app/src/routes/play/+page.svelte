<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { live } from '$lib/client/live.svelte';
  import Klok from '$lib/client/Klok.svelte';
  import Media from '$lib/client/Media.svelte';
  import Cijfers from '$lib/client/Cijfers.svelte';
  import Podium from '$lib/client/Podium.svelte';
  import { maakPortret } from '$lib/client/portret';
  import { houdWakker } from '$lib/client/wakker';
  import { prijsIcoon } from '$lib/shared/prijzen';
  import { kies, kanteling, JUICH, TROOST, NIETS_INGELEVERD, REACTIES } from '$lib/shared/kwinkslagen';

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
  let mijnNaam = $derived(staat?.spelers.find((s) => s.id === live.spelerId)?.naam ?? null);
  /** Wie er bij de cijfers op de televisie staat, om dat op de telefoon te kunnen zeggen. */
  let opTv = $derived(
    staat?.cijfers && staat.cijfers.soort !== 'voorspellingen' && staat.cijfers.stap > 0
      ? staat.cijfers.personen[staat.cijfers.stap - 1]?.naam ?? null
      : null,
  );
  let alGestuurd = $derived(mijnTeam ? (staat?.ingeleverd ?? []).includes(mijnTeam.id) : false);
  let teamRonde = $derived((ronde?.teamModus ?? 'individueel') === 'teams');
  /* Dezelfde sfeer als op de televisie, zodat de telefoon meekleurt. */
  let sfeer = $derived(
    staat && staat.fase !== 'lobby' && staat.fase !== 'einde' ? (ronde?.sfeer ?? 'vilt') : 'vilt',
  );

  // Bij een nieuwe vraag het veld leegmaken.
  $effect(() => {
    if (sleutel !== laatsteSleutel) {
      laatsteSleutel = sleutel;
      antwoord = '';
      verstuurd = false;
      melding = '';
    }
  });

  /* ---- Jouw uitslag bij de onthulling ---------------------------------
     De server stuurt bij de onthulling alle antwoorden en de uitdeling van
     deze vraag mee. Daaruit volgt precies één zin voor deze telefoon. */
  let mijnInzending = $derived(
    mijnTeam ? (staat?.inzendingen ?? []).find((i) => i.inzender === mijnTeam.id) ?? null : null,
  );
  let mijnPunten = $derived(live.spelerId != null ? (staat?.uitdeling?.[live.spelerId] ?? 0) : 0);
  let uitslag = $derived.by((): 'goed' | 'fout' | 'wacht' | 'niets' | null => {
    if (!staat || staat.fase !== 'antwoord') return null;
    if (!mijnInzending) return 'niets';
    if (mijnPunten > 0) return 'goed';
    if (mijnInzending.isGoed === false) return 'fout';
    return 'wacht';
  });

  // Een trilling bij het oordeel: kort en blij, of één lange voor 'helaas'.
  let vorigeUitslag = $state<string | null>(null);
  $effect(() => {
    const nu = uitslag;
    if (nu !== vorigeUitslag) {
      if (nu === 'goed') tril([40, 60, 40, 60, 80]);
      else if (nu === 'fout') tril([120]);
      vorigeUitslag = nu;
    }
  });
  function tril(patroon: number[]) {
    try {
      navigator.vibrate?.(patroon);
    } catch {
      /* geen trilmotor, geen probleem */
    }
  }

  /* Dezelfde zin als op de televisie: gekozen op de vraag, niet op toeval. */
  let kwinkslag = $derived(
    uitslag === 'goed' ? kies(JUICH, `${sleutel}:${live.spelerId}`)
      : uitslag === 'fout' ? kies(TROOST, `${sleutel}:${live.spelerId}`)
        : uitslag === 'niets' ? kies(NIETS_INGELEVERD, `${sleutel}:${live.spelerId}`)
          : '',
  );
  let kantelingNu = $derived(kanteling(sleutel));

  /* ---- Reacties naar de televisie ----------------------------------- */
  let laatsteReactie = $state('');
  async function reageer(emoji: string) {
    laatsteReactie = emoji;
    try {
      navigator.vibrate?.(20);
    } catch { /* geen trilmotor */ }
    try {
      await live.reageer(emoji);
    } catch { /* de volgende komt wel door */ }
    setTimeout(() => (laatsteReactie = ''), 500);
  }

  /* ---- Waar sta je ------------------------------------------------- */
  let mijnPlek = $derived((staat?.stand ?? []).findIndex((r) => r.spelerId === live.spelerId) + 1);
  let winnaars = $derived((staat?.stand ?? []).filter((r, _, alle) => alle.length && r.punten === alle[0].punten));
  let winZin = $derived(
    winnaars.length === 0 ? 'Niemand wint' : winnaars.length === 1 ? `${winnaars[0].naam} wint` : `${winnaars.map((w) => w.naam).join(' & ')} winnen`,
  );
  let ikWin = $derived(winnaars.some((w) => w.spelerId === live.spelerId));
  let rangwoord = $derived(
    mijnPlek === 1 ? 'Je staat bovenaan.' : mijnPlek > 0 ? `Je staat ${mijnPlek}e van ${staat?.stand.length ?? 0}.` : '',
  );

  onMount(() => {
    live.start();
    // Een telefoon die op slot gaat, mist de vraag. Dus: wakker blijven.
    const laatSlapen = houdWakker();
    return () => {
      live.stop();
      laatSlapen();
    };
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

  /* ---- Je portret ---------------------------------------------------
     Een selfie vanaf de telefoon, verkleind vóór het versturen. Hij staat
     daarna op de televisie bij je naam, in de stand en op het podium. */
  let ik = $derived(staat?.spelers.find((s) => s.id === live.spelerId) ?? null);
  let fotoBezig = $state(false);
  let fotoMelding = $state('');
  let fotoInvoer = $state<HTMLInputElement | null>(null);

  async function kiesFoto(e: Event) {
    const bestand = (e.target as HTMLInputElement).files?.[0];
    if (!bestand) return;
    fotoBezig = true;
    fotoMelding = '';
    try {
      const foto = await maakPortret(bestand);
      const r = await fetch('/api/foto', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ foto }),
      });
      if (!r.ok) throw new Error(await r.text());
      fotoMelding = 'Je staat op het scherm.';
    } catch {
      fotoMelding = 'Dat lukte niet. Probeer een andere foto.';
    } finally {
      fotoBezig = false;
      if (fotoInvoer) fotoInvoer.value = '';
    }
  }
</script>

<svelte:head><title>Spelen — Blackjack Quiz 26/27</title></svelte:head>

<div class="scherm" data-sfeer={sfeer}>
  <div class="motief" aria-hidden="true"></div>
  <div class="romp" style="max-width:560px">
    <!-- Kop: waar zijn we, en hoeveel tijd is er nog -->
    <div style="display:flex;align-items:center;gap:.9rem">
      {#if ik}
        <button class="portretknop" onclick={() => fotoInvoer?.click()} disabled={fotoBezig} aria-label="Foto kiezen">
          {#if ik.foto}<img class="avatar" src={ik.foto} alt="" />{:else}<span class="avatar">{initialen(ik.naam)}</span>{/if}
        </button>
      {/if}
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

    {#if live.por}
      <p class="por" role="alert" in:fly={{ y: -12, duration: 260, easing: cubicOut }} out:fade={{ duration: 300 }}>
        👉 {live.por.tekst}
      </p>
    {/if}

    {#if !staat}
      <p class="fijn">Verbinden…</p>
    {:else if staat.fase === 'lobby'}
      <div class="paneel" in:fly={{ y: 16, duration: 420, easing: cubicOut }}>
        <p class="etiket">Je doet mee{ik ? ` als ${ik.naam}` : ''}</p>
        <p class="lood" style="font-size:1rem;margin-top:.4rem">Je staat op de televisie. De quizmaster start zo.</p>
      </div>
      <div class="paneel" style="display:flex;gap:1rem;align-items:center" in:fly={{ y: 16, duration: 420, delay: 80, easing: cubicOut }}>
        {#if ik?.foto}<img class="avatar l" src={ik.foto} alt="" />{:else}<span class="avatar l">{initialen(ik?.naam ?? '?')}</span>{/if}
        <span style="flex:1 1 auto;min-width:0">
          <p class="lood" style="font-size:1rem">{ik?.foto ? 'Mooi. Zo sta je op het podium.' : 'Zet je gezicht op het scherm.'}</p>
          <button class="knop" style="margin-top:.6rem" onclick={() => fotoInvoer?.click()} disabled={fotoBezig}>
            {fotoBezig ? 'Bezig…' : ik?.foto ? 'Andere foto' : 'Selfie of foto kiezen'}
          </button>
          {#if fotoMelding}<p class="fijn" style="margin-top:.4rem">{fotoMelding}</p>{/if}
        </span>
      </div>
    {:else if staat.fase === 'ronde'}
      <div class="paneel" in:fly={{ y: 16, duration: 420, easing: cubicOut }}>
        <p class="etiket">{ronde?.suit} Ronde {staat.rondeIndex + 1}</p>
        <h2 class="groot" style="font-size:1.6rem;margin-top:.4rem">{ronde?.naam}</h2>
        <p class="lood" style="font-size:1rem;margin-top:.6rem">{ronde?.uitleg}</p>
      </div>
    {:else if staat.fase === 'vraag' && vraag}
      {#key sleutel}
        <div class="tafelkaart" data-suit={ronde?.suit} style="padding:1.2rem;--kanteling:{kantelingNu}deg">
          <p class="etiket">Vraag {vraag.index + 1} van {vraag.aantal} · {vraag.punten} {vraag.punten === 1 ? 'punt' : 'punten'}</p>
          {#if vraag.emoji}<div class="emoji" style="font-size:2.6rem">{vraag.emoji}</div>{/if}
          {#if vraag.lyric}<p class="lyric" style="font-size:1.25rem">“{vraag.lyric}”</p>{/if}
          <p class="vraagtekst" style="font-size:1.35rem">{vraag.tekst}</p>
          {#if vraag.media}
            <Media media={vraag.media} alleenBeeld klein />
          {/if}
        </div>
      {/key}

      {#if vraag.type === 'waarnietwaar'}
        <div class="knoprij" style="gap:.7rem">
          <button class="knop groot" class:gekozen={antwoord === 'Waar'} style="flex:1" onclick={() => stuur('Waar')}>Waar</button>
          <button class="knop groot" class:gekozen={antwoord === 'Niet waar'} style="flex:1" onclick={() => stuur('Niet waar')}>Niet waar</button>
        </div>
      {:else if vraag.type === 'stem' && vraag.opties}
        <p class="fijn">Tik op een naam. Wie met de meerderheid meestemt, krijgt de punten.</p>
        <div class="raster">
          {#each vraag.opties as naam (naam)}
            {@const sp = staat.spelers.find((x) => x.naam === naam)}
            <button class="knop groot stemknop" class:gekozen={antwoord === naam} onclick={() => stuur(naam)}>
              {#if sp?.foto}<img class="avatar" src={sp.foto} alt="" />{:else}<span class="avatar">{initialen(naam)}</span>{/if}
              {naam}
            </button>
          {/each}
        </div>
      {:else if vraag.opties}
        <div style="display:flex;flex-direction:column;gap:.6rem">
          {#each vraag.opties as optie, i}
            <button
              class="knop"
              class:gekozen={antwoord === String.fromCharCode(65 + i)}
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
        <!-- Bewust geen type="number": dan wordt de waarde een getal en valt
             de knop uit; bovendien mag "1,5" gewoon. Het toetsenbord blijft numeriek. -->
        <input
          type="text"
          inputmode={vraag.type === 'dichtstbij' ? 'decimal' : 'text'}
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
      {#key uitslag}
        <div class="uitslag" data-uitslag={uitslag} in:fly={{ y: 14, duration: 360, easing: cubicOut }}>
          {#if uitslag === 'goed'}
            <span class="stempel groen" style="--hoek:8deg">Goed!</span>
            <span class="teken">✓</span>
            <span>
              <strong>{kwinkslag}</strong>
              <span class="plus">+{mijnPunten}</span>
              <span class="fijn">{mijnPunten === 1 ? 'punt' : 'punten'}{teamRonde ? ' voor het hele team' : ''}</span>
            </span>
          {:else if uitslag === 'fout'}
            <span class="stempel" style="--hoek:-9deg">Mis</span>
            <span class="teken">✗</span>
            <span><strong>{kwinkslag}</strong> <span class="fijn">Jullie hadden: “{mijnInzending?.tekst}”</span></span>
          {:else if uitslag === 'wacht'}
            <span class="teken">…</span>
            <span><strong>De quizmaster kijkt ernaar.</strong> <span class="fijn">Jullie hadden: “{mijnInzending?.tekst}”</span></span>
          {:else}
            <span class="teken">—</span>
            <span><strong>{kwinkslag}</strong></span>
          {/if}
        </div>
      {/key}
      <div class="onthulling" style="padding:1.2rem">
        <p class="etiket stil">Het antwoord</p>
        <p class="antwoordtekst" style="font-size:1.6rem">{staat.onthulling?.antwoord}</p>
        {#if staat.onthulling?.toelichting}
          <p class="toelichting" style="font-size:.95rem">{staat.onthulling.toelichting}</p>
        {/if}
        {#if staat.onthulling?.stemmen?.length}
          <div class="stemtelling" style="margin-top:.8rem">
            {#each staat.onthulling.stemmen as t (t.naam)}
              <p class="fijn" style="display:flex;justify-content:space-between;gap:.8rem;padding:.15rem 0">
                <span>{t.naam}</span>
                <span style="font-family:var(--mono)">{t.aantal} {t.aantal === 1 ? 'stem' : 'stemmen'}</span>
              </p>
            {/each}
          </div>
        {/if}
      </div>
      <div class="reactierij" aria-label="Reageer op de televisie">
        {#each REACTIES as emoji (emoji)}
          <button onclick={() => reageer(emoji)} aria-label="Stuur {emoji}" style={laatsteReactie === emoji ? 'transform:scale(1.25) rotate(-8deg)' : ''}>{emoji}</button>
        {/each}
      </div>
      {#if staat.inzendingen.length > 1}
        <div class="paneel" style="padding:.9rem 1rem">
          <p class="etiket stil" style="margin-bottom:.4rem">Wat de rest had</p>
          {#each staat.inzendingen as i (i.inzender)}
            {@const team = staat.teams.find((t) => t.id === i.inzender)}
            <p class="fijn" style="display:flex;justify-content:space-between;gap:.8rem;padding:.2rem 0;color:var(--ivoor-zacht)">
              <span style="color:var(--salie)">{team ? (team.leden.length === 1 && !teamRonde ? team.naam : `${team.suit} ${team.naam}`) : '?'}</span>
              <span style="text-align:right">{i.tekst || '—'} {i.isGoed === true ? '✓' : i.isGoed === false ? '✗' : ''}</span>
            </p>
          {/each}
        </div>
      {/if}
    {:else if staat.fase === 'cijfers' && staat.cijfers}
      {#key staat.cijfers.stap}
        <div class="paneel" in:fly={{ y: 14, duration: 360, easing: cubicOut }}>
          <p class="etiket">{ronde?.suit} {ronde?.naam} · de cijfers</p>
          {#if staat.cijfers.soort !== 'voorspellingen' && !staat.cijfers.personen.some((p) => p.naam === mijnNaam)}
            <p class="fijn" style="margin-top:.5rem">Van jou zijn er geen cijfers bijgehouden. Kijk mee op de televisie.</p>
          {:else}
            {#if opTv && opTv !== mijnNaam}<p class="fijn" style="margin:.3rem 0 .6rem">Op de televisie: {opTv}. Dit is jouw jaar.</p>{/if}
            <div style="margin-top:.6rem">
              <Cijfers cijfers={staat.cijfers} spelers={staat.spelers} compact alleen={mijnNaam} />
            </div>
          {/if}
        </div>
      {/key}
    {:else if staat.fase === 'stand' || staat.fase === 'einde'}
      {#if staat.fase === 'einde'}
        <div class="paneel" style="text-align:center" in:fly={{ y: 16, duration: 420, easing: cubicOut }}>
          <p class="etiket">De uitslag</p>
          <h2 class="groot" style="font-size:1.8rem;margin-top:.3rem">{winZin}</h2>
          {#if ikWin}<p class="lood" style="font-size:1rem;margin-top:.3rem">Dat ben jij. Gefeliciteerd!</p>{/if}
        </div>
        <div style="padding:1.6rem .2rem .2rem">
          <Podium top3={staat.stand.slice(0, 3)} compact />
        </div>
        {#if staat.prijzen.length}
          <div class="paneel">
            <p class="etiket stil">Prijzen</p>
            {#each staat.prijzen as p (p.sleutel)}
              <p style="display:flex;gap:.6rem;align-items:baseline;margin:.5rem 0 0">
                <span aria-hidden="true">{prijsIcoon(p.sleutel)}</span>
                <span><strong>{p.titel}:</strong> {p.namen.length ? p.namen.join(' & ') : ''} <span class="fijn">{p.namen.length ? '— ' : ''}{p.detail}</span></span>
              </p>
            {/each}
          </div>
        {/if}
        <a class="knop vol" href="/uitslag/{staat.spelId}">Bekijk en deel de uitslag</a>
      {/if}
      <div class="reactierij" aria-label="Reageer op de televisie">
        {#each REACTIES as emoji (emoji)}
          <button onclick={() => reageer(emoji)} aria-label="Stuur {emoji}" style={laatsteReactie === emoji ? 'transform:scale(1.25) rotate(-8deg)' : ''}>{emoji}</button>
        {/each}
      </div>
      <div class="paneel">
        <p class="etiket">{staat.fase === 'einde' ? 'Eindstand' : 'Tussenstand'}</p>
        {#if rangwoord}<p class="lood" style="font-size:1.05rem;margin-top:.3rem">{rangwoord}</p>{/if}
        <div class="stand" style="margin-top:.5rem">
          {#each staat.stand as r, i (r.spelerId)}
            <div class="standrij" class:leider={i === 0} class:ik={r.spelerId === live.spelerId} style="--i:{i}">
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
    <input bind:this={fotoInvoer} type="file" accept="image/*" capture="user" onchange={kiesFoto} hidden />
  </div>
</div>

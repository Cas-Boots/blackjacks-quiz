<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { live } from '$lib/client/live.svelte';
  import Klok from '$lib/client/Klok.svelte';
  import Teller from '$lib/client/Teller.svelte';
  import Confetti from '$lib/client/Confetti.svelte';
  import { flip } from 'svelte/animate';
  import * as geluid from '$lib/client/geluid';

  let staat = $derived(live.staat);
  let vraag = $derived(staat?.vraag ?? null);
  let ronde = $derived(staat?.ronde ?? null);
  let rood = $derived(ronde?.suit === '♥' || ronde?.suit === '♦');
  /* Bij een individuele ronde is elke speler zijn eigen "team". Die als
     teamkaarten tonen zet iedere naam twee keer op het scherm; dan is een
     rij naamplaten eerlijker én rustiger. */
  let inTeams = $derived((ronde?.teamModus ?? 'individueel') === 'teams');
  /* Buiten een ronde om — aanmelden en uitslag — staat de tafel in zijn
     eigen kleuren, zodat begin en eind herkenbaar bij elkaar horen. */
  let sfeer = $derived(
    staat && staat.fase !== 'lobby' && staat.fase !== 'einde' ? (ronde?.sfeer ?? 'vilt') : 'vilt',
  );

  /** Eén sleutel per dia, zodat Svelte de overgang echt opnieuw speelt. */
  let diaSleutel = $derived(
    `${staat?.fase ?? 'leeg'}:${staat?.rondeIndex ?? 0}:${vraag?.index ?? 0}`,
  );

  let top3 = $derived((staat?.stand ?? []).slice(0, 3));
  /** Tweede, eerste, derde — zoals een echt podium staat. */
  let podiumVolgorde = $derived(top3.length === 3 ? [1, 0, 2] : top3.map((_, i) => i));
  const medailles = ['🥇', '🥈', '🥉'];

  function initialen(naam: string) {
    return naam.slice(0, 2);
  }

  /* ---- Geluid ---------------------------------------------------------
     Browsers laten pas geluid toe na een echte aanraking, dus de eerste klik
     of toetsaanslag wekt de audio. Tot dat moment staat er een discrete
     hint in beeld. */
  let geluidAan = $state(true);
  let gewekt = $state(false);

  function wekGeluid() {
    geluid.wek();
    gewekt = geluid.isGewekt();
  }

  function wisselGeluid() {
    wekGeluid();
    geluidAan = !geluidAan;
    geluid.zetAan(geluidAan);
  }

  /* ---- De stand: eerst de oude volgorde, dan schuiven ------------------
     Het scorebord verschijnt in de volgorde van vóór deze ronde en gaat pas
     daarna naar de nieuwe. Dat is het moment waar het bij een quiz om draait:
     je ziet iemand stijgen. */
  let toonNieuweVolgorde = $state(false);

  let standOud = $derived(
    [...(staat?.stand ?? [])].sort((a, b) => {
      const pa = live.vorigePunten[a.spelerId] ?? a.punten;
      const pb = live.vorigePunten[b.spelerId] ?? b.punten;
      return pb - pa || a.naam.localeCompare(b.naam, 'nl');
    }),
  );
  let standNu = $derived(toonNieuweVolgorde ? (staat?.stand ?? []) : standOud);

  /* ---- Geluidsmomenten -------------------------------------------------
     Elk geluid hangt aan een overgang, niet aan een toestand. Zonder deze
     vergelijking met de vorige waarde zou elke binnenkomende momentopname
     het geluid opnieuw afspelen. */
  let vorigeFase = $state('');
  let vorigeVraag = $state('');
  let vorigAantalIngeleverd = $state(0);
  let vorigeSeconde = $state(99);
  let vorigePuntenSom = $state(-1);

  $effect(() => {
    const st = live.staat;
    if (!st) return;
    const vraagSleutel = `${st.rondeIndex}:${st.vraag?.index ?? -1}`;

    if (st.fase !== vorigeFase) {
      if (st.fase === 'ronde') geluid.rondeStart();
      if (st.fase === 'antwoord') geluid.onthul();
      if (st.fase === 'stand' || st.fase === 'einde') {
        toonNieuweVolgorde = false;
        geluid.roffel();
        // Even de oude volgorde laten staan, dan laten schuiven.
        setTimeout(() => (toonNieuweVolgorde = true), 900);
        if (st.fase === 'einde') setTimeout(() => geluid.fanfare(), 1100);
      }
      vorigeFase = st.fase;
    }

    if (st.fase === 'vraag' && vraagSleutel !== vorigeVraag) {
      geluid.vraagOp();
      vorigeVraag = vraagSleutel;
      vorigAantalIngeleverd = 0;
      vorigeSeconde = 99;
    }

    if (st.fase === 'vraag' && st.ingeleverd.length > vorigAantalIngeleverd) {
      geluid.ingeleverd();
    }
    vorigAantalIngeleverd = st.ingeleverd.length;

    // Punten erbij tijdens de onthulling: een kort signaal.
    const som = st.stand.reduce((n, r) => n + r.punten, 0);
    if (vorigePuntenSom >= 0 && som > vorigePuntenSom && st.fase === 'antwoord') geluid.juist();
    vorigePuntenSom = som;
  });

  /* ---- Aftikken in de laatste seconden -------------------------------- */
  let restSec = $state(99);
  onMount(() => {
    const t = setInterval(() => {
      const st = live.staat;
      if (!st?.klok?.loopt) {
        restSec = 99;
        return;
      }
      const sec = Math.ceil(live.resterendMs() / 1000);
      restSec = sec;
      if (sec < vorigeSeconde && sec <= 5 && sec > 0) geluid.tik(sec <= 3);
      if (sec <= 0 && vorigeSeconde > 0) geluid.tijdOm();
      vorigeSeconde = sec;
    }, 120);
    return () => clearInterval(t);
  });

  let spanning = $derived(restSec <= 5 && live.staat?.klok?.loopt === true);

  onMount(() => {
    live.start();
    void live.meld('tv').catch(() => {});
    const opGebaar = () => wekGeluid();
    window.addEventListener('pointerdown', opGebaar, { once: true });
    window.addEventListener('keydown', opGebaar, { once: true });
    return () => {
      live.stop();
      window.removeEventListener('pointerdown', opGebaar);
      window.removeEventListener('keydown', opGebaar);
    };
  });
</script>

<svelte:head><title>Blackjack Quiz 26/27</title></svelte:head>

<div class="scherm" class:spanning data-sfeer={sfeer}>
  <!-- Motief dat bij het onderwerp hoort; fluisterend, nooit storend. -->
  <div class="motief" aria-hidden="true"></div>
  <!-- Randgloed in de laatste seconden. Puur sfeer, vangt geen klikken. -->
  <div class="spanningsrand" aria-hidden="true"></div>

  <button
    class="geluidsknop"
    onclick={wisselGeluid}
    title={gewekt ? (geluidAan ? 'Geluid uit' : 'Geluid aan') : 'Klik om geluid aan te zetten'}
    aria-label={geluidAan ? 'Geluid uit' : 'Geluid aan'}
  >
    {#if !gewekt}🔇 klik voor geluid{:else if geluidAan}🔊{:else}🔈{/if}
  </button>

  <!-- De rondekop hoort bij het spel, niet bij het aanmelden of de uitslag. -->
  {#if staat && staat.fase !== 'lobby' && staat.fase !== 'einde'}
    <header class="rail">
      <span class="suit" class:rood>{ronde?.suit}</span>
      <span class="titel">
        <p class="etiket stil">Ronde {staat.rondeIndex + 1} van {staat.rondeAantal}</p>
        <h2>{ronde?.naam}</h2>
      </span>
      {#if vraag}
        <span class="vorderingen" aria-hidden="true">
          {#each Array(vraag.aantal) as _, i}
            <i class:gehad={i < vraag.index} class:nu={i === vraag.index}></i>
          {/each}
        </span>
        <span class="teller">{vraag.index + 1} / {vraag.aantal}</span>
      {/if}
      <Klok vorm="ring" />
    </header>
  {/if}

  {#key diaSleutel}
    <div class="romp midden" in:fade={{ duration: 260, easing: cubicOut }}>
      {#if !staat}
        <h1 class="groot" style="text-align:center;color:var(--salie)">Verbinden…</h1>

        <!-- ══ Aanmeldscherm ══════════════════════════════════════════ -->
      {:else if staat.fase === 'lobby'}
        <div style="display:flex;flex-direction:column;gap:clamp(1rem,3vh,2.5rem);align-items:center;text-align:center">
          <p class="etiket" in:fly={{ y: -14, duration: 500, easing: cubicOut }}>Oud &amp; Nieuw · Blackjacks</p>
          <h1 class="mega" in:fly={{ y: 26, duration: 620, easing: cubicOut }}>Blackjack Quiz 26/27</h1>
          <hr class="rule" style="width:min(620px,70vw)" />
          <p class="lood" style="text-align:center">Pak je telefoon en kies je naam.</p>

          <div class="knoprij" style="justify-content:center;margin-top:1rem">
            {#each staat.spelers as s, i (s.id)}
              <span class="naamplaat" class:aan={s.verbonden} in:fly={{ y: 18, duration: 420, delay: 120 + i * 90, easing: cubicOut }}>
                <span class="stip" class:aan={s.verbonden}></span>
                {#if s.foto}
                  <img class="avatar" src={s.foto} alt="" />
                {:else}
                  <span class="avatar">{initialen(s.naam)}</span>
                {/if}
                <strong>{s.naam}</strong>
              </span>
            {/each}
          </div>
        </div>

        <!-- ══ Titelkaart van de ronde ════════════════════════════════ -->
      {:else if staat.fase === 'ronde'}
        <div style="display:flex;flex-direction:column;gap:clamp(.9rem,2.4vh,2rem)">
          <p class="etiket" in:fly={{ x: -20, duration: 460, easing: cubicOut }}>
            Ronde {staat.rondeIndex + 1} · {ronde?.thema}
          </p>
          <h1 class="mega" in:fly={{ y: 28, duration: 620, delay: 80, easing: cubicOut }}>
            <span style="color:{rood ? 'var(--rood-licht)' : 'var(--goud)'}">{ronde?.suit}</span>
            {ronde?.naam}
          </h1>
          <hr class="rule" style="animation-delay:.3s" />
          <p class="lood" in:fly={{ y: 16, duration: 520, delay: 300, easing: cubicOut }}>{ronde?.uitleg}</p>

          {#if inTeams}
            <div class="raster" style="margin-top:clamp(.5rem,2vh,1.5rem)">
              {#each staat.teams as t, i (t.id)}
                <div class="teamkaart" in:fly={{ y: 24, duration: 480, delay: 420 + i * 110, easing: cubicOut }}>
                  <span class="kop">
                    <span class="suit" class:rood={t.suit === '♥' || t.suit === '♦'}>{t.suit}</span>
                    {t.naam}
                  </span>
                  <div class="knoprij">
                    {#each t.leden as id (id)}
                      {@const sp = staat.spelers.find((x) => x.id === id)}
                      <span class="naamplaat" style="padding:.35rem .8rem .35rem .35rem">
                        {#if sp?.foto}
                          <img class="avatar" style="width:1.9rem;height:1.9rem" src={sp.foto} alt="" />
                        {:else}
                          <span class="avatar" style="width:1.9rem;height:1.9rem;font-size:.7rem">{initialen(sp?.naam ?? '?')}</span>
                        {/if}
                        {sp?.naam ?? '?'}
                      </span>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div style="display:flex;flex-direction:column;gap:.9rem;margin-top:clamp(.5rem,2vh,1.5rem)">
              <p class="etiket stil">Ieder voor zich</p>
              <div class="knoprij">
                {#each staat.spelers as sp, i (sp.id)}
                  <span class="naamplaat" in:fly={{ y: 20, duration: 440, delay: 420 + i * 90, easing: cubicOut }}>
                    {#if sp.foto}
                      <img class="avatar" src={sp.foto} alt="" />
                    {:else}
                      <span class="avatar">{initialen(sp.naam)}</span>
                    {/if}
                    <strong>{sp.naam}</strong>
                  </span>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- ══ De vraag ═══════════════════════════════════════════════ -->
      {:else if staat.fase === 'vraag' && vraag}
        <div style="display:flex;flex-direction:column;gap:clamp(.8rem,2vh,1.6rem)">
          <div class="tafelkaart" data-suit={ronde?.suit}>
            <p class="etiket">Vraag {vraag.index + 1} · {vraag.punten} {vraag.punten === 1 ? 'punt' : 'punten'}</p>
            {#if vraag.emoji}<div class="emoji">{vraag.emoji}</div>{/if}
            {#if vraag.lyric}<p class="lyric">“{vraag.lyric}”</p>{/if}
            <p class="vraagtekst">{vraag.tekst}</p>
            {#if vraag.opties}
              <div class="keuzes">
                {#each vraag.opties as optie, i}
                  <div class="keuze" in:fly={{ y: 14, duration: 380, delay: 220 + i * 80, easing: cubicOut }}>
                    <span class="letter">{String.fromCharCode(65 + i)}</span><span>{optie}</span>
                  </div>
                {/each}
              </div>
            {/if}
            {#if vraag.eenheid}
              <p class="fijn" style="color:rgba(19,31,26,.55)">Antwoord in {vraag.eenheid}.</p>
            {/if}
          </div>

          <!-- Wie is er al binnen. Geen antwoorden, alleen namen. -->
          <div class="inleverrij" in:fade={{ duration: 400, delay: 400 }}>
            {#each staat.teams as t (t.id)}
              <span class="vak" class:binnen={staat.ingeleverd.includes(t.id)}>
                {t.naam}
              </span>
            {/each}
          </div>
        </div>

        <!-- ══ De onthulling ══════════════════════════════════════════ -->
      {:else if staat.fase === 'antwoord' && vraag}
        <div style="display:flex;flex-direction:column;gap:clamp(.8rem,2vh,1.4rem)">
          <div class="tafelkaart" data-suit={ronde?.suit} style="padding-block:clamp(16px,2vw,32px)">
            {#if vraag.emoji}<div class="emoji klein">{vraag.emoji}</div>{/if}
            {#if vraag.lyric}<p class="lyric klein">“{vraag.lyric}”</p>{/if}
            <p class="vraagtekst klein">{vraag.tekst}</p>
            {#if vraag.opties}
              <div class="keuzes">
                {#each vraag.opties as optie, i}
                  <div
                    class="keuze"
                    class:goed={i === staat.onthulling?.goedeOptie}
                    class:fout={staat.onthulling?.goedeOptie !== undefined && i !== staat.onthulling?.goedeOptie}
                  >
                    <span class="letter">{String.fromCharCode(65 + i)}</span><span>{optie}</span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>

          <div class="onthulling">
            <p class="etiket stil">Het antwoord</p>
            <p class="antwoordtekst">{staat.onthulling?.antwoord}</p>
            {#if staat.onthulling?.toelichting}
              <p class="toelichting" in:fade={{ duration: 400, delay: 450 }}>{staat.onthulling.toelichting}</p>
            {/if}
          </div>
        </div>

        <!-- ══ Tussenstand ════════════════════════════════════════════ -->
      {:else if staat.fase === 'stand'}
        <div style="display:flex;flex-direction:column;gap:clamp(.8rem,2vh,1.6rem)">
          <p class="etiket" in:fly={{ x: -18, duration: 420, easing: cubicOut }}>{ronde?.naam} zit erop</p>
          <h1 class="groot" in:fly={{ y: 22, duration: 520, delay: 60, easing: cubicOut }}>Tussenstand</h1>
          <hr class="rule" style="animation-delay:.25s" />
          <div class="stand">
            {#each standNu as r, i (r.spelerId)}
              <div class="standrij" class:leider={toonNieuweVolgorde && i === 0} style="--i:{i}" animate:flip={{ duration: 720, easing: cubicOut }}>
                <span class="plek">{i + 1}</span>
                {#if r.foto}
                  <img class="avatar m" class:goud={toonNieuweVolgorde && i === 0} src={r.foto} alt="" />
                {:else}
                  <span class="avatar m" class:goud={toonNieuweVolgorde && i === 0}>{initialen(r.naam)}</span>
                {/if}
                <span class="naam">{r.naam}</span>
                <span class="standpunten">
                  <Teller naar={r.punten} van={live.vorigePunten[r.spelerId] ?? r.punten} vertraging={250} />
                </span>
              </div>
            {/each}
          </div>
        </div>

        <!-- ══ De uitslag ═════════════════════════════════════════════ -->
      {:else if staat.fase === 'einde'}
        <Confetti />
        <div style="display:flex;flex-direction:column;gap:clamp(1rem,2.5vh,2rem);align-items:center;text-align:center">
          <p class="etiket" in:fly={{ y: -14, duration: 460, easing: cubicOut }}>{staat.quizNaam}</p>
          <h1 class="mega" in:scale={{ start: 0.86, duration: 760, delay: 200, easing: cubicOut }}>
            {staat.stand[0]?.naam ?? 'Niemand'} wint
          </h1>
          <p class="lood" style="text-align:center" in:fade={{ duration: 500, delay: 700 }}>
            Met {staat.stand[0]?.punten ?? 0} punten.
          </p>

          <div class="podium" style="margin-top:clamp(.5rem,2vh,1.5rem)">
            {#each podiumVolgorde as idx, positie (top3[idx]?.spelerId ?? positie)}
              {#if top3[idx]}
                <div class="plaats" class:eerste={idx === 0} style="--i:{positie}">
                  <span class="medaille">{medailles[idx]}</span>
                  {#if top3[idx].foto}
                    <img class="avatar l" class:goud={idx === 0} src={top3[idx].foto} alt="" />
                  {:else}
                    <span class="avatar l" class:goud={idx === 0}>{initialen(top3[idx].naam)}</span>
                  {/if}
                  <span class="naam">{top3[idx].naam}</span>
                  <span class="punten">
                    <Teller naar={top3[idx].punten} van={live.vorigePunten[top3[idx].spelerId] ?? top3[idx].punten} vertraging={600 + positie * 200} />
                    punten
                  </span>
                </div>
              {/if}
            {/each}
          </div>

          {#if staat.stand.length > 3}
            <div class="stand" style="max-width:560px;margin-top:1rem">
              {#each staat.stand.slice(3) as r, i (r.spelerId)}
                <div class="standrij" style="--i:{i + 4}">
                  <span class="plek">{i + 4}</span>
                  <span></span>
                  <span class="naam" style="font-size:calc(var(--fs-naam)*.7)">{r.naam}</span>
                  <span class="standpunten" style="font-size:calc(var(--fs-naam)*.6)">{r.punten}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/key}
</div>

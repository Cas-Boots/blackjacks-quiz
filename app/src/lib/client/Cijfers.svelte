<script lang="ts">
  /**
   * De cijfers van het jaar, zoals ze na een recap-ronde op de televisie
   * komen. Stap 0 is het overzicht van iedereen; daarna één persoon per
   * stap (sport, taart) of één voorspelling per stap.
   *
   * Op de telefoon (compact) laat dezelfde component alleen jouw eigen
   * kaart zien, wat de televisie ook toont.
   */
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { Cijfers, CijfersPersoon, PubliekeSpeler, VoorspellingUitslag } from '$lib/shared/state';

  let {
    cijfers,
    spelers = [],
    compact = false,
    alleen = null,
  }: { cijfers: Cijfers; spelers?: PubliekeSpeler[]; compact?: boolean; alleen?: string | null } = $props();

  const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  const MAANDEN_VOL = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

  let sport = $derived(cijfers.soort === 'sport');
  let voorspellingen = $derived(cijfers.soort === 'voorspellingen');
  /** Wie er op deze stap centraal staat. */
  let persoon = $derived<CijfersPersoon | null>(
    voorspellingen ? null
      : alleen ? cijfers.personen.find((p) => p.naam === alleen) ?? null
        : cijfers.stap > 0 ? cijfers.personen[cijfers.stap - 1] ?? null : null,
  );
  let voorspelling = $derived<VoorspellingUitslag | null>(
    voorspellingen && cijfers.stap > 0 ? cijfers.voorspellingen?.vragen[cijfers.stap - 1] ?? null : null,
  );
  let maxTotaal = $derived(Math.max(1, ...cijfers.personen.map((p) => (sport ? p.sport.totaal : p.taart.totaal))));
  let maxDoel = $derived(Math.max(maxTotaal, ...cijfers.personen.map((p) => p.sport.doel ?? 0)));
  let peildatumTekst = $derived(`${Number(cijfers.peildatum.slice(8, 10))} ${MAANDEN_VOL[Number(cijfers.peildatum.slice(5, 7)) - 1]}`);

  function fotoVan(naam: string) {
    return spelers.find((s) => s.naam === naam)?.foto ?? null;
  }
  function initialen(naam: string) {
    return naam.slice(0, 2);
  }
  function totaalVan(p: CijfersPersoon) {
    return sport ? p.sport.totaal : p.taart.totaal;
  }

  /* ---- De jaarkaart --------------------------------------------------
     Eén hokje per dag, de weken als kolommen, maandag bovenaan. Dezelfde
     vorm als een bijdragenkalender: in één oogopslag zie je de drukke en
     de stille periodes. */
  interface Hokje {
    datum: string;
    kolom: number;
    rij: number;
    aantal: number;
    toekomst: boolean;
  }
  function jaarkaart(dagen: Record<string, number>, jaar: number, peildatum: string): { hokjes: Hokje[]; kolommen: number; maanden: { naam: string; kolom: number }[] } {
    const hokjes: Hokje[] = [];
    const maanden: { naam: string; kolom: number }[] = [];
    const start = new Date(Date.UTC(jaar, 0, 1));
    // Maandag = 0.
    const eersteDag = (start.getUTCDay() + 6) % 7;
    const laatste = new Date(Date.UTC(jaar, 11, 31));
    let kolommen = 0;
    for (let d = new Date(start), i = 0; d <= laatste; d.setUTCDate(d.getUTCDate() + 1), i++) {
      const datum = d.toISOString().slice(0, 10);
      const kolom = Math.floor((i + eersteDag) / 7);
      const rij = (i + eersteDag) % 7;
      if (d.getUTCDate() === 1) maanden.push({ naam: MAANDEN[d.getUTCMonth()], kolom });
      hokjes.push({ datum, kolom, rij, aantal: dagen[datum] ?? 0, toekomst: datum > peildatum });
      kolommen = kolom + 1;
    }
    return { hokjes, kolommen, maanden };
  }
  let kaart = $derived(
    persoon ? jaarkaart(sport ? persoon.sport.dagen : persoon.taart.dagen, cijfers.jaar, cijfers.peildatum) : null,
  );
  function niveau(n: number) {
    return n <= 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : 3;
  }

  /** Aantal per maand, voor het lijstje onder de kaart. */
  let perMaand = $derived.by(() => {
    if (!persoon) return [];
    const dagen = sport ? persoon.sport.dagen : persoon.taart.dagen;
    const uit = new Array(12).fill(0);
    for (const [datum, n] of Object.entries(dagen)) uit[Number(datum.slice(5, 7)) - 1] += n;
    return uit as number[];
  });
  let drukste = $derived(perMaand.length ? Math.max(...perMaand) : 0);

  function landenBuitenNl(p: CijfersPersoon) {
    return p.landen.filter((l) => l.code !== 'NL');
  }
  function datumKort(datum: string) {
    return `${Number(datum.slice(8, 10))} ${MAANDEN[Number(datum.slice(5, 7)) - 1]}`;
  }
</script>

<div class="cijfers" class:compact data-soort={cijfers.soort}>
  {#if voorspellingen && cijfers.voorspellingen}
    {@const u = cijfers.voorspellingen}
    {#if voorspelling}
      <!-- ══ Eén voorspelling ══════════════════════════════════════ -->
      <div class="kop" in:fly={{ x: -18, duration: 420, easing: cubicOut }}>
        <p class="etiket">Voorspelling {voorspelling.nr} van {u.vragen.length} · januari {cijfers.jaar}</p>
        <h2 class="vraag">{voorspelling.vraag}</h2>
      </div>
      <div class="uitkomst" class:open={voorspelling.open} in:fly={{ y: 14, duration: 420, delay: 150, easing: cubicOut }}>
        {#if voorspelling.open}
          <span class="label">Nog open</span>
          <span>Dit weten we pas aan het eind van het jaar.</span>
        {:else}
          <span class="label">Uitkomst{voorspelling.voorlopig ? ' tot nu toe' : ''}</span>
          <strong>{voorspelling.uitkomst}</strong>
          {#if voorspelling.toelichting}<span class="fijn">{voorspelling.toelichting}</span>{/if}
        {/if}
      </div>
      <div class="antwoorden">
        {#each voorspelling.antwoorden as a, i (a.naam)}
          <div
            class="antwoord"
            class:goed={a.goed === true}
            class:fout={a.goed === false}
            class:ik={alleen === a.naam}
            in:fly={{ y: 16, duration: 380, delay: 300 + i * 80, easing: cubicOut }}
          >
            <span class="wie">
              {#if fotoVan(a.naam)}
                <img class="avatar" src={fotoVan(a.naam)} alt="" />
              {:else}
                <span class="avatar">{initialen(a.naam)}</span>
              {/if}
              {a.naam}
            </span>
            <span class="wat">{a.antwoord}</span>
            <span class="oordeel">
              {#if a.goed === true}✓ +{a.inzet}
              {:else if a.goed === false}✗{#if a.werkelijk}<span class="fijn"> {a.werkelijk}</span>{/if}
              {:else if !voorspelling.open}<span class="fijn">{a.werkelijk ? `nu ${a.werkelijk}` : 'nog open'}</span>
              {:else}<span class="fijn">{a.inzet} {a.inzet === 1 ? 'punt' : 'punten'}</span>{/if}
            </span>
          </div>
        {/each}
      </div>
    {:else}
      <!-- ══ De tussenstand van de voorspellingen ═══════════════════ -->
      <div class="kop" in:fly={{ x: -18, duration: 420, easing: cubicOut }}>
        <p class="etiket">De voorspellingen van januari {cijfers.jaar}</p>
        <h2 class="vraag">{u.open ? `${u.vragen.length - u.open} van de ${u.vragen.length} beslist` : 'Alle voorspellingen beslist'}</h2>
      </div>
      <div class="tabel">
        <div class="rij kopje">
          <span></span><span></span><span class="num">goed</span><span class="num">mis</span><span class="num">open</span><span class="num">punten</span>
        </div>
        {#each u.stand as s, i (s.naam)}
          <div class="rij" class:leider={i === 0 && s.punten > 0} class:ik={alleen === s.naam} in:fly={{ y: 14, duration: 380, delay: 150 + i * 80, easing: cubicOut }}>
            <span class="plek">{i + 1}</span>
            <span class="wie">
              {#if fotoVan(s.naam)}
                <img class="avatar" src={fotoVan(s.naam)} alt="" />
              {:else}
                <span class="avatar">{initialen(s.naam)}</span>
              {/if}
              {s.naam}
              {#if s.quizmaster}<span class="rol">quizmaster</span>{/if}
            </span>
            <span class="num goedgetal">{s.goed}</span>
            <span class="num">{s.fout}</span>
            <span class="num stil">{s.open}</span>
            <span class="num punten">{s.punten}</span>
          </div>
        {/each}
      </div>
      {#if u.stand.some((s) => s.quizmaster) || u.zitUit?.length}
        <p class="voetnoot" in:fade={{ duration: 400, delay: 150 + u.stand.length * 80 }}>
          {#if u.stand.some((s) => s.quizmaster)}De punten gaan naar de stand van de avond; die van de quizmaster blijven in deze ronde.{/if}
          {#if u.zitUit?.length}{u.zitUit.join(' en ')} voorspelde in januari niet mee en zit deze ronde uit.{/if}
        </p>
      {/if}
    {/if}
  {:else if persoon}
    <!-- ══ Eén persoon ═══════════════════════════════════════════════ -->
    {@const p = persoon}
    {@const totaal = totaalVan(p)}
    <div class="persoonkop" in:fly={{ x: -18, duration: 420, easing: cubicOut }}>
      {#if fotoVan(p.naam)}
        <img class="avatar l" src={fotoVan(p.naam)} alt="" />
      {:else}
        <span class="avatar l">{initialen(p.naam)}</span>
      {/if}
      <div>
        <p class="etiket">{sport ? 'Gesport' : 'Taart'} in {cijfers.jaar} · tot {peildatumTekst}</p>
        <h2 class="naam">{p.naam}</h2>
        <p class="groot">
          <span class="getal">{totaal}</span>
          {#if sport}
            {totaal === 1 ? 'keer' : 'keer'}
            {#if p.sport.doel !== null}
              <span class="doel" class:gehaald={p.sport.totaal >= p.sport.doel}>
                {p.sport.totaal >= p.sport.doel ? '✓ doel van ' + p.sport.doel + ' gehaald' : 'van de ' + p.sport.doel + ' als doel'}
              </span>
            {/if}
          {:else}
            {totaal === 1 ? 'taart' : 'taarten'}
          {/if}
        </p>
      </div>
    </div>

    {#if kaart}
      <div class="jaar" in:fade={{ duration: 500, delay: 200 }}>
        <div class="maanden" style="grid-template-columns: repeat({kaart.kolommen}, 1fr)">
          {#each kaart.maanden as m (m.naam)}
            <span style="grid-column: {m.kolom + 1} / span 4">{m.naam}</span>
          {/each}
        </div>
        <div class="hokjes" style="grid-template-columns: repeat({kaart.kolommen}, 1fr)">
          {#each kaart.hokjes as h (h.datum)}
            <span
              class="hokje n{niveau(h.aantal)}"
              class:toekomst={h.toekomst}
              style="grid-column: {h.kolom + 1}; grid-row: {h.rij + 1}"
              title="{h.datum}: {h.aantal}"
            ></span>
          {/each}
        </div>
        <div class="permaand" style="grid-template-columns: repeat(12, 1fr)">
          {#each perMaand as n, i (i)}
            <span class:druk={n === drukste && n > 0}>{n || '·'}</span>
          {/each}
        </div>
      </div>
    {/if}

    {#if sport}
      <div class="soorten" in:fade={{ duration: 400, delay: 350 }}>
        {#each p.sport.soorten as s, i (s.naam)}
          <span class="soort" class:top={i === 0} in:fly={{ y: 12, duration: 320, delay: 400 + i * 60, easing: cubicOut }}>
            <span class="emoji">{s.emoji}</span>
            {s.naam}
            <span class="aantal">{s.aantal}</span>
          </span>
        {/each}
        {#if p.sport.langsteReeks >= 3}
          <span class="soort reeks">🔥 langste reeks: {p.sport.langsteReeks} dagen</span>
        {/if}
      </div>
    {:else}
      <div class="landen" in:fade={{ duration: 400, delay: 350 }}>
        <p class="etiket stil">
          {#if landenBuitenNl(p).length === 0}Bleef het hele jaar in Nederland
          {:else}{p.landen.length} {p.landen.length === 1 ? 'land' : 'landen'}, in deze volgorde{/if}
        </p>
        <div class="vlaggen">
          {#each p.landen as l, i (l.code + l.datum)}
            <span class="land" in:fly={{ y: 12, duration: 320, delay: 400 + i * 70, easing: cubicOut }}>
              <span class="vlag">{l.vlag}</span>
              <span>{l.naam.replace(/^(de|het) /, '')}<span class="fijn"> · {datumKort(l.datum)}</span></span>
            </span>
          {/each}
        </div>
      </div>
    {/if}
  {:else}
    <!-- ══ Het overzicht ═════════════════════════════════════════════ -->
    <div class="kop" in:fly={{ x: -18, duration: 420, easing: cubicOut }}>
      <p class="etiket">{sport ? 'Onze sportcompetitie' : 'Taart en verre landen'} · tot {peildatumTekst}</p>
      <h2 class="vraag">{sport ? 'Zo vaak sportten we in ' + cijfers.jaar : 'Zoveel taart ging erdoorheen in ' + cijfers.jaar}</h2>
    </div>
    <div class="balken">
      {#each cijfers.personen as p, i (p.naam)}
        {@const totaal = totaalVan(p)}
        <div class="balkrij" class:ik={alleen === p.naam} in:fly={{ y: 14, duration: 380, delay: 120 + i * 90, easing: cubicOut }}>
          <span class="wie">
            {#if fotoVan(p.naam)}
              <img class="avatar" src={fotoVan(p.naam)} alt="" />
            {:else}
              <span class="avatar">{initialen(p.naam)}</span>
            {/if}
            {p.naam}
          </span>
          <span class="baan">
            <span class="balk" style="width: {(100 * totaal) / (sport ? maxDoel : maxTotaal)}%; animation-delay: {200 + i * 90}ms"></span>
            {#if sport && p.sport.doel !== null}
              <span class="doelstreep" style="left: {(100 * p.sport.doel) / maxDoel}%" title="doel {p.sport.doel}"></span>
            {/if}
          </span>
          <span class="getal">
            {totaal}
            {#if sport && p.sport.doel !== null}<span class="fijn">/ {p.sport.doel}</span>{/if}
          </span>
          {#if !sport}
            <span class="vlaggenrij">{#each p.landen as l (l.code + l.datum)}<span>{l.vlag}</span>{/each}</span>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .cijfers {
    display: flex;
    flex-direction: column;
    gap: clamp(0.8rem, 2vh, 1.6rem);
    width: 100%;
  }
  .compact {
    gap: 0.8rem;
  }
  .kop .vraag,
  .persoonkop .naam {
    font-family: var(--display);
    font-weight: 600;
    line-height: 1.1;
    margin: 0.3rem 0 0;
    color: var(--ivoor);
  }
  .kop .vraag {
    font-size: calc(var(--fs-vraag) * 0.72);
  }
  .compact .kop .vraag {
    font-size: 1.35rem;
  }
  .persoonkop {
    display: flex;
    align-items: center;
    gap: clamp(0.8rem, 2vw, 1.6rem);
  }
  .persoonkop .naam {
    font-size: var(--fs-groot);
  }
  .compact .persoonkop .naam {
    font-size: 1.8rem;
  }
  .groot {
    margin: 0.2rem 0 0;
    font-size: var(--fs-lood);
    color: var(--ivoor-zacht);
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .groot .getal {
    font-family: var(--mono);
    font-size: calc(var(--fs-naam) * 1.1);
    color: var(--goud-licht);
    font-variant-numeric: tabular-nums;
  }
  .doel {
    font-size: 0.85em;
    color: var(--salie);
    margin-left: 0.4rem;
  }
  .doel.gehaald {
    color: var(--groen-licht);
  }

  /* ---- de jaarkaart ---- */
  .jaar {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .maanden,
  .hokjes,
  .permaand {
    display: grid;
    gap: clamp(2px, 0.25vw, 4px);
  }
  .maanden span,
  .permaand span {
    font-family: var(--mono);
    font-size: calc(var(--fs-etiket) * 0.95);
    color: var(--salie);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .permaand {
    margin-top: 0.15rem;
  }
  .permaand span {
    text-align: center;
    text-transform: none;
    letter-spacing: 0;
    font-variant-numeric: tabular-nums;
  }
  .permaand span.druk {
    color: var(--goud-licht);
  }
  .hokjes {
    grid-template-rows: repeat(7, 1fr);
  }
  .hokje {
    aspect-ratio: 1;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.06);
    transition: background 0.4s var(--zacht);
  }
  .hokje.n1 {
    background: color-mix(in oklab, var(--goud) 42%, transparent);
  }
  .hokje.n2 {
    background: color-mix(in oklab, var(--goud) 72%, transparent);
  }
  .hokje.n3 {
    background: var(--goud-licht);
  }
  .hokje.toekomst {
    background: transparent;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  }

  /* ---- sporten ---- */
  .soorten {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 0.6rem;
  }
  .soort {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.9rem 0.4rem 0.6rem;
    border-radius: 999px;
    border: 1px solid var(--rand);
    background: linear-gradient(180deg, var(--vilt-hoog), var(--vilt-diep));
    font-size: calc(var(--fs-lood) * 0.85);
    color: var(--ivoor-zacht);
  }
  .compact .soort {
    font-size: 0.9rem;
  }
  .soort.top {
    border-color: var(--goud-diep);
    color: var(--ivoor);
  }
  .soort.reeks {
    border-style: dashed;
    color: var(--salie);
  }
  .soort .emoji {
    font-size: 1.25em;
  }
  .soort .aantal {
    font-family: var(--mono);
    color: var(--goud-licht);
    font-variant-numeric: tabular-nums;
  }

  /* ---- landen ---- */
  .vlaggen {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 0.7rem;
    margin-top: 0.5rem;
  }
  .land {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.9rem 0.35rem 0.5rem;
    border-radius: 999px;
    border: 1px solid var(--rand);
    background: linear-gradient(180deg, var(--vilt-hoog), var(--vilt-diep));
    font-size: calc(var(--fs-lood) * 0.85);
  }
  .compact .land {
    font-size: 0.9rem;
  }
  .land .vlag {
    font-size: 1.4em;
    line-height: 1;
  }

  /* ---- overzicht: de balken ---- */
  .balken {
    display: flex;
    flex-direction: column;
    gap: clamp(0.4rem, 1vh, 0.8rem);
  }
  .balkrij {
    display: grid;
    grid-template-columns: minmax(7rem, 14vw) 1fr auto;
    align-items: center;
    gap: clamp(0.6rem, 1.4vw, 1.2rem);
  }
  .compact .balkrij {
    grid-template-columns: 6rem 1fr auto;
    gap: 0.6rem;
  }
  .balkrij.ik .wie,
  .rij.ik .wie,
  .antwoord.ik .wie {
    color: var(--goud-licht);
  }
  [data-soort='taart'] .balkrij {
    grid-template-columns: minmax(7rem, 14vw) 1fr auto minmax(4rem, auto);
  }
  .wie {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-family: var(--display);
    font-size: calc(var(--fs-naam) * 0.7);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .compact .wie {
    font-size: 1.05rem;
  }
  .baan {
    position: relative;
    height: clamp(0.9rem, 2.2vh, 1.6rem);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.06);
    overflow: visible;
  }
  .balk {
    display: block;
    height: 100%;
    border-radius: 4px;
    background: linear-gradient(90deg, var(--goud-diep), var(--goud));
    transform-origin: left;
    animation: groei 0.9s var(--deal) both;
  }
  @keyframes groei {
    from {
      transform: scaleX(0);
    }
  }
  .doelstreep {
    position: absolute;
    top: -0.25rem;
    bottom: -0.25rem;
    width: 2px;
    background: var(--ivoor);
    opacity: 0.7;
  }
  .balkrij .getal {
    font-family: var(--mono);
    font-size: calc(var(--fs-naam) * 0.75);
    color: var(--goud-licht);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .compact .balkrij .getal {
    font-size: 1.05rem;
  }
  .vlaggenrij {
    font-size: 1.3em;
    letter-spacing: 0.1em;
    white-space: nowrap;
  }
  .compact .vlaggenrij {
    display: none;
  }

  /* ---- voorspellingen ---- */
  .uitkomst {
    display: flex;
    align-items: baseline;
    gap: 0.8rem;
    flex-wrap: wrap;
    padding: clamp(0.7rem, 1.4vw, 1.2rem) clamp(0.9rem, 1.8vw, 1.5rem);
    border-radius: 14px;
    border: 1px solid var(--goud-diep);
    background: linear-gradient(170deg, var(--vilt-hoog), var(--vilt-diep));
    font-size: var(--fs-lood);
  }
  .uitkomst strong {
    font-family: var(--display);
    font-size: calc(var(--fs-naam) * 0.9);
    color: var(--goud-licht);
  }
  .uitkomst.open {
    border-color: var(--rand);
    border-style: dashed;
    color: var(--salie);
  }
  .uitkomst .label {
    font-family: var(--mono);
    font-size: calc(var(--fs-etiket) * 0.95);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--salie);
  }
  .antwoorden {
    display: grid;
    gap: 0.6rem;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  }
  .compact .antwoorden {
    grid-template-columns: 1fr;
  }
  .antwoord {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'wie oordeel'
      'wat wat';
    align-items: center;
    gap: 0.35rem 0.7rem;
    padding: 0.6rem 0.9rem;
    border-radius: 12px;
    border: 1px solid var(--rand);
    background: linear-gradient(170deg, var(--vilt-hoog), var(--vilt-diep));
    font-size: calc(var(--fs-lood) * 0.85);
  }
  .compact .antwoord {
    font-size: 0.9rem;
  }
  .antwoord.goed {
    border-color: var(--groen);
    background: linear-gradient(170deg, rgba(78, 154, 107, 0.22), var(--vilt-diep));
  }
  .antwoord.fout {
    border-color: rgba(192, 69, 47, 0.5);
    opacity: 0.8;
  }
  .antwoord .wie {
    grid-area: wie;
    overflow: visible;
  }
  .antwoord .wat {
    grid-area: wat;
    color: var(--ivoor-zacht);
    line-height: 1.3;
  }
  .antwoord .oordeel {
    grid-area: oordeel;
    font-family: var(--mono);
    white-space: nowrap;
    color: var(--salie);
  }
  .antwoord.goed .oordeel {
    color: var(--groen-licht);
  }
  .antwoord.fout .oordeel {
    color: var(--rood-licht);
  }
  .tabel {
    display: flex;
    flex-direction: column;
  }
  .rij {
    display: grid;
    grid-template-columns: 2.5rem 1fr repeat(4, minmax(3.5rem, 8vw));
    align-items: center;
    gap: 0.6rem;
    padding: clamp(0.4rem, 1vh, 0.8rem) 0.5rem;
    border-bottom: 1px solid var(--rand);
    font-size: var(--fs-lood);
  }
  .compact .rij {
    grid-template-columns: 1.6rem 1fr repeat(4, 2.8rem);
    font-size: 0.95rem;
  }
  .rij.kopje {
    border-bottom-color: var(--goud-diep);
    padding-bottom: 0.2rem;
  }
  .rij.kopje .num {
    font-family: var(--mono);
    font-size: calc(var(--fs-etiket) * 0.95);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--salie);
  }
  .rij.leider {
    background: linear-gradient(90deg, rgba(201, 162, 39, 0.16), transparent 72%);
  }
  .rij .plek {
    font-family: var(--mono);
    color: var(--salie);
  }
  .rij .num {
    text-align: right;
    font-family: var(--mono);
    font-variant-numeric: tabular-nums;
  }
  .rij .num.goedgetal {
    color: var(--groen-licht);
  }
  .rij .num.stil {
    color: var(--salie);
  }
  .rij .num.punten {
    color: var(--goud-licht);
    font-size: 1.15em;
  }
  .rij .rol {
    margin-left: 0.5rem;
    font-family: var(--mono);
    font-size: calc(var(--fs-etiket) * 0.85);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--salie);
  }
  .voetnoot {
    margin: 0.8rem 0 0;
    color: var(--salie);
    font-size: calc(var(--fs-lood) * 0.8);
  }
  .compact .voetnoot {
    font-size: 0.85rem;
  }

  .avatar {
    width: clamp(1.8rem, 2.6vw, 2.6rem);
    height: clamp(1.8rem, 2.6vw, 2.6rem);
    font-size: 0.75rem;
  }
  .avatar.l {
    width: clamp(3.5rem, 7vw, 7rem);
    height: clamp(3.5rem, 7vw, 7rem);
    font-size: clamp(1rem, 2vw, 2rem);
  }
  .fijn {
    color: var(--salie);
    font-size: 0.85em;
  }
</style>

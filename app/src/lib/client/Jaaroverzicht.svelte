<script lang="ts">
  /**
   * Het jaaroverzicht: de film waarmee de avond opent.
   *
   * Eén dia per keer — een titelkaart, twaalf maanden, een slotkaart — en
   * onder in beeld een strook die laat zien waar we in het jaar zijn. Over
   * alles wat de quiz nog gaat vragen ligt een zwarte balk; het woord
   * eronder zit niet eens in het pakketje, en elke balk is even breed. Dat
   * geldt ook voor onze eigen taarten, landen en wie het vaakst ging. Na de
   * uitslag draait dezelfde film zonder balken, en dan schuiven ze open.
   *
   * Op de telefoon (compact) staat dezelfde dia. Na de uitslag staat daar
   * onderaan niet de hele groep maar jouw eigen maand.
   */
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import Teller from './Teller.svelte';
  import type { JaarDia, PubliekeSpeler } from '$lib/shared/state';

  let {
    dia,
    spelers = [],
    compact = false,
    alleen = null,
    loopt = false,
  }: {
    dia: JaarDia;
    spelers?: PubliekeSpeler[];
    compact?: boolean;
    alleen?: string | null;
    /** Of de film vanzelf doorloopt; dan tekent de voortgangslijn mee. */
    loopt?: boolean;
  } = $props();

  const MAANDEN_KORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

  let eigen = $derived(dia.eigen);
  /** Wat jíj die maand deed — voor op je eigen telefoon. */
  let mijn = $derived(alleen ? (eigen?.perPersoon.find((p) => p.naam === alleen) ?? null) : null);
  /** Een taart onder een balk telt als 'misschien': dan staat het blok er gewoon. */
  let ietsGedaan = $derived(!!eigen && (eigen.sport > 0 || eigen.taart !== 0 || eigen.nieuweLanden));

  function fotoVan(naam: string) {
    return spelers.find((s) => s.naam === naam)?.foto ?? null;
  }
  function initialen(naam: string) {
    return naam.slice(0, 2);
  }
  function datumKort(datum: string) {
    return `${Number(datum.slice(8, 10))} ${MAANDEN_KORT[Number(datum.slice(5, 7)) - 1]}`;
  }
</script>

<div class="film" class:compact class:onthuld={dia.onthuld} data-soort={dia.soort}>
  <!-- ══ De titelkaart ═══════════════════════════════════════════════ -->
  {#if dia.soort === 'titel'}
    <div class="kaart titelkaart">
      <p class="etiket" in:fly={{ y: -12, duration: 480, easing: cubicOut }}>Het jaaroverzicht</p>
      <h1 class="jaartal" in:fly={{ y: 26, duration: 700, easing: cubicOut }}>{dia.titel}</h1>
      <hr class="rule" style="width:min(520px,60vw)" />
      <p class="filmtitel" in:fly={{ y: 18, duration: 560, delay: 220, easing: cubicOut }}>{dia.kop}</p>
      {#each dia.regels as regel, i (i)}
        <p class="inleiding" in:fade={{ duration: 500, delay: 480 }}>
          {#each regel.delen as deel, n (n)}
            {#if deel.balk}<span class="zwart">{deel.tekst}</span>{:else}{deel.tekst}{/if}
          {/each}
        </p>
      {/each}
    </div>

    <!-- ══ De slotkaart ══════════════════════════════════════════════ -->
  {:else if dia.soort === 'slot'}
    <div class="kaart titelkaart">
      <p class="etiket" in:fly={{ y: -12, duration: 480, easing: cubicOut }}>Aftiteling</p>
      <h1 class="jaartal klein" in:fly={{ y: 22, duration: 640, easing: cubicOut }}>{dia.titel}</h1>
      <hr class="rule" style="width:min(520px,60vw)" />
      <p class="filmtitel" in:fly={{ y: 16, duration: 520, delay: 200, easing: cubicOut }}>{dia.kop}</p>
      {#if dia.jaartotaal}
        <div class="totalen">
          {#each [
            { emoji: '🏃', getal: dia.jaartotaal.sport, wat: 'keer gesport' },
            { emoji: '🍰', getal: dia.jaartotaal.taart, wat: 'taarten' },
            { emoji: '🌍', getal: dia.jaartotaal.landen, wat: 'landen' },
            { emoji: '📅', getal: dia.jaartotaal.dagen, wat: 'dagen met iets erop' },
          ] as t, i (t.wat)}
            <div class="tegel" in:fly={{ y: 22, duration: 520, delay: 320 + i * 140, easing: cubicOut }}>
              <span class="tegelemoji" aria-hidden="true">{t.emoji}</span>
              <span class="tegelgetal"><Teller naar={t.getal} van={0} vertraging={320 + i * 140} /></span>
              <span class="tegelwat">{t.wat}</span>
            </div>
          {/each}
        </div>
        <p class="fijn peildatum">Onze cijfers lopen tot {datumKort(dia.peildatum)}.</p>
      {:else}
        <p class="fijn peildatum" in:fade={{ duration: 500, delay: 520 }}>Ons jaar in getallen volgt na de uitslag.</p>
      {/if}
    </div>

    <!-- ══ Een maand ═════════════════════════════════════════════════ -->
  {:else}
    <div class="kaart">
      <div class="maandkop">
        <h1 class="maandnaam" in:fly={{ x: -26, duration: 560, easing: cubicOut }}>{dia.titel}</h1>
        <span class="jaarschaduw" aria-hidden="true">{dia.jaar}</span>
      </div>
      <p class="maandhoed" in:fly={{ y: 14, duration: 480, delay: 120, easing: cubicOut }}>{dia.kop}</p>

      {#if dia.regels.length}
        <div class="regels">
          {#each dia.regels as regel, i (i)}
            <div class="regel" in:fly={{ y: 18, duration: 460, delay: 220 + i * 160, easing: cubicOut }}>
              {#if regel.emoji}<span class="regelemoji" aria-hidden="true">{regel.emoji}</span>{/if}
              <span class="regeltekst">
                {#each regel.delen as deel, n (n)}
                  {#if deel.balk}<span class="zwart">{deel.tekst}</span>{:else}{deel.tekst}{/if}
                {/each}
                {#if regel.bij}
                  <span class="bij">
                    {#each regel.bij as deel, n (n)}
                      {#if deel.balk}<span class="zwart">{deel.tekst}</span>{:else}{deel.tekst}{/if}
                    {/each}
                  </span>
                {/if}
              </span>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Onze eigen maand: op de televisie de hele groep, op je telefoon jij. -->
      {#if eigen && (ietsGedaan || mijn)}
        <div class="onsjaar" in:fade={{ duration: 420, delay: 400 }}>
          <p class="etiket stil">{mijn ? 'Jij' : 'Wij'} in {dia.titel}</p>
          <div class="eigenrij">
            {#if mijn}
              <span class="chip"><span class="chipemoji">🏃</span><b>{mijn.sport}</b> keer gesport</span>
              <span class="chip"><span class="chipemoji">🍰</span><b>{mijn.taart}</b> {mijn.taart === 1 ? 'taart' : 'taarten'}</span>
              {#each mijn.landen as vlag, i (i)}
                <span class="chip vlagchip">{vlag}</span>
              {/each}
            {:else}
              <span class="chip"><span class="chipemoji">🏃</span><b>{eigen.sport}</b> keer gesport</span>
              {#if eigen.taart === null}
                <span class="chip"><span class="chipemoji">🍰</span><span class="zwart"></span> taarten</span>
              {:else}
                <span class="chip"><span class="chipemoji">🍰</span><b>{eigen.taart}</b> {eigen.taart === 1 ? 'taart' : 'taarten'}</span>
              {/if}
              {#each eigen.landen as land (land.naam)}
                <span class="chip vlagchip">
                  <span class="vlag">{land.vlag}</span>{land.naam}
                  <span class="fijn">{land.wie} · {datumKort(land.datum)}</span>
                </span>
              {:else}
                {#if eigen.nieuweLanden}
                  <span class="chip"><span class="chipemoji">🌍</span><span class="zwart"></span> erbij</span>
                {/if}
              {/each}
              {#if eigen.bijStart}
                <span class="chip stil">De lijst begon met {eigen.bijStart} {eigen.bijStart === 1 ? 'land' : 'landen'}</span>
              {/if}
              {#if eigen.koploper}
                {@const naam = eigen.koploper.naam}
                <span class="chip koploper">
                  {#if naam === null}
                    <span class="avatar">?</span><span class="zwart"></span>
                  {:else if fotoVan(naam)}
                    <img class="avatar" src={fotoVan(naam)} alt="" />{naam}
                  {:else}
                    <span class="avatar">{initialen(naam)}</span>{naam}
                  {/if}
                  het vaakst — <b>{eigen.koploper.aantal}×</b>
                </span>
              {/if}
            {/if}
          </div>
          {#if eigen.totaal}
            <div class="meeloop" aria-label="De stand van het jaar tot en met deze maand">
              <span>{eigen.totaal.sport} keer gesport</span>
              <span>{eigen.totaal.taart} taarten</span>
              <span>{eigen.totaal.landen} landen</span>
              <span class="fijn">dit jaar tot hier</span>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  <!-- ══ De filmstrook: waar zijn we in het jaar ═════════════════════ -->
  <div class="strook" aria-hidden="true">
    {#each MAANDEN_KORT as naam, i (naam)}
      {@const nr = i + 1}
      <span
        class="vak"
        class:mee={dia.strook.includes(nr)}
        class:nu={dia.maand === nr}
        class:gehad={dia.strook.includes(nr) && (dia.soort === 'slot' || (dia.maand !== null && nr < dia.maand))}
      >
        <i></i><em>{naam}</em>
      </span>
    {/each}
  </div>
  <!-- De lijn die de dia uittelt. Puur sfeer: de klok op de server beslist. -->
  <div class="voortgang" class:loopt aria-hidden="true">
    <i style="--duur:{dia.seconden}s"></i>
  </div>
</div>

<style>
  .film {
    display: flex;
    flex-direction: column;
    gap: clamp(0.8rem, 2vh, 1.8rem);
    width: 100%;
  }
  .kaart {
    display: flex;
    flex-direction: column;
    gap: clamp(0.5rem, 1.6vh, 1.2rem);
    min-width: 0;
  }
  .titelkaart {
    align-items: center;
    text-align: center;
    gap: clamp(0.6rem, 2vh, 1.4rem);
  }

  /* ---- titel- en slotkaart ---- */
  .jaartal {
    font-family: var(--display);
    font-size: calc(var(--fs-mega) * 1.15);
    line-height: 0.9;
    letter-spacing: 0.02em;
    color: var(--goud-licht);
    margin: 0;
  }
  .jaartal.klein {
    font-size: var(--fs-groot);
    color: var(--ivoor);
  }
  .compact .jaartal {
    font-size: 3.4rem;
  }
  .compact .jaartal.klein {
    font-size: 1.9rem;
  }
  .filmtitel {
    font-family: var(--display);
    font-size: var(--fs-lood);
    color: var(--ivoor);
    margin: 0;
    max-width: 30ch;
  }
  .inleiding {
    font-size: calc(var(--fs-lood) * 0.95);
    color: var(--ivoor-zacht);
    margin: 0;
    max-width: 44ch;
    line-height: 1.5;
  }
  .totalen {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: clamp(0.6rem, 1.6vw, 1.4rem);
    margin-top: clamp(0.4rem, 1.5vh, 1rem);
  }
  .tegel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    min-width: clamp(6rem, 11vw, 11rem);
    padding: clamp(0.6rem, 1.4vh, 1.2rem) clamp(0.8rem, 1.6vw, 1.6rem);
    border-radius: 14px;
    border: 1px solid var(--rand);
    background: linear-gradient(180deg, var(--vilt-hoog), var(--vilt-diep));
  }
  .tegelemoji {
    font-size: calc(var(--fs-lood) * 1.2);
  }
  .tegelgetal {
    font-family: var(--mono);
    font-size: var(--fs-naam);
    color: var(--goud-licht);
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
  }
  .tegelwat {
    font-size: var(--fs-etiket);
    color: var(--salie);
    text-align: center;
  }
  .peildatum {
    margin: 0.2rem 0 0;
  }

  /* ---- de maandkaart ---- */
  .maandkop {
    position: relative;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
  }
  .maandnaam {
    font-family: var(--display);
    font-size: var(--fs-mega);
    line-height: 0.95;
    margin: 0;
    color: var(--ivoor);
    text-transform: lowercase;
  }
  .compact .maandnaam {
    font-size: 2.4rem;
  }
  .jaarschaduw {
    font-family: var(--display);
    font-size: calc(var(--fs-groot) * 0.9);
    color: var(--goud);
    opacity: 0.38;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }
  .compact .jaarschaduw {
    font-size: 1.1rem;
  }
  .maandhoed {
    font-family: var(--display);
    font-size: calc(var(--fs-lood) * 1.15);
    color: var(--goud-licht);
    margin: 0;
  }
  .compact .maandhoed {
    font-size: 1rem;
  }

  .regels {
    display: flex;
    flex-direction: column;
    gap: clamp(0.4rem, 1.2vh, 0.9rem);
    margin-top: clamp(0.2rem, 1vh, 0.8rem);
  }
  .regel {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: start;
    gap: clamp(0.5rem, 1.2vw, 1.1rem);
    padding: clamp(0.4rem, 1vh, 0.8rem) clamp(0.6rem, 1.2vw, 1.1rem);
    border-radius: 12px;
    border: 1px solid transparent;
    border-left: 2px solid var(--goud-diep);
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.045), transparent 70%);
  }
  .regelemoji {
    font-size: calc(var(--fs-lood) * 1.25);
    line-height: 1.35;
  }
  .regeltekst {
    font-size: calc(var(--fs-lood) * 1.08);
    line-height: 1.45;
    color: var(--ivoor);
  }
  .compact .regeltekst {
    font-size: 1rem;
  }
  .bij {
    display: block;
    margin-top: 0.2rem;
    font-size: 0.82em;
    color: var(--salie);
  }

  /* ---- de zwarte balk ----------------------------------------------
     Zolang hij ligt is hij leeg: het woord zit niet in de pagina. Elke
     balk is even breed, of er nu '19' onder zit of een heel stadion — de
     lengte zou anders zelf een hint zijn. Na de uitslag staat de tekst er
     wel, en blijft alleen het streepje eronder staan: je ziet dan precies
     welke woorden de hele avond zwart waren. */
  .zwart {
    display: inline-block;
    vertical-align: baseline;
    min-width: 4.4em;
    height: 1em;
    margin: 0 0.12em;
    transform: translateY(0.14em);
    border-radius: 3px;
    background: #050806;
    box-shadow:
      inset 0 0 0 1px rgba(201, 162, 39, 0.35),
      0 1px 0 rgba(255, 255, 255, 0.04);
    background-image: repeating-linear-gradient(
      100deg,
      rgba(255, 255, 255, 0.05) 0 2px,
      transparent 2px 7px
    );
  }
  .compact .zwart {
    min-width: 3.4em;
  }
  .onthuld .zwart {
    min-width: 0;
    height: auto;
    transform: none;
    padding: 0 0.1em;
    border-radius: 2px;
    background: none;
    background-image: none;
    box-shadow: inset 0 -0.42em 0 rgba(201, 162, 39, 0.24);
    color: var(--goud-licht);
    animation: balkOpen 700ms var(--deal) backwards;
  }
  @keyframes balkOpen {
    from {
      background: #050806;
      color: transparent;
      box-shadow: inset 0 0 0 1px rgba(201, 162, 39, 0.35);
    }
  }

  /* ---- ons eigen jaar ---- */
  .onsjaar {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    margin-top: clamp(0.2rem, 1.2vh, 1rem);
    padding-top: clamp(0.4rem, 1.2vh, 1rem);
    border-top: 1px solid var(--rand);
  }
  .eigenrij {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem 0.6rem;
    align-items: center;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.3rem 0.85rem 0.3rem 0.6rem;
    border-radius: 999px;
    border: 1px solid var(--rand);
    background: linear-gradient(180deg, var(--vilt-hoog), var(--vilt-diep));
    font-size: calc(var(--fs-lood) * 0.82);
    color: var(--ivoor-zacht);
    white-space: nowrap;
  }
  .compact .chip {
    font-size: 0.85rem;
  }
  .chip b {
    font-family: var(--mono);
    color: var(--goud-licht);
    font-variant-numeric: tabular-nums;
  }
  .chip .chipemoji,
  .chip .vlag {
    font-size: 1.2em;
    line-height: 1;
  }
  .chip.vlagchip {
    padding-left: 0.5rem;
  }
  .chip.stil {
    border-style: dashed;
    color: var(--salie);
  }
  .chip.koploper {
    border-color: var(--goud-diep);
    color: var(--ivoor);
    padding-left: 0.3rem;
  }
  .chip .avatar {
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
    object-fit: cover;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--vilt-licht);
    color: var(--ivoor-zacht);
    font-size: 0.7rem;
    font-family: var(--ui);
  }
  .meeloop {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 1.1rem;
    font-family: var(--mono);
    font-size: var(--fs-etiket);
    color: var(--salie);
    font-variant-numeric: tabular-nums;
  }

  /* ---- de filmstrook ---- */
  .strook {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: clamp(3px, 0.5vw, 8px);
    margin-top: auto;
    padding-top: clamp(0.3rem, 1vh, 0.8rem);
  }
  .vak {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
  }
  .vak i {
    display: block;
    width: 100%;
    height: clamp(4px, 0.8vh, 8px);
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.07);
    transition: background 500ms var(--zacht);
  }
  .vak.mee i {
    background: rgba(255, 255, 255, 0.16);
  }
  .vak.gehad i {
    background: var(--goud-diep);
  }
  .vak.nu i {
    background: var(--goud-licht);
    box-shadow: 0 0 12px color-mix(in oklab, var(--goud-licht) 55%, transparent);
  }
  .vak em {
    font-family: var(--mono);
    font-style: normal;
    font-size: calc(var(--fs-etiket) * 0.82);
    letter-spacing: 0.06em;
    color: rgba(255, 255, 255, 0.22);
    text-transform: uppercase;
  }
  .vak.mee em {
    color: var(--salie);
  }
  .vak.nu em {
    color: var(--goud-licht);
  }
  .compact .vak em {
    display: none;
  }

  /* ---- de lijn die de dia uittelt ---- */
  .voortgang {
    height: 2px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.07);
    overflow: hidden;
  }
  .voortgang i {
    display: block;
    height: 100%;
    width: 0;
    background: linear-gradient(90deg, var(--goud-diep), var(--goud-licht));
  }
  .voortgang.loopt i {
    animation: uittellen var(--duur, 10s) linear forwards;
  }
  @keyframes uittellen {
    to {
      width: 100%;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .voortgang.loopt i,
    .onthuld .zwart {
      animation: none;
    }
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { invalidateAll } from '$app/navigation';
  import Kader from '$lib/client/Kader.svelte';
  import type { PageData } from './$types';

  /*
   * De proefpagina: de hele avond uitproberen zonder de echte te raken.
   *
   * Een proefrit is een spel met een eigen database in het geheugen (zie
   * src/lib/server/proef.ts). De televisie, de telefoons en het hostscherm
   * van die proefrit staan hier naast elkaar, elk op ware grootte en
   * verkleind. Bots spelen de namen waar geen telefoon op zit. Onder
   * 'Spring naar' staat elk onderdeel van de avond één klik verderop.
   */

  let { data }: { data: PageData } = $props();

  interface Onderdeel {
    id: string;
    hoofdstuk: string;
    label: string;
    soort: string;
  }
  interface Overzicht {
    id: string;
    instellingen: { kansGoed: number; bots: boolean; gast: string | null };
    nu: string;
    fase: string;
    spelers: { id: number; naam: string; mens: boolean }[];
    onderdelen: Onderdeel[];
  }

  const OPSLAG = 'bjq-proef';
  const TOON = 'bjq-proef-toon';
  const MAX_TELEFOONS = 4;

  let pin = $state('');
  let fout = $state('');
  let bezig = $state(false);

  let proefId = $state<string | null>(null);
  let o = $state<Overzicht | null>(null);
  let herkomst = $state('');

  // Voor een nieuwe proefrit.
  let kans = $state(70);
  let gast = $state('');
  let metBots = $state(true);

  // Wat er op het podium staat, onthouden op deze computer.
  let toon = $state({ tv: true, host: true, telefoons: 2 });
  /** Per telefoon een volgnummer: 'Opnieuw aanmelden' maakt er een nieuw apparaat van. */
  let rondjes = $state<number[]>(Array(MAX_TELEFOONS).fill(0));

  const bewaar = (sleutel: string, waarde: string | null) => {
    try {
      if (waarde === null) localStorage.removeItem(sleutel);
      else localStorage.setItem(sleutel, waarde);
    } catch {
      /* geen opslag: dan onthoudt de pagina het niet */
    }
  };
  const lees = (sleutel: string) => {
    try {
      return localStorage.getItem(sleutel);
    } catch {
      return null;
    }
  };

  const FASE: Record<string, string> = {
    lobby: 'Lobby — aanmelden',
    jaaroverzicht: 'Het jaaroverzicht',
    ronde: 'Titelkaart van een ronde',
    vraag: 'Vraag open',
    antwoord: 'Antwoord onthuld',
    cijfers: 'Cijfers van het jaar',
    stand: 'Tussenstand',
    einde: 'Podium en prijzen',
  };

  let hoofdstukken = $derived.by(() => {
    const uit: { naam: string; items: Onderdeel[] }[] = [];
    for (const d of o?.onderdelen ?? []) {
      const laatste = uit[uit.length - 1];
      if (laatste?.naam === d.hoofdstuk) laatste.items.push(d);
      else uit.push({ naam: d.hoofdstuk, items: [d] });
    }
    return uit;
  });
  let nuLabel = $derived(o?.onderdelen.find((d) => d.id === o?.nu));

  const adres = (pad: string, apparaat?: string) =>
    `${pad}?proef=${encodeURIComponent(proefId ?? '')}${apparaat ? `&apparaat=${apparaat}` : ''}`;
  let eigenAdres = $derived(proefId && herkomst ? `${herkomst}/?proef=${encodeURIComponent(proefId)}` : '');

  async function aanmelden() {
    fout = '';
    bezig = true;
    try {
      const r = await fetch('/api/join', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rol: 'quizmaster', pin }),
      });
      if (r.status === 403) throw new Error('Die pincode klopt niet.');
      if (!r.ok) throw new Error('Aanmelden lukte niet.');
      pin = '';
      await invalidateAll();
    } catch (e) {
      fout = (e as Error).message;
    } finally {
      bezig = false;
    }
  }

  async function post(body: Record<string, unknown>) {
    const r = await fetch('/api/proef', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: proefId, ...body }),
    });
    if (!r.ok) {
      let reden = '';
      try {
        reden = (await r.json()).message ?? '';
      } catch {
        /* geen uitleg */
      }
      throw new Error(reden || `De server zei ${r.status}.`);
    }
    return r.json();
  }

  async function ververs() {
    if (!proefId) return;
    const r = await fetch(`/api/proef?id=${encodeURIComponent(proefId)}`, { cache: 'no-store' });
    if (r.status === 410) {
      // Opgeruimd (vier uur stil, of de server herstartte).
      proefId = null;
      o = null;
      bewaar(OPSLAG, null);
      fout = 'De vorige proefrit bestaat niet meer. Begin een nieuwe.';
      return;
    }
    if (r.ok) o = await r.json();
  }

  async function begin() {
    fout = '';
    bezig = true;
    try {
      const { id } = await post({ actie: 'start', kansGoed: kans / 100, gast: gast.trim() || null, bots: metBots });
      proefId = id;
      bewaar(OPSLAG, id);
      rondjes = Array(MAX_TELEFOONS).fill(0);
      await ververs();
    } catch (e) {
      fout = (e as Error).message;
    } finally {
      bezig = false;
    }
  }

  async function stop() {
    if (!confirm('De proefrit stoppen? Alles van deze proefrit verdwijnt.')) return;
    try {
      await post({ actie: 'stop' });
    } catch {
      /* al weg */
    }
    proefId = null;
    o = null;
    bewaar(OPSLAG, null);
  }

  async function spring(onderdeel: string) {
    fout = '';
    bezig = true;
    try {
      await post({ actie: 'spring', onderdeel });
      await ververs();
    } catch (e) {
      fout = (e as Error).message;
    } finally {
      bezig = false;
    }
  }

  async function instellen(extra: Record<string, unknown>) {
    try {
      await post({ actie: 'instellingen', ...extra });
      await ververs();
    } catch (e) {
      fout = (e as Error).message;
    }
  }

  function zetToon(nieuw: Partial<typeof toon>) {
    toon = { ...toon, ...nieuw };
    bewaar(TOON, JSON.stringify(toon));
  }

  onMount(() => {
    herkomst = location.origin;
    try {
      toon = { ...toon, ...JSON.parse(lees(TOON) ?? '{}') };
    } catch {
      /* standaard */
    }
    const bewaard = lees(OPSLAG);
    if (bewaard && data.aangemeld) {
      proefId = bewaard;
      void ververs();
    }
    const tik = setInterval(() => void ververs(), 1500);
    return () => clearInterval(tik);
  });
</script>

<svelte:head><title>Proefrit — Blackjack Quiz 26/27</title></svelte:head>

<div class="scherm">
  {#if !data.aangemeld}
    <div class="romp midden" style="max-width:520px">
      <p class="etiket">Proefrit</p>
      <h1 class="groot">De avond uitproberen</h1>
      <p class="lood">Met bots aan tafel, zonder de echte avond te raken. Dezelfde pincode als het hostscherm.</p>
      {#if fout}<p class="let-op" style="border-color:var(--rood)" in:fade={{ duration: 200 }}>{fout}</p>{/if}
      <div class="knoprij">
        <input
          type="password" inputmode="numeric" bind:value={pin} placeholder="Pincode" autocomplete="off"
          style="max-width:10rem" onkeydown={(e) => e.key === 'Enter' && aanmelden()} aria-label="Pincode"
        />
        <button class="knop hoofd" onclick={aanmelden} disabled={bezig || !pin}>Naar de proefrit</button>
        <a class="knop stil" href="/">Terug naar het begin</a>
      </div>
    </div>
  {:else if !proefId}
    <div class="romp midden" style="max-width:640px">
      <p class="etiket">Proefrit</p>
      <h1 class="groot">De avond uitproberen</h1>
      <p class="lood">
        Een proefrit is een eigen spel dat alleen in het geheugen van de server leeft. De echte televisie en telefoons
        zien er niets van, hij komt niet in de uitslagen, en een echte avond kan gewoon doorlopen. Hij speelt de rondes
        en vragen die voor de echte avond klaarstaan.
      </p>
      {#if fout}<p class="let-op" style="border-color:var(--rood)" in:fade={{ duration: 200 }}>{fout}</p>{/if}
      <div class="paneel instellingen">
        <label>
          <span>Bots spelen mee</span>
          <input type="checkbox" bind:checked={metBots} />
        </label>
        <label>
          <span>Kans op een goed antwoord</span>
          <span class="schuif"><input type="range" min="0" max="100" step="5" bind:value={kans} disabled={!metBots} /><output>{kans}%</output></span>
        </label>
        <label>
          <span>Plus-één aan tafel <span class="fijn">(leeg: alleen de vaste vijf)</span></span>
          <input type="text" bind:value={gast} placeholder="bijvoorbeeld Tom" maxlength="24" />
        </label>
        <p class="fijn">
          De vaste vijf spelen mee, Cas is de quizmaster. Een plus-één speelt elke ronde mee behalve De Voorspellingen.
          Op elke naam waar je een telefoon op zet, stopt de bot.
        </p>
      </div>
      <div class="knoprij">
        <button class="knop hoofd" onclick={begin} disabled={bezig}>Begin de proefrit</button>
        <a class="knop stil" href="/host">Naar het echte hostscherm</a>
      </div>
    </div>
  {:else}
    <div class="proef">
      <aside class="zij">
        <div class="paneel">
          <p class="etiket">Proefrit</p>
          <p class="fase">{FASE[o?.fase ?? ''] ?? '…'}</p>
          {#if nuLabel}<p class="fijn">{nuLabel.hoofdstuk} · {nuLabel.label}</p>{/if}
          {#if fout}<p class="let-op" style="border-color:var(--rood)" in:fade={{ duration: 200 }}>{fout}</p>{/if}
          <p class="fijn" style="margin-top:.6rem">Klik door op het hostscherm hiernaast, of spring direct naar een onderdeel.</p>
          <div class="knoprij" style="margin-top:.6rem">
            <button class="knop stil klein" onclick={stop}>Stop de proefrit</button>
          </div>
        </div>

        <div class="paneel">
          <p class="etiket">Aan tafel</p>
          <ul class="tafel">
            {#each o?.spelers ?? [] as s (s.id)}
              <li>
                <span>{s.naam}</span>
                <span class="fijn">{s.mens ? '📱 telefoon' : o?.instellingen.bots ? '🤖 bot' : '— niemand'}</span>
              </li>
            {/each}
          </ul>
          <label class="regel">
            <span>Bots spelen mee</span>
            <input type="checkbox" checked={o?.instellingen.bots ?? true} onchange={(e) => instellen({ bots: e.currentTarget.checked })} />
          </label>
          <label class="regel">
            <span>Goed</span>
            <span class="schuif">
              <input
                type="range" min="0" max="100" step="5" value={Math.round((o?.instellingen.kansGoed ?? 0.7) * 100)}
                onchange={(e) => instellen({ kansGoed: Number(e.currentTarget.value) / 100 })}
              />
              <output>{Math.round((o?.instellingen.kansGoed ?? 0.7) * 100)}%</output>
            </span>
          </label>
          {#if !o?.instellingen.gast}
            <div class="knoprij" style="margin-top:.5rem">
              <input type="text" bind:value={gast} placeholder="Plus-één" maxlength="24" style="max-width:9rem" />
              <button class="knop stil klein" onclick={() => gast.trim() && instellen({ gast: gast.trim() })} disabled={!gast.trim()}>Schuif aan</button>
            </div>
          {/if}
        </div>

        <div class="paneel">
          <p class="etiket">Spring naar</p>
          <p class="fijn">Alles ervoor wordt door de bots gespeeld, alles erna gewist. Een vraag opnieuw openen begint hem leeg.</p>
          <div class="sprong">
            {#each hoofdstukken as h (h.naam)}
              <p class="hoofdstuk">{h.naam}</p>
              <ul>
                {#each h.items as d (d.id)}
                  <li class:nu={d.id === o?.nu}>
                    <button onclick={() => spring(d.id)} disabled={bezig}>
                      <span class="soort">{d.soort}</span>
                      <span class="lbl">{d.label}</span>
                    </button>
                  </li>
                {/each}
              </ul>
            {/each}
          </div>
        </div>

        <div class="paneel">
          <p class="etiket">Schermen</p>
          <label class="regel"><span>Televisie</span><input type="checkbox" checked={toon.tv} onchange={(e) => zetToon({ tv: e.currentTarget.checked })} /></label>
          <label class="regel"><span>Hostscherm</span><input type="checkbox" checked={toon.host} onchange={(e) => zetToon({ host: e.currentTarget.checked })} /></label>
          <label class="regel">
            <span>Telefoons</span>
            <select value={toon.telefoons} onchange={(e) => zetToon({ telefoons: Number(e.currentTarget.value) })}>
              {#each [0, 1, 2, 3, 4] as n (n)}<option value={n}>{n}</option>{/each}
            </select>
          </label>
        </div>

        <div class="paneel">
          <p class="etiket">Op je eigen telefoon</p>
          {#if eigenAdres}
            <div class="eigen">
              <img src={`/api/qr?doel=${encodeURIComponent(eigenAdres)}`} alt="QR-code van deze proefrit" />
              <p class="fijn">Scan de code om met een echte telefoon mee te doen. Die zit dan in deze proefrit, niet in de echte avond. <a href={eigenAdres} target="_blank" rel="noreferrer">Open in een tabblad</a></p>
            </div>
          {/if}
        </div>
      </aside>

      <section class="podium">
        {#if toon.tv}
          <div class="scherm-kaart">
            <header><span class="etiket">Televisie</span><a class="fijn" href={adres('/tv', 'tv')} target="_blank" rel="noreferrer">los openen ↗</a></header>
            <Kader src={adres('/tv', 'tv')} breedte={1920} hoogte={1080} titel="Televisie van de proefrit" />
          </div>
        {/if}
        <div class="rij">
          {#each Array(toon.telefoons) as _, i (i)}
            <div class="scherm-kaart telefoon">
              <header>
                <span class="etiket">Telefoon {i + 1}</span>
                <button class="fijn link" onclick={() => (rondjes[i] += 1)} title="Een nieuw apparaat: weer bij het kiezen van een naam">Opnieuw</button>
              </header>
              {#key rondjes[i]}
                <Kader src={adres('/', `telefoon-${i + 1}${rondjes[i] ? `-${rondjes[i]}` : ''}`)} breedte={390} hoogte={780} titel="Telefoon {i + 1}" />
              {/key}
            </div>
          {/each}
          {#if toon.host}
            <div class="scherm-kaart host">
              <header><span class="etiket">Hostscherm</span><a class="fijn" href={adres('/host', 'host')} target="_blank" rel="noreferrer">los openen ↗</a></header>
              <Kader src={adres('/host', 'host')} breedte={1100} hoogte={1400} titel="Hostscherm van de proefrit" />
            </div>
          {/if}
        </div>
      </section>
    </div>
  {/if}
</div>

<style>
  .instellingen {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin: 1rem 0;
  }
  .instellingen label,
  .regel {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  .regel {
    margin-top: 0.4rem;
  }
  .schuif {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .schuif output {
    font-family: var(--mono);
    min-width: 3em;
    text-align: right;
  }
  .proef {
    display: grid;
    grid-template-columns: 340px minmax(0, 1fr);
    gap: 16px;
    padding: 16px;
    align-items: start;
  }
  .zij {
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: sticky;
    top: 16px;
    max-height: calc(100vh - 32px);
    overflow: auto;
  }
  .zij .paneel {
    padding: 0.9rem 1rem;
  }
  .fase {
    font-family: var(--serif, serif);
    font-size: 1.35rem;
    margin: 0.2rem 0;
  }
  .tafel {
    list-style: none;
    margin: 0.4rem 0;
    padding: 0;
  }
  .tafel li {
    display: flex;
    justify-content: space-between;
    padding: 0.2rem 0;
    border-bottom: 1px solid var(--rand);
  }
  .sprong .hoofdstuk {
    margin: 0.7rem 0 0.2rem;
    font-size: 0.8rem;
    color: var(--goud);
  }
  .sprong ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .sprong li button {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
    width: 100%;
    text-align: left;
    background: none;
    border: 0;
    color: inherit;
    font: inherit;
    font-size: 0.88rem;
    padding: 0.25rem 0.4rem;
    border-radius: 6px;
    cursor: pointer;
  }
  .sprong li button:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  .sprong li.nu button {
    background: rgba(201, 162, 39, 0.16);
    box-shadow: inset 3px 0 0 var(--goud);
  }
  .sprong .soort {
    flex: none;
    font-family: var(--mono);
    font-size: 0.68rem;
    color: var(--salie);
    border: 1px solid var(--rand);
    border-radius: 4px;
    padding: 0 0.3rem;
    min-width: 4.6rem;
    text-align: center;
  }
  .sprong .lbl {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .podium {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }
  .rij {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-start;
  }
  .scherm-kaart {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--rand);
    border-radius: 12px;
    padding: 8px;
  }
  .scherm-kaart header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin: 0 2px 6px;
  }
  .scherm-kaart header .etiket {
    margin: 0;
  }
  .telefoon {
    flex: 0 0 270px;
  }
  .host {
    flex: 1 1 380px;
    min-width: 320px;
  }
  .link {
    background: none;
    border: 0;
    color: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .eigen {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: 0.8rem;
    align-items: center;
  }
  .eigen img {
    width: 110px;
    border-radius: 8px;
  }
  @media (max-width: 900px) {
    .proef {
      grid-template-columns: 1fr;
    }
    .zij {
      position: static;
      max-height: none;
    }
  }
</style>

<script lang="ts">
  import { fade } from 'svelte/transition';
  import { invalidateAll } from '$app/navigation';
  import { maakPortret } from '$lib/client/portret';
  import Portret from '$lib/client/Portret.svelte';
  import { dierVan } from '$lib/shared/dieren';
  import type { PageData } from './$types';
  import type { BeheerOverzicht } from '$lib/server/beheer';

  let { data }: { data: PageData } = $props();

  /* Het overzicht komt van de server mee met de pagina, en daarna vers terug
     bij elke opdracht — zo hoeft het scherm niets zelf te onthouden. */
  let overzicht = $state<BeheerOverzicht | null>(null);
  $effect(() => {
    overzicht = data.overzicht;
  });

  let pin = $state('');
  let fout = $state('');
  let melding = $state('');
  let bezig = $state(false);

  let nieuweSpeler = $state('');
  /** Welke speler of welk spel er nu een naamveld open heeft. */
  let hernoem = $state<{ soort: 'speler' | 'spel'; id: number; naam: string } | null>(null);
  let fotoInvoer = $state<HTMLInputElement | null>(null);
  let fotoVoor = $state<number | null>(null);

  let o = $derived(overzicht);
  let server = $derived(o?.server ?? null);
  let gezond = $derived(!!server && server.fouten.length === 0);
  let ontbrekendeMedia = $derived(o?.media.verwacht.filter((v) => !v.aanwezig) ?? []);
  let oudeApparaten = $derived((o?.apparaten ?? []).filter((a) => a.stilSinds > 24 * 3600 && !a.ditApparaat).length);

  async function alsQuizmaster() {
    fout = '';
    bezig = true;
    try {
      const r = await fetch('/api/join', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rol: 'quizmaster', pin }),
      });
      if (r.status === 403) throw new Error('Die pincode klopt niet.');
      // Een andere fout (zoals de rem na te veel missers) heeft een eigen reden.
      if (!r.ok) throw new Error(redenUit(new Error(await r.text())) || 'Aanmelden lukte niet.');
      pin = '';
      await invalidateAll();
    } catch (e) {
      fout = (e as Error).message;
    } finally {
      bezig = false;
    }
  }

  function redenUit(e: unknown): string {
    try {
      return JSON.parse(String((e as Error).message)).message ?? '';
    } catch {
      return '';
    }
  }

  async function doe(opdracht: string, extra: Record<string, unknown> = {}) {
    if (bezig) return false;
    bezig = true;
    fout = '';
    melding = '';
    try {
      const r = await fetch('/api/beheer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ opdracht, ...extra }),
      });
      if (!r.ok) throw new Error(await r.text());
      const uit = await r.json();
      overzicht = uit.overzicht;
      melding = uit.melding ?? '';
      setTimeout(() => (melding = ''), 4000);
      return true;
    } catch (e) {
      fout = redenUit(e) || `"${opdracht}" mislukte. Probeer het opnieuw.`;
      return false;
    } finally {
      bezig = false;
    }
  }

  async function ververs() {
    bezig = true;
    fout = '';
    try {
      const r = await fetch('/api/beheer', { cache: 'no-store' });
      if (!r.ok) throw new Error(await r.text());
      overzicht = await r.json();
    } catch {
      fout = 'Verversen lukte niet.';
    } finally {
      bezig = false;
    }
  }

  /* ---- Spelers -------------------------------------------------------- */
  async function voegSpelerToe() {
    const naam = nieuweSpeler.trim();
    if (!naam) return;
    if (await doe('speler-toevoegen', { naam })) nieuweSpeler = '';
  }

  function beginHernoem(soort: 'speler' | 'spel', id: number, naam: string) {
    hernoem = { soort, id, naam };
  }

  async function bewaarHernoem() {
    if (!hernoem) return;
    const { soort, id, naam } = hernoem;
    if (await doe(soort === 'speler' ? 'speler-hernoemen' : 'spel-hernoemen', { id, naam })) hernoem = null;
  }

  function kiesFoto(spelerId: number) {
    fotoVoor = spelerId;
    fotoInvoer?.click();
  }

  async function fotoGekozen(e: Event) {
    const invoer = e.target as HTMLInputElement;
    const bestand = invoer.files?.[0];
    const spelerId = fotoVoor;
    invoer.value = '';
    fotoVoor = null;
    if (!bestand || spelerId === null) return;
    try {
      const foto = await maakPortret(bestand);
      await doe('speler-foto', { id: spelerId, foto });
    } catch {
      fout = 'Die afbeelding kon niet worden gelezen.';
    }
  }

  async function verwijderSpeler(id: number, naam: string) {
    if (!confirm(`${naam} weghalen? Dit kan niet ongedaan worden gemaakt.`)) return;
    await doe('speler-verwijderen', { id });
  }

  /* ---- Spellen -------------------------------------------------------- */
  async function verwijderSpel(id: number, omschrijving: string) {
    if (!confirm(`Spel #${id} (${omschrijving}) weggooien, met alle antwoorden en de stand? Dit kan niet ongedaan worden gemaakt.`)) return;
    await doe('spel-verwijderen', { id });
  }

  async function activeerSpel(id: number) {
    if (!confirm(`Spel #${id} weer actief maken? De televisie en de telefoons springen er meteen naar.`)) return;
    await doe('spel-activeren', { id });
  }

  /* ---- Opmaak --------------------------------------------------------- */
  function datum(iso: string | null) {
    if (!iso) return '—';
    const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function geleden(seconden: number | null) {
    if (seconden === null) return 'nog nooit gezien';
    if (seconden < 60) return `${seconden}s geleden`;
    if (seconden < 3600) return `${Math.round(seconden / 60)} min geleden`;
    if (seconden < 86_400) return `${Math.round(seconden / 3600)} uur geleden`;
    return `${Math.round(seconden / 86_400)} ${seconden < 172_800 ? 'dag' : 'dagen'} geleden`;
  }
  function bytes(n: number | null) {
    if (n === null) return '—';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} kB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  }
  function duur(seconden: number) {
    if (seconden < 3600) return `${Math.round(seconden / 60)} min`;
    if (seconden < 86_400) return `${(seconden / 3600).toFixed(1)} uur`;
    return `${(seconden / 86_400).toFixed(1)} dagen`;
  }
  const faseNaam: Record<string, string> = {
    lobby: 'lobby', ronde: 'bezig', vraag: 'bezig', antwoord: 'bezig', cijfers: 'bezig', stand: 'bezig', einde: 'afgelopen',
  };
  const rolNaam: Record<string, string> = { quizmaster: 'quizmaster', speler: 'telefoon', gast: 'kijker' };
  const bronNaam: Record<string, string> = { live: 'live uit resolution-recap', bestand: 'uit een bestand', ingebouwd: 'ingebouwde momentopname' };
</script>

<svelte:head><title>Beheer — Blackjack Quiz 26/27</title></svelte:head>

<div class="scherm">
  {#if !data.aangemeld}
    <div class="romp midden" style="max-width:520px">
      <p class="etiket">Beheer</p>
      <h1 class="groot">Alleen voor de quizmaster</h1>
      <p class="lood">Spelers, oude spellen, telefoons en de bestanden bij de vragen. Dezelfde pincode als het hostscherm.</p>
      {#if fout}<p class="let-op" style="border-color:var(--rood)" in:fade={{ duration: 200 }}>{fout}</p>{/if}
      <div class="knoprij">
        <input
          type="password" inputmode="numeric" bind:value={pin} placeholder="Pincode" autocomplete="off"
          style="max-width:10rem" onkeydown={(e) => e.key === 'Enter' && alsQuizmaster()} aria-label="Pincode"
        />
        <button class="knop hoofd" onclick={alsQuizmaster} disabled={bezig || !pin}>Naar het beheer</button>
        <a class="knop stil" href="/">Terug naar het begin</a>
      </div>
    </div>
  {:else if o && server}
    <div class="romp" style="max-width:1100px">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <div style="flex:1 1 220px;min-width:0">
          <p class="etiket">Beheer</p>
          <h1 class="groot">Blackjack Quiz 26/27</h1>
        </div>
        <p class="verbinding">
          <span class="stip" class:aan={gezond} class:uit={!gezond}></span>
          {gezond ? 'server gezond' : 'server niet in orde'}
          · {server.productie ? 'productie' : 'laptop'}
        </p>
        <button class="knop stil" onclick={ververs} disabled={bezig}>Ververs</button>
      </div>

      {#if fout}<p class="let-op" style="border-color:var(--rood)" in:fade={{ duration: 200 }}>{fout}</p>{/if}
      {#if melding}<p class="let-op" style="border-color:var(--groen)" in:fade={{ duration: 200 }}>{melding}</p>{/if}

      <!-- De server -->
      <section class="paneel">
        <p class="etiket stil">Server</p>
        {#each server.fouten as f (f)}<p class="let-op" style="border-color:var(--rood);margin-top:.6rem">{f}</p>{/each}
        {#each server.waarschuwingen as w (w)}<p class="let-op" style="margin-top:.6rem">{w}</p>{/each}
        <dl class="beheer-feiten">
          <dt>Adres</dt>
          <dd>
            {#if server.origin}
              {server.origin}
            {:else if server.adressen.length}
              {#each server.adressen as a, i (a.adres)}
                {#if i > 0}<br />{/if}
                <a href="http://{a.adres}:{server.poort}/tv" class="mono">http://{a.adres}:{server.poort}</a>
                <span style="opacity:.7">({a.naam}{i === 0 ? ' — tik dit op de televisie' : ''})</span>
              {/each}
            {:else}
              niet ingesteld (ORIGIN)
            {/if}
          </dd>
          <dt>Database</dt><dd><span class="mono">{server.databasePad}</span> · {bytes(server.databaseBytes)} · {server.tabellen} tabellen</dd>
          <dt>Schermen live</dt><dd>{server.schermenVerbonden} open {server.schermenVerbonden === 1 ? 'stroom' : 'stromen'}</dd>
          <dt>Proces</dt><dd>Node {server.nodeVersie} · draait {duur(server.draaitSinds)}</dd>
          <dt>Cijfers van het jaar</dt>
          <dd>
            {bronNaam[server.recap.bron] ?? server.recap.bron}
            {#if server.recap.exportedAt}· export van {datum(server.recap.exportedAt)}{/if}
            · {server.recap.aantalEntries} regels
            {#if server.recap.fout}<br /><span style="color:var(--rood-licht)">Verversen mislukte: {server.recap.fout}</span>{/if}
          </dd>
        </dl>
        <div class="knoprij" style="margin-top:.8rem">
          <a class="knop" href="/api/beheer/export" download>Download een back-up (JSON)</a>
          <a class="knop stil" href="/api/health" target="_blank" rel="noreferrer">Gezondheidscontrole</a>
        </div>
      </section>

      <!-- De inhoud en de bestanden erbij -->
      <section class="paneel">
        <p class="etiket stil">Inhoud</p>
        <div class="beheer-tabel"><table class="uitslagtabel">
          <thead><tr><th>Pakket</th><th class="cijfer">Rondes</th><th class="cijfer">Vragen</th><th class="cijfer">Live</th><th class="cijfer">Nog te vullen</th></tr></thead>
          <tbody>
            {#each o.inhoud as p (p.id)}
              <tr>
                <td>{p.naam} <span class="fijn">({p.id})</span></td>
                <td class="cijfer">{p.rondes}</td>
                <td class="cijfer">{p.vragen}</td>
                <td class="cijfer">{p.live}</td>
                <td class="cijfer" style:color={p.teVullen ? 'var(--rood-licht)' : undefined}>{p.teVullen}</td>
              </tr>
            {/each}
          </tbody>
        </table></div>
        <p class="fijn" style="margin-top:.6rem">Vragen aanpassen gaat in <span class="mono">src/lib/content/packs.ts</span>, daarna <span class="mono">npm run content:sync</span>.</p>

        <p class="etiket stil" style="margin-top:1.2rem">Bestanden bij de vragen</p>
        <p class="fijn" style="margin-top:.3rem">
          Map <span class="mono">{o.media.map}</span>
          {#if !o.media.mapBestaat}<span style="color:var(--rood-licht)"> · bestaat niet</span>{/if}
          · {o.media.verwacht.length} verwacht
          {#if o.media.ontbrekend}· <span style="color:var(--rood-licht)">{o.media.ontbrekend} {o.media.ontbrekend === 1 ? 'ontbreekt' : 'ontbreken'}</span>{:else if o.media.verwacht.length}· <span style="color:var(--groen-licht)">alles aanwezig</span>{/if}
        </p>
        {#if o.media.verwacht.length}
          <div class="beheer-tabel"><table class="uitslagtabel">
            <thead><tr><th></th><th>Bestand</th><th>Soort</th><th>Vraag</th></tr></thead>
            <tbody>
              {#each o.media.verwacht as v (v.pakket + v.ronde + v.bron + v.vraag)}
                <tr class:beheer-ontbreekt={!v.aanwezig}>
                  <td><span class="stip" class:aan={v.aanwezig} class:uit={!v.aanwezig}></span></td>
                  <td class="mono">{v.bron}</td>
                  <td>{v.soort}</td>
                  <td style="white-space:normal;min-width:18rem"><span class="fijn">{v.ronde}</span><br />{v.vraag}</td>
                </tr>
              {/each}
            </tbody>
          </table></div>
        {/if}
        {#if o.media.ongebruikt.length}
          <p class="fijn" style="margin-top:.6rem">In de map maar door geen vraag gebruikt: {o.media.ongebruikt.join(', ')}</p>
        {/if}
      </section>

      <!-- De spelers -->
      <section class="paneel">
        <p class="etiket stil">Spelers</p>
        <p class="fijn" style="margin-top:.3rem">Vaste spelers doen vanzelf mee aan elk nieuw spel; een gast schuift per avond aan. Weghalen kan alleen zolang er geen avond aan hangt.</p>
        <input type="file" accept="image/*" bind:this={fotoInvoer} onchange={fotoGekozen} style="display:none" aria-hidden="true" tabindex="-1" />
        <div class="beheer-lijst">
          {#each o.spelers as s (s.id)}
            <div class="beheer-rij">
              <button class="portretknop" onclick={() => kiesFoto(s.id)} disabled={bezig} title="Portret kiezen voor {s.naam}" aria-label="Portret kiezen voor {s.naam}">
                <Portret naam={s.naam} foto={s.foto} dier={s.dier} />
              </button>
              <div style="min-width:0">
                {#if hernoem?.soort === 'speler' && hernoem.id === s.id}
                  <span class="knoprij" style="gap:.4rem">
                    <input type="text" bind:value={hernoem.naam} maxlength="24" style="max-width:12rem;padding:.35rem .7rem" aria-label="Nieuwe naam" onkeydown={(e) => { if (e.key === 'Enter') bewaarHernoem(); if (e.key === 'Escape') hernoem = null; }} />
                    <button class="knop hoofd" style="padding:.4rem .9rem" onclick={bewaarHernoem} disabled={bezig}>Bewaar</button>
                    <button class="knop stil" style="padding:.4rem .9rem" onclick={() => (hernoem = null)}>Annuleer</button>
                  </span>
                {:else}
                  <strong style="font-size:1.05rem">{s.naam}</strong>
                  {#if s.isQuizmaster}<span class="badge">quizmaster</span>{/if}
                  {#if s.isGast}<span class="badge">gast</span>{/if}
                  {#if s.doetNuMee}<span class="badge" style="border-color:var(--groen);color:var(--groen-licht)">doet nu mee</span>{/if}
                {/if}
                <br />
                <span class="fijn">{s.avonden} {s.avonden === 1 ? 'avond' : 'avonden'} · telefoon {geleden(s.stilSinds)}</span>
              </div>
              <div class="knoprij" style="gap:.3rem;justify-content:flex-end">
                <button class="knop stil" onclick={() => beginHernoem('speler', s.id, s.naam)} disabled={bezig}>Hernoem</button>
                {#if !s.isQuizmaster}
                  <button class="knop stil" onclick={() => doe('speler-gast', { id: s.id, isGast: !s.isGast })} disabled={bezig}>
                    {s.isGast ? 'Maak vast' : 'Maak gast'}
                  </button>
                {/if}
                {#if !s.isQuizmaster}
                  <button class="knop stil" onclick={() => doe('speler-dier', { id: s.id })} disabled={bezig} title="Nu: {dierVan(s.dier, s.naam).titel}">🎲 Ander dier</button>
                {/if}
                {#if s.foto}
                  <button class="knop stil" onclick={() => doe('speler-foto', { id: s.id, foto: null })} disabled={bezig}>Portret weg</button>
                {/if}
                {#if s.verwijderbaar}
                  <button class="knop stil" style="color:var(--rood-licht)" onclick={() => verwijderSpeler(s.id, s.naam)} disabled={bezig}>Verwijder</button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
        <div class="knoprij" style="margin-top:.8rem">
          <input type="text" bind:value={nieuweSpeler} placeholder="Nieuwe vaste speler" maxlength="24" autocomplete="off" style="max-width:14rem;padding:.5rem .8rem" onkeydown={(e) => e.key === 'Enter' && voegSpelerToe()} aria-label="Naam van de nieuwe speler" />
          <button class="knop" onclick={voegSpelerToe} disabled={bezig || !nieuweSpeler.trim()}>+ Speler</button>
        </div>
      </section>

      <!-- De spellen -->
      <section class="paneel">
        <p class="etiket stil">Spellen</p>
        <p class="fijn" style="margin-top:.3rem">Elke avond blijft bewaard. Een proefrit gooi je hier weg; een eerder spel kun je weer actief maken.</p>
        <div class="beheer-lijst">
          {#each o.spellen as s (s.id)}
            <div class="beheer-rij" class:beheer-actief={s.isActief}>
              <span class="plek mono">#{s.id}</span>
              <div style="min-width:0">
                {#if hernoem?.soort === 'spel' && hernoem.id === s.id}
                  <span class="knoprij" style="gap:.4rem">
                    <input type="text" bind:value={hernoem.naam} maxlength="60" style="max-width:16rem;padding:.35rem .7rem" aria-label="Nieuwe naam van het spel" onkeydown={(e) => { if (e.key === 'Enter') bewaarHernoem(); if (e.key === 'Escape') hernoem = null; }} />
                    <button class="knop hoofd" style="padding:.4rem .9rem" onclick={bewaarHernoem} disabled={bezig}>Bewaar</button>
                    <button class="knop stil" style="padding:.4rem .9rem" onclick={() => (hernoem = null)}>Annuleer</button>
                  </span>
                {:else}
                  <strong style="font-size:1.05rem">{s.naam}</strong>
                  {#if s.isActief}<span class="badge" style="border-color:var(--goud);color:var(--goud-licht)">actief</span>{/if}
                  <span class="badge">{faseNaam[s.fase] ?? s.fase}</span>
                {/if}
                <br />
                <span class="fijn">
                  {s.pakketNaam} · {datum(s.gestartOp)} · {s.aantalSpelers} spelers · {s.aantalAntwoorden} antwoorden · {s.aantalHandelingen} handelingen
                  {#if s.winnaars.length}· voorop: {s.winnaars.join(' & ')} met {s.punten}{/if}
                </span>
              </div>
              <div class="knoprij" style="gap:.3rem;justify-content:flex-end">
                <a class="knop stil" href="/uitslag/{s.id}" target="_blank" rel="noreferrer">Uitslag</a>
                <button class="knop stil" onclick={() => beginHernoem('spel', s.id, s.naam)} disabled={bezig}>Hernoem</button>
                {#if !s.isActief}
                  <button class="knop stil" onclick={() => activeerSpel(s.id)} disabled={bezig}>Maak actief</button>
                {/if}
                <button class="knop stil" style="color:var(--rood-licht)" onclick={() => verwijderSpel(s.id, `${s.pakketNaam}, ${datum(s.gestartOp)}`)} disabled={bezig}>Verwijder</button>
              </div>
            </div>
          {/each}
        </div>
        <p class="fijn" style="margin-top:.8rem">Een nieuw spel begin je op het <a href="/host">hostscherm</a>, daar kies je ook het pakket.</p>
      </section>

      <!-- De apparaten -->
      <section class="paneel">
        <p class="etiket stil">Apparaten</p>
        <p class="fijn" style="margin-top:.3rem">Elke telefoon, televisie en elk hostscherm dat zich meldde. Zit iemand op de verkeerde naam, koppel die telefoon dan los: hij kiest daarna opnieuw.</p>
        <div class="beheer-tabel"><table class="uitslagtabel">
          <thead><tr><th></th><th>Rol</th><th>Naam</th><th>Laatst gezien</th><th></th></tr></thead>
          <tbody>
            {#each o.apparaten as a (a.id)}
              <tr>
                <td><span class="stip" class:aan={a.stilSinds < 20} class:uit={a.stilSinds >= 20 && a.stilSinds < 24 * 3600}></span></td>
                <td>{rolNaam[a.rol] ?? a.rol}{#if a.ditApparaat} <span class="badge">dit scherm</span>{/if}</td>
                <td>{a.spelerNaam ?? a.naam ?? '—'}</td>
                <td>{geleden(a.stilSinds)}</td>
                <td style="text-align:right">
                  {#if !a.ditApparaat}
                    <button class="knop stil" style="padding:.3rem .7rem" onclick={() => doe('apparaat-loskoppelen', { id: a.id })} disabled={bezig}>Koppel los</button>
                  {/if}
                </td>
              </tr>
            {:else}
              <tr><td colspan="5" class="fijn">Nog geen apparaten gezien.</td></tr>
            {/each}
          </tbody>
        </table></div>
        <div class="knoprij" style="margin-top:.8rem">
          <button class="knop stil" onclick={() => doe('apparaten-opruimen')} disabled={bezig || !oudeApparaten}>
            Vergeet apparaten ouder dan een dag{#if oudeApparaten} ({oudeApparaten}){/if}
          </button>
        </div>
      </section>

      <div class="knoprij">
        <a class="knop stil" href="/host">Hostscherm</a>
        <a class="knop stil" href="/tv" target="_blank" rel="noreferrer">Televisiescherm</a>
        <a class="knop stil" href="/uitslag" target="_blank" rel="noreferrer">Uitslagen</a>
        <a class="knop stil" href="/">Terug naar het begin</a>
      </div>
    </div>
  {/if}
</div>

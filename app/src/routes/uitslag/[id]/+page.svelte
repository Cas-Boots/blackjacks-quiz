<script lang="ts">
  import type { PageData } from './$types';
  import Podium from '$lib/client/Podium.svelte';
  import { prijsIcoon } from '$lib/shared/prijzen';

  let { data }: { data: PageData } = $props();
  let u = $derived(data.uitslag);
  let gedeeld = $state('');

  function datum(iso: string) {
    const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function initialen(naam: string) {
    return naam.slice(0, 2);
  }

  /** Een samenvatting in platte tekst, voor in de groepsapp. */
  let samenvatting = $derived.by(() => {
    const regels = [`${u.naam} — ${u.pakket}`, datum(u.gestartOp), ''];
    for (const r of u.stand) regels.push(`${r.plek}. ${r.naam} — ${r.punten} ${r.punten === 1 ? 'punt' : 'punten'}`);
    if (u.prijzen.length) {
      regels.push('');
      for (const p of u.prijzen) regels.push(`${prijsIcoon(p.sleutel)} ${p.titel}: ${p.namen.length ? p.namen.join(' & ') + ' — ' : ''}${p.detail}`);
    }
    return regels.join('\n');
  });

  async function deel() {
    const url = typeof location !== 'undefined' ? location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: u.naam, text: samenvatting, url });
        gedeeld = 'Gedeeld.';
      } else {
        await navigator.clipboard.writeText(`${samenvatting}\n\n${url}`);
        gedeeld = 'Gekopieerd. Plak hem in de groepsapp.';
      }
    } catch {
      gedeeld = '';
    }
    setTimeout(() => (gedeeld = ''), 3000);
  }
</script>

<svelte:head><title>Uitslag — {u.naam}</title></svelte:head>

<div class="scherm">
  <div class="romp" style="max-width:900px">
    <p class="etiket">{u.pakket} · {datum(u.gestartOp)}</p>
    <h1 class="groot">{u.fase === 'einde' ? 'De uitslag' : 'De stand tot nu toe'}</h1>
    {#if u.stand.length}
      <p class="lood">
        {#if u.stand.filter((r) => r.plek === 1).length > 1}
          {u.stand.filter((r) => r.plek === 1).map((r) => r.naam).join(' & ')} winnen met {u.stand[0].punten} punten.
        {:else}
          {u.stand[0].naam} wint met {u.stand[0].punten} {u.stand[0].punten === 1 ? 'punt' : 'punten'}.
        {/if}
      </p>
    {/if}

    <div class="knoprij">
      <button class="knop hoofd" onclick={deel}>Deel de uitslag</button>
      <a class="knop stil" href="/uitslag">Alle avonden</a>
      {#if gedeeld}<span class="fijn">{gedeeld}</span>{/if}
    </div>

    {#if u.stand.length >= 2}
      <div style="padding:1.6rem .2rem .2rem">
        <Podium top3={u.stand.slice(0, 3)} compact />
      </div>
    {/if}

    <div class="paneel">
      <p class="etiket stil">Eindstand</p>
      <div class="stand" style="margin-top:.5rem">
        {#each u.stand as r, i (r.spelerId)}
          <div class="standrij" class:leider={r.plek === 1} style="--i:{i}">
            <span class="plek">{r.plek}</span>
            {#if r.foto}<img class="avatar" class:goud={r.plek === 1} src={r.foto} alt="" />{:else}<span class="avatar" class:goud={r.plek === 1}>{initialen(r.naam)}</span>{/if}
            <span class="naam" style="font-size:1.3rem">{r.naam}</span>
            <span class="standpunten" style="font-size:1.1rem">{r.punten}</span>
          </div>
        {/each}
      </div>
    </div>

    {#if u.prijzen.length}
      <div class="paneel">
        <p class="etiket stil">Prijzen</p>
        {#each u.prijzen as p (p.sleutel)}
          <p style="display:flex;gap:.6rem;align-items:baseline;margin:.5rem 0 0">
            <span aria-hidden="true">{prijsIcoon(p.sleutel)}</span>
            <span><strong>{p.titel}:</strong> {p.namen.join(' & ')} <span class="fijn">{p.namen.length ? '— ' : ''}{p.detail}</span></span>
          </p>
        {/each}
      </div>
    {/if}

    {#if u.rondes.some((r) => r.gespeeld)}
      <div class="paneel" style="overflow-x:auto">
        <p class="etiket stil">Per ronde</p>
        <table class="uitslagtabel">
          <thead>
            <tr>
              <th>Ronde</th>
              {#each u.stand as r (r.spelerId)}<th>{r.naam}</th>{/each}
            </tr>
          </thead>
          <tbody>
            {#each u.rondes as ronde, ri (ri)}
              {#if ronde.gespeeld}
                <tr>
                  <td><span class="suit" class:rood={ronde.suit === '♥' || ronde.suit === '♦'}>{ronde.suit}</span> {ronde.naam}</td>
                  {#each u.stand as r (r.spelerId)}
                    {@const p = ronde.punten[r.spelerId] ?? 0}
                    <td class="cijfer" class:best={p > 0 && p === Math.max(...Object.values(ronde.punten))}>{p}</td>
                  {/each}
                </tr>
              {/if}
            {/each}
            {#if u.correcties.length}
              <tr>
                <td>Correcties</td>
                {#each u.stand as r (r.spelerId)}
                  {@const som = u.correcties.filter((c) => c.naam === r.naam).reduce((n, c) => n + c.punten, 0)}
                  <td class="cijfer">{som > 0 ? '+' : ''}{som || ''}</td>
                {/each}
              </tr>
            {/if}
            <tr class="totaal">
              <td>Totaal</td>
              {#each u.stand as r (r.spelerId)}<td class="cijfer">{r.punten}</td>{/each}
            </tr>
          </tbody>
        </table>
      </div>
    {/if}

    {#if u.vragen.length}
      <details class="paneel">
        <summary><span class="etiket stil">Per vraag</span> <span class="fijn">{u.vragen.length} vragen</span></summary>
        <ol class="vragenlijst" style="margin-top:.6rem">
          {#each u.vragen as v (`${v.ronde}:${v.nummer}`)}
            <li>
              <span>
                <span class="fijn">{u.rondes[v.ronde]?.naam} · {v.nummer}</span><br />
                {v.tekst}
                <br /><span class="fijn" style="color:var(--groen-licht)">{v.antwoord}</span>
                <span class="fijn"> — {v.goed.length ? `goed: ${v.goed.join(', ')}` : 'niemand goed'}{v.inzenders ? ` · ${v.inzenders} ${v.inzenders === 1 ? 'inzending' : 'inzendingen'}` : ''}</span>
              </span>
            </li>
          {/each}
        </ol>
      </details>
    {/if}
  </div>
</div>

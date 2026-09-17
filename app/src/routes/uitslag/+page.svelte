<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();

  const faseNaam: Record<string, string> = {
    lobby: 'nog niet begonnen', ronde: 'bezig', vraag: 'bezig', antwoord: 'bezig', stand: 'bezig', einde: 'afgelopen',
  };

  function datum(iso: string) {
    const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  }
</script>

<svelte:head><title>Uitslagen — Blackjack Quiz</title></svelte:head>

<div class="scherm">
  <div class="romp" style="max-width:820px">
    <p class="etiket">Blackjack Quiz</p>
    <h1 class="groot">Eerdere avonden</h1>
    <p class="lood">Elke avond blijft bewaard. Tik op een avond voor de eindstand, de prijzen en wat er per vraag gebeurde.</p>

    <div class="stand">
      {#each data.spellen as s, i (s.id)}
        <a class="standrij uitslagrij" href="/uitslag/{s.id}" style="--i:{i}">
          <span class="plek">#{s.id}</span>
          <span></span>
          <span>
            <span class="naam" style="font-size:1.3rem">{s.pakket}</span>
            <br /><span class="fijn">{datum(s.gestartOp)} · {s.aantalSpelers} spelers · {faseNaam[s.fase] ?? s.fase}{s.isActief ? ' · nu actief' : ''}</span>
          </span>
          <span class="standpunten" style="font-size:1rem;text-align:right">
            {#if s.winnaars.length}{s.winnaars.join(' & ')}<br /><span class="fijn">{s.punten} {s.punten === 1 ? 'punt' : 'punten'}</span>{:else}—{/if}
          </span>
        </a>
      {:else}
        <p class="fijn">Nog geen avonden gespeeld.</p>
      {/each}
    </div>

    <div class="knoprij">
      <a class="knop stil" href="/">Terug naar het begin</a>
    </div>
  </div>
</div>

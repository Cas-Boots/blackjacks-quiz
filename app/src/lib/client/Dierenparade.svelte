<script lang="ts" module>
  /** Wie er over het scherm rent: het maatje van deze speler. */
  export interface Loper {
    id: number;
    naam: string;
    dier: string | null;
  }

  /** Nooit meer dan dit tegelijk, anders wordt het een kudde. */
  export const MAX_LOPERS = 4;
</script>

<script lang="ts">
  /**
   * De maatjes die over het scherm trekken op de grote momenten.
   *
   * Elk dier komt op zijn eigen manier binnen (lopen, springen, slingeren,
   * zwemmen, vliegen, graven), stopt op zijn eigen plek, doet een kunstje en
   * gaat weer. Met meer dieren staan ze even naast elkaar. Blij: een van zijn
   * blije kunstjes. Sip: sjokkend, grijs, onder een regenwolkje, met een sip
   * kunstje. Welk kunstje is elke keer een verrassing (zie actiesVan).
   */
  import { onMount, untrack } from 'svelte';
  import { dierVan, gangVan, kiesActie } from '$lib/shared/dieren';

  let {
    lopers,
    stemming = 'blij',
    klaar,
  }: {
    lopers: Loper[];
    stemming?: 'blij' | 'sip';
    /** Als de laatste de overkant heeft gehaald. */
    klaar?: () => void;
  } = $props();

  /* Eén keer vastgelegd bij het begin: wie, welk kunstje, en waar hij stopt.
     De eerste loopt het verst door, zodat niemand een ander inhaalt. Een
     optocht die al loopt verandert niet meer; een nieuwe krijgt een nieuwe. */
  const sip = untrack(() => stemming === 'sip');
  const HEEN_MS = sip ? 2600 : 1500;
  const ACTIE_MS = 2200;
  const WEG_MS = sip ? 2600 : 1500;
  const ZETJE_MS = 300;

  const rij = untrack(() => lopers).slice(0, MAX_LOPERS).map((l, i, alle) => {
    const d = dierVan(l.dier, l.naam);
    const stop = alle.length === 1 ? 50 : 20 + (60 * (alle.length - 1 - i)) / (alle.length - 1);
    const gang = sip ? 'sip' : gangVan(d.beweging);
    return { ...l, d, gang, actie: kiesActie(d, sip ? 'sip' : 'blij'), stop, start: i * ZETJE_MS };
  });
  /* Het decor dat bij de gang hoort: een tak om aan te slingeren, water om
     in te zwemmen. Eén keer over de hele breedte, voor wie het nodig heeft. */
  const metTak = rij.some((l) => l.gang === 'schommel');
  const metWater = rij.some((l) => l.gang === 'zwem');
  const metGrond = rij.some((l) => l.gang === 'graaf');

  let verstreken = $state(0);
  onMount(() => {
    const begin = performance.now();
    const einde = (rij.length - 1) * ZETJE_MS + HEEN_MS + ACTIE_MS + WEG_MS;
    const tik = setInterval(() => {
      verstreken = performance.now() - begin;
      if (verstreken > einde) {
        clearInterval(tik);
        klaar?.();
      }
    }, 100);
    return () => clearInterval(tik);
  });

  function faseVan(start: number) {
    const t = verstreken - start;
    if (t < 0) return 'wacht';
    if (t < HEEN_MS) return 'heen';
    if (t < HEEN_MS + ACTIE_MS) return 'actie';
    if (t < HEEN_MS + ACTIE_MS + WEG_MS) return 'weg';
    return 'klaar';
  }
</script>

{#if metTak}
  <div class="parade-tak" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
{/if}
{#if metWater}
  <div class="parade-water achter" aria-hidden="true"></div>
{/if}

{#each rij as l (l.id)}
  {@const fase = faseVan(l.start)}
  {@const onderweg = fase === 'heen' || fase === 'weg'}
  {@const gravend = l.gang === 'graaf' && (onderweg || l.actie.lijf === 'graaf')}
  <div
    class="dierenparade"
    data-gang={l.gang}
    data-fase={fase}
    style="--stop:{l.stop}vw;--heen:{HEEN_MS}ms;--weg:{WEG_MS}ms"
    aria-hidden="true"
  >
    <span class="actie" data-lijf={fase === 'actie' ? l.actie.lijf : null}>
      <!-- De meeste dieren kijken naar links; hier lopen ze naar rechts. -->
      <span class="kijk" class:rechts={l.d.kijktRechts}>
        <span class="dier">
          <!-- Lijf en ledematen per gang: ze bewegen met het dier mee. -->
          {#if l.gang === 'vlieg'}
            <span class="vleugel links"></span><span class="vleugel rechts"></span><span class="fartlijnen"></span>
          {:else if l.gang === 'schommel'}
            <span class="liaan"></span>
          {:else if l.gang === 'stap' && onderweg}
            <span class="pootjes"><i></i><i></i></span>
          {:else if l.gang === 'spring' && onderweg}
            <span class="veer"></span>
          {:else if l.gang === 'zwem' && onderweg}
            <span class="vin"></span>
          {/if}
          {#if gravend}
            <span class="klauwen"><i></i><i></i></span>
          {/if}
          <span class="emoji">{l.d.emoji}</span>
        </span>
      </span>
      {#if gravend}
        <span class="kluiten"><i></i><i></i><i></i></span>
      {/if}
      {#if fase === 'actie' && l.actie.ding}
        {#each l.actie.dingGaat === 'op' || l.actie.dingGaat === 'val' ? [0, 1, 2] : [0] as n (n)}
          <span class="ding" data-gaat={l.actie.dingGaat} style="--n:{n}">{l.actie.ding}</span>
        {/each}
      {/if}
    </span>
    <!-- De naam via CSS: puur versiering, geen tweede "Tom" in de tekst van de pagina. -->
    <span class="lopernaam" data-naam={l.naam}></span>
  </div>
{/each}

{#if metWater}
  <div class="parade-water voor" aria-hidden="true"></div>
{/if}
{#if metGrond}
  <div class="parade-grond" aria-hidden="true"></div>
{/if}

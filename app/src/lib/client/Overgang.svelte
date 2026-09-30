<script lang="ts" module>
  export interface OvergangMoment {
    /** Loopt op, zodat hetzelfde soort moment twee keer na elkaar ook speelt. */
    id: number;
    soort: 'kaart' | 'aftellen';
    suit: string;
    tekst: string;
  }
</script>

<script lang="ts">
  import * as geluid from '$lib/client/geluid';

  /**
   * De overgang tussen twee delen van de avond, zoals een spelshow hem
   * tussen twee blokken zet.
   *
   * - 'kaart': een speelkaart zo groot als het scherm vliegt erlangs en
   *   neemt de oude dia mee. Bij een nieuwe ronde, de tussenstand, de uitslag.
   * - 'aftellen': drie, twee, één — de opening van de avond.
   *
   * Hangt over alles heen en vangt geen klikken. Bij 'minder beweging'
   * speelt er niets.
   */
  let { moment }: { moment: OvergangMoment | null } = $props();

  let zichtbaar = $state<OvergangMoment | null>(null);
  let tel = $state(3);
  let timers: ReturnType<typeof setTimeout>[] = [];

  function wis() {
    for (const t of timers) clearTimeout(t);
    timers = [];
  }

  $effect(() => {
    const m = moment;
    if (!m) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    wis();
    zichtbaar = m;
    if (m.soort === 'kaart') {
      geluid.zwiep();
      timers.push(setTimeout(() => (zichtbaar = null), 1150));
    } else {
      tel = 3;
      geluid.aftel(false);
      timers.push(setTimeout(() => { tel = 2; geluid.aftel(false); }, 800));
      timers.push(setTimeout(() => { tel = 1; geluid.aftel(false); }, 1600));
      timers.push(setTimeout(() => { tel = 0; geluid.aftel(true); }, 2400));
      timers.push(setTimeout(() => (zichtbaar = null), 3300));
    }
    return wis;
  });

  let rood = $derived(zichtbaar?.suit === '♥' || zichtbaar?.suit === '♦');
</script>

{#if zichtbaar}
  {#key zichtbaar.id}
    <div class="overgang {zichtbaar.soort}" aria-hidden="true">
      {#if zichtbaar.soort === 'kaart'}
        <div class="vliegkaart" class:rood>
          <span class="hoek boven">{zichtbaar.suit}</span>
          <span class="midden">{zichtbaar.suit}</span>
          <span class="tekst">{zichtbaar.tekst}</span>
          <span class="hoek onder">{zichtbaar.suit}</span>
        </div>
      {:else}
        <div class="spots"><i></i><i></i></div>
        {#key tel}
          <span class="tel" class:start={tel === 0}>{tel > 0 ? tel : zichtbaar.tekst}</span>
        {/key}
      {/if}
    </div>
  {/key}
{/if}

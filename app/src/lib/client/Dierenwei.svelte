<script lang="ts">
  /**
   * De wei: de maatjes scharrelen hier rond met een eigen willetje (wei.ts).
   *
   * Op de televisie in de lobby lopen alle dieren van wie er al is; op de
   * telefoon alleen dat van jezelf, en daar kun je erop tikken voor een
   * kunstje. Wie van beweging houdt: zonder beweging (prefers-reduced-motion)
   * staan ze gewoon stil naast elkaar.
   *
   * Het decor (bomen, een vijver, bloemen, holen) komt mee met de dieren die
   * het nodig hebben (THUIS in wei.ts). Het staat achter de dieren; alleen het
   * water van de vijver ligt ervoor, zodat wie zwemt er half in ligt.
   */
  import { onMount, untrack } from 'svelte';
  import { fade } from 'svelte/transition';
  import { dierVan } from '$lib/shared/dieren';
  import Pixeldier from './Pixeldier.svelte';
  import Ding from './Ding.svelte';
  import Decorplaatje from './Decorplaatje.svelte';
  import { aai, houdingVan, maakWereld, nieuweBewoner, stapWei, type Bewoner, type Decor } from './wei';

  let {
    spelers,
    namen = true,
    aaibaar = false,
    label = '',
  }: {
    spelers: { id: number; naam: string; dier: string | null; dierNaam?: string | null }[];
    /** Een naambordje onder elk dier. */
    namen?: boolean;
    /** Tikken op een dier geeft een kunstje. */
    aaibaar?: boolean;
    label?: string;
  } = $props();

  let wei = $state<Bewoner[]>([]);
  let wereld = $state<Decor[]>([]);
  let vak = $state<HTMLDivElement>();
  /** Hoe breed de wei is, in em (een dier is 1em): zo weten we wat er past. */
  let breedteEm = $state(20);

  /* Het decor volgt de dieren: komt er een aap bij, dan komt er een bananenboom. */
  $effect(() => {
    const sleutels = wei.map((b) => b.sleutel).sort().join(',');
    const breed = Math.round(breedteEm);
    untrack(() => {
      wereld = maakWereld(sleutels ? sleutels.split(',') : [], breed, wereld);
    });
  });

  /* Wie erbij komt valt de wei in; wie weggaat verdwijnt; wie van dier
     wisselt, verschijnt als zijn nieuwe dier. */
  $effect(() => {
    const lijst = spelers.map((s) => ({ id: s.id, naam: s.naam, dier: s.dier, dierNaam: s.dierNaam ?? null }));
    // Alleen de spelers tellen; de wei zelf verandert elk frame.
    untrack(() => {
      const nu = new Map(lijst.map((s) => [s.id, s]));
      const blijft = wei.filter((b) => {
        const s = nu.get(b.id);
        return s && dierVan(s.dier, s.naam).sleutel === b.sleutel;
      });
      // Een nieuwe naam krijgt het dier gewoon waar het staat.
      for (const b of blijft) {
        const s = nu.get(b.id)!;
        if (b.dierNaam !== s.dierNaam || b.naam !== s.naam) Object.assign(b, { dierNaam: s.dierNaam, naam: s.naam });
      }
      const erbij = lijst.filter((s) => !blijft.some((b) => b.id === s.id)).map((s) => nieuweBewoner(s));
      if (erbij.length || blijft.length !== wei.length) wei = [...blijft, ...erbij];
    });
  });

  onMount(() => {
    const meet = () => {
      if (!vak) return;
      const em = parseFloat(getComputedStyle(vak).fontSize) || 16;
      breedteEm = vak.clientWidth / em;
    };
    meet();
    const kijker = new ResizeObserver(meet);
    if (vak) kijker.observe(vak);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => kijker.disconnect();
    let vorige = performance.now();
    let frame = requestAnimationFrame(function tik(nu) {
      // Een tabblad op de achtergrond slaat seconden over; niet alles in één keer inhalen.
      stapWei(wei, Math.min(100, nu - vorige), Math.random, wereld);
      vorige = nu;
      frame = requestAnimationFrame(tik);
    });
    return () => {
      cancelAnimationFrame(frame);
      kijker.disconnect();
    };
  });

  function tik(b: Bewoner) {
    if (!aaibaar) return;
    aai(b);
    try {
      navigator.vibrate?.(15);
    } catch { /* geen trilmotor */ }
  }
</script>

<div class="wei" bind:this={vak} class:aaibaar role={aaibaar ? 'group' : undefined} aria-label={label || undefined} aria-hidden={aaibaar ? undefined : 'true'}>
  {#each wereld as d (d.soort + d.x)}
    <div class="decor" data-soort={d.soort} style="left:{d.x}%" transition:fade={{ duration: 700 }}>
      <Decorplaatje soort={d.soort} />
    </div>
  {/each}
  {#each wei as b (b.id)}
    {@const h = houdingVan(b)}
    <div
      class="bewoner"
      data-soort={b.soort}
      data-doen={b.doen}
      data-nat={b.nat || null}
      style="left:clamp(0.6em, {b.x}%, calc(100% - 0.6em));--tel:{b.duur}ms;--hoog:{b.hoog}em"
    >
      {#key b.beurt}
        <span class="actie" data-lijf={h.lijf}>
          <span class="kijk" class:links={b.richting === -1}>
            {#if aaibaar}
              <button class="aai" onclick={() => tik(b)} aria-label={b.dierNaam ? `Aai ${b.dierNaam}` : 'Aai je maatje'}>
                <Pixeldier sleutel={b.sleutel} pose={h.pose} vlieg={h.vlieg} />
              </button>
            {:else}
              <Pixeldier sleutel={b.sleutel} pose={h.pose} vlieg={h.vlieg} />
            {/if}
          </span>
          {#if b.actie?.ding}
            {#each b.actie.dingGaat === 'op' || b.actie.dingGaat === 'val' ? [0, 1] : [0] as n (n)}
              <span class="ding" data-gaat={b.actie.dingGaat} style="--n:{n}"><Ding teken={b.actie.ding} /></span>
            {/each}
          {/if}
        </span>
      {/key}
      {#if namen}<span class="weinaam" data-naam={b.dierNaam ?? b.naam}></span>{/if}
    </div>
  {/each}
  <!-- Het wateroppervlak ligt vóór de dieren: wie zwemt, ligt er half in. -->
  {#each wereld.filter((d) => d.soort === 'vijver') as d (d.x)}
    <div class="decor water" style="left:{d.x}%" transition:fade={{ duration: 700 }}>
      <Decorplaatje soort="vijver" />
    </div>
  {/each}
</div>

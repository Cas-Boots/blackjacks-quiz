<script lang="ts">
  /**
   * De wei: de maatjes scharrelen hier rond met een eigen willetje (wei.ts).
   *
   * Op de televisie in de lobby lopen alle dieren van wie er al is; op de
   * telefoon alleen dat van jezelf, en daar kun je erop tikken voor een
   * kunstje. Wie van beweging houdt: zonder beweging (prefers-reduced-motion)
   * staan ze gewoon stil naast elkaar.
   */
  import { onMount, untrack } from 'svelte';
  import { dierVan } from '$lib/shared/dieren';
  import Pixeldier from './Pixeldier.svelte';
  import { aai, houdingVan, nieuweBewoner, stapWei, type Bewoner } from './wei';

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
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let vorige = performance.now();
    let frame = requestAnimationFrame(function tik(nu) {
      // Een tabblad op de achtergrond slaat seconden over; niet alles in één keer inhalen.
      stapWei(wei, Math.min(100, nu - vorige));
      vorige = nu;
      frame = requestAnimationFrame(tik);
    });
    return () => cancelAnimationFrame(frame);
  });

  function tik(b: Bewoner) {
    if (!aaibaar) return;
    aai(b);
    try {
      navigator.vibrate?.(15);
    } catch { /* geen trilmotor */ }
  }
</script>

<div class="wei" class:aaibaar role={aaibaar ? 'group' : undefined} aria-label={label || undefined} aria-hidden={aaibaar ? undefined : 'true'}>
  {#each wei as b (b.id)}
    {@const h = houdingVan(b)}
    <div
      class="bewoner"
      data-soort={b.soort}
      data-doen={b.doen}
      style="left:clamp(0.6em, {b.x}%, calc(100% - 0.6em));--tel:{b.duur}ms"
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
            {#each b.actie.dingGaat === 'op' || b.actie.dingGaat === 'val' ? [0, 1, 2] : [0] as n (n)}
              <span class="ding" data-gaat={b.actie.dingGaat} style="--n:{n}">{b.actie.ding}</span>
            {/each}
          {/if}
        </span>
      {/key}
      {#if namen}<span class="weinaam" data-naam={b.dierNaam ?? b.naam}></span>{/if}
    </div>
  {/each}
</div>

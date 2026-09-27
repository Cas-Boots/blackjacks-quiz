<script lang="ts" module>
  import { DECOR } from '$lib/shared/pixeldecor';

  /** Eén pad per kleur, één keer uitgerekend per plaatje. */
  const paden = new Map<string, { kleur: string; d: string }[]>();
  function padenVan(soort: string) {
    const klaar = paden.get(soort);
    if (klaar) return klaar;
    const plaatje = DECOR[soort];
    const perKleur = new Map<string, string[]>();
    plaatje.rijen.forEach((rij, y) =>
      [...rij].forEach((t, x) => {
        if (t === '.') return;
        const kleur = plaatje.palet[t];
        const lijst = perKleur.get(kleur) ?? [];
        lijst.push(`M${x} ${y}h1v1h-1z`);
        perKleur.set(kleur, lijst);
      }),
    );
    const uit = [...perKleur].map(([kleur, delen]) => ({ kleur, d: delen.join('') }));
    paden.set(soort, uit);
    return uit;
  }
</script>

<script lang="ts">
  /** Een stuk decor in de wei (shared/pixeldecor.ts): 32 pixels per em, net als de dieren. */
  let { soort }: { soort: string } = $props();
  let plaatje = $derived(DECOR[soort]);
  let breed = $derived(plaatje.rijen[0].length);
  let hoog = $derived(plaatje.rijen.length);
</script>

<svg
  class="decorplaatje"
  viewBox="0 0 {breed} {hoog}"
  style="width:{breed / 32}em;height:{hoog / 32}em"
  shape-rendering="crispEdges"
  aria-hidden="true"
>
  {#each padenVan(soort) as p (p.kleur)}<path fill={p.kleur} d={p.d} />{/each}
</svg>

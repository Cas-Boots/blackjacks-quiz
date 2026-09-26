<script lang="ts">
  /**
   * Een maatje in pixelkunst (shared/pixeldieren.ts).
   *
   * Het dier staat hier als losse lagen: lijf, ogen, blosjes, vleugels en
   * poten. app.css wisselt die lagen per pose: knipperen doet hij altijd,
   * lopen laat de poten om en om stappen, blij knijpt de ogen dicht met een
   * blos, sip laat een traan vallen, slapen geeft zzz, schrikken een uitroep.
   * Een vliegend dier klappert met zijn vleugels.
   */
  import { lagenVan, MAAT, SCHAAL } from '$lib/shared/pixeldieren';
  import { hash } from '$lib/shared/kwinkslagen';
  import type { Pose } from '$lib/shared/dieren';

  let {
    sleutel,
    pose = 'staan',
    vlieg = false,
    stijl = '',
  }: {
    sleutel: string;
    pose?: Pose;
    /** Klapperen met de vleugels (of, zonder vleugels, het hele lijf). */
    vlieg?: boolean;
    stijl?: string;
  } = $props();

  let l = $derived(lagenVan(sleutel));
  /* Niet alle dieren knipperen tegelijk: elk zijn eigen ritme. */
  let ritme = $derived(hash(`knipper:${sleutel}`) % 1000);
  /* De traan valt uit het oog. */
  let oog = $derived(l.oog);
</script>

<svg
  class="pixeldier"
  data-pose={pose}
  data-vlieg={vlieg || null}
  data-vleugels={l.vleugelNeer.length ? '' : null}
  viewBox="0 0 {MAAT} {MAAT}"
  shape-rendering="crispEdges"
  style="--knipper:{ritme}ms;{stijl}"
  aria-hidden="true"
>
  <g class="px-lijf">
    {#each l.lijf as p (p.kleur)}<path fill={p.kleur} d={p.d} />{/each}
    <g class="px-dicht">{#each l.ogenDicht as p (p.kleur)}<path fill={p.kleur} d={p.d} />{/each}</g>
    <g class="px-open">{#each l.ogenOpen as p (p.kleur)}<path fill={p.kleur} d={p.d} />{/each}</g>
    <g class="px-blos">{#each l.wangen as p (p.kleur)}<path fill={p.kleur} d={p.d} />{/each}</g>
    <g class="px-vleugel neer">{#each l.vleugelNeer as p (p.kleur)}<path fill={p.kleur} d={p.d} />{/each}</g>
    <g class="px-vleugel op">{#each l.vleugelOp as p (p.kleur)}<path fill={p.kleur} d={p.d} />{/each}</g>
  </g>
  <g class="px-poten rust">{#each l.potenRust as p (p.kleur)}<path fill={p.kleur} d={p.d} />{/each}</g>
  <g class="px-poten a">{#each l.potenA as p (p.kleur)}<path fill={p.kleur} d={p.d} />{/each}</g>
  <g class="px-poten b">{#each l.potenB as p (p.kleur)}<path fill={p.kleur} d={p.d} />{/each}</g>
  <!-- Traan, zzz en uitroep in de maat van de tekening: grove pixels, net als het dier zelf. -->
  <g transform="scale({SCHAAL})">
    {#if pose === 'sip'}
      <rect class="px-traan" x={oog.x} y={oog.y + 1} width="1" height="1" fill="#7cc8ff" />
    {:else if pose === 'slaap'}
      <path class="px-zzz" fill="#dfe8ff" d="M12 -3h3v1h-1v1h-1v1h2v1h-3v-1h1v-1h1v-1h-2z" />
    {:else if pose === 'schrik'}
      <path class="px-uitroep" fill="#ffd23f" d="M{oog.x} -5h1v3h-1zM{oog.x} -1h1v1h-1z" />
    {/if}
  </g>
</svg>

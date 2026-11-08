<script lang="ts">
  /**
   * De ladder bij ieder zijn eigen getal: per speler een balk tot het juiste
   * getal, met de speling als vak eromheen en de eigen gok als stip. In het
   * vak is raak. Zo zie je het verschil tussen iedereen in één beeld, en
   * waarom wie wel of niet scoorde: de speling staat er gewoon bij.
   */
  import type { EigenUitslag } from '$lib/shared/state';

  let { rijen, eenheid = '' }: { rijen: EigenUitslag[]; eenheid?: string } = $props();

  let bereik = $derived.by(() => {
    const waarden = rijen.flatMap((r) => [0, r.doel - r.speling, r.doel + r.speling, ...(r.gok === null ? [] : [r.gok])]);
    const min = Math.min(...waarden);
    const max = Math.max(...waarden, min + 1);
    const rand = (max - min) * 0.04;
    return { min: min - rand, max: max + rand };
  });
  const x = (n: number) => ((n - bereik.min) / (bereik.max - bereik.min)) * 100;
  const fmt = (n: number) => n.toLocaleString('nl-NL', { maximumFractionDigits: 1 });
</script>

<div class="ladder">
  {#each rijen as r, i (r.naam)}
    <div class="rij" class:goed={r.goed} style="--i:{i}">
      <span class="naam">{r.naam}</span>
      <span class="baan">
        <i class="balk" style="left:{x(Math.min(0, r.doel))}%;width:{Math.abs(x(r.doel) - x(0))}%"></i>
        <i class="vak" style="left:{x(r.doel - r.speling)}%;width:{x(r.doel + r.speling) - x(r.doel - r.speling)}%"></i>
        <i class="doel" style="left:{x(r.doel)}%"></i>
        {#if r.gok !== null}<i class="gok" style="left:{x(r.gok)}%"></i>{/if}
      </span>
      <span class="cijfer">
        <span><b>{fmt(r.doel)}</b>{eenheid ? ' ' + eenheid : ''}</span>
        <small>± {fmt(r.speling)} · gok {r.gok === null ? '—' : fmt(r.gok)}</small>
      </span>
      <span class="oordeel" aria-hidden="true">{r.goed ? '✓' : '✗'}</span>
    </div>
  {/each}
</div>

<style>
  .ladder {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    width: 100%;
    margin-top: 0.4rem;
  }
  .rij {
    display: grid;
    grid-template-columns: 8rem 1fr 11rem 1.6rem;
    align-items: center;
    gap: 1rem;
    animation: opkomen 0.5s var(--deal) both;
    animation-delay: calc(0.5s + var(--i) * 0.14s);
  }
  .naam {
    font-size: calc(var(--fs-lood) * 0.9);
    color: var(--ivoor-zacht);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .baan {
    position: relative;
    height: 1.6rem;
  }
  .baan i {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }
  .balk {
    height: 0.5rem;
    border-radius: 0.25rem;
    background: var(--rand);
  }
  .vak {
    height: 1.6rem;
    border-radius: 0.4rem;
    background: rgba(201, 162, 39, 0.16);
    border: 1px solid rgba(201, 162, 39, 0.45);
  }
  .doel {
    width: 3px;
    height: 1.6rem;
    margin-left: -1.5px;
    background: var(--goud);
    box-shadow: 0 0 12px rgba(201, 162, 39, 0.6);
  }
  .gok {
    width: 1rem;
    height: 1rem;
    margin-left: -0.5rem;
    border-radius: 50%;
    background: var(--rood-licht);
    border: 2px solid var(--vilt-diep);
  }
  .goed .gok {
    background: var(--groen-licht);
    box-shadow: 0 0 0 2px var(--groen), 0 0 14px rgba(138, 211, 166, 0.7);
  }
  .cijfer {
    font-family: var(--mono);
    font-size: calc(var(--fs-lood) * 0.8);
    color: var(--goud-licht);
    display: flex;
    flex-direction: column;
    line-height: 1.15;
  }
  .cijfer span {
    white-space: nowrap;
  }
  .cijfer small {
    white-space: nowrap;
    font-size: 0.75em;
    color: var(--salie);
  }
  .oordeel {
    font-size: calc(var(--fs-lood) * 1.1);
    color: var(--rood-licht);
  }
  .goed .oordeel,
  .goed .naam {
    color: var(--groen-licht);
  }
</style>

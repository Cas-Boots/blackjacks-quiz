<script lang="ts">
  /**
   * De getallenlijn bij een dichtstbij-vraag: elke gok als stip, het doel als
   * messing streep. In één oogopslag zie je wie er het dichtst bij zat — en
   * wie er hopeloos naast zat, wat aan tafel minstens zo leuk is.
   */
  let {
    doel,
    eenheid = '',
    gokken,
    verLabel = '',
  }: {
    doel: number;
    eenheid?: string;
    gokken: { naam: string; getal: number; wint: boolean }[];
    /** Tekst bij de gok die er het verst naast zat; leeg laat hem weg. */
    verLabel?: string;
  } = $props();

  /* Wie zat er hopeloos naast. Alleen als er echt iets te lachen valt:
     de slechtste gok zit minstens drie keer zo ver weg als de beste én
     minstens de helft van het doel ernaast. Een exact goede gok maakt de
     eerste eis vanzelf waar, vandaar de tweede. */
  let verIndex = $derived.by(() => {
    if (!verLabel || gokken.length < 2) return -1;
    const afstanden = gokken.map((g) => Math.abs(g.getal - doel));
    const beste = Math.min(...afstanden);
    const slechtste = Math.max(...afstanden);
    if (slechtste === 0 || slechtste < beste * 3 || slechtste < Math.abs(doel) * 0.5) return -1;
    return afstanden.indexOf(slechtste);
  });

  let bereik = $derived.by(() => {
    const waarden = [doel, ...gokken.map((g) => g.getal)];
    let min = Math.min(...waarden);
    let max = Math.max(...waarden);
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const marge = (max - min) * 0.08;
    return { min: min - marge, max: max + marge };
  });

  function positie(getal: number) {
    return ((getal - bereik.min) / (bereik.max - bereik.min)) * 100;
  }

  /* Stippen die dicht op elkaar zitten krijgen om en om een hogere rij,
     zodat de namen leesbaar blijven. */
  let rijen = $derived.by(() => {
    const gesorteerd = gokken.map((g, i) => ({ ...g, i, x: positie(g.getal) })).sort((a, b) => a.x - b.x);
    const rij = new Array(gokken.length).fill(0);
    let vorigeX = -Infinity;
    let vorigeRij = 1;
    for (const g of gesorteerd) {
      rij[g.i] = g.x - vorigeX < 9 ? (vorigeRij % 2) + 1 : 1;
      vorigeX = g.x;
      vorigeRij = rij[g.i];
    }
    return rij;
  });

  const fmt = (n: number) => n.toLocaleString('nl-NL');
</script>

<div class="getallenlijn" style="--rijen:{Math.max(1, ...rijen)}">
  <div class="lijn"></div>
  <div class="doel" style="left:{positie(doel)}%">
    <span class="doeltekst">{fmt(doel)}{eenheid ? ' ' + eenheid : ''}</span>
  </div>
  {#each gokken as g, i (g.naam + i)}
    <div class="gok" class:wint={g.wint} style="left:{positie(g.getal)}%;--rij:{rijen[i]}">
      <span class="naam">{g.naam}{#if i === verIndex} <span class="ver">🥴 {verLabel}</span>{/if}</span>
      <span class="stip"></span>
      <span class="waarde">{fmt(g.getal)}</span>
    </div>
  {/each}
</div>

<style>
  .getallenlijn {
    position: relative;
    width: 100%;
    height: calc(8rem + (var(--rijen) - 1) * 2.2rem);
    margin-top: 0.4rem;
  }
  .lijn {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--rand) 8%, var(--rand) 92%, transparent);
  }
  .doel {
    position: absolute;
    top: 30%;
    bottom: 30%;
    width: 3px;
    transform: translateX(-50%);
    background: var(--goud);
    box-shadow: 0 0 14px rgba(201, 162, 39, 0.7);
    animation: opkomen 0.5s var(--deal) both;
  }
  /* Onder de waarden van de gokken, zodat een gok die precies goed is
     niet over het doel heen valt. */
  .doeltekst {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 2rem;
    padding: 0.1rem 0.5rem;
    border-radius: 6px;
    background: rgba(201, 162, 39, 0.14);
    white-space: nowrap;
    font-family: var(--mono);
    font-size: calc(var(--fs-lood) * 0.9);
    color: var(--goud-licht);
  }
  .gok {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    animation: opkomen 0.5s var(--deal) both;
    animation-delay: 0.25s;
  }
  .gok .stip {
    width: 0.9rem;
    height: 0.9rem;
    border-radius: 50%;
    background: var(--salie);
    border: 2px solid var(--vilt-diep);
    box-shadow: 0 0 0 2px var(--salie-diep);
  }
  .gok.wint .stip {
    background: var(--groen-licht);
    box-shadow: 0 0 0 2px var(--groen), 0 0 16px rgba(138, 211, 166, 0.7);
  }
  .gok .naam {
    position: absolute;
    bottom: calc(100% + 0.1rem + (var(--rij) - 1) * 2.2rem);
    white-space: nowrap;
    font-size: calc(var(--fs-lood) * 0.8);
    color: var(--ivoor-zacht);
  }
  .gok.wint .naam {
    color: var(--groen-licht);
    font-weight: 600;
  }
  .gok .waarde {
    position: absolute;
    top: calc(100% + 0.1rem);
    white-space: nowrap;
    font-family: var(--mono);
    font-size: calc(var(--fs-lood) * 0.72);
    color: var(--salie);
  }
  .gok.wint .waarde {
    color: var(--groen-licht);
  }
  .gok .ver {
    font-family: var(--display);
    font-style: italic;
    font-size: 0.85em;
    color: var(--rood-licht);
    animation: opkomen 0.5s 0.9s var(--deal) both;
  }
</style>

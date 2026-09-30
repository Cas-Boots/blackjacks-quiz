<script lang="ts">
  import { onMount } from 'svelte';

  /**
   * Een foto, filmpje of muziekfragment bij een vraag.
   *
   * De bron is een data-URI, een volledig adres of een bestandsnaam uit de
   * map `media/`. Video en muziek volgen `speelt`: de quizmaster zet dat aan
   * en uit vanaf het hostscherm, zodat niemand naar de laptop hoeft te lopen.
   * Ontbreekt het bestand, dan komt er een nette melding in plaats van een
   * kapot pictogram.
   */
  let {
    media,
    speelt = false,
    klein = false,
    alleenBeeld = false,
  }: {
    media: { soort: string; bron: string; bijschrift?: string };
    speelt?: boolean;
    klein?: boolean;
    /** Op de telefoon: alleen foto's, het geluid komt van de televisie. */
    alleenBeeld?: boolean;
  } = $props();

  let bron = $derived(/^(data:|https?:\/\/|\/)/.test(media.bron) ? media.bron : `/media/${encodeURIComponent(media.bron)}`);
  let ontbreekt = $state(false);
  let speler = $state<HTMLMediaElement | null>(null);

  // Het element volgt de server, niet andersom: de speeltoestand is één
  // vlag op de server, en elke televisie die meekijkt doet hetzelfde.
  $effect(() => {
    const el = speler;
    if (!el || ontbreekt) return;
    if (speelt) el.play().catch(() => {});
    else el.pause();
  });

  // Als het fragment uit zichzelf afloopt, mag het scherm dat weten.
  let afgelopen = $state(false);
  onMount(() => {
    const el = speler;
    if (!el) return;
    const opEinde = () => (afgelopen = true);
    const opStart = () => (afgelopen = false);
    el.addEventListener('ended', opEinde);
    el.addEventListener('play', opStart);
    return () => {
      el.removeEventListener('ended', opEinde);
      el.removeEventListener('play', opStart);
    };
  });
</script>

{#if ontbreekt}
  <p class="media-ontbreekt">Bestand <code>{media.bron}</code> ontbreekt in de map <code>media/</code>.</p>
{:else if media.soort === 'beeld'}
  <figure class="media-beeld" class:klein>
    <img src={bron} alt="" onerror={() => (ontbreekt = true)} />
    {#if media.bijschrift}<figcaption>{media.bijschrift}</figcaption>{/if}
  </figure>
{:else if alleenBeeld}
  <p class="media-ontbreekt" style="border-style:dashed">
    {media.soort === 'video' ? 'Het filmpje' : 'Het fragment'} speelt op de televisie.
  </p>
{:else if media.soort === 'video'}
  <figure class="media-beeld" class:klein>
    <!-- svelte-ignore a11y_media_has_caption -->
    <video bind:this={speler} src={bron} playsinline preload="auto" onerror={() => (ontbreekt = true)}></video>
    {#if media.bijschrift}<figcaption>{media.bijschrift}</figcaption>{/if}
  </figure>
{:else}
  <div class="media-muziek" class:speelt={speelt && !afgelopen} class:klein>
    <audio bind:this={speler} src={bron} preload="auto" onerror={() => (ontbreekt = true)}></audio>
    <span class="balken" aria-hidden="true">
      {#each Array(9) as _, i}<i style="--n:{i}"></i>{/each}
    </span>
    <span class="tekst">
      {#if afgelopen}Fragment afgelopen{:else if speelt}Luister…{:else}Fragment staat klaar{/if}
    </span>
    {#if media.bijschrift}<span class="fijn">{media.bijschrift}</span>{/if}
  </div>
{/if}

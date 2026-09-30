<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { live } from '$lib/client/live.svelte';
  import Confetti from '$lib/client/Confetti.svelte';
  import * as geluid from '$lib/client/geluid';
  import { aftelTekst, nogTekst } from '$lib/shared/nieuwjaar';
  import type { Pauze } from '$lib/shared/state';

  /**
   * Wat er over het scherm ligt zolang de quiz stilstaat.
   *
   * Een gewone pauze zegt dat en verder niets. Een pauze voor middernacht
   * telt af naar het nieuwe jaar — de laatste tien seconden in het groot — en
   * slaat om in "Gelukkig nieuwjaar" zodra het twaalf uur is. Daarna blijft
   * dat staan tot de quizmaster de quiz laat verdergaan.
   *
   * Het scherm eronder blijft staan: op de telefoon blijft een half getikt
   * antwoord dus gewoon bewaard.
   */
  let { soort, vorm = 'tv' }: { soort: Pauze; vorm?: 'tv' | 'telefoon' } = $props();

  let restMs = $state<number | null>(live.totMiddernachtMs());
  onMount(() => {
    const t = setInterval(() => (restMs = live.totMiddernachtMs()), 200);
    return () => clearInterval(t);
  });

  let jaar = $derived(live.staat?.nieuwjaar?.jaar ?? new Date().getFullYear() + 1);
  let geweest = $derived(restMs !== null && restMs <= 0);
  let seconden = $derived(restMs === null ? null : Math.ceil(restMs / 1000));
  /** De laatste tien seconden telt de kamer hardop mee. */
  let slotTel = $derived(soort === 'nieuwjaar' && seconden !== null && seconden > 0 && seconden <= 10);
  /** Bij een gewone pauze vlak voor middernacht zeggen we wel even hoe laat het is. */
  let bijnaMiddernacht = $derived(restMs !== null && restMs > 0 && restMs <= 60 * 60_000);

  /* Tikken in de laatste seconden en een fanfare om twaalf uur. Alleen op de
     televisie: zes telefoons die door elkaar piepen is geen aftellen meer. */
  let vorigeSeconde: number | null = null;
  $effect(() => {
    const s = seconden;
    if (soort !== 'nieuwjaar' || s === null) return;
    if (vorigeSeconde !== null && s !== vorigeSeconde) {
      if (vorm === 'tv' && s > 0 && s <= 10) geluid.tik(s <= 3);
      if (s <= 0 && vorigeSeconde > 0) {
        if (vorm === 'tv') geluid.fanfare();
        else {
          try {
            navigator.vibrate?.([120, 80, 120, 80, 400]);
          } catch {
            /* geen trilmotor */
          }
        }
      }
    }
    vorigeSeconde = s;
  });
</script>

<div class="pauzelaag" class:telefoon={vorm === 'telefoon'} role="status" transition:fade={{ duration: 300 }}>
  {#if soort === 'nieuwjaar' && geweest}
    {#if vorm === 'tv'}<Confetti />{/if}
    <div class="pauze-inhoud" in:scale={{ start: 0.8, duration: 700, easing: cubicOut }}>
      <p class="etiket">Proost!</p>
      <h1 class="mega">Gelukkig nieuwjaar</h1>
      <p class="jaartal">{jaar}</p>
      <p class="lood">De quiz gaat zo verder.</p>
    </div>
  {:else if soort === 'nieuwjaar'}
    <div class="pauze-inhoud">
      <p class="etiket">Even pauze · het is bijna twaalf uur</p>
      {#if slotTel}
        {#key seconden}
          <p class="slotcijfer" in:scale={{ start: 1.6, duration: 380, easing: cubicOut }}>{seconden}</p>
        {/key}
      {:else}
        <p class="aftel">{restMs === null ? '—' : aftelTekst(restMs)}</p>
        <p class="lood">tot {jaar}</p>
      {/if}
    </div>
  {:else}
    <div class="pauze-inhoud">
      <p class="etiket">De quiz staat even stil</p>
      <h1 class="mega">Even pauze</h1>
      <p class="lood">Schenk nog wat in. We gaan zo verder waar we waren.</p>
      {#if bijnaMiddernacht && restMs !== null}
        <p class="fijn middernacht">🎆 {nogTekst(restMs)} tot middernacht</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .pauzelaag {
    position: fixed;
    inset: 0;
    /* Boven de dia, onder de geluidsknop en het paneel van de testmodus. */
    z-index: 50;
    display: grid;
    place-items: center;
    padding: clamp(18px, 4vw, 90px);
    text-align: center;
    background:
      radial-gradient(70% 55% at 50% -5%, var(--lamp) 0%, transparent 62%),
      radial-gradient(130% 100% at 50% 0%, var(--vilt-licht) 0%, var(--vilt) 40%, var(--vilt-diep) 100%);
  }
  .pauze-inhoud {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(0.8rem, 2.4vh, 2rem);
  }
  .pauze-inhoud .lood {
    text-align: center;
  }
  .aftel {
    margin: 0;
    font-family: var(--display);
    font-weight: 700;
    font-size: clamp(4rem, 18vw, 16rem);
    line-height: 0.9;
    font-variant-numeric: tabular-nums;
    color: var(--goud-licht);
  }
  .slotcijfer {
    margin: 0;
    font-family: var(--display);
    font-weight: 700;
    font-size: clamp(8rem, 40vh, 28rem);
    line-height: 0.9;
    color: var(--goud-licht);
    text-shadow: 0 0 60px rgba(240, 217, 140, 0.45);
  }
  .jaartal {
    margin: 0;
    font-family: var(--display);
    font-weight: 700;
    font-size: clamp(3rem, 14vw, 12rem);
    line-height: 0.9;
    color: var(--goud);
  }
  .middernacht {
    font-size: var(--fs-lood);
    color: var(--goud-licht);
  }

  /* Op de telefoon: dezelfde boodschap, op telefoonmaat. */
  .telefoon .mega {
    font-size: 2.6rem;
  }
  .telefoon .aftel {
    font-size: 4.5rem;
  }
  .telefoon .slotcijfer {
    font-size: 9rem;
  }
  .telefoon .jaartal {
    font-size: 4rem;
  }
  .telefoon .lood,
  .telefoon .middernacht {
    font-size: 1rem;
  }
</style>

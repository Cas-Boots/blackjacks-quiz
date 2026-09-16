<script lang="ts">
  import { onMount, untrack } from 'svelte';

  /**
   * Een getal dat naar zijn nieuwe waarde toe telt in plaats van er heen te
   * springen. De klassieke scoreboard-beweging: je ziet de punten binnenkomen.
   */
  let {
    naar,
    van = 0,
    duur = 900,
    vertraging = 0,
  }: { naar: number; van?: number; duur?: number; vertraging?: number } = $props();

  let getoond = $state(untrack(() => van));

  onMount(() => {
    if (naar === van) {
      getoond = naar;
      return;
    }
    const minder = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (minder) {
      getoond = naar;
      return;
    }

    let raf = 0;
    let start = 0;
    const stap = (t: number) => {
      if (!start) start = t;
      const verstreken = t - start - vertraging;
      if (verstreken < 0) {
        raf = requestAnimationFrame(stap);
        return;
      }
      const p = Math.min(1, verstreken / duur);
      // Snel op gang, rustig uitlopend: het getal "landt" op zijn waarde.
      const eased = 1 - Math.pow(1 - p, 3);
      getoond = Math.round(van + (naar - van) * eased);
      if (p < 1) raf = requestAnimationFrame(stap);
    };
    raf = requestAnimationFrame(stap);
    return () => cancelAnimationFrame(raf);
  });
</script>

{getoond}

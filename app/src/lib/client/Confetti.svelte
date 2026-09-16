<script lang="ts">
  import { onMount } from 'svelte';

  /** Snippers in de kleuren van de tafel. Speelt één keer en dooft uit. */
  let doek: HTMLCanvasElement;

  onMount(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = doek.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pasAan = () => {
      doek.width = doek.clientWidth * dpr;
      doek.height = doek.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    pasAan();
    window.addEventListener('resize', pasAan);

    const kleuren = ['#c9a227', '#f0d98c', '#f7f3e8', '#c0452f', '#4e9a6b'];
    const snippers = Array.from({ length: 190 }, () => ({
      x: Math.random() * doek.clientWidth,
      y: -30 - Math.random() * doek.clientHeight * 0.8,
      b: 5 + Math.random() * 8,
      h: 9 + Math.random() * 13,
      vy: 1.6 + Math.random() * 3,
      vx: -1.2 + Math.random() * 2.4,
      hoek: Math.random() * Math.PI,
      draai: -0.09 + Math.random() * 0.18,
      kleur: kleuren[Math.floor(Math.random() * kleuren.length)],
    }));

    let raf = 0;
    const lus = () => {
      ctx.clearRect(0, 0, doek.clientWidth, doek.clientHeight);
      let levend = false;
      for (const s of snippers) {
        s.y += s.vy;
        s.x += s.vx;
        s.hoek += s.draai;
        if (s.y < doek.clientHeight + 40) levend = true;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.hoek);
        ctx.fillStyle = s.kleur;
        ctx.fillRect(-s.b / 2, -s.h / 2, s.b, s.h);
        ctx.restore();
      }
      if (levend) raf = requestAnimationFrame(lus);
      else ctx.clearRect(0, 0, doek.clientWidth, doek.clientHeight);
    };
    raf = requestAnimationFrame(lus);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', pasAan);
    };
  });
</script>

<canvas bind:this={doek} class="confetti" aria-hidden="true"></canvas>

<style>
  .confetti {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 40;
  }
</style>

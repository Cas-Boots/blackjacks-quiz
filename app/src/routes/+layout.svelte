<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  let { children } = $props();
  /* Een scherm van een proefrit draagt altijd dit etiket, zodat niemand het
     voor de echte avond aanziet. */
  let inProef = $derived(page.url.searchParams.has('proef'));
</script>

{@render children()}

{#if inProef}
  <div class="proefetiket" aria-label="Dit scherm hoort bij een proefrit">Proefrit</div>
{/if}

<style>
  .proefetiket {
    position: fixed;
    left: 10px;
    bottom: 10px;
    z-index: 70;
    padding: 0.25rem 0.7rem;
    border-radius: 999px;
    background: #e8c547;
    color: #1a1405;
    font-family: var(--mono);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    pointer-events: none;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  }
</style>

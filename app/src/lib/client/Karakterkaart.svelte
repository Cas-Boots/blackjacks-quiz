<script lang="ts">
  /**
   * Het karakter van een maatje, als kaartje op de telefoon: waar hij om
   * bekend staat, zijn eigenschappen in pixelblokjes, en wat hij het liefst
   * eet. Dezelfde eigenschappen sturen hoe hij zich in de wei gedraagt.
   */
  import { EIGENSCHAPPEN, type Maatje } from '$lib/shared/dieren';

  let { dier }: { dier: Maatje } = $props();
</script>

<div class="karakterkaart">
  <p class="specialiteit">“{dier.specialiteit}”</p>
  <dl>
    {#each EIGENSCHAPPEN as e (e.sleutel)}
      {@const waarde = dier.karakter[e.sleutel]}
      <div class="eigenschap">
        <dt>{e.naam}</dt>
        <dd aria-label="{waarde} van 5">
          {#each [1, 2, 3, 4, 5] as n (n)}<i class:vol={n <= waarde} style="--n:{n}"></i>{/each}
        </dd>
      </div>
    {/each}
  </dl>
  <p class="fijn hapje"><span aria-hidden="true">{dier.hapje.ding}</span> Lievelingshapje: {dier.hapje.naam}</p>
</div>

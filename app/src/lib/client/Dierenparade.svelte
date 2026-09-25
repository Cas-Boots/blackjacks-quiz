<script lang="ts" module>
  /** Wie er over het scherm rent: het maatje van deze speler. */
  export interface Loper {
    id: number;
    naam: string;
    dier: string | null;
  }

  /** Nooit meer dan dit tegelijk, anders wordt het een kudde. */
  export const MAX_LOPERS = 4;
</script>

<script lang="ts">
  /**
   * De maatjes die over het scherm trekken op de grote momenten.
   *
   * Blij: elk dier op zijn eigen manier (lopen, springen, slingeren, zwemmen,
   * vliegen, graven). Sip: sjokkend, grijs, met een regenwolkje erboven. Ze
   * gaan kort na elkaar, trekken één keer over en zijn dan weg.
   */
  import { dierVan, gangVan } from '$lib/shared/dieren';

  let {
    lopers,
    stemming = 'blij',
    klaar,
  }: {
    lopers: Loper[];
    stemming?: 'blij' | 'sip';
    /** Als de laatste de overkant heeft gehaald. */
    klaar?: () => void;
  } = $props();

  let rij = $derived(lopers.slice(0, MAX_LOPERS));
</script>

{#each rij as l, i (l.id)}
  {@const d = dierVan(l.dier, l.naam)}
  <div
    class="dierenparade"
    data-gang={stemming === 'sip' ? 'sip' : gangVan(d.beweging)}
    style="animation-delay:{i * 550}ms"
    aria-hidden="true"
    onanimationend={(e) => e.target === e.currentTarget && i === rij.length - 1 && klaar?.()}
  >
    <span class="dier">{d.emoji}</span>
    <!-- De naam via CSS: puur versiering, geen tweede "Tom" in de tekst van de pagina. -->
    <span class="lopernaam" data-naam={l.naam}></span>
  </div>
{/each}

<script lang="ts">
  /**
   * Een portret met geestdier.
   *
   * Met een foto zit het dier als klein figuurtje rechtsonder op de rand;
   * zonder foto is het dier zelf het portret. Elk dier beweegt op zijn eigen
   * manier (zie de `dier-…`-animaties in app.css), net niet in de maat met de
   * rest van de tafel. Met een stemming juicht het dier of druipt het af.
   */
  import { dierVan } from '$lib/shared/dieren';
  import { hash } from '$lib/shared/kwinkslagen';

  let {
    naam,
    foto = null,
    dier = null,
    maat = '',
    goud = false,
    stemming = null,
    stijl = '',
  }: {
    naam: string;
    foto?: string | null;
    dier?: string | null;
    maat?: '' | 'm' | 'l';
    goud?: boolean;
    /** 'feest' bij een goed antwoord of een eerste plek, 'sip' bij een misser. */
    stemming?: 'feest' | 'sip' | null;
    /** Extra stijl voor het rondje zelf, voor de plekken die het kleiner willen. */
    stijl?: string;
  } = $props();

  let d = $derived(dierVan(dier, naam));
  /* Niet iedereen tegelijk: een eigen vertraging per naam. */
  let vertraging = $derived(-((hash(naam) % 1000) / 1000) * 2);
</script>

<span class="portret {maat}">
  {#if foto}
    <img class="avatar {maat}" class:goud src={foto} alt="" style={stijl} />
    <span class="dierbadge" title={d.titel}>
      <span class="dier" data-beweging={stemming ?? d.beweging} style="animation-delay:{vertraging}s">{d.emoji}</span>
    </span>
  {:else}
    <span class="avatar dierlijk {maat}" class:goud style={stijl} title={d.titel}>
      <span class="dier" data-beweging={stemming ?? d.beweging} style="animation-delay:{vertraging}s">{d.emoji}</span>
    </span>
  {/if}
</span>

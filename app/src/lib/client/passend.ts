import type { Action } from 'svelte/action';

/**
 * Houd een dia binnen het scherm van de televisie.
 *
 * Aan de televisie zit geen muis en geen scrollbalk: wat onder de onderrand
 * valt, bestaat niet voor de kamer. Een vraag van acht regels of een podium
 * met zeven prijzen is nu eenmaal hoger dan 1080 beeldpunten, en dan is alles
 * een maat kleiner beter dan de inleverrij kwijt.
 *
 * Het vlak krimpt daarom precies zoveel als nodig is en geen streep meer:
 * past de dia gewoon, dan gebeurt er niets. De maat komt als `--pas` op het
 * element te staan; de stijl doet er `transform: scale()` mee.
 *
 * Gemeten wordt de opmaak, niet het beeld: `offsetHeight` telt de transform
 * niet mee, dus de meting kan zichzelf niet in een kringetje najagen.
 */
export const passend: Action<HTMLElement, { minimum?: number } | undefined> = (el, opties) => {
  /* Onder deze maat wordt het van de bank af toch onleesbaar; dan liever een
     dia die nét niet past dan een dia die niemand meer kan lezen. */
  const minimum = opties?.minimum ?? 0.5;
  let gepland = 0;

  const meet = () => {
    gepland = 0;
    const ruimte = el.parentElement;
    if (!ruimte) return;
    const stijl = getComputedStyle(ruimte);
    const ruim = ruimte.clientHeight - parseFloat(stijl.paddingTop) - parseFloat(stijl.paddingBottom);
    const hoog = el.offsetHeight;
    if (ruim <= 0 || hoog <= 0) return;
    el.style.setProperty('--pas', Math.min(1, Math.max(minimum, ruim / hoog)).toFixed(3));
  };

  /* Meten kost opmaak, dus hooguit één keer per beeld. */
  const plan = () => {
    if (!gepland) gepland = requestAnimationFrame(meet);
  };

  /* De dia zelf verandert van hoogte (een speler schuift aan, de cijfers
     lopen door), het scherm verandert van formaat, en de lettertypen komen
     later binnen dan de tekst. Alle drie zijn reden om opnieuw te kijken. */
  const kijker = new ResizeObserver(plan);
  kijker.observe(el);
  if (el.parentElement) kijker.observe(el.parentElement);
  document.fonts?.ready.then(plan).catch(() => {});
  /* De eerste meting mag niet wachten op het volgende beeld: anders staat de
     dia één beeld lang op volle grootte en zie je hem terugspringen. */
  meet();

  return {
    destroy() {
      if (gepland) cancelAnimationFrame(gepland);
      kijker.disconnect();
    },
  };
};

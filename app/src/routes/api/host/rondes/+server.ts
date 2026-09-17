import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { actiefSpel, pakketVan, samengesteld, huidige } from '$lib/server/spel';
import { PAKKETTEN } from '$lib/content/packs';

/**
 * De rondes van het pakket, met wat er van meedoet.
 *
 * Alleen voor het hostscherm: hier staan de antwoorden bij, zodat de
 * quizmaster vooraf kan zien welke vragen nog ingevuld moeten worden.
 */
export const GET: RequestHandler = ({ locals }) => {
  if (locals.rol !== 'quizmaster') error(403, 'alleen de quizmaster');
  const spel = actiefSpel();
  if (!spel) return json({ rondes: [], pakketten: [] });

  const pakket = pakketVan(spel);
  let keuze: Record<string, number[]> = {};
  try {
    keuze = JSON.parse(spel.samenstelling || '{}');
  } catch {
    keuze = {};
  }
  const actief = samengesteld(spel);
  const { vraag } = huidige(spel);

  const rondes = pakket.rondes.map((r, pakketIndex) => {
    const gekozen = keuze[String(pakketIndex)] ?? (r.optioneel ? [] : r.vragen.map((_, i) => i));
    const gekozenSet = new Set(gekozen);
    // Waar deze ronde in de gespeelde volgorde staat, of null als hij niet meedoet.
    const speelIndex = gekozen.length ? actief.findIndex((a) => a.naam === r.naam && a.thema === r.thema) : -1;
    return {
      pakketIndex,
      speelIndex: speelIndex >= 0 ? speelIndex : null,
      naam: r.naam,
      suit: r.suit,
      thema: r.thema,
      type: r.type,
      teamModus: r.teamModus,
      tijd: r.tijd,
      punten: r.punten,
      optioneel: !!r.optioneel,
      teVullen: !!r.teVullen,
      gekozen,
      vragen: r.vragen.map((v, i) => ({
        index: i,
        tekst: v.v,
        antwoord: antwoordVan(r.type, v),
        teVullen: !!v.teVullen,
        media: v.media ? `${v.media.soort}: ${v.media.bron.startsWith('data:') ? 'ingebouwd' : v.media.bron}` : null,
        gekozen: gekozenSet.has(i),
      })),
    };
  });

  return json({
    pakket: spel.pakket,
    pakketten: Object.entries(PAKKETTEN).map(([id, p]) => ({ id, naam: p.naam, beschrijving: p.beschrijving })),
    fase: spel.fase,
    rondes,
    /** De vraag die nu open staat, mét antwoord — voor het spiekbriefje van de quizmaster. */
    huidige: vraag && (spel.fase === 'vraag' || spel.fase === 'antwoord')
      ? { tekst: vraag.v, antwoord: antwoordVan(pakket.rondes.find((r) => r.vragen.includes(vraag))?.type ?? 'open', vraag), toelichting: vraag.toelichting ?? null }
      : null,
  });
};

function antwoordVan(type: string, v: { a?: string; goed?: boolean | number; opties?: string[]; getal?: number; eenheid?: string }): string {
  if (type === 'waarnietwaar') return v.goed === true ? 'Waar' : 'Niet waar';
  if (type === 'meerkeuze' && v.opties && typeof v.goed === 'number') return `${String.fromCharCode(65 + v.goed)} — ${v.opties[v.goed]}`;
  if (type === 'dichtstbij' && typeof v.getal === 'number') return `${v.getal.toLocaleString('nl-NL')}${v.eenheid ? ' ' + v.eenheid : ''}`;
  return v.a ?? '';
}

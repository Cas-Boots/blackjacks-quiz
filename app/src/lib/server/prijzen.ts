/**
 * De prijzen aan het eind van de avond.
 *
 * Naast de winnaar verdienen nog een paar mensen een moment op het scherm:
 * wie de meeste vragen goed had, wie het snelst op de knop zat, en wie de
 * beste ronde draaide. Allemaal af te leiden uit wat er al vastligt: de
 * uitdelingen per vraag en de reactietijd per antwoord.
 */

export interface Prijs {
  sleutel: 'scherpschutter' | 'snelste' | 'beste-ronde';
  titel: string;
  /** Wie hem wint; bij een gelijkspel meerdere namen. */
  namen: string[];
  detail: string;
}

export interface PrijsInvoer {
  spelers: { id: number; naam: string }[];
  /** Per vraag: "rondeIndex:vraagIndex" en wie er wat kreeg. */
  uitdelingen: { vraagSleutel: string; verdeling: Record<number, number> }[];
  /** Goedgekeurde antwoorden met hun reactietijd en de spelers erachter. */
  goedeAntwoorden: { spelerIds: number[]; naMs: number | null }[];
  /** Namen van de gespeelde rondes, op rondeIndex. */
  rondeNamen: string[];
}

export function bepaalPrijzen(invoer: PrijsInvoer): Prijs[] {
  const naamVan = (id: number) => invoer.spelers.find((s) => s.id === id)?.naam ?? '?';
  const uit: Prijs[] = [];

  // Scherpschutter: de meeste vragen met punten.
  const goedPerSpeler = new Map<number, number>();
  const perRonde = new Map<number, Map<number, number>>();
  for (const u of invoer.uitdelingen) {
    const rondeIndex = Number(u.vraagSleutel.split(':')[0]);
    for (const [idTekst, punten] of Object.entries(u.verdeling)) {
      const id = Number(idTekst);
      if (!(punten > 0)) continue;
      goedPerSpeler.set(id, (goedPerSpeler.get(id) ?? 0) + 1);
      const ronde = perRonde.get(rondeIndex) ?? new Map<number, number>();
      ronde.set(id, (ronde.get(id) ?? 0) + punten);
      perRonde.set(rondeIndex, ronde);
    }
  }
  // Een prijs die bijna iedereen deelt is geen prijs. Twee mag, daarboven niet.
  const MAX_DELERS = 2;

  const meesteGoed = Math.max(0, ...goedPerSpeler.values());
  const scherpschutters = [...goedPerSpeler.entries()].filter(([, n]) => n === meesteGoed).map(([id]) => id);
  if (meesteGoed > 0 && scherpschutters.length <= MAX_DELERS) {
    const winnaars = scherpschutters;
    uit.push({
      sleutel: 'scherpschutter',
      titel: 'Scherpschutter',
      namen: winnaars.map(naamVan),
      detail: `${meesteGoed} ${meesteGoed === 1 ? 'vraag' : 'vragen'} goed`,
    });
  }

  // Snelste vinger: het snelste antwoord dat ook goed was.
  const metTijd = invoer.goedeAntwoorden.filter((a) => a.naMs !== null && a.spelerIds.length);
  if (metTijd.length) {
    const snelste = Math.min(...metTijd.map((a) => a.naMs as number));
    const winnaar = metTijd.find((a) => a.naMs === snelste)!;
    uit.push({
      sleutel: 'snelste',
      titel: 'Snelste vinger',
      namen: winnaar.spelerIds.map(naamVan),
      detail: `goed in ${(snelste / 1000).toLocaleString('nl-NL', { maximumFractionDigits: 1 })} seconden`,
    });
  }

  // Beste ronde: de meeste punten in één ronde.
  let beste = { punten: 0, rondeIndex: -1, ids: [] as number[] };
  for (const [rondeIndex, ronde] of perRonde) {
    for (const [id, punten] of ronde) {
      if (punten > beste.punten) beste = { punten, rondeIndex, ids: [id] };
      else if (punten === beste.punten && rondeIndex === beste.rondeIndex) beste.ids.push(id);
    }
  }
  if (beste.punten > 0 && beste.ids.length <= MAX_DELERS) {
    uit.push({
      sleutel: 'beste-ronde',
      titel: 'Beste ronde',
      namen: beste.ids.map(naamVan),
      detail: `${beste.punten} punten in ${invoer.rondeNamen[beste.rondeIndex] ?? `ronde ${beste.rondeIndex + 1}`}`,
    });
  }

  return uit;
}

/**
 * De prijzen aan het eind van de avond.
 *
 * Naast de winnaar verdienen nog een paar mensen een moment op het scherm:
 * wie de meeste vragen goed had, wie het snelst op de knop zat, wie de
 * beste ronde draaide, wie de langste reeks neerzette en wie van het verst
 * terugkwam. En één vraag verdient het ook: de moeilijkste. Allemaal af te
 * leiden uit wat er al vastligt: de uitdelingen per vraag en de reactietijd
 * per antwoord.
 */

export type PrijsSleutel = 'scherpschutter' | 'snelste' | 'beste-ronde' | 'reeks' | 'comeback' | 'moeilijkste-vraag';

export interface Prijs {
  sleutel: PrijsSleutel;
  titel: string;
  /** Wie hem wint; bij een gelijkspel meerdere namen. Bij de moeilijkste vraag: leeg. */
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
  /** De gespeelde vragen in volgorde, met hoeveel inzendingen ze kregen. Voor de reeks en de moeilijkste vraag. */
  vragen?: { sleutel: string; tekst: string; inzenders: number }[];
}

/** Een prijs die bijna iedereen deelt is geen prijs. Twee mag, daarboven niet. */
const MAX_DELERS = 2;

export function bepaalPrijzen(invoer: PrijsInvoer): Prijs[] {
  const naamVan = (id: number) => invoer.spelers.find((s) => s.id === id)?.naam ?? '?';
  const uit: Prijs[] = [];
  const rondeIndexVan = (sleutel: string) => Number(sleutel.split(':')[0]);

  // Scherpschutter: de meeste vragen met punten.
  const goedPerSpeler = new Map<number, number>();
  const perRonde = new Map<number, Map<number, number>>();
  for (const u of invoer.uitdelingen) {
    const rondeIndex = rondeIndexVan(u.vraagSleutel);
    for (const [idTekst, punten] of Object.entries(u.verdeling)) {
      const id = Number(idTekst);
      if (!(punten > 0)) continue;
      goedPerSpeler.set(id, (goedPerSpeler.get(id) ?? 0) + 1);
      const ronde = perRonde.get(rondeIndex) ?? new Map<number, number>();
      ronde.set(id, (ronde.get(id) ?? 0) + punten);
      perRonde.set(rondeIndex, ronde);
    }
  }

  const meesteGoed = Math.max(0, ...goedPerSpeler.values());
  const scherpschutters = [...goedPerSpeler.entries()].filter(([, n]) => n === meesteGoed).map(([id]) => id);
  if (meesteGoed > 0 && scherpschutters.length <= MAX_DELERS) {
    uit.push({
      sleutel: 'scherpschutter',
      titel: 'Scherpschutter',
      namen: scherpschutters.map(naamVan),
      detail: `${meesteGoed} ${meesteGoed === 1 ? 'vraag' : 'vragen'} goed`,
    });
  }

  // Snelste vinger: het snelste antwoord dat ook goed was. Bij een gelijke
  // tijd delen ze, net als bij de andere prijzen — en met dezelfde grens.
  const metTijd = invoer.goedeAntwoorden.filter((a) => a.naMs !== null && a.spelerIds.length);
  if (metTijd.length) {
    const snelste = Math.min(...metTijd.map((a) => a.naMs as number));
    const ids = [...new Set(metTijd.filter((a) => a.naMs === snelste).flatMap((a) => a.spelerIds))];
    if (ids.length <= MAX_DELERS) {
      uit.push({
        sleutel: 'snelste',
        titel: 'Snelste vinger',
        namen: ids.map(naamVan),
        detail: `goed in ${(snelste / 1000).toLocaleString('nl-NL', { maximumFractionDigits: 1 })} seconden`,
      });
    }
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

  const vragen = invoer.vragen ?? [];
  const verdelingVan = new Map(invoer.uitdelingen.map((u) => [u.vraagSleutel, u.verdeling]));

  // De reeks: de meeste vragen achter elkaar met punten. Drie of meer telt.
  if (vragen.length) {
    const langste = new Map<number, number>();
    const lopend = new Map<number, number>();
    for (const v of vragen) {
      const verdeling = verdelingVan.get(v.sleutel) ?? {};
      for (const s of invoer.spelers) {
        const n = (verdeling[s.id] ?? 0) > 0 ? (lopend.get(s.id) ?? 0) + 1 : 0;
        lopend.set(s.id, n);
        if (n > (langste.get(s.id) ?? 0)) langste.set(s.id, n);
      }
    }
    const top = Math.max(0, ...langste.values());
    const ids = [...langste.entries()].filter(([, n]) => n === top).map(([id]) => id);
    if (top >= 3 && ids.length <= MAX_DELERS) {
      uit.push({
        sleutel: 'reeks',
        titel: 'Langste reeks',
        namen: ids.map(naamVan),
        detail: `${top} vragen op rij goed`,
      });
    }
  }

  // De comeback: wie na een ronde het diepst stond en aan het eind het
  // meest is geklommen. Eén plek klimmen is geen comeback; twee wel.
  const rondeIndexen = [...new Set(invoer.uitdelingen.map((u) => rondeIndexVan(u.vraagSleutel)))].sort((a, b) => a - b);
  if (rondeIndexen.length >= 2 && invoer.spelers.length >= 3) {
    const totaal = new Map<number, number>(invoer.spelers.map((s) => [s.id, 0]));
    const rangschik = () =>
      [...totaal.entries()]
        .sort((a, b) => b[1] - a[1] || naamVan(a[0]).localeCompare(naamVan(b[0]), 'nl'))
        .map(([id]) => id);
    const diepste = new Map<number, number>();
    for (const ri of rondeIndexen) {
      for (const u of invoer.uitdelingen) {
        if (rondeIndexVan(u.vraagSleutel) !== ri) continue;
        for (const [id, punten] of Object.entries(u.verdeling)) totaal.set(Number(id), (totaal.get(Number(id)) ?? 0) + punten);
      }
      // De laatste ronde is de eindstand zelf; daar kun je niet meer van terugkomen.
      if (ri === rondeIndexen[rondeIndexen.length - 1]) break;
      rangschik().forEach((id, plek) => diepste.set(id, Math.max(diepste.get(id) ?? 0, plek)));
    }
    const eind = rangschik();
    let grootste = { sprong: 0, ids: [] as number[], van: 0, naar: 0 };
    eind.forEach((id, plek) => {
      const sprong = (diepste.get(id) ?? plek) - plek;
      if (sprong > grootste.sprong) grootste = { sprong, ids: [id], van: (diepste.get(id) ?? plek) + 1, naar: plek + 1 };
      else if (sprong === grootste.sprong && sprong > 0) grootste.ids.push(id);
    });
    if (grootste.sprong >= 2 && grootste.ids.length <= MAX_DELERS) {
      uit.push({
        sleutel: 'comeback',
        titel: 'Comeback van de avond',
        namen: grootste.ids.map(naamVan),
        detail: `van plek ${grootste.van} naar plek ${grootste.naar}`,
      });
    }
  }

  // De moeilijkste vraag: de minste mensen met punten, bij gelijke stand de
  // vraag waar de meeste mensen het wél probeerden.
  if (vragen.length) {
    let moeilijkst: { tekst: string; goed: number; inzenders: number } | null = null;
    for (const v of vragen) {
      const goed = Object.values(verdelingVan.get(v.sleutel) ?? {}).filter((p) => p > 0).length;
      if (!moeilijkst || goed < moeilijkst.goed || (goed === moeilijkst.goed && v.inzenders > moeilijkst.inzenders)) {
        moeilijkst = { tekst: v.tekst, goed, inzenders: v.inzenders };
      }
    }
    if (moeilijkst && moeilijkst.goed < invoer.spelers.length) {
      uit.push({
        sleutel: 'moeilijkste-vraag',
        titel: 'Moeilijkste vraag',
        namen: [],
        detail: `“${moeilijkst.tekst}” — ${moeilijkst.goed === 0 ? 'niemand had hem goed' : `${moeilijkst.goed} ${moeilijkst.goed === 1 ? 'iemand' : 'mensen'} goed`}`,
      });
    }
  }

  return uit;
}

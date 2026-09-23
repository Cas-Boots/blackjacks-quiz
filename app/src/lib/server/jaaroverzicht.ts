/**
 * De film van het jaar, dia voor dia.
 *
 * Neemt de geschreven tijdlijn uit `content/jaaroverzicht.ts` en de cijfers
 * uit resolution-recap, en maakt daar de dia's van die de televisie laat
 * zien: een titelkaart, één kaart per maand, en een slotkaart met het jaar
 * in getallen.
 *
 * Twee dingen gebeuren hier en nergens anders:
 *
 * 1. **De balken.** Wat in de tijdlijn tussen dubbele haken staat is een
 *    antwoord van vanavond. Zolang de avond loopt gaat dat woord niet mee
 *    in het pakketje naar de clients, en ook niet hoe lang het is: elke
 *    balk is even breed. Net als bij een vraag: wat nog gevraagd wordt,
 *    staat niet in de browser van de televisie. Hetzelfde geldt voor onze
 *    eigen cijfers die de recap-rondes vragen — taarten, landen, wie het
 *    vaakst ging — en voor regels die alleen in de herhaling horen.
 * 2. **Welke maanden meedoen.** Een maand komt in beeld als er iets van te
 *    vertellen valt: een geschreven moment dat niet meer op invulling wacht,
 *    of iets uit onze eigen cijfers. Zo staat er in oktober geen lege kaart
 *    zolang die maand nog niet is bijgeschreven.
 */
import { JAAROVERZICHT } from '$lib/content/jaaroverzicht';
import type { JaarMaand, JaarMoment } from '$lib/content/types';
import type { JaarDeel, JaarDia, JaarEigen, JaarRegel } from '$lib/shared/state';
import type { Analyse, Persoon } from './recap/analyse';

const MAANDEN = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

export function maandNaam(nr: number): string {
  return MAANDEN[nr - 1] ?? String(nr);
}

/* ---- De balken -------------------------------------------------------- */

/**
 * Knipt een regel in stukken op de dubbele haken. Zolang `onthuld` uit
 * staat, gaat de tekst onder een balk niet mee — ook de lengte niet.
 */
export function splits(tekst: string, onthuld: boolean): JaarDeel[] {
  const delen: JaarDeel[] = [];
  const patroon = /\[\[(.+?)\]\]/g;
  let laatste = 0;
  for (let m = patroon.exec(tekst); m; m = patroon.exec(tekst)) {
    if (m.index > laatste) delen.push({ tekst: tekst.slice(laatste, m.index), balk: false });
    delen.push({ tekst: onthuld ? m[1] : '', balk: true });
    laatste = m.index + m[0].length;
  }
  if (laatste < tekst.length) delen.push({ tekst: tekst.slice(laatste), balk: false });
  return delen;
}

/** Of een moment in beeld komt: niet als hij op invulling wacht, en sommige pas na de uitslag. */
function zichtbaar(moment: JaarMoment, onthuld: boolean): boolean {
  return !moment.teVullen && (onthuld || !moment.pasNaAfloop);
}

/** Hoeveel balken er in deze maand liggen. Voor het hostscherm en de controle vooraf. */
export function aantalBalken(maand: JaarMaand): number {
  return maand.momenten.reduce(
    (n, m) => n + (m.teVullen ? 0 : (m.tekst.match(/\[\[/g)?.length ?? 0) + (m.bij?.match(/\[\[/g)?.length ?? 0)),
    0,
  );
}

function regelVan(moment: JaarMoment, onthuld: boolean): JaarRegel {
  return {
    emoji: moment.emoji ?? null,
    delen: splits(moment.tekst, onthuld),
    bij: moment.bij ? splits(moment.bij, onthuld) : null,
  };
}

/* ---- Onze eigen maand ------------------------------------------------- */

function inMaand(dagen: Record<string, number>, jaar: number, maand: number): number {
  const voorvoegsel = `${jaar}-${String(maand).padStart(2, '0')}-`;
  let n = 0;
  for (const [datum, aantal] of Object.entries(dagen)) {
    if (datum.startsWith(voorvoegsel)) n += aantal;
  }
  return n;
}

/** 'Cas', 'Cas & Liz', en daarboven 'vier van ons' — een naamplaat past niet eindeloos. */
function wieTekst(namen: string[]): string {
  if (namen.length <= 2) return namen.join(' & ');
  return `${namen.length} van ons`;
}

/** Wanneer een land voor het eerst op de lijst kwam, en door wie. */
function eersteKeerPerLand(personen: Persoon[]) {
  const eerste = new Map<string, { naam: string; vlag: string; datum: string; wie: string[] }>();
  for (const p of personen) {
    for (const l of p.landen) {
      const bekend = eerste.get(l.code);
      if (!bekend) {
        eerste.set(l.code, { naam: l.naam, vlag: l.vlag, datum: l.datum, wie: [p.naam] });
      } else if (l.datum < bekend.datum) {
        eerste.set(l.code, { naam: l.naam, vlag: l.vlag, datum: l.datum, wie: [p.naam] });
      } else if (l.datum === bekend.datum && !bekend.wie.includes(p.naam)) {
        bekend.wie.push(p.naam);
      }
    }
  }
  return eerste;
}

/** Onze maand zoals hij na de uitslag op het scherm komt: alles ingevuld. */
export interface VolleMaand extends JaarEigen {
  taart: number;
  bijStart: number;
  koploper: { naam: string; aantal: number } | null;
  totaal: { sport: number; taart: number; landen: number };
}

/** Wat wij in deze maand deden, met de stand van het jaar tot en met die maand erbij. */
export function eigenMaand(analyse: Analyse, maand: number): VolleMaand {
  const jaar = analyse.jaar;
  const perPersoon = analyse.personen.map((p) => ({
    naam: p.naam,
    sport: inMaand(p.sport.dagen, jaar, maand),
    taart: inMaand(p.taart.dagen, jaar, maand),
    landen: [] as string[],
  }));

  const eerste = eersteKeerPerLand(analyse.personen);
  const dezeMaand = [...eerste.values()].filter((l) => l.datum.startsWith(`${jaar}-${String(maand).padStart(2, '0')}-`));
  // Landen op de eerste dagen van het jaar zijn meestal in één keer
  // ingevoerd en geen reis — dezelfde afspraak als bij 'landen.opEenDag' in
  // recap/vragen.ts. Die tellen wel mee in het totaal, maar ze horen niet
  // als uitje in januari op het scherm.
  const bijStart = dezeMaand.filter((l) => l.datum.slice(5) === '01-01' || l.datum.slice(5) === '01-02');
  const landen = dezeMaand
    .filter((l) => !bijStart.includes(l))
    .sort((a, b) => a.datum.localeCompare(b.datum) || a.naam.localeCompare(b.naam, 'nl'))
    .map((l) => ({ vlag: l.vlag, naam: l.naam, wie: wieTekst(l.wie), datum: l.datum }));

  // Op je eigen telefoon telt waar jíj was, niet wie er als eerste was.
  for (const p of analyse.personen) {
    const mijn = perPersoon.find((x) => x.naam === p.naam);
    if (!mijn) continue;
    mijn.landen = p.landen
      .filter((l) => l.datum.startsWith(`${jaar}-${String(maand).padStart(2, '0')}-`))
      .map((l) => l.vlag);
  }

  const sport = perPersoon.reduce((n, p) => n + p.sport, 0);
  const taart = perPersoon.reduce((n, p) => n + p.taart, 0);
  const beste = [...perPersoon].sort((a, b) => b.sport - a.sport || a.naam.localeCompare(b.naam, 'nl'))[0];

  return {
    sport,
    taart,
    landen,
    nieuweLanden: landen.length > 0,
    bijStart: bijStart.length,
    koploper: beste && beste.sport > 0 ? { naam: beste.naam, aantal: beste.sport } : null,
    perPersoon,
    totaal: totaalTot(analyse, maand),
  };
}

/**
 * Dezelfde maand, maar met balken over wat de recap-rondes vragen. Hoe vaak
 * er gesport is blijft staan — de quiz vraagt wíé het vaakst ging, niet
 * hoe vaak we samen gingen — maar de naam van de koploper, de taarten, de
 * landen en de stand van het jaar gaan eruit. Per persoon gaat er niets mee:
 * dat pakketje gaat naar iedereen, en opgeteld is het precies de vraag wie
 * het vaakst sportte.
 */
export function achterBalken(eigen: JaarEigen): JaarEigen {
  return {
    sport: eigen.sport,
    taart: null,
    landen: [],
    nieuweLanden: eigen.nieuweLanden,
    bijStart: null,
    koploper: eigen.koploper ? { naam: null, aantal: eigen.koploper.aantal } : null,
    perPersoon: [],
    totaal: null,
  };
}

/** De stand van het jaar tot en met deze maand: sporten, taarten, landen. */
function totaalTot(analyse: Analyse, maand: number): { sport: number; taart: number; landen: number } {
  const grens = `${analyse.jaar}-${String(maand).padStart(2, '0')}-31`;
  let sport = 0;
  let taart = 0;
  const codes = new Set<string>();
  for (const p of analyse.personen) {
    for (const [datum, n] of Object.entries(p.sport.dagen)) if (datum <= grens) sport += n;
    for (const [datum, n] of Object.entries(p.taart.dagen)) if (datum <= grens) taart += n;
    for (const l of p.landen) if (l.datum <= grens) codes.add(l.code);
  }
  return { sport, taart, landen: codes.size };
}

/** Het hele jaar in vier getallen, voor de slotkaart. */
export function jaarTotaal(analyse: Analyse): { sport: number; taart: number; landen: number; dagen: number } {
  const dagen = new Set<string>();
  for (const p of analyse.personen) {
    for (const d of Object.keys(p.sport.dagen)) dagen.add(d);
  }
  return { ...totaalTot(analyse, 12), dagen: dagen.size };
}

function heeftEigenNieuws(eigen: JaarEigen): boolean {
  return eigen.sport > 0 || (eigen.taart ?? 0) > 0 || eigen.nieuweLanden;
}

/* ---- De dia's --------------------------------------------------------- */

/**
 * De maanden die in de film zitten: alles waar iets van te vertellen valt.
 * Vóór de uitslag tellen regels die pas in de herhaling horen niet mee.
 */
export function maandenInDeFilm(analyse: Analyse, onthuld = false): number[] {
  return JAAROVERZICHT.maanden
    .filter((m) => m.momenten.some((x) => zichtbaar(x, onthuld)) || heeftEigenNieuws(eigenMaand(analyse, m.nr)))
    .map((m) => m.nr);
}

/** Titelkaart, één kaart per maand, slotkaart. */
export function aantalDias(analyse: Analyse, onthuld = false): number {
  return maandenInDeFilm(analyse, onthuld).length + 2;
}

/** Maanden die nog op invulling wachten. Voor het hostscherm en `npm run verify`. */
export function maandenTeVullen(): { nr: number; naam: string; aantal: number }[] {
  return JAAROVERZICHT.maanden
    .map((m) => ({ nr: m.nr, naam: maandNaam(m.nr), aantal: m.momenten.filter((x) => x.teVullen).length }))
    .filter((m) => m.aantal > 0);
}

function seconden(soort: JaarDia['soort'], regels: number, metEigen: boolean): number {
  if (soort === 'titel') return 7;
  if (soort === 'slot') return 12;
  return Math.min(18, Math.max(8, Math.round(5 + regels * 1.8 + (metEigen ? 2 : 0))));
}

/**
 * De dia bij deze stap. `onthuld` haalt de balken eraf; dat doet de
 * spelmotor pas als de avond voorbij is, zodat de herhaling na de uitslag
 * het hele jaar laat lezen.
 */
export function jaaroverzichtVoor(analyse: Analyse, stap: number, onthuld: boolean): JaarDia {
  const strook = maandenInDeFilm(analyse, onthuld);
  const stappen = strook.length + 2;
  const nu = Math.max(0, Math.min(stap, stappen - 1));
  const basis = {
    stap: nu,
    stappen,
    jaar: JAAROVERZICHT.jaar,
    strook,
    onthuld,
    peildatum: analyse.peildatum,
  };

  if (nu === 0) {
    return {
      ...basis,
      soort: 'titel',
      titel: String(JAAROVERZICHT.jaar),
      kop: JAAROVERZICHT.titel,
      maand: null,
      regels: [{ emoji: null, delen: splits(JAAROVERZICHT.inleiding, onthuld), bij: null }],
      eigen: null,
      seconden: seconden('titel', 1, false),
      jaartotaal: null,
    };
  }

  if (nu === stappen - 1) {
    return {
      ...basis,
      soort: 'slot',
      titel: `Dat was ${JAAROVERZICHT.jaar}`,
      kop: onthuld ? JAAROVERZICHT.slotNaAfloop : JAAROVERZICHT.slot,
      maand: null,
      regels: [],
      eigen: null,
      seconden: seconden('slot', 0, false),
      jaartotaal: onthuld ? jaarTotaal(analyse) : null,
    };
  }

  const nr = strook[nu - 1];
  const maand = JAAROVERZICHT.maanden.find((m) => m.nr === nr) as JaarMaand;
  const regels = maand.momenten.filter((m) => zichtbaar(m, onthuld)).map((m) => regelVan(m, onthuld));
  const eigen = eigenMaand(analyse, nr);
  return {
    ...basis,
    soort: 'maand',
    titel: maandNaam(nr),
    kop: maand.kop,
    maand: nr,
    regels,
    eigen: onthuld ? eigen : achterBalken(eigen),
    seconden: seconden('maand', regels.length, heeftEigenNieuws(eigen)),
    jaartotaal: null,
  };
}

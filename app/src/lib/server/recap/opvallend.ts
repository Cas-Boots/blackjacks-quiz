/**
 * Opvallend: de laatste dia van de sportcijfers.
 *
 * Geen ranglijst, maar de weetjes van het soort "nooit", "één keer" en
 * "altijd": wie nooit zonder een ander sportte, op welke dag iemand het hele
 * jaar (bijna) niet ging. Alles wordt op de avond zelf uitgerekend op de
 * laatste cijfers; wat niet meer klopt, valt vanzelf weg.
 *
 * Bewust niet: wie samen sport (dat zijn de stellen, dat weet iedereen),
 * gezamenlijke uitjes en de drukste dag. Te voorspelbaar.
 */
import type { CijfersFeit } from '$lib/shared/state';
import { opsomming, sportEmoji, sportNaam, telwoord, type Analyse, type Persoon } from './analyse';

/** Pas vanaf zoveel sportdagen zegt "nooit zonder" iets. */
const MIN_DAGEN_SAMEN = 30;
/** Pas vanaf zoveel keer sporten zegt een lege weekdag iets (gemiddeld vijf per weekdag). */
const MIN_KEER_WEEKDAG = 35;
/** Zoveel weetjes passen op één dia. */
const MAX_FEITEN = 5;

const WEEKDAGEN = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
const MAANDEN = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

/** Maandag = 0. */
function weekdag(datum: string): number {
  const d = new Date(Date.UTC(Number(datum.slice(0, 4)), Number(datum.slice(5, 7)) - 1, Number(datum.slice(8, 10))));
  return (d.getUTCDay() + 6) % 7;
}

/** 'dinsdag 7 april' */
function dagTekst(datum: string): string {
  return `${WEEKDAGEN[weekdag(datum)]} ${Number(datum.slice(8, 10))} ${MAANDEN[Number(datum.slice(5, 7)) - 1]}`;
}

function keer(n: number): string {
  return `${telwoord(n)} keer`;
}

/* ---- Nooit zonder ---------------------------------------------------- */

function nooitZonder(personen: Persoon[]): CijfersFeit[] {
  const feiten: CijfersFeit[] = [];
  const gehad = new Set<string>();
  for (const a of personen) {
    const dagenA = [...a.sportPerDag.keys()];
    if (dagenA.length < MIN_DAGEN_SAMEN) continue;
    for (const b of personen) {
      if (a === b) continue;
      const zonder = dagenA.filter((d) => !b.sportPerDag.has(d));
      if (zonder.length > 1) continue;
      const sleutel = [a.naam, b.naam].sort().join('|');
      if (gehad.has(sleutel)) continue;
      gehad.add(sleutel);
      const bAlleen = [...b.sportPerDag.keys()].filter((d) => !a.sportPerDag.has(d)).length;
      const aantal = `${a.naam} sportte dit jaar op ${dagenA.length} dagen`;
      if (zonder.length === 0 && bAlleen === 0) {
        feiten.push({
          emoji: '👯',
          kop: 'Altijd samen',
          tekst: `${a.naam} en ${b.naam} sportten dit jaar op precies dezelfde ${dagenA.length} dagen. Geen enkele keer ging één van beiden alleen.`,
          namen: [a.naam, b.naam],
        });
      } else if (zonder.length === 0) {
        feiten.push({
          emoji: '🫶',
          kop: `Nooit zonder ${b.naam}`,
          tekst: `${aantal}, en op elk daarvan sportte ${b.naam} ook. ${b.naam} ging wel ${keer(bAlleen)} zonder ${a.naam}.`,
          namen: [a.naam, b.naam],
        });
      } else {
        feiten.push({
          emoji: '🫶',
          kop: `Bijna nooit zonder ${b.naam}`,
          tekst: `${aantal}. Op één na sportte ${b.naam} die dag ook: alleen op ${dagTekst(zonder[0])} niet.`,
          namen: [a.naam, b.naam],
        });
      }
    }
  }
  return feiten;
}

/* ---- De lege weekdag ------------------------------------------------- */

interface LegeDag {
  persoon: Persoon;
  dag: number;
  aantal: number;
  /** Hoeveel keer je op die dag zou verwachten als het jaar gelijk verdeeld was. */
  verwacht: number;
  datums: string[];
}

function legeDagen(personen: Persoon[]): LegeDag[] {
  const uit: LegeDag[] = [];
  for (const p of personen) {
    if (p.sport.totaal < MIN_KEER_WEEKDAG) continue;
    const perDag: string[][] = WEEKDAGEN.map(() => []);
    for (const [datum, n] of Object.entries(p.sport.dagen)) {
      for (let i = 0; i < n; i++) perDag[weekdag(datum)].push(datum);
    }
    const minste = Math.min(...perDag.map((d) => d.length));
    if (minste > 1) continue;
    perDag.forEach((datums, dag) => {
      if (datums.length === minste) uit.push({ persoon: p, dag, aantal: minste, verwacht: p.sport.totaal / 7, datums });
    });
  }
  return uit;
}

function weekdagFeiten(lege: LegeDag[]): CijfersFeit[] {
  // Wie op dezelfde dag even weinig sportte, komt samen in één weetje.
  const groepen = new Map<string, LegeDag[]>();
  for (const l of lege) {
    const sleutel = `${l.dag}|${l.aantal}`;
    groepen.set(sleutel, [...(groepen.get(sleutel) ?? []), l]);
  }
  return [...groepen.values()]
    .sort((x, y) => y.reduce((n, l) => n + l.verwacht, 0) - x.reduce((n, l) => n + l.verwacht, 0))
    .map((groep) => {
      const { dag, aantal } = groep[0];
      const namen = groep.map((l) => l.persoon.naam);
      const dagNaam = WEEKDAGEN[dag];
      if (aantal === 0) {
        const tekst =
          groep.length === 1
            ? `${namen[0]} sportte dit jaar ${groep[0].persoon.sport.totaal} keer, en geen enkele keer op een ${dagNaam}.`
            : `${opsomming(namen)} sportten dit jaar ${opsomming(groep.map((l) => String(l.persoon.sport.totaal)))} keer, en geen van ${groep.length === 2 ? 'beiden' : 'allen'} ooit op een ${dagNaam}.`;
        return { emoji: '🚫', kop: `Nooit op ${dagNaam}`, tekst, namen };
      }
      const tekst =
        groep.length === 1
          ? `${namen[0]} sportte dit jaar ${groep[0].persoon.sport.totaal} keer. Op een ${dagNaam} maar één keer: ${dagTekst(groep[0].datums[0]).replace(`${dagNaam} `, '')}.`
          : `${opsomming(namen)} sportten dit jaar elk maar één keer op een ${dagNaam}.`;
      return { emoji: '☝️', kop: `Eén ${dagNaam}`, tekst, namen };
    });
}

/* ---- De lievelingssport, maar nooit op die dag ----------------------- */

function sportWeekdagFeiten(personen: Persoon[], lege: LegeDag[]): CijfersFeit[] {
  const feiten: CijfersFeit[] = [];
  for (const p of personen) {
    const top = [...p.perSport.entries()].sort((a, b) => b[1] - a[1])[0];
    if (!top || top[1] < MIN_KEER_WEEKDAG || top[0] === 'onbekend') continue;
    const [tag, aantal] = top;
    const perDag = new Array(7).fill(0);
    const welDag = new Array(7).fill(0);
    for (const [datum, tags] of p.sportPerDag) {
      welDag[weekdag(datum)] += tags.length;
      perDag[weekdag(datum)] += tags.filter((t) => t === tag).length;
    }
    // Alleen doordeweeks, en alleen als je op die dag wél iets anders deed:
    // anders zegt de lege weekdag het al.
    for (let dag = 0; dag < 5; dag++) {
      if (perDag[dag] > 0 || welDag[dag] === 0) continue;
      if (lege.some((l) => l.persoon === p && l.dag === dag)) continue;
      const dagNaam = WEEKDAGEN[dag];
      const wat = tag === 'gym' ? `ging dit jaar ${aantal} keer naar de sportschool` : `deed dit jaar ${aantal} keer ${sportNaam(tag).toLowerCase()}`;
      feiten.push({
        emoji: sportEmoji(tag),
        kop: tag === 'gym' ? `Nooit sportschool op ${dagNaam}` : `Nooit ${sportNaam(tag).toLowerCase()} op ${dagNaam}`,
        tekst: `${p.naam} ${wat}, maar nooit op een ${dagNaam}. Wel ${keer(welDag[dag])} iets anders.`,
        namen: [p.naam],
      });
    }
  }
  return feiten;
}

/** De weetjes voor de laatste dia van de sportcijfers, belangrijkste eerst. */
export function opvallend(analyse: Analyse): CijfersFeit[] {
  const lege = legeDagen(analyse.personen);
  return [
    ...nooitZonder(analyse.personen),
    ...weekdagFeiten(lege),
    ...sportWeekdagFeiten(analyse.personen, lege),
  ].slice(0, MAX_FEITEN);
}

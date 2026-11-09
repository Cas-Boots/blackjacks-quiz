/**
 * Opvallend: de laatste dia van de sportcijfers.
 *
 * Geen ranglijst, maar de weetjes van het soort "nooit", "één keer" en
 * "altijd": wie nooit zonder een ander sportte, op welke dag iemand het hele
 * jaar (bijna) niet ging. Alles wordt op de avond zelf uitgerekend op de
 * laatste cijfers; wat niet meer klopt, valt vanzelf weg.
 *
 * Bewust niet: wie samen sport (dat zijn de stellen, dat weet iedereen),
 * gezamenlijke uitjes, de drukste dag en een sport die op één weekdag nooit
 * gebeurt (Joris nooit naar de sportschool op vrijdag). Te saai.
 */
import type { CijfersFeit } from '$lib/shared/state';
import { VERKLARING } from '$lib/content/opvallend';
import { opsomming, telwoord, type Analyse, type Persoon } from './analyse';

/** Zo noemen we elkaar. De portretjes gaan op de volledige naam. */
const ROEPNAAM: Record<string, string> = {
  Bastiaan: 'Bas',
};

function roep(naam: string): string {
  return ROEPNAAM[naam] ?? naam;
}

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
      const [x, y] = [roep(a.naam), roep(b.naam)];
      const aantal = `${x} sportte dit jaar op ${dagenA.length} dagen`;
      if (zonder.length === 0 && bAlleen === 0) {
        feiten.push({
          emoji: '👯',
          kop: `${x} en ${y} altijd samen`,
          tekst: `${x} en ${y} sportten dit jaar op precies dezelfde ${dagenA.length} dagen. Geen enkele keer ging één van beiden alleen.`,
          namen: [a.naam, b.naam],
        });
      } else if (zonder.length === 0) {
        feiten.push({
          emoji: '🫶',
          kop: `${x} nooit zonder ${y}`,
          tekst: `${aantal}, en op elk daarvan sportte ${y} ook. ${y} ging wel ${keer(bAlleen)} zonder ${x}.`,
          namen: [a.naam, b.naam],
        });
      } else {
        feiten.push({
          emoji: '🫶',
          kop: `${x} bijna nooit zonder ${y}`,
          tekst: `${aantal}. Op één na sportte ${y} die dag ook: alleen op ${dagTekst(zonder[0])} niet.`,
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
      const genoemd = namen.map(roep);
      const dagNaam = WEEKDAGEN[dag];
      if (aantal === 0) {
        const tekst =
          groep.length === 1
            ? `${genoemd[0]} sportte dit jaar ${groep[0].persoon.sport.totaal} keer, en geen enkele keer op een ${dagNaam}.`
            : `${opsomming(genoemd)} sportten dit jaar ${opsomming(groep.map((l) => String(l.persoon.sport.totaal)))} keer, en geen van ${groep.length === 2 ? 'beiden' : 'allen'} ooit op een ${dagNaam}.`;
        return { emoji: '🚫', kop: `Nooit op ${dagNaam}`, tekst, namen };
      }
      const tekst =
        groep.length === 1
          ? `${genoemd[0]} sportte dit jaar ${groep[0].persoon.sport.totaal} keer. Op een ${dagNaam} maar één keer: ${dagTekst(groep[0].datums[0]).replace(`${dagNaam} `, '')}.`
          : `${opsomming(genoemd)} sportten dit jaar elk maar één keer op een ${dagNaam}.`;
      return { emoji: '☝️', kop: `Eén ${dagNaam}`, tekst, namen };
    });
}

/** De sleutel waarmee een verklaring in `content/opvallend.ts` staat. */
export function verklaringSleutel(feit: CijfersFeit): string {
  return `${feit.kop}: ${[...feit.namen].sort().join(' + ')}`;
}

/**
 * Zet de weetjes zo neer dat niemand twee keer achter elkaar aan de beurt
 * is: anders staan de stellen met twee weetjes onder elkaar. Lukt het niet
 * meer, dan komt de rest in de oorspronkelijke volgorde.
 */
function afgewisseld(feiten: CijfersFeit[]): CijfersFeit[] {
  const over = [...feiten];
  const uit: CijfersFeit[] = [];
  while (over.length) {
    const vorige = uit.at(-1);
    const i = vorige ? over.findIndex((f) => !f.namen.some((n) => vorige.namen.includes(n))) : 0;
    uit.push(over.splice(Math.max(0, i), 1)[0]);
  }
  return uit;
}

/** De weetjes voor de laatste dia van de sportcijfers. */
export function opvallend(analyse: Analyse): CijfersFeit[] {
  const lege = legeDagen(analyse.personen);
  const feiten = [...nooitZonder(analyse.personen), ...weekdagFeiten(lege)].slice(0, MAX_FEITEN);
  return afgewisseld(feiten).map((f) => {
    const bij = VERKLARING[verklaringSleutel(f)];
    return bij ? { ...f, bij } : f;
  });
}

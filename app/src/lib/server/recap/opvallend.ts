/**
 * Opvallend: de laatste dia van de sportcijfers.
 *
 * Geen ranglijst, maar de weetjes van het soort "nooit", "één keer" en
 * "altijd": wie nooit zonder een ander sportte, op welke dag iemand het hele
 * jaar (bijna) niet ging, wat er op vrijdag de dertiende gebeurde, wie na een
 * sport de dag erna altijd rust nam. Alles
 * wordt op de avond zelf uitgerekend op de laatste cijfers; wat niet meer
 * klopt, valt vanzelf weg. Het liefst staat iedereen er één keer in.
 *
 * Bewust niet: wie samen sport (dat zijn de stellen, dat weet iedereen),
 * gezamenlijke uitjes, de drukste dag, de langste reeks (die staat al op de
 * persoonlijke kaart), wie nooit drie dagen achter elkaar sportte, feestdagen
 * (Valentijnsdag, Koningsdag, de WK-finale), Joris en de taart, en een
 * sport die op één weekdag nooit gebeurt (Joris nooit naar de sportschool op
 * vrijdag). Te saai.
 */
import type { CijfersFeit } from '$lib/shared/state';
import { EEN_KEER, VERKLARING } from '$lib/content/opvallend';
import { datumTekst, opsomming, sportEmoji, sportNaam, telwoord, type Analyse, type Persoon } from './analyse';

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
/** Zoveel weetjes passen op één dia (in twee kolommen). */
const MAX_FEITEN = 8;
/** Pas vanaf zoveel keer zegt "nooit de dag na deze sport" iets. */
const MIN_KEER_DAG_ERNA = 15;

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

/* ---- Vrijdag de dertiende ------------------------------------------- */

function wieSportteOp(personen: Persoon[], datum: string): Persoon[] {
  return personen.filter((p) => p.sportPerDag.has(datum));
}

/** Alle vrijdagen de dertiende van het jaar, 'JJJJ-MM-DD'. */
function vrijdagenDeDertiende(jaar: number): string[] {
  const uit: string[] = [];
  for (let m = 0; m < 12; m++) {
    const d = new Date(Date.UTC(jaar, m, 13));
    if (d.getUTCDay() === 5) uit.push(d.toISOString().slice(0, 10));
  }
  return uit;
}

/** Op vrijdag de dertiende bleef iedereen thuis. Alleen als dat voor álle geweest zijn geldt. */
function dertiendeFeit(analyse: Analyse): CijfersFeit[] {
  const alle = vrijdagenDeDertiende(analyse.jaar);
  const geweest = alle.filter((d) => d <= analyse.peildatum);
  const nog = alle.filter((d) => d > analyse.peildatum);
  if (!geweest.length || geweest.some((d) => wieSportteOp(analyse.personen, d).length)) return [];
  const welke = opsomming(geweest.map(datumTekst));
  const tekst =
    geweest.length === 1
      ? `Op vrijdag ${welke} sportte niemand van ons.`
      : `Op ${welke} sportte niemand van ons. ${geweest.length === 2 ? 'Allebei' : `Alle ${telwoord(geweest.length)}`} vrijdag de dertiende.`;
  const vooruit = nog.length ? ` En ${opsomming(nog.map(datumTekst))} moet nog komen.` : '';
  return [{ emoji: '🐈‍⬛', kop: 'Vrijdag de dertiende', tekst: tekst + vooruit, namen: [] }];
}

/* ---- Eén keer, en de dag erna --------------------------------------- */

function eenKeerFeiten(personen: Persoon[]): CijfersFeit[] {
  const feiten: CijfersFeit[] = [];
  for (const { wie, sport, kop } of EEN_KEER) {
    const p = personen.find((x) => x.naam === wie);
    if (!p || p.perSport.get(sport) !== 1) continue;
    const datum = [...p.sportPerDag].find(([, tags]) => tags.includes(sport))?.[0];
    if (!datum) continue;
    feiten.push({
      emoji: sportEmoji(sport),
      kop,
      tekst: `${roep(p.naam)} sportte dit jaar ${p.sport.totaal} keer. ${sportNaam(sport)}: één keer, op ${datumTekst(datum)}.`,
      namen: [p.naam],
    });
  }
  return feiten;
}

function dagErna(datum: string): string {
  const d = new Date(Date.UTC(Number(datum.slice(0, 4)), Number(datum.slice(5, 7)) - 1, Number(datum.slice(8, 10)) + 1));
  return d.toISOString().slice(0, 10);
}

/** 'liep 21 keer hard', 'ging 48 keer naar de sportschool', 'deed 39 keer padel' */
function deedKeer(tag: string, n: number): string {
  if (tag === 'running') return `liep dit jaar ${n} keer hard`;
  if (tag === 'gym') return `ging dit jaar ${n} keer naar de sportschool`;
  return `deed dit jaar ${n} keer ${sportNaam(tag).toLowerCase()}`;
}

/** Wie na een bepaalde sport de dag erna nooit sportte: na het hardlopen altijd rust. */
function dagErnaFeiten(analyse: Analyse): CijfersFeit[] {
  const feiten: CijfersFeit[] = [];
  for (const p of analyse.personen) {
    for (const [tag, aantal] of p.perSport) {
      if (aantal < MIN_KEER_DAG_ERNA || tag === 'onbekend') continue;
      // Wat op de peildatum gebeurde, heeft nog geen dag erna.
      const dagen = [...p.sportPerDag].filter(([d, tags]) => tags.includes(tag) && d < analyse.peildatum).map(([d]) => d);
      if (dagen.some((d) => p.sportPerDag.has(dagErna(d)))) continue;
      feiten.push({
        emoji: sportEmoji(tag),
        kop: `Na ${tag === 'running' ? 'het hardlopen' : sportNaam(tag).toLowerCase()}: rust`,
        tekst: `${roep(p.naam)} ${deedKeer(tag, aantal)}, en sportte de dag erna geen enkele keer.`,
        namen: [p.naam],
      });
    }
  }
  return feiten;
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
  const feiten = [
    ...nooitZonder(analyse.personen),
    ...weekdagFeiten(lege),
    ...eenKeerFeiten(analyse.personen),
    ...dagErnaFeiten(analyse),
    ...dertiendeFeit(analyse),
  ].slice(0, MAX_FEITEN);
  return afgewisseld(feiten).map((f) => {
    const bij = VERKLARING[verklaringSleutel(f)];
    return bij ? { ...f, bij } : f;
  });
}

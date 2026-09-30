/**
 * Van de export van resolution-recap naar cijfers per persoon.
 *
 * Puur rekenwerk, zonder database of netwerk, zodat het in een test past.
 * De export is precies wat `/api/export` van resolution-recap teruggeeft
 * (en wat er dagelijks in `backups/` van dat project belandt).
 */
import type { CijfersLand, CijfersPersoon } from '$lib/shared/state';

export interface RecapExport {
  exportSchemaVersion?: number;
  exportedAt?: string;
  seasons: { id: number; year: number; name: string; is_active: number }[];
  people: { id: number; name: string; emoji: string | null; is_active: number }[];
  metrics: { id: number; name: string; name_nl?: string | null }[];
  entries: {
    id: number;
    season_id: number;
    person_id: number;
    metric_id: number;
    entry_date: string;
    deleted_at: string | null;
    tags: string | null;
  }[];
  goals: { id: number; season_id: number; person_id: number; metric_id: number; target: number }[];
  countries_visited: {
    id: number;
    season_id: number;
    person_id: number;
    country_code: string;
    country_name: string;
    visited_at: string;
  }[];
}

export interface Persoon extends CijfersPersoon {
  id: number;
  /** Aantal keer per sporttag (na het gelijktrekken van oude namen). */
  perSport: Map<string, number>;
}

export interface Analyse {
  jaar: number;
  /** Tot en met welke dag de cijfers lopen, 'JJJJ-MM-DD'. */
  peildatum: string;
  personen: Persoon[];
  /** Alle sporttags die iemand heeft gebruikt, met het totaal. */
  sporten: Map<string, number>;
}

/* ---- Sporten: van tag naar Nederlandse naam --------------------------- */

const SPORT_ALIAS: Record<string, string> = {
  skating: 'ice-skating',
  'inline-skating': 'road-skating',
  skeeleren: 'road-skating',
  soccer: 'football',
  mountainbiking: 'mountain-biking',
};

const SPORTEN: Record<string, { naam: string; emoji: string }> = {
  running: { naam: 'Hardlopen', emoji: '🏃' },
  cycling: { naam: 'Fietsen', emoji: '🚴' },
  'mountain-biking': { naam: 'Mountainbiken', emoji: '🚵' },
  hiking: { naam: 'Wandelen', emoji: '🥾' },
  walking: { naam: 'Wandelen', emoji: '🚶' },
  swimming: { naam: 'Zwemmen', emoji: '🏊' },
  kayaking: { naam: 'Kajakken', emoji: '🛶' },
  rafting: { naam: 'Raften', emoji: '🚣' },
  rowing: { naam: 'Roeien', emoji: '🚣' },
  paddleboarding: { naam: 'Suppen', emoji: '🏄' },
  gym: { naam: 'Sportschool', emoji: '🏋️' },
  fitness: { naam: 'Fitness', emoji: '💪' },
  hyrox: { naam: 'Hyrox', emoji: '🏆' },
  bootcamp: { naam: 'Bootcamp', emoji: '💪' },
  physio: { naam: 'Fysio', emoji: '🧑‍⚕️' },
  yoga: { naam: 'Yoga', emoji: '🧘' },
  pilates: { naam: 'Pilates', emoji: '🧘' },
  tennis: { naam: 'Tennis', emoji: '🎾' },
  padel: { naam: 'Padel', emoji: '🎾' },
  badminton: { naam: 'Badminton', emoji: '🏸' },
  squash: { naam: 'Squash', emoji: '🎾' },
  'table-tennis': { naam: 'Tafeltennis', emoji: '🏓' },
  football: { naam: 'Voetbal', emoji: '⚽' },
  basketball: { naam: 'Basketbal', emoji: '🏀' },
  hockey: { naam: 'Hockey', emoji: '🏑' },
  volleyball: { naam: 'Volleybal', emoji: '🏐' },
  korfball: { naam: 'Korfbal', emoji: '🏐' },
  climbing: { naam: 'Klimmen', emoji: '🧗' },
  bouldering: { naam: 'Boulderen', emoji: '🧗' },
  skiing: { naam: 'Skiën', emoji: '⛷️' },
  snowboarding: { naam: 'Snowboarden', emoji: '🏂' },
  'ice-skating': { naam: 'Schaatsen', emoji: '⛸️' },
  'road-skating': { naam: 'Skeeleren', emoji: '🛼' },
  sledding: { naam: 'Sleeën', emoji: '🛷' },
  boxing: { naam: 'Boksen', emoji: '🥊' },
  'martial-arts': { naam: 'Vechtsport', emoji: '🥋' },
  dance: { naam: 'Dansen', emoji: '💃' },
  other: { naam: 'Anders', emoji: '🏅' },
  onbekend: { naam: 'Zonder soort', emoji: '❔' },
};

export function sportTag(ruw: string | null | undefined): string {
  const schoon = (ruw ?? '').trim().toLowerCase();
  if (!schoon) return 'onbekend';
  return SPORT_ALIAS[schoon] ?? schoon;
}

export function sportNaam(tag: string): string {
  return SPORTEN[tag]?.naam ?? tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, ' ');
}

export function sportEmoji(tag: string): string {
  return SPORTEN[tag]?.emoji ?? '🏅';
}

/** Welke tag hoort bij een naam die iemand in een vraag typt: 'fysio', 'physio', 'Fysio'. */
export function zoekSportTag(naam: string): string {
  const schoon = naam.trim().toLowerCase();
  const alsTag = sportTag(schoon);
  if (SPORTEN[alsTag]) return alsTag;
  const opNaam = Object.entries(SPORTEN).find(([, s]) => s.naam.toLowerCase() === schoon);
  return opNaam ? opNaam[0] : alsTag;
}

/* ---- Landen: van Engelse naam naar Nederlandse ------------------------ */

const LANDEN_NL: Record<string, string> = {
  NL: 'Nederland', BE: 'België', DE: 'Duitsland', FR: 'Frankrijk', GB: 'het Verenigd Koninkrijk',
  IE: 'Ierland', ES: 'Spanje', PT: 'Portugal', IT: 'Italië', AT: 'Oostenrijk', CH: 'Zwitserland',
  LU: 'Luxemburg', DK: 'Denemarken', SE: 'Zweden', NO: 'Noorwegen', FI: 'Finland', IS: 'IJsland',
  PL: 'Polen', CZ: 'Tsjechië', SK: 'Slowakije', HU: 'Hongarije', SI: 'Slovenië', HR: 'Kroatië',
  BA: 'Bosnië en Herzegovina', RS: 'Servië', ME: 'Montenegro', MK: 'Noord-Macedonië', AL: 'Albanië',
  GR: 'Griekenland', BG: 'Bulgarije', RO: 'Roemenië', MD: 'Moldavië', UA: 'Oekraïne', BY: 'Wit-Rusland',
  LT: 'Litouwen', LV: 'Letland', EE: 'Estland', RU: 'Rusland', TR: 'Turkije', CY: 'Cyprus', MT: 'Malta',
  MA: 'Marokko', TN: 'Tunesië', EG: 'Egypte', ZA: 'Zuid-Afrika', KE: 'Kenia', TZ: 'Tanzania',
  SA: 'Saoedi-Arabië', AE: 'de Verenigde Arabische Emiraten', QA: 'Qatar', OM: 'Oman', JO: 'Jordanië',
  IL: 'Israël', US: 'de Verenigde Staten', CA: 'Canada', MX: 'Mexico', BR: 'Brazilië', AR: 'Argentinië',
  CL: 'Chili', PE: 'Peru', CO: 'Colombia', CR: 'Costa Rica', CU: 'Cuba', JP: 'Japan', KR: 'Zuid-Korea',
  CN: 'China', TH: 'Thailand', VN: 'Vietnam', ID: 'Indonesië', MY: 'Maleisië', SG: 'Singapore',
  PH: 'de Filipijnen', IN: 'India', LK: 'Sri Lanka', NP: 'Nepal', AU: 'Australië', NZ: 'Nieuw-Zeeland',
};

export function landNaam(code: string, engels: string): string {
  return LANDEN_NL[code.toUpperCase()] ?? engels;
}

export function vlag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return '🏳️';
  return [...code.toUpperCase()].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join('');
}

/* ---- De analyse -------------------------------------------------------- */

function vindMetric(metrics: RecapExport['metrics'], patroon: RegExp, anders: number): number {
  const m = metrics.find((x) => patroon.test(x.name) || patroon.test(x.name_nl ?? ''));
  return m ? m.id : anders;
}

function langsteReeks(dagen: Iterable<string>): number {
  const lijst = [...new Set(dagen)].sort();
  let beste = 0;
  let reeks = 0;
  let vorige: number | null = null;
  for (const d of lijst) {
    const t = Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));
    reeks = vorige !== null && t - vorige === 86_400_000 ? reeks + 1 : 1;
    beste = Math.max(beste, reeks);
    vorige = t;
  }
  return beste;
}

export function analyseer(data: RecapExport): Analyse {
  const seizoen =
    data.seasons.find((s) => s.is_active) ??
    [...data.seasons].sort((a, b) => b.year - a.year)[0] ??
    { id: 1, year: new Date().getUTCFullYear() };
  const sportId = vindMetric(data.metrics, /sport/i, 1);
  const taartId = vindMetric(data.metrics, /cake|taart/i, 2);

  const entries = data.entries.filter((e) => e.season_id === seizoen.id && !e.deleted_at);
  const peildatum = (data.exportedAt ?? new Date().toISOString()).slice(0, 10);
  const sporten = new Map<string, number>();

  const personen: Persoon[] = data.people
    .filter((p) => p.is_active)
    .sort((a, b) => a.id - b.id)
    .map((p) => {
      const mijn = entries.filter((e) => e.person_id === p.id);
      const sportDagen: Record<string, number> = {};
      const taartDagen: Record<string, number> = {};
      const perSport = new Map<string, number>();
      let sportTotaal = 0;
      let taartTotaal = 0;
      for (const e of mijn) {
        if (e.metric_id === sportId) {
          sportTotaal += 1;
          sportDagen[e.entry_date] = (sportDagen[e.entry_date] ?? 0) + 1;
          const tag = sportTag(e.tags);
          perSport.set(tag, (perSport.get(tag) ?? 0) + 1);
          sporten.set(tag, (sporten.get(tag) ?? 0) + 1);
        } else if (e.metric_id === taartId) {
          taartTotaal += 1;
          taartDagen[e.entry_date] = (taartDagen[e.entry_date] ?? 0) + 1;
        }
      }
      const doel = data.goals.find((g) => g.person_id === p.id && g.metric_id === sportId && g.season_id === seizoen.id);
      const landen: CijfersLand[] = data.countries_visited
        .filter((c) => c.person_id === p.id && c.season_id === seizoen.id)
        .sort((a, b) => a.visited_at.localeCompare(b.visited_at) || a.id - b.id)
        .map((c) => ({
          code: c.country_code.toUpperCase(),
          naam: landNaam(c.country_code, c.country_name),
          vlag: vlag(c.country_code),
          datum: c.visited_at.slice(0, 10),
        }));
      return {
        id: p.id,
        naam: p.name,
        emoji: p.emoji ?? '',
        perSport,
        sport: {
          totaal: sportTotaal,
          doel: doel ? doel.target : null,
          dagen: sportDagen,
          soorten: [...perSport.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([tag, aantal]) => ({ naam: sportNaam(tag), emoji: sportEmoji(tag), aantal })),
          langsteReeks: langsteReeks(Object.keys(sportDagen)),
        },
        taart: { totaal: taartTotaal, dagen: taartDagen },
        landen,
      };
    });

  return { jaar: seizoen.year, peildatum, personen, sporten };
}

/** Wat de televisie nodig heeft: zonder de interne velden. */
export function publiek(p: Persoon): CijfersPersoon {
  return { naam: p.naam, emoji: p.emoji, sport: p.sport, taart: p.taart, landen: p.landen };
}

/* ---- Taal ------------------------------------------------------------- */

const TELWOORDEN = [
  'nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien',
  'elf', 'twaalf', 'dertien', 'veertien', 'vijftien', 'zestien', 'zeventien', 'achttien', 'negentien', 'twintig',
];
const MAANDEN = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

/** 'twaalf' voor kleine getallen, daarboven cijfers. Eerste letter groot als je dat vraagt. */
export function telwoord(n: number, hoofdletter = false): string {
  const w = n >= 0 && n <= 20 && Number.isInteger(n) ? TELWOORDEN[n] : String(n);
  return hoofdletter ? w.charAt(0).toUpperCase() + w.slice(1) : w;
}

export function maandNaam(datum: string): string {
  return MAANDEN[Number(datum.slice(5, 7)) - 1] ?? datum;
}

/** '30 januari' */
export function datumTekst(datum: string): string {
  return `${Number(datum.slice(8, 10))} ${maandNaam(datum)}`;
}

/** 'Eva, Liz en Bastiaan' */
export function opsomming(namen: string[]): string {
  if (namen.length === 0) return 'niemand';
  if (namen.length === 1) return namen[0];
  return `${namen.slice(0, -1).join(', ')} en ${namen[namen.length - 1]}`;
}

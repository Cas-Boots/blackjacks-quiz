/**
 * De ronde over onze eigen WK-poule, uitgerekend uit de export van
 * blackjacks-cup (`/api/export`).
 *
 * Het WK is voorbij, dus de cijfers veranderen niet meer: we werken met één
 * vaste momentopname in `src/lib/content/poule-snapshot.json`. Die ververs je
 * alleen als er in de poule achteraf nog iets rechtgezet wordt; zie het
 * README. Punten nemen we over zoals de poule ze toekende (jokers tellen daar
 * al dubbel), zodat de quiz de spelregels van de poule niet hoeft na te doen.
 */
import snapshot from '$lib/content/poule-snapshot.json';
import { opsomming, telwoord } from './analyse';
import type { LevendAntwoord } from './vragen';

export interface PouleExport {
  exportSchemaVersion: number;
  exportedAt: string;
  users: { id: number; name: string }[];
  matches: {
    id: number;
    stage: string;
    homeTeam: string;
    awayTeam: string;
    kickoffAt: string;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
    homePenalties: number | null;
    awayPenalties: number | null;
  }[];
  predictions: {
    userId: number;
    matchId: number;
    homePred: number | null;
    awayPred: number | null;
    outcome: string | null;
    pointsAwarded: number | null;
    isJoker: boolean;
  }[];
  outrightQuestions: { id: number; type: string; label: string; points: number; settledAnswer: string | null; isSettled: boolean }[];
  outrightPredictions: { userId: number; questionId: number; answer: string; pointsAwarded: number | null }[];
  leaderboard: { userId: number; name: string; points: number; rank: number }[];
}

export const TEAMS_NL: Record<string, string> = {
  Algeria: 'Algerije', Argentina: 'Argentinië', Australia: 'Australië', Austria: 'Oostenrijk',
  Belgium: 'België', 'Bosnia-Herzegovina': 'Bosnië-Herzegovina', Brazil: 'Brazilië', Canada: 'Canada',
  'Cape Verde Islands': 'Kaapverdië', Colombia: 'Colombia', 'Congo DR': 'Congo', Croatia: 'Kroatië',
  Curaçao: 'Curaçao', Czechia: 'Tsjechië', Ecuador: 'Ecuador', Egypt: 'Egypte', England: 'Engeland',
  France: 'Frankrijk', Germany: 'Duitsland', Ghana: 'Ghana', Haiti: 'Haïti', Iran: 'Iran', Iraq: 'Irak',
  'Ivory Coast': 'Ivoorkust', Japan: 'Japan', Jordan: 'Jordanië', Mexico: 'Mexico', Morocco: 'Marokko',
  Netherlands: 'Nederland', 'New Zealand': 'Nieuw-Zeeland', Norway: 'Noorwegen', Panama: 'Panama',
  Paraguay: 'Paraguay', Portugal: 'Portugal', Qatar: 'Qatar', 'Saudi Arabia': 'Saoedi-Arabië',
  Scotland: 'Schotland', Senegal: 'Senegal', 'South Africa': 'Zuid-Afrika', 'South Korea': 'Zuid-Korea',
  Spain: 'Spanje', Sweden: 'Zweden', Switzerland: 'Zwitserland', Tunisia: 'Tunesië', Turkey: 'Turkije',
  'United States': 'de Verenigde Staten', Uruguay: 'Uruguay', Uzbekistan: 'Oezbekistan',
};

/** De Nederlandse naam van een land zoals de poule het schrijft; onbekend blijft zoals het is. */
export function teamNaam(engels: string): string {
  return TEAMS_NL[engels] ?? engels;
}

const hoofdletter = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const normaliseer = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

type Wedstrijd = PouleExport['matches'][number];
const wedstrijdTekst = (m: Wedstrijd) =>
  `${hoofdletter(teamNaam(m.homeTeam))}–${teamNaam(m.awayTeam)} (${m.homeScore}-${m.awayScore})`;

/** Alles wat de vragen nodig hebben, één keer uitgerekend. */
export function analyseerPoule(data: PouleExport) {
  const naam = new Map(data.users.map((u) => [u.id, u.name]));
  const wedstrijd = new Map(data.matches.map((m) => [m.id, m]));
  const gespeeld = data.matches.filter((m) => m.status === 'finished');
  const stand = [...data.leaderboard].sort((a, b) => a.rank - b.rank || b.points - a.points);
  const finale = data.matches.find((m) => m.stage === 'final' && m.status === 'finished');
  const kampioen = finale
    ? (finale.homeScore ?? 0) > (finale.awayScore ?? 0) || (finale.homePenalties ?? 0) > (finale.awayPenalties ?? 0)
      ? finale.homeTeam
      : finale.awayTeam
    : null;
  const punten = (p: { pointsAwarded: number | null }) => p.pointsAwarded ?? 0;
  const perWedstrijd = new Map<number, PouleExport['predictions']>();
  for (const p of data.predictions) {
    const lijst = perWedstrijd.get(p.matchId) ?? [];
    lijst.push(p);
    perWedstrijd.set(p.matchId, lijst);
  }
  const exact = new Map<string, number>();
  for (const p of data.predictions) {
    const m = wedstrijd.get(p.matchId);
    if (!m || m.status !== 'finished' || p.homePred === null || p.awayPred === null) continue;
    if (p.homePred === m.homeScore && p.awayPred === m.awayScore) {
      const n = naam.get(p.userId) ?? '?';
      exact.set(n, (exact.get(n) ?? 0) + 1);
    }
  }
  return { data, naam, wedstrijd, gespeeld, stand, kampioen, punten, perWedstrijd, exact };
}

export type PouleAnalyse = ReturnType<typeof analyseerPoule>;

let bewaard: PouleAnalyse | null = null;
export function pouleAnalyse(): PouleAnalyse {
  bewaard ??= analyseerPoule(snapshot as unknown as PouleExport);
  return bewaard;
}

/** 'Daarna Bastiaan met 203, Cas met 187, ...' */
const daarna = (lijst: { name: string; points: number }[]) =>
  lijst.length ? `Daarna ${opsomming(lijst.map((r) => `${r.name} met ${r.points}`))}.` : undefined;

export const POULE_OPLOSSERS: Record<string, (p: PouleAnalyse) => LevendAntwoord> = {
  'poule.winnaar': ({ stand }) => {
    const top = stand.filter((r) => r.rank === stand[0]?.rank);
    const v = 'Wie won uiteindelijk de poule, en met hoeveel punten?';
    if (!top.length) return { v, a: 'Nog geen stand' };
    return {
      v,
      a: `${opsomming(top.map((r) => r.name))} — ${top[0].points} punten`,
      toelichting: daarna(stand.slice(top.length)),
    };
  },

  'poule.onderaan': ({ stand }) => {
    const laatste = stand[stand.length - 1];
    const v = 'Wie eindigde er onderaan?';
    if (!laatste) return { v, a: 'Nog geen stand' };
    const onder = stand.filter((r) => r.rank === laatste.rank);
    const voorlaatste = stand[stand.length - onder.length - 1];
    return {
      v,
      a: `${opsomming(onder.map((r) => r.name))} — ${laatste.points} punten`,
      toelichting: voorlaatste ? `Nog ${voorlaatste.points - laatste.points} punten achter ${voorlaatste.name}.` : undefined,
    };
  },

  // De vraag draait zich om als bijna iedereen het goed had: dan is de
  // uitzondering het leukere antwoord.
  'poule.kampioen': ({ data, naam, kampioen }) => {
    const vraag = data.outrightQuestions.find((q) => q.type === 'winner');
    const land = kampioen ?? vraag?.settledAnswer ?? null;
    if (!vraag || !land) return { v: 'Wie had de wereldkampioen vooraf goed?', a: 'Nog niet bekend' };
    const keuzes = data.outrightPredictions.filter((p) => p.questionId === vraag.id);
    const goed = keuzes.filter((p) => normaliseer(p.answer) === normaliseer(land)).map((p) => naam.get(p.userId) ?? '?');
    const fout = keuzes.filter((p) => normaliseer(p.answer) !== normaliseer(land));
    const nl = teamNaam(land);
    if (goed.length > fout.length && fout.length > 0) {
      const wie = fout.map((p) => naam.get(p.userId) ?? '?');
      return {
        v: fout.length === 1
          ? `Iedereen op één na had ${nl} vooraf als wereldkampioen aangewezen. Wie niet?`
          : `${hoofdletter(telwoord(goed.length))} van ons hadden ${nl} vooraf als wereldkampioen. Wie niet?`,
        a: opsomming(fout.map((p) => `${naam.get(p.userId)} (${teamNaam(p.answer)})`)),
        toelichting: `${opsomming(wie)} liet${wie.length > 1 ? 'en' : ''} ${vraag.points} punten liggen.`,
      };
    }
    return { v: `Wie had ${nl} vooraf als wereldkampioen aangewezen?`, a: opsomming(goed) };
  },

  'poule.enigeGoed': ({ data, naam }) => {
    const v = 'Bij welke vooraf-vraag was één van ons de enige met het goede antwoord?';
    const enigen = data.outrightQuestions
      .filter((q) => q.isSettled && q.points > 0)
      .map((q) => ({ q, goed: data.outrightPredictions.filter((p) => p.questionId === q.id && (p.pointsAwarded ?? 0) > 0) }))
      .filter((x) => x.goed.length === 1)
      .sort((a, b) => b.q.points - a.q.points);
    if (!enigen.length) return { v, a: 'Bij geen enkele: er zat altijd iemand anders naast' };
    const tekst = ({ q, goed }: (typeof enigen)[number]) =>
      `${q.label} — ${naam.get(goed[0].userId)} (${teamNaam(goed[0].answer)})`;
    return {
      v,
      a: tekst(enigen[0]),
      toelichting: enigen.length > 1 ? `Ook goed: ${opsomming(enigen.slice(1).map(tekst))}.` : undefined,
    };
  },

  'poule.jokerBest': ({ data, naam, wedstrijd, punten }) => {
    const jokers = data.predictions.filter((p) => p.isJoker);
    const max = Math.max(0, ...jokers.map(punten));
    if (!jokers.length || max === 0) return { v: 'Wie haalde de meeste punten uit een joker?', a: 'Niemand: geen joker leverde iets op' };
    const top = jokers.filter((p) => punten(p) === max);
    return {
      v: 'Wie haalde de meeste punten uit een joker, en op welke wedstrijd?',
      a: opsomming(top.map((p) => `${naam.get(p.userId)} op ${wedstrijdTekst(wedstrijd.get(p.matchId)!)}`)),
      toelichting: `${max} punten${top.length > 1 ? ' elk' : ''}: ${
        top.every((p) => {
          const m = wedstrijd.get(p.matchId)!;
          return p.homePred === m.homeScore && p.awayPred === m.awayScore;
        })
          ? 'de uitslag precies goed, en dubbel door de joker'
          : 'dubbel door de joker'
      }.`,
    };
  },

  'poule.jokerVerspild': ({ data, naam, wedstrijd, punten }) => {
    const nul = data.predictions.filter((p) => p.isJoker && punten(p) === 0 && wedstrijd.get(p.matchId)?.status === 'finished');
    if (!nul.length) return { v: 'Wie verspilde een joker aan een wedstrijd die niets opleverde?', a: 'Niemand: elke joker leverde iets op' };
    // Per wedstrijd, zodat twee mensen op dezelfde misser samen in één zin staan.
    const perWedstrijd = new Map<number, string[]>();
    for (const p of nul) perWedstrijd.set(p.matchId, [...(perWedstrijd.get(p.matchId) ?? []), naam.get(p.userId) ?? '?']);
    const delen = [...perWedstrijd].map(([id, wie]) => `${opsomming(wie)} op ${wedstrijdTekst(wedstrijd.get(id)!)}`);
    return {
      v: nul.length === 1
        ? 'Wie verspilde een joker aan een wedstrijd die niets opleverde?'
        : `${hoofdletter(telwoord(nul.length))} van ons verspilden een joker aan een wedstrijd die niets opleverde. Wie?`,
      a: opsomming(delen),
    };
  },

  // Met achttien wedstrijden waar niemand iets aan verdiende, vragen we naar
  // de enige die echt pijn doet: een van de latere wereldkampioen.
  'poule.niemandGoed': ({ gespeeld, perWedstrijd, punten, kampioen }) => {
    const niemand = gespeeld.filter((m) => {
      const ps = perWedstrijd.get(m.id) ?? [];
      return ps.length > 0 && ps.every((p) => punten(p) === 0);
    });
    const vanKampioen = kampioen ? niemand.filter((m) => m.homeTeam === kampioen || m.awayTeam === kampioen) : [];
    const totaal = `In totaal leverden ${telwoord(niemand.length)} wedstrijden niemand van ons iets op.`;
    if (vanKampioen.length) {
      return {
        v: `Welke wedstrijd van de latere wereldkampioen ${teamNaam(kampioen!)} voorspelde niemand van ons goed?`,
        a: opsomming(vanKampioen.map(wedstrijdTekst)),
        toelichting: totaal,
      };
    }
    const v = 'Welke wedstrijd voorspelde niemand van ons goed?';
    if (!niemand.length) return { v, a: 'Geen enkele: bij elke wedstrijd had iemand het goed' };
    // Anders de laatste (de spannendste ronde).
    const laatste = niemand[niemand.length - 1];
    return { v, a: wedstrijdTekst(laatste), toelichting: niemand.length > 1 ? totaal : undefined };
  },

  'poule.exact': ({ exact }) => {
    const v = 'Wie had de meeste uitslagen precies goed?';
    const lijst = [...exact].sort((a, b) => b[1] - a[1]);
    if (!lijst.length) return { v, a: 'Niemand had er één precies goed' };
    const top = lijst.filter(([, n]) => n === lijst[0][1]);
    const rest = lijst.slice(top.length);
    return {
      v,
      a: `${opsomming(top.map(([n]) => n))} — ${telwoord(top[0][1])} keer`,
      toelichting: rest.length ? `Daarna ${opsomming(rest.map(([n, k]) => `${n} met ${k}`))}.` : undefined,
    };
  },
};

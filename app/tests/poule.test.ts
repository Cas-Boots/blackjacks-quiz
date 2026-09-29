import { describe, it, expect } from 'vitest';
import snapshot from '../src/lib/content/poule-snapshot.json';
import { analyseerPoule, POULE_OPLOSSERS, TEAMS_NL, type PouleExport } from '../src/lib/server/recap/poule';
import { PAKKETTEN } from '../src/lib/content/packs';

const echt = analyseerPoule(snapshot as unknown as PouleExport);

/** Een verzonnen poule van drie, om de randgevallen te raken. */
function klein(overschrijf: Partial<PouleExport> = {}): PouleExport {
  return {
    exportSchemaVersion: 1,
    exportedAt: '2026-07-20T00:00:00.000Z',
    users: [{ id: 1, name: 'An' }, { id: 2, name: 'Bo' }, { id: 3, name: 'Cy' }],
    matches: [
      { id: 1, stage: 'group', homeTeam: 'Spain', awayTeam: 'Qatar', kickoffAt: '2026-06-12T18:00:00Z', status: 'finished', homeScore: 0, awayScore: 0, homePenalties: null, awayPenalties: null },
      { id: 2, stage: 'final', homeTeam: 'Spain', awayTeam: 'Brazil', kickoffAt: '2026-07-19T19:00:00Z', status: 'finished', homeScore: 1, awayScore: 1, homePenalties: 3, awayPenalties: 5 },
    ],
    predictions: [
      { userId: 1, matchId: 1, homePred: 2, awayPred: 0, outcome: null, pointsAwarded: 0, isJoker: false },
      { userId: 2, matchId: 1, homePred: 1, awayPred: 0, outcome: null, pointsAwarded: 0, isJoker: false },
      { userId: 1, matchId: 2, homePred: 1, awayPred: 1, outcome: null, pointsAwarded: 12, isJoker: true },
      { userId: 2, matchId: 2, homePred: 2, awayPred: 0, outcome: null, pointsAwarded: 0, isJoker: true },
      { userId: 3, matchId: 2, homePred: 1, awayPred: 1, outcome: null, pointsAwarded: 6, isJoker: false },
    ],
    outrightQuestions: [{ id: 1, type: 'winner', label: 'WK Winnaar', points: 20, settledAnswer: 'Brazil', isSettled: true }],
    outrightPredictions: [
      { userId: 1, questionId: 1, answer: 'Brazil', pointsAwarded: 20 },
      { userId: 2, questionId: 1, answer: 'Spain', pointsAwarded: 0 },
      { userId: 3, questionId: 1, answer: 'Spain', pointsAwarded: 0 },
    ],
    leaderboard: [
      { userId: 1, name: 'An', points: 32, rank: 1 },
      { userId: 3, name: 'Cy', points: 6, rank: 2 },
      { userId: 2, name: 'Bo', points: 0, rank: 3 },
    ],
    ...overschrijf,
  };
}
const los = (sleutel: string, data = klein()) => POULE_OPLOSSERS[sleutel](analyseerPoule(data));

describe('de WK-poule uit de echte export', () => {
  const ronde = Object.values(PAKKETTEN).flatMap((p) => p.rondes).find((r) => r.naam === 'De WK-poule')!;

  it('staat in het pakket, helemaal gevuld', () => {
    expect(ronde).toBeDefined();
    expect(ronde.vragen.every((v) => v.live?.startsWith('poule.') && !v.teVullen)).toBe(true);
  });

  // De losse HTML-quiz kan niet rekenen; zijn vaste tekst moet dus gelijk zijn
  // aan wat de server uit dezelfde momentopname haalt.
  it('heeft dezelfde vaste tekst als de server uitrekent', () => {
    for (const vraag of ronde.vragen) {
      const uit = POULE_OPLOSSERS[vraag.live!](echt);
      expect({ sleutel: vraag.live, v: vraag.v, a: vraag.a, t: vraag.toelichting })
        .toEqual({ sleutel: vraag.live, v: uit.v, a: uit.a, t: uit.toelichting });
    }
  });

  it('klopt met de eindstand van de poule zelf', () => {
    const totaal = new Map<number, number>();
    for (const p of [...echt.data.predictions, ...echt.data.outrightPredictions]) {
      totaal.set(p.userId, (totaal.get(p.userId) ?? 0) + (p.pointsAwarded ?? 0));
    }
    for (const r of echt.data.leaderboard) expect(totaal.get(r.userId), r.name).toBe(r.points);
  });

  it('kent alle landen van het toernooi in het Nederlands', () => {
    const teams = new Set(echt.data.matches.flatMap((m) => [m.homeTeam, m.awayTeam]));
    for (const t of teams) expect(TEAMS_NL, t).toHaveProperty([t]);
  });
});

describe('randgevallen', () => {
  it('vraagt naar wie het goed had als de meesten het mis hadden', () => {
    const u = los('poule.kampioen');
    expect(u.v).toBe('Wie had Brazilië vooraf als wereldkampioen aangewezen?');
    expect(u.a).toBe('An');
  });

  it('noemt een gedeelde eerste plaats samen', () => {
    const data = klein({ leaderboard: [
      { userId: 1, name: 'An', points: 10, rank: 1 },
      { userId: 2, name: 'Bo', points: 10, rank: 1 },
      { userId: 3, name: 'Cy', points: 4, rank: 3 },
    ] });
    expect(los('poule.winnaar', data).a).toBe('An en Bo — 10 punten');
  });

  it('ziet de kampioen ook na strafschoppen', () => {
    // Brazilië won de finale na strafschoppen; de 0-0 van Spanje is dan niet 'van de kampioen'.
    const u = los('poule.niemandGoed');
    expect(u.v).toBe('Welke wedstrijd voorspelde niemand van ons goed?');
    expect(u.a).toBe('Spanje–Qatar (0-0)');
  });

  it('zegt alleen "precies goed" als de joker-uitslag ook precies klopte', () => {
    expect(los('poule.jokerBest').toelichting).toBe('12 punten: de uitslag precies goed, en dubbel door de joker.');
    const data = klein();
    data.predictions[2] = { ...data.predictions[2], homePred: 0, awayPred: 0 };
    expect(los('poule.jokerBest', data).toelichting).toBe('12 punten: dubbel door de joker.');
  });

  it('noemt één verspilde joker met de gewone vraag', () => {
    const u = los('poule.jokerVerspild');
    expect(u.v).toBe('Wie verspilde een joker aan een wedstrijd die niets opleverde?');
    expect(u.a).toBe('Bo op Spanje–Brazilië (1-1)');
  });

  it('breekt niet op een lege export', () => {
    const leeg = klein({ matches: [], predictions: [], outrightQuestions: [], outrightPredictions: [], leaderboard: [] });
    for (const sleutel of Object.keys(POULE_OPLOSSERS)) expect(los(sleutel, leeg).a, sleutel).toBeTruthy();
  });
});

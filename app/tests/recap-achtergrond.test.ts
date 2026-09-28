import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import snapshot from '../src/lib/content/recap-snapshot.json';

/**
 * Het bijna live houden van de cijfers: wanneer de achtergrond ververst, en
 * vooral wanneer niet — een antwoord mag nooit halverwege een ronde
 * verschuiven.
 */
process.env.DATABASE_PATH = ':memory:';
process.env.NODE_ENV = 'test';

type Spel = typeof import('../src/lib/server/spel');
type Achtergrond = typeof import('../src/lib/server/recap/achtergrond');
let spel: Spel;
let achtergrond: Achtergrond;
let bron: typeof import('../src/lib/server/recap/bron');

beforeAll(async () => {
  const { zorgVoorMigraties } = await import('../src/lib/server/db/migrate');
  const { zorgVoorBasis } = await import('../src/lib/server/seed');
  zorgVoorMigraties();
  zorgVoorBasis();
  spel = await import('../src/lib/server/spel');
  achtergrond = await import('../src/lib/server/recap/achtergrond');
  bron = await import('../src/lib/server/recap/bron');
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.RECAP_URL;
  delete process.env.RECAP_TOKEN;
  delete process.env.RECAP_INTERVAL;
});

/** Een pakket met een ronde die de cijfers gebruikt en een die dat niet doet. */
function rondeIndexen(s: { pakket: string; samenstelling: string }) {
  const rondes = spel.samengesteld(s);
  const recap = rondes.findIndex((r) => r.cijfers === 'sport');
  const gewoon = rondes.findIndex((r) => !r.cijfers && !r.vragen.some((v) => v.live));
  return { recap, gewoon };
}

describe('cijfersLiggenVast', () => {
  it('houdt de cijfers vast tijdens een recap-ronde en het jaaroverzicht, en nergens anders', () => {
    const s = spel.actiefSpel()!;
    const { recap, gewoon } = rondeIndexen(s);
    expect(recap).toBeGreaterThanOrEqual(0);
    expect(gewoon).toBeGreaterThanOrEqual(0);
    for (const fase of ['ronde', 'vraag', 'antwoord', 'cijfers']) {
      expect(spel.cijfersLiggenVast({ ...s, fase, rondeIndex: recap })).toBe(true);
      expect(spel.cijfersLiggenVast({ ...s, fase, rondeIndex: gewoon })).toBe(false);
    }
    expect(spel.cijfersLiggenVast({ ...s, fase: 'jaaroverzicht', rondeIndex: gewoon })).toBe(true);
    expect(spel.cijfersLiggenVast({ ...s, fase: 'lobby', rondeIndex: recap })).toBe(false);
    expect(spel.cijfersLiggenVast({ ...s, fase: 'stand', rondeIndex: recap })).toBe(false);
  });
});

describe('recapInterval', () => {
  it('staat standaard op een minuut, is uit te zetten en gaat niet onder 15 seconden', () => {
    expect(achtergrond.recapInterval()).toBe(60);
    process.env.RECAP_INTERVAL = '0';
    expect(achtergrond.recapInterval()).toBe(0);
    process.env.RECAP_INTERVAL = '5';
    expect(achtergrond.recapInterval()).toBe(15);
    process.env.RECAP_INTERVAL = '120';
    expect(achtergrond.recapInterval()).toBe(120);
    process.env.RECAP_INTERVAL = 'vaak';
    expect(achtergrond.recapInterval()).toBe(0);
  });
});

describe('beurt', () => {
  function liveBron(exportedAt: string) {
    process.env.RECAP_URL = 'https://recap.test/';
    process.env.RECAP_TOKEN = 'x'.repeat(32);
    const fetch = vi.fn(async () => new Response(JSON.stringify({ ...snapshot, exportedAt })));
    vi.stubGlobal('fetch', fetch);
    return fetch;
  }

  it('doet niets zonder live bron', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    expect(await achtergrond.beurt({ mag: () => true, veranderd: () => {} })).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('slaat een beurt over als de cijfers vast liggen', async () => {
    const fetch = liveBron('2026-09-28T10:00:00.000Z');
    const veranderd = vi.fn();
    expect(await achtergrond.beurt({ mag: () => false, veranderd })).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
    expect(veranderd).not.toHaveBeenCalled();
  });

  it('haalt op en meldt het alleen als de export nieuw is', async () => {
    const fetch = liveBron('2026-09-28T11:00:00.000Z');
    const veranderd = vi.fn();
    expect(await achtergrond.beurt({ mag: () => true, veranderd })).toBe(true);
    expect(fetch).toHaveBeenCalledWith('https://recap.test/api/export', expect.anything());
    expect(veranderd).toHaveBeenCalledTimes(1);
    expect(bron.recapStatus().bron).toBe('live');

    expect(await achtergrond.beurt({ mag: () => true, veranderd })).toBe(false);
    expect(veranderd).toHaveBeenCalledTimes(1);
  });

  it('houdt de vorige cijfers als de bron onbereikbaar is', async () => {
    process.env.RECAP_URL = 'https://recap.test';
    process.env.RECAP_TOKEN = 'x'.repeat(32);
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nee', { status: 404 })));
    const voor = bron.recapStatus().exportedAt;
    expect(await achtergrond.beurt({ mag: () => true, veranderd: () => {} })).toBe(false);
    const na = bron.recapStatus();
    expect(na.exportedAt).toBe(voor);
    expect(na.fout).toMatch(/404/);
  });
});

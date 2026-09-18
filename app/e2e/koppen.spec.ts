import { test, expect, type Page } from '@playwright/test';

/**
 * De veiligheidskoppen mogen de schermen niet breken.
 *
 * Een Content-Security-Policy die één script of één afbeelding tegenhoudt,
 * merk je pas op de avond zelf. Daarom opent dit de drie schermen in een
 * echte browser en let het op wat de browser tegenhoudt.
 */

async function metConsole(pagina: Page, pad: string) {
  const geblokkeerd: string[] = [];
  pagina.on('console', (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) geblokkeerd.push(m.text());
  });
  const antwoord = await pagina.goto(pad);
  return { antwoord, geblokkeerd };
}

test('de veiligheidskoppen staan op elke pagina', async ({ page }) => {
  const { antwoord } = await metConsole(page, '/tv');
  const koppen = antwoord!.headers();
  expect(koppen['content-security-policy']).toContain("script-src 'self' 'nonce-");
  expect(koppen['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(koppen['x-content-type-options']).toBe('nosniff');
  expect(koppen['x-frame-options']).toBe('DENY');
  expect(koppen['referrer-policy']).toBe('same-origin');
});

test('de stand wordt nooit onderweg bewaard', async ({ request }) => {
  const r = await request.get('/api/state');
  expect(r.headers()['cache-control']).toBe('no-store');
});

test('een opdracht van een andere site wordt geweigerd', async ({ request }) => {
  const r = await request.post('/api/join', {
    data: { rol: 'tv' },
    headers: { 'sec-fetch-site': 'cross-site' },
  });
  expect(r.status()).toBe(403);
});

for (const pad of ['/', '/tv', '/play', '/host']) {
  test(`de browser houdt niets tegen op ${pad}`, async ({ page }) => {
    const { geblokkeerd } = await metConsole(page, pad);
    await expect(page.locator('body')).toBeVisible();
    // Even de tijd geven om de stroom te openen en de QR-code te laden.
    await page.waitForTimeout(1500);
    expect(geblokkeerd).toEqual([]);
  });
}

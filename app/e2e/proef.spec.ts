import { test, expect } from '@playwright/test';

/**
 * De proefrit: een eigen spel met bots, naast elkaar op /proef, dat de echte
 * avond nergens raakt.
 */

test('zonder pincode geen proefrit, ook niet via de API', async ({ page, request }) => {
  await page.goto('/proef');
  await expect(page.getByRole('button', { name: 'Naar de proefrit' })).toBeVisible();
  expect((await request.post('/api/proef', { data: { actie: 'start' } })).status()).toBe(403);
  // Een verzonnen proefrit bestaat niet, en valt niet terug op de echte avond.
  expect((await request.get('/api/state?proef=verzonnen')).status()).toBe(410);
});

test('een proefrit met bots en een telefoon, zonder de echte avond te raken', async ({ page, request }) => {
  await page.goto('/playtest');
  await page.getByPlaceholder('Pincode').fill('2627');
  await page.getByRole('button', { name: 'Naar de proefrit' }).click();
  await expect(page.getByRole('button', { name: 'Begin de proefrit' })).toBeVisible();
  // Na het aanmelden (dat is een echte aanmelding als quizmaster, en telt als wijziging).
  const echtVoor = (await (await request.get('/api/state')).json()).staat;
  await page.getByPlaceholder('bijvoorbeeld Tom').fill('Tom');
  await page.getByRole('button', { name: 'Begin de proefrit' }).click();

  // De vaste spelers en de plus-één, allemaal bot. Hoeveel vaste spelers er
  // zijn hangt af van wat eerdere proeven in de gedeelde database achterlieten
  // (het beheer voegt er een toe), dus tellen we ze in plaats van vijf vast te zetten.
  const beheer = await (await page.request.get('/api/beheer')).json();
  const vast = (beheer.spelers as { naam: string; isGast: boolean; isQuizmaster: boolean }[])
    .filter((s) => !s.isGast && !s.isQuizmaster);
  const tafel = page.locator('.tafel li');
  await expect(tafel).toHaveCount(vast.length + (vast.some((s) => s.naam === 'Tom') ? 0 : 1), { timeout: 15_000 });
  await expect(tafel.filter({ hasText: 'Tom' })).toContainText('bot');

  // De televisie in zijn kader, met het etiket en een QR-code naar de proefrit.
  const tv = page.frameLocator('iframe[title="Televisie van de proefrit"]');
  await expect(tv.getByText('Proefrit', { exact: true })).toBeVisible({ timeout: 15_000 });

  // Telefoon 1 kiest Liz; dan is Liz geen bot meer.
  const telefoon = page.frameLocator('iframe[title="Telefoon 1"]');
  await telefoon.getByRole('button', { name: /Liz/ }).click({ timeout: 15_000 });
  await expect(tafel.filter({ hasText: 'Liz' })).toContainText('telefoon', { timeout: 10_000 });

  // Rechtstreeks naar de eerste vraag: de telefoon kan antwoorden, de bots ook.
  await page.locator('.sprong button', { hasText: '1. De WK' }).click();
  await telefoon.getByRole('button', { name: 'Waar', exact: true }).click({ timeout: 15_000 });
  const host = page.frameLocator('iframe[title="Hostscherm van de proefrit"]');
  await expect(host.getByRole('button', { name: 'Toon het antwoord' })).toBeVisible({ timeout: 15_000 });

  // Naar de tussenstand van de voorspellingen: alles ervoor is gespeeld, Tom zit die ronde uit.
  await page.locator('.sprong button', { hasText: 'De voorspellingen' }).click();
  await expect(tv.getByText('voorspelde in januari niet mee', { exact: false })).toBeVisible({ timeout: 15_000 });

  // De echte avond merkte niets: zelfde spel, zelfde versie, geen Tom.
  const echtNa = (await (await request.get('/api/state')).json()).staat;
  expect(echtNa.spelId).toBe(echtVoor.spelId);
  expect(echtNa.versie).toBe(echtVoor.versie);
  expect(echtNa.spelers.map((s: { naam: string }) => s.naam)).not.toContain('Tom');

  // Stoppen: de proefrit is weg.
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Stop de proefrit' }).click();
  await expect(page.getByRole('button', { name: 'Begin de proefrit' })).toBeVisible();
});

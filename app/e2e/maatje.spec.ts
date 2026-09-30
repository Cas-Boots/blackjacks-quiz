import { test, expect, type BrowserContext, type Page } from '@playwright/test';

/**
 * Je maatje kiezen en iets laten doen. Niemand heeft vanzelf een maatje, en
 * twee spelers nooit hetzelfde. Je tikt op je telefoon, en het doet het op je
 * telefoon én op de televisie, op je naambordje in de lobby.
 */

async function nieuwApparaat(browser: BrowserContext['browser'], pad: string): Promise<{ ctx: BrowserContext; pagina: Page }> {
  const ctx = await browser!.newContext();
  const pagina = await ctx.newPage();
  await pagina.goto(pad);
  return { ctx, pagina };
}

test('een speler laat zijn maatje dansen, en de televisie ziet het', async ({ browser }) => {
  const host = await nieuwApparaat(browser, '/');
  await host.pagina.getByPlaceholder('Pincode').fill('2627');
  await host.pagina.getByRole('button', { name: 'Hostscherm' }).click();
  await expect(host.pagina.getByText('Quizmaster', { exact: false })).toBeVisible({ timeout: 15_000 });
  await host.pagina.request.post('/api/host', { data: { opdracht: 'nieuw-spel', pakket: 'jaar2026' } });

  const tv = await nieuwApparaat(browser, '/tv');
  await expect(tv.pagina.getByRole('heading', { name: 'Blackjack Quiz 26/27' })).toBeVisible();

  const telefoon = await nieuwApparaat(browser, '/');
  await telefoon.pagina.getByRole('button', { name: /Liz/ }).click();
  await expect(telefoon.pagina).toHaveURL(/\/play/, { timeout: 15_000 });

  // Niemand heeft vanzelf een maatje: Liz kiest er zelf een.
  const bordje = tv.pagina.locator('.naamplaat', { hasText: 'Liz' });
  await expect(bordje).toBeVisible({ timeout: 15_000 });
  await expect(telefoon.pagina.getByText('Je hebt nog geen maatje.')).toBeVisible();
  await expect(telefoon.pagina.locator('.dierenkiezer [aria-checked="true"]')).toHaveCount(0);
  await expect(bordje.locator('.plaatmaatje')).toHaveCount(0);
  await telefoon.pagina.getByRole('radio', { name: /Octopus/ }).click();
  await expect(bordje.locator('.plaatmaatje')).toBeAttached({ timeout: 5_000 });

  // Liz laat haar maatje dansen: op haar telefoon danst het meteen...
  await telefoon.pagina.getByRole('button', { name: 'Laat je maatje dansen' }).click();
  await expect(telefoon.pagina.locator('.telefoonwei .actie[data-lijf="dans"]')).toBeVisible();
  // ...en op de televisie danst het maatje op haar naambordje.
  await expect(bordje.locator('.plaatmaatje[data-bezig] .actie[data-lijf="dans"]')).toBeAttached({ timeout: 5_000 });

  // Alleen een speler stuurt zijn maatje aan, en alleen met een opdracht die bestaat.
  expect((await tv.pagina.request.post('/api/maatje', { data: { opdracht: 'dans' } })).status()).toBe(403);
  expect((await telefoon.pagina.request.post('/api/maatje', { data: { opdracht: 'vlieg' } })).status()).toBe(400);

  // Een tweede speler kan de octopus niet meer kiezen: hij is bezet.
  const tweede = await nieuwApparaat(browser, '/');
  await tweede.pagina.getByRole('button', { name: /Bastiaan/ }).click();
  await expect(tweede.pagina).toHaveURL(/\/play/, { timeout: 15_000 });
  await expect(tweede.pagina.getByRole('radio', { name: /Octopus.*al gekozen door Liz/ })).toBeDisabled({ timeout: 5_000 });
  expect((await tweede.pagina.request.post('/api/dier', { data: { dier: 'octopus' } })).status()).toBe(409);

  for (const a of [host, tv, telefoon, tweede]) await a.ctx.close();
});

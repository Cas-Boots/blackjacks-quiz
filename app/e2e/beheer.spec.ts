import { test, expect, type Browser } from '@playwright/test';

/**
 * Het beheerscherm: zonder pincode alleen een slot, met pincode de spelers,
 * de spellen en de apparaten — en de knoppen doen wat ze zeggen.
 */

async function beheerder(browser: Browser) {
  const ctx = await browser.newContext();
  const pagina = await ctx.newPage();
  await pagina.goto('/beheer');
  await pagina.getByPlaceholder('Pincode').fill('2627');
  await pagina.getByRole('button', { name: 'Naar het beheer' }).click();
  await expect(pagina.getByRole('heading', { name: 'Blackjack Quiz 26/27' })).toBeVisible({ timeout: 15_000 });
  return { ctx, pagina };
}

test('zonder pincode blijft het beheer dicht, ook de API', async ({ page, request }) => {
  await page.goto('/beheer');
  await expect(page.getByRole('heading', { name: 'Alleen voor de quizmaster' })).toBeVisible();
  await expect(page.getByText('Spelers', { exact: true })).toHaveCount(0);

  expect((await request.get('/api/beheer')).status()).toBe(403);
  expect((await request.get('/api/beheer/export')).status()).toBe(403);
  expect((await request.post('/api/beheer', { data: { opdracht: 'speler-toevoegen', naam: 'Indringer' } })).status()).toBe(403);
});

test('een verkeerde pincode wordt geweigerd', async ({ page }) => {
  await page.goto('/beheer');
  await page.getByPlaceholder('Pincode').fill('0000');
  await page.getByRole('button', { name: 'Naar het beheer' }).click();
  await expect(page.getByText('Die pincode klopt niet.')).toBeVisible();
});

test('spelers toevoegen, hernoemen, gast maken en weghalen', async ({ browser }) => {
  const { pagina } = await beheerder(browser);
  // Een vers spel in de lobby, zodat een nieuwe vaste speler meteen aanschuift.
  expect((await pagina.request.post('/api/host', { data: { opdracht: 'nieuw-spel', pakket: 'jaar2026' } })).ok()).toBeTruthy();
  await pagina.getByRole('button', { name: 'Ververs' }).click();

  // Toevoegen: een vaste speler die meteen aanschuift.
  await pagina.getByLabel('Naam van de nieuwe speler').fill('Proefpersoon');
  await pagina.getByRole('button', { name: '+ Speler' }).click();
  const rij = pagina.locator('.beheer-rij', { hasText: 'Proefpersoon' });
  await expect(rij).toBeVisible();
  await expect(rij.getByText('doet nu mee')).toBeVisible();

  // Hernoemen. Zodra het naamveld open staat, staat de naam alleen nog in
  // het veld en niet meer als tekst in de rij; daarom zoeken we het veld op de pagina.
  await rij.getByRole('button', { name: 'Hernoem' }).click();
  await pagina.getByLabel('Nieuwe naam').fill('Proefkonijn');
  await pagina.getByRole('button', { name: 'Bewaar' }).click();
  const hernoemd = pagina.locator('.beheer-rij', { hasText: 'Proefkonijn' });
  await expect(hernoemd).toBeVisible();
  await expect(pagina.locator('.beheer-rij', { hasText: 'Proefpersoon' })).toHaveCount(0);

  // Een bezette naam wordt geweigerd.
  await hernoemd.getByRole('button', { name: 'Hernoem' }).click();
  await pagina.getByLabel('Nieuwe naam').fill('Liz');
  await pagina.getByRole('button', { name: 'Bewaar' }).click();
  await expect(pagina.getByText('Die naam is er al.')).toBeVisible();
  await pagina.getByRole('button', { name: 'Annuleer' }).click();
  await expect(hernoemd).toBeVisible();

  // Hij deed mee aan een avond, dus hij kan niet weg — wel gast worden.
  await expect(hernoemd.getByRole('button', { name: 'Verwijder' })).toHaveCount(0);
  await hernoemd.getByRole('button', { name: 'Maak gast' }).click();
  await expect(hernoemd.getByText('gast', { exact: true })).toBeVisible();
  await hernoemd.getByRole('button', { name: 'Maak vast' }).click();
  await expect(hernoemd.getByText('gast', { exact: true })).toHaveCount(0);

  // Opruimen: als gast telt hij niet mee bij de volgende tests (de proefrit
  // neemt alleen de vaste spelers over).
  await hernoemd.getByRole('button', { name: 'Maak gast' }).click();
  await expect(hernoemd.getByText('gast', { exact: true })).toBeVisible();
});

test('een proefrit weggooien laat de schermen niet zonder spel', async ({ browser }) => {
  const { pagina } = await beheerder(browser);
  // Een extra spel via het hostscherm, zodat er iets weg kan.
  const r = await pagina.request.post('/api/host', { data: { opdracht: 'nieuw-spel', pakket: 'familie' } });
  expect(r.ok()).toBeTruthy();
  await pagina.getByRole('button', { name: 'Ververs' }).click();

  const actief = pagina.locator('.beheer-rij.beheer-actief');
  await expect(actief).toHaveCount(1);
  await expect(actief.getByText('Familie', { exact: false })).toBeVisible();

  pagina.once('dialog', (d) => d.accept());
  await actief.getByRole('button', { name: 'Verwijder' }).click();
  await expect(pagina.getByText(/Spel #\d+ is weg\./)).toBeVisible();
  // Er is weer precies één actief spel, en het is niet de familieversie.
  await expect(pagina.locator('.beheer-rij.beheer-actief')).toHaveCount(1);
  const staat = await (await pagina.request.get('/api/state')).json();
  expect(staat.staat).not.toBeNull();
});

test('de back-up is een JSON met de spelers erin en zonder apparaten', async ({ browser }) => {
  const { pagina } = await beheerder(browser);
  const r = await pagina.request.get('/api/beheer/export');
  expect(r.ok()).toBeTruthy();
  expect(r.headers()['content-disposition']).toContain('attachment');
  const uit = await r.json();
  expect(uit.spelers.some((s: { naam: string }) => s.naam === 'Liz')).toBeTruthy();
  expect(uit.apparaten).toBeUndefined();
});

test('een telefoon loskoppelen zet hem terug naar de naamkeuze', async ({ browser }) => {
  const { pagina } = await beheerder(browser);

  // Een gast met een eigen naam, zodat de rij in de lijst met apparaten uniek is.
  const telefoon = await browser.newContext();
  const t = await telefoon.newPage();
  await t.goto('/');
  await t.getByLabel('Je naam').fill('Losse Telefoon');
  await t.getByRole('button', { name: 'Schuif aan' }).click();
  await expect(t).toHaveURL(/\/play/, { timeout: 15_000 });

  await pagina.getByRole('button', { name: 'Ververs' }).click();
  const rij = pagina.locator('.uitslagtabel tr', { hasText: 'Losse Telefoon' });
  await expect(rij).toBeVisible();
  await rij.getByRole('button', { name: 'Koppel los' }).click();
  await expect(pagina.getByText('Apparaat losgekoppeld', { exact: false })).toBeVisible();

  // De telefoon is weer gast: de stand kent geen speler meer voor dit koekje.
  const staat = await (await t.request.get('/api/state')).json();
  expect(staat.rol).toBe('gast');
  expect(staat.spelerId).toBeNull();
});

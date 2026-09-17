import { test, expect, type BrowserContext, type Page } from '@playwright/test';

/**
 * Een avond in het klein: de televisie, de quizmaster en drie telefoons.
 *
 * Elke rol krijgt een eigen browsercontext, dus een eigen koekjespot — net als
 * losse apparaten. Zo test dit ook echt de live-verbinding en niet één pagina
 * die met zichzelf praat.
 */

async function nieuwApparaat(browser: BrowserContext['browser'], pad: string): Promise<{ ctx: BrowserContext; pagina: Page }> {
  const ctx = await browser!.newContext();
  const pagina = await ctx.newPage();
  await pagina.goto(pad);
  return { ctx, pagina };
}

test('een ronde spelen met televisie, quizmaster en drie telefoons', async ({ browser }) => {
  const tv = await nieuwApparaat(browser, '/tv');
  const host = await nieuwApparaat(browser, '/');
  await expect(tv.pagina.getByRole('heading', { name: 'Blackjack Quiz 26/27' })).toBeVisible();
  // De televisie toont een QR-code met het adres waarop de telefoons kunnen meedoen.
  await expect(tv.pagina.getByAltText('QR-code om mee te doen')).toBeVisible({ timeout: 15_000 });

  // De quizmaster meldt zich met de pincode.
  await host.pagina.getByPlaceholder('Pincode').fill('2627');
  await host.pagina.getByRole('button', { name: 'Hostscherm' }).click();
  await expect(host.pagina.getByText('Quizmaster', { exact: false })).toBeVisible({ timeout: 15_000 });

  // Drie telefoons kiezen een naam.
  const namen = ['Liz', 'Bastiaan', 'Joris'];
  const telefoons: { ctx: BrowserContext; pagina: Page; naam: string }[] = [];
  for (const naam of namen) {
    const t = await nieuwApparaat(browser, '/');
    await t.pagina.getByRole('button', { name: new RegExp(naam) }).click();
    await expect(t.pagina).toHaveURL(/\/play/, { timeout: 15_000 });
    telefoons.push({ ...t, naam });
  }

  // De televisie ziet de telefoons binnenkomen.
  for (const naam of namen) {
    await expect(tv.pagina.getByText(naam, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
  }

  // De quizmaster start de eerste ronde.
  await host.pagina.getByRole('button', { name: 'Start de ronde' }).click();

  // De vraag verschijnt op de televisie én op elke telefoon — dat is de kern
  // van de live-verbinding.
  await expect(tv.pagina.locator('.vraagtekst')).toBeVisible({ timeout: 15_000 });
  const vraagOpTv = (await tv.pagina.locator('.vraagtekst').first().textContent())?.trim();
  expect(vraagOpTv && vraagOpTv.length > 0).toBeTruthy();

  for (const t of telefoons) {
    await expect(t.pagina.locator('.vraagtekst')).toContainText(vraagOpTv!, { timeout: 15_000 });
  }

  // Ronde 1 is waar/niet waar: twee knoppen, geen typewerk.
  await telefoons[0].pagina.getByRole('button', { name: 'Waar', exact: true }).click();
  await telefoons[1].pagina.getByRole('button', { name: 'Niet waar', exact: true }).click();
  await expect(telefoons[0].pagina.getByText(/Verstuurd|genoteerd/)).toBeVisible({ timeout: 10_000 });

  // De quizmaster ziet het aantal inzendingen oplopen.
  await expect(host.pagina.getByText(/Ingeleverd — [12] van/)).toBeVisible({ timeout: 15_000 });

  // Onthullen, en de antwoorden verschijnen op het hostscherm.
  await host.pagina.getByRole('button', { name: 'Toon het antwoord' }).click();
  await expect(tv.pagina.getByText('Het antwoord')).toBeVisible({ timeout: 15_000 });
  await expect(host.pagina.getByText('Tik aan wie het goed had', { exact: false })).toBeVisible({ timeout: 15_000 });

  // Bij de onthulling ziet iedereen wat er was ingetikt: de televisie toont
  // de antwoorden als kaartjes, de telefoon zegt dat er nog beoordeeld wordt.
  await expect(tv.pagina.locator('.antwoordkaart')).toHaveCount(2, { timeout: 15_000 });
  await expect(telefoons[0].pagina.locator('.uitslag')).toBeVisible({ timeout: 15_000 });

  // Punten toekennen aan de eerste inzender en controleren dat de stand meebeweegt.
  const eersteInzender = host.pagina.locator('.inzending').first();
  await eersteInzender.click();
  await expect(host.pagina.locator('.standpunten').first()).not.toHaveText('0', { timeout: 15_000 });

  // De eerste inzender was de eerste telefoon: die hoort nu 'Goed!' te zien,
  // met de punten erbij, en de televisie zet een vinkje op dat kaartje.
  await expect(telefoons[0].pagina.locator('.uitslag[data-uitslag="goed"]')).toContainText('Goed', { timeout: 15_000 });
  await expect(tv.pagina.locator('.antwoordkaart.goed')).toHaveCount(1, { timeout: 15_000 });

  for (const t of telefoons) await t.ctx.close();
  await host.ctx.close();
  await tv.ctx.close();
});

test('een telefoon die later binnenkomt krijgt de lopende vraag te zien', async ({ browser }) => {
  // Dit is het geval waar het op de avond zelf misgaat: iemand ververst, of
  // komt later aan tafel. Het scherm moet dan meteen goed staan.
  const host = await nieuwApparaat(browser, '/');
  await host.pagina.getByPlaceholder('Pincode').fill('2627');
  await host.pagina.getByRole('button', { name: 'Hostscherm' }).click();
  await expect(host.pagina.getByRole('button', { name: /Start de ronde|Toon het antwoord|Volgende vraag/ })).toBeVisible({ timeout: 15_000 });

  const laat = await nieuwApparaat(browser, '/');
  await laat.pagina.getByRole('button', { name: /Eva/ }).click();
  await expect(laat.pagina).toHaveURL(/\/play/, { timeout: 15_000 });

  // De telefoon hoort de lopende stand op te pikken zonder dat er iets gebeurt.
  await expect(laat.pagina.locator('.tafelkaart, .paneel, .onthulling').first()).toBeVisible({ timeout: 15_000 });

  await laat.ctx.close();
  await host.ctx.close();
});

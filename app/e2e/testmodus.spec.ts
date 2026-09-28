import { test, expect, type Page } from '@playwright/test';

/**
 * De testmodus van de televisie: `/tv?test`.
 *
 * Elke dia moet zonder fout op het scherm komen, de knoppen moeten doen wat
 * ze zeggen, en de televisie mag ondertussen niets naar de server sturen —
 * anders zou een proefrondje het spel dat klaarstaat kunnen raken.
 */

/**
 * Wat er buiten het scherm van de televisie valt.
 *
 * Aan de televisie zit geen scrollbalk: wat onder de onderrand ligt, bestaat
 * niet voor de kamer. Alleen de buitenste laag wordt gemeld, anders staat bij
 * een dia die niet past meteen de halve boom in de lijst.
 */
async function buitenBeeld(page: Page) {
  return page.evaluate(() => {
    const hoog = window.innerHeight;
    const uit: Element[] = [];
    for (const el of document.querySelectorAll('.romp *')) {
      const vak = el.getBoundingClientRect();
      if (!vak.height && !vak.width) continue;
      if (vak.bottom > hoog + 1 || vak.top < -1) {
        if (!uit.some((eerder) => eerder.contains(el))) uit.push(el);
      }
    }
    return uit.map((el) => {
      const klasse = typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : '';
      return el.tagName.toLowerCase() + (klasse ? `.${klasse}` : '');
    });
  });
}

test('de testmodus loopt alle dia’s door zonder spel en zonder de server te raken', async ({ page }) => {
  const fouten: string[] = [];
  const schrijfacties: string[] = [];
  page.on('pageerror', (e) => fouten.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') fouten.push(m.text());
  });
  page.on('request', (r) => {
    if (r.method() !== 'GET') schrijfacties.push(`${r.method()} ${new URL(r.url()).pathname}`);
  });

  await page.goto('/tv?test');
  await expect(page.getByText('Testmodus', { exact: false }).first()).toBeVisible();
  // De eerste dia is de lobby, met de QR-code zoals op de avond zelf.
  await expect(page.getByRole('heading', { name: 'Blackjack Quiz 26/27' })).toBeVisible();
  await expect(page.getByAltText('QR-code om mee te doen')).toBeVisible({ timeout: 15_000 });

  // Een telefoon komt binnen: de naamplaat gaat aan en er komt een begroeting.
  await expect(page.locator('.naamplaat.aan')).toHaveCount(2);
  await page.getByRole('button', { name: 'Telefoon komt binnen' }).click();
  await expect(page.locator('.naamplaat.aan')).toHaveCount(3);
  await expect(page.locator('.begroeting')).toContainText('Joris');

  // Alle dia's langs, via de lijst in het paneel.
  const dias = page.locator('.testpaneel .dia');
  const aantal = await dias.count();
  expect(aantal).toBeGreaterThan(25);
  for (let i = 0; i < aantal; i++) {
    await dias.nth(i).click();
    await expect(dias.nth(i)).toHaveClass(/nu/);
    // De knip tussen twee dia's met dezelfde fase duurt een tiende seconde.
    await page.waitForTimeout(150);
    await expect(page.locator('.scherm')).toBeVisible();
    // En de hele dia hoort op het scherm te staan: een lange vraag of een
    // podium vol prijzen krimpt mee, maar valt er niet vanaf.
    expect(await buitenBeeld(page), `dia ${i + 1} van ${aantal} valt buiten het scherm`).toEqual([]);
  }

  // Een paar dia's op inhoud.
  const ga = async (id: string) => {
    await page.goto(`/tv?test=${id}`);
    await page.waitForTimeout(200);
  };

  await ga('vraag-waar');
  await expect(page.locator('.vraagtekst')).toContainText('finale van het WK');
  await expect(page.locator('.inleverrij .vak.binnen')).toHaveCount(0);
  await page.getByRole('button', { name: 'Iemand levert in' }).click();
  await expect(page.locator('.inleverrij .vak.binnen')).toHaveCount(1);
  await page.getByRole('button', { name: 'Tijd is om' }).click();
  await expect(page.locator('.stempel')).toContainText('Tijd');

  await ga('antwoord-beoordelen');
  await expect(page.getByText('Het antwoord')).toBeVisible();
  await expect(page.locator('.antwoordkaart')).toHaveCount(6);
  await expect(page.locator('.antwoordkaart.goed')).toHaveCount(0);
  await page.getByRole('button', { name: 'Beoordeel de volgende' }).click();
  await expect(page.locator('.antwoordkaart.goed')).toHaveCount(1);

  await ga('antwoord-dichtstbij');
  await expect(page.locator('.getallenlijn .gok')).toHaveCount(5);
  await expect(page.locator('.getallenlijn .gok.wint')).toHaveCount(1);

  await ga('antwoord-iedereen-fout');
  await expect(page.locator('.stempel')).toContainText('Iedereen fout');

  await ga('cijfers-sport');
  await expect(page.locator('.cijfers .balkrij')).toHaveCount(6);
  await page.getByRole('button', { name: /Stap verder/ }).click();
  await expect(page.locator('.cijfers .hokjes')).toBeVisible();

  await ga('stand');
  await expect(page.locator('.romp').getByRole('heading', { name: 'Tussenstand' })).toBeVisible();
  await expect(page.locator('.standrij')).toHaveCount(6);
  await expect(page.locator('.badge.stijger')).toBeVisible({ timeout: 5_000 });

  await ga('einde');
  await expect(page.locator('.podium .trede')).toHaveCount(3);
  await expect(page.locator('.romp').getByRole('heading', { name: /wint/ })).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.prijs')).toHaveCount(7);

  // De twee randgevallen waar het om begonnen was, nu met alle tijd voor de
  // opkomst van het podium en met de inleverrij erbij.
  await ga('vraag-lang');
  await expect(page.locator('.keuze')).toHaveCount(4);
  await expect(page.locator('.inleverrij')).toBeVisible();
  expect(await buitenBeeld(page), 'een veel te lange vraag hoort op het scherm te passen').toEqual([]);

  await ga('einde');
  await page.waitForTimeout(4000);
  await expect(page.locator('.prijs')).toHaveCount(7);
  expect(await buitenBeeld(page), 'het podium met zeven prijzen hoort op het scherm te passen').toEqual([]);

  // Pauze en middernacht: het aftellen, de laatste seconden in het groot, en het nieuwe jaar.
  await ga('pauze');
  await expect(page.locator('.pauzelaag').getByRole('heading', { name: 'Even pauze' })).toBeVisible();
  await ga('middernacht-nadert');
  await expect(page.locator('.middernacht-melding')).toContainText('tot middernacht');
  await ga('nieuwjaar-aftellen');
  await expect(page.locator('.aftel')).toBeVisible();
  await page.getByRole('button', { name: 'Nog 12 seconden tot middernacht' }).click();
  await expect(page.locator('.slotcijfer')).toBeVisible({ timeout: 5_000 });
  await expect(page.locator('.pauzelaag').getByRole('heading', { name: 'Gelukkig nieuwjaar' })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.jaartal')).toHaveText('2027');

  await ga('vraag-video-ontbreekt');
  await expect(page.locator('.media-ontbreekt')).toContainText('ontbreekt', { timeout: 10_000 });

  // De pijltjestoetsen lopen door de lijst; T klapt het paneel dicht.
  await ga('lobby');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.testpaneel .dia.nu')).toContainText('Iedereen is erbij');
  // De URL onthoudt de dia, zodat herladen op dezelfde plek uitkomt.
  await expect(page).toHaveURL(/test=lobby-vol/);
  await page.keyboard.press('t');
  await expect(page.locator('.testpaneel')).toHaveCount(0);
  await expect(page.getByText('Testmodus', { exact: false }).first()).toBeVisible();

  expect(schrijfacties, 'de testmodus mag niets naar de server sturen').toEqual([]);
  // Bestanden die niet laden horen erbij: het ontbrekende filmpje is precies
  // wat die dia laat zien, en zonder internet vallen de lettertypen terug op
  // het systeem. Fouten in de code zelf tellen wél.
  expect(fouten.filter((f) => !/^Failed to load resource/.test(f))).toEqual([]);
});

test('zonder ?test meldt de televisie zich gewoon aan', async ({ page }) => {
  const schrijfacties: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'POST') schrijfacties.push(new URL(r.url()).pathname);
  });
  await page.goto('/tv');
  // Het spel dat andere proeven achterlieten kan in elke fase staan; hier
  // telt alleen dat dit het echte scherm is, zonder paneel en zonder etiket.
  await expect(page.locator('.scherm')).toBeVisible();
  await expect.poll(() => schrijfacties, { timeout: 15_000 }).toContain('/api/join');
  await expect(page.locator('.testpaneel')).toHaveCount(0);
  await expect(page.locator('.testetiket')).toHaveCount(0);
});

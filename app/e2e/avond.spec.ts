import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';

/**
 * De rest van de avond: dichtstbij, een teamronde, een beeldvraag, de
 * stemronde met een gast, een por, ongedaan maken, het podium met de
 * prijzen, de uitslagpagina en een telefoon zonder live stroom.
 *
 * Elke proef begint met een nieuw spel en een eigen samenstelling, zodat de
 * proeven elkaar niet in de weg zitten en de rondenummers vastliggen.
 */

type Apparaat = { ctx: BrowserContext; pagina: Page };

async function nieuwApparaat(browser: Browser, pad: string, opties: Parameters<Browser['newContext']>[0] = {}): Promise<Apparaat> {
  const ctx = await browser.newContext(opties);
  const pagina = await ctx.newPage();
  await pagina.goto(pad);
  return { ctx, pagina };
}

/** De quizmaster: aangemeld met de pincode, met een korte weg naar de opdrachten. */
async function quizmaster(browser: Browser) {
  const host = await nieuwApparaat(browser, '/');
  await host.pagina.getByPlaceholder('Pincode').fill('2627');
  await host.pagina.getByRole('button', { name: 'Hostscherm' }).click();
  await expect(host.pagina).toHaveURL(/\/host/, { timeout: 15_000 });
  const doe = async (opdracht: string, extra: Record<string, unknown> = {}) => {
    const r = await host.pagina.request.post('/api/host', { data: { opdracht, ...extra } });
    expect(r.ok(), `${opdracht}: ${r.status()} ${await r.text()}`).toBeTruthy();
    return r.json();
  };
  const staat = async () => (await (await host.pagina.request.get('/api/state')).json()).staat;
  return { ...host, doe, staat };
}

/**
 * Een nieuw spel met alleen de opgegeven rondes en vragen (pakketindex →
 * vraagindexen). Een ronde die je niet noemt doet niet mee: de server neemt
 * voor een ontbrekende sleutel de standaard, dus die krijgt hier een lege lijst.
 */
async function nieuwSpel(qm: Awaited<ReturnType<typeof quizmaster>>, keuze: Record<string, number[]>) {
  await qm.doe('nieuw-spel', { pakket: 'jaar2026' });
  const rondes = (await (await qm.pagina.request.get('/api/host/rondes')).json()).rondes as { pakketIndex: number }[];
  const samenstelling: Record<string, number[]> = {};
  for (const r of rondes) samenstelling[String(r.pakketIndex)] = keuze[String(r.pakketIndex)] ?? [];
  await qm.doe('zet-samenstelling', { samenstelling });
}

async function telefoon(browser: Browser, naam: string): Promise<Apparaat & { naam: string }> {
  const t = await nieuwApparaat(browser, '/');
  // De naam van de knop is "Li Liz": de initialen op het portret tellen mee.
  await t.pagina.getByRole('button', { name: new RegExp(`${naam}$`) }).click();
  await expect(t.pagina).toHaveURL(/\/play/, { timeout: 15_000 });
  return { ...t, naam };
}

test('dichtstbij: de machine rekent bij de onthulling uit wie er het dichtst zat', async ({ browser }) => {
  const qm = await quizmaster(browser);
  await nieuwSpel(qm, { '2': [0] }); // Dichtstbij Wint, eerste vraag: 361 autobranden
  const tv = await nieuwApparaat(browser, '/tv');

  await qm.doe('naar-ronde', { ronde: 0 });
  // Twee telefoons uit verschillende teams, zodat er twee gissingen zijn.
  const st = await qm.staat();
  const naamVan = (id: number) => st.spelers.find((s: { id: number }) => s.id === id).naam;
  const a = await telefoon(browser, naamVan(st.teams[0].leden[0]));
  const b = await telefoon(browser, naamVan(st.teams[1].leden[0]));

  await qm.doe('start-ronde');
  await expect(a.pagina.getByPlaceholder('Jullie getal')).toBeVisible({ timeout: 15_000 });
  await a.pagina.getByPlaceholder('Jullie getal').fill('361');
  await a.pagina.getByRole('button', { name: 'Versturen' }).click();
  await b.pagina.getByPlaceholder('Jullie getal').fill('100');
  await b.pagina.getByRole('button', { name: 'Versturen' }).click();
  await expect(qm.pagina.getByText(/Ingeleverd — 2 van/)).toBeVisible({ timeout: 15_000 });

  await qm.pagina.getByRole('button', { name: 'Toon het antwoord' }).click();

  // Zonder een extra knop: precies goed is 3 + 2 punten, voor het hele team.
  await expect(tv.pagina.locator('.getallenlijn')).toBeVisible({ timeout: 15_000 });
  await expect(tv.pagina.locator('.getallenlijn .gok.wint')).toHaveCount(1);
  await expect(a.pagina.locator('.uitslag[data-uitslag="goed"]')).toContainText('+5', { timeout: 15_000 });
  await expect(b.pagina.locator('.uitslag[data-uitslag="fout"]')).toBeVisible({ timeout: 15_000 });
  await expect(qm.pagina.getByRole('button', { name: 'Opnieuw berekenen' })).toBeVisible();

  for (const x of [a, b, tv, qm]) await x.ctx.close();
});

test('pauze: de quiz staat stil, iedereen ziet het, en hij gaat verder waar hij was', async ({ browser }) => {
  const qm = await quizmaster(browser);
  await nieuwSpel(qm, { '2': [0, 1] });
  const tv = await nieuwApparaat(browser, '/tv');
  await qm.doe('naar-ronde', { ronde: 0 });
  const st = await qm.staat();
  const a = await telefoon(browser, st.spelers.find((s: { id: number }) => s.id === st.teams[0].leden[0]).naam);

  await qm.doe('start-ronde');
  await expect(a.pagina.getByPlaceholder('Jullie getal')).toBeVisible({ timeout: 15_000 });
  // Half getikt, nog niet verstuurd: dat moet de pauze overleven.
  await a.pagina.getByPlaceholder('Jullie getal').fill('300');

  await qm.pagina.getByRole('button', { name: '☕ Pauze' }).click();
  await expect(tv.pagina.getByRole('heading', { name: 'Even pauze' })).toBeVisible({ timeout: 15_000 });
  await expect(a.pagina.getByRole('heading', { name: 'Even pauze' })).toBeVisible({ timeout: 15_000 });
  const gepauzeerd = await qm.staat();
  expect(gepauzeerd.pauze).toBe('pauze');
  expect(gepauzeerd.klok.loopt).toBe(false);
  expect(gepauzeerd.fase).toBe('vraag');

  // Inleveren en doorklikken wachten tot na de pauze.
  const inleveren = await a.pagina.request.post('/api/answer', { data: { tekst: '300' } });
  expect(inleveren.status()).toBe(409);
  const verder = await qm.pagina.request.post('/api/host', { data: { opdracht: 'toon-antwoord' } });
  expect(verder.status()).toBe(409);
  // Punten bijstellen mag wel.
  await qm.doe('corrigeer', { spelerId: st.spelers[0].id, punten: 1 });

  // Omschakelen naar het aftellen, en weer verder.
  await qm.pagina.getByRole('button', { name: '🎆 Toon het aftellen' }).click();
  await expect(tv.pagina.locator('.aftel')).toBeVisible({ timeout: 15_000 });
  await qm.pagina.getByRole('button', { name: '▶ Hervat de quiz' }).click();

  await expect(tv.pagina.locator('.pauzelaag')).toHaveCount(0, { timeout: 15_000 });
  await expect(a.pagina.locator('.pauzelaag')).toHaveCount(0, { timeout: 15_000 });
  const hervat = await qm.staat();
  expect(hervat.pauze).toBeNull();
  expect(hervat.klok.loopt).toBe(true);
  expect(hervat.fase).toBe('vraag');
  expect(hervat.vraag.index).toBe(0);
  // Het half getikte antwoord staat er nog, en kan nu weg.
  await expect(a.pagina.getByPlaceholder('Jullie getal')).toHaveValue('300');
  await a.pagina.getByRole('button', { name: 'Versturen' }).click();
  await expect(qm.pagina.getByText(/Ingeleverd — 1 van/)).toBeVisible({ timeout: 15_000 });

  for (const x of [a, tv, qm]) await x.ctx.close();
});

test('teamronde: één telefoon levert in voor het hele team', async ({ browser }) => {
  const qm = await quizmaster(browser);
  await nieuwSpel(qm, { '1': [0] }); // Sport: de Marges, in teams
  await qm.doe('naar-ronde', { ronde: 0 });
  const st = await qm.staat();
  const team = st.teams.find((t: { leden: number[] }) => t.leden.length >= 2);
  const naamVan = (id: number) => st.spelers.find((s: { id: number }) => s.id === id).naam;
  const a = await telefoon(browser, naamVan(team.leden[0]));
  const b = await telefoon(browser, naamVan(team.leden[1]));

  await qm.doe('start-ronde');
  await expect(a.pagina.getByText(`Team ${team.suit} ${team.naam}`)).toBeVisible({ timeout: 15_000 });
  await expect(b.pagina.getByText(`Team ${team.suit} ${team.naam}`)).toBeVisible({ timeout: 15_000 });

  await a.pagina.getByPlaceholder('Jullie antwoord').fill('Ferran Torres');
  await a.pagina.getByRole('button', { name: 'Versturen' }).click();
  // De teamgenoot ziet dat het team al heeft ingeleverd en kan het aanpassen.
  await expect(b.pagina.getByText('Je antwoord staat genoteerd.')).toBeVisible({ timeout: 15_000 });
  await expect(b.pagina.getByRole('button', { name: 'Antwoord aanpassen' })).toBeVisible();

  await qm.pagina.getByRole('button', { name: 'Toon het antwoord' }).click();
  // Het voorstel van de machine: dit antwoord lijkt goed. Eén klik neemt het over.
  await qm.pagina.getByRole('button', { name: /Vink de 1 aan/ }).click();
  await expect(a.pagina.locator('.uitslag[data-uitslag="goed"]')).toContainText('voor het hele team', { timeout: 15_000 });
  await expect(b.pagina.locator('.uitslag[data-uitslag="goed"]')).toBeVisible({ timeout: 15_000 });

  for (const x of [a, b, qm]) await x.ctx.close();
});

test('beeldvraag: de ingebouwde afbeelding staat op de televisie en op de telefoon', async ({ browser }) => {
  const qm = await quizmaster(browser);
  await nieuwSpel(qm, { '9': [0] }); // Jullie Jaar in Beeld, de vraag met de ingebouwde afbeelding
  const tv = await nieuwApparaat(browser, '/tv');
  const t = await telefoon(browser, 'Eva');

  await qm.doe('naar-ronde', { ronde: 0 });
  await qm.doe('start-ronde');
  const opTv = tv.pagina.locator('.tafelkaart .media-beeld img');
  await expect(opTv).toBeVisible({ timeout: 15_000 });
  await expect(opTv).toHaveAttribute('src', /^data:image\/svg\+xml/);
  await expect(t.pagina.locator('.tafelkaart .media-beeld img')).toBeVisible({ timeout: 15_000 });
  await expect(qm.pagina.getByText('Fragment: beeld')).toBeVisible();

  for (const x of [t, tv, qm]) await x.ctx.close();
});

test('stemronde met een gast, een por, ongedaan maken en het podium', async ({ browser }) => {
  const qm = await quizmaster(browser);
  await nieuwSpel(qm, { '13': [0, 1] }); // Wie van de Blackjacks?
  const tv = await nieuwApparaat(browser, '/tv');

  // Een gast die niet in de lijst staat schuift aan via het aanmeldscherm.
  const gast = await nieuwApparaat(browser, '/');
  await gast.pagina.getByPlaceholder('Je naam').fill('Tom');
  await gast.pagina.getByRole('button', { name: 'Schuif aan' }).click();
  await expect(gast.pagina).toHaveURL(/\/play/, { timeout: 15_000 });
  await expect(tv.pagina.getByText('Tom', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(qm.pagina.getByText('Tom schuift aan').first()).toBeVisible({ timeout: 15_000 });

  const liz = await telefoon(browser, 'Liz');
  const rik = await telefoon(browser, 'Rik');

  await qm.doe('naar-ronde', { ronde: 0 });
  await qm.doe('start-ronde');

  // Iedereen is een stemknop, ook de gast.
  await expect(liz.pagina.locator('.stemknop')).toHaveCount(6, { timeout: 15_000 });
  await liz.pagina.locator('.stemknop', { hasText: 'Rik' }).click();
  await rik.pagina.locator('.stemknop', { hasText: 'Rik' }).click();
  await gast.pagina.locator('.stemknop', { hasText: 'Liz' }).click();
  await expect(qm.pagina.getByText(/Ingeleverd — 3 van/)).toBeVisible({ timeout: 15_000 });

  // Een por: alleen wie nog niets inleverde krijgt hem. Liz niet, Eva wel.
  const eva = await telefoon(browser, 'Eva');
  // Een por is vluchtig: pas porren als Eva's stroom open staat.
  await expect(eva.pagina.getByText('verbonden', { exact: true })).toBeVisible({ timeout: 15_000 });
  await qm.pagina.getByRole('button', { name: /Por de achterblijvers/ }).click();
  await expect(eva.pagina.locator('.por')).toBeVisible({ timeout: 15_000 });
  await expect(liz.pagina.locator('.por')).toHaveCount(0);

  await qm.pagina.getByRole('button', { name: 'Toon het antwoord' }).click();

  // De meerderheid koos Rik; de televisie toont de telling, Liz en Rik krijgen de punten.
  await expect(tv.pagina.locator('.stemrij')).toHaveCount(2, { timeout: 15_000 });
  await expect(tv.pagina.locator('.stemrij.wint .naam')).toHaveText('Rik');
  await expect(tv.pagina.locator('.antwoordtekst')).toHaveText('Rik');
  await expect(liz.pagina.locator('.uitslag[data-uitslag="goed"]')).toContainText('+3', { timeout: 15_000 });
  await expect(gast.pagina.locator('.uitslag[data-uitslag="fout"]')).toBeVisible({ timeout: 15_000 });

  // Ongedaan: terug naar de open vraag, en de punten zijn weer weg.
  await qm.pagina.getByRole('button', { name: /Ongedaan: Antwoord getoond/ }).click();
  await expect(tv.pagina.locator('.stemrij')).toHaveCount(0, { timeout: 15_000 });
  await expect(liz.pagina.locator('.stemknop').first()).toBeVisible({ timeout: 15_000 });
  await expect(qm.pagina.getByText('Teruggedraaid: Antwoord getoond').first()).toBeVisible({ timeout: 15_000 });
  await expect(qm.pagina.locator('.standpunten').first()).toHaveText('0');

  // Opnieuw onthullen, naar de uitslag: podium, prijzen, uitslagpagina.
  await qm.pagina.getByRole('button', { name: 'Toon het antwoord' }).click();
  await expect(qm.pagina.locator('.standpunten').first()).toHaveText('3', { timeout: 15_000 });
  await qm.doe('naar-einde');
  await expect(tv.pagina.locator('.podium .trede')).toHaveCount(3, { timeout: 15_000 });
  await expect(tv.pagina.locator('.prijs').first()).toBeVisible({ timeout: 15_000 });
  await expect(tv.pagina.getByText(/\/uitslag\/\d+/)).toBeVisible({ timeout: 15_000 });

  const link = liz.pagina.getByRole('link', { name: 'Bekijk en deel de uitslag' });
  await expect(link).toBeVisible({ timeout: 15_000 });
  await link.click();
  await expect(liz.pagina).toHaveURL(/\/uitslag\/\d+/);
  await expect(liz.pagina.getByRole('heading', { name: 'De uitslag' })).toBeVisible();
  await expect(liz.pagina.getByText('Eindstand')).toBeVisible();
  await expect(liz.pagina.getByText('Moeilijkste vraag')).toBeVisible();
  await expect(liz.pagina.getByRole('button', { name: 'Deel de uitslag' })).toBeVisible();

  // En de lijst met alle avonden kent deze avond.
  await liz.pagina.goto('/uitslag');
  await expect(liz.pagina.locator('a.uitslagrij').first()).toBeVisible();

  for (const x of [eva, gast, liz, rik, tv, qm]) await x.ctx.close();
});

test('zonder live stroom valt een telefoon terug op navragen en blijft meedoen', async ({ browser }) => {
  const qm = await quizmaster(browser);
  await nieuwSpel(qm, { '0': [0] });
  const t = await nieuwApparaat(browser, '/');
  // Een proxy die de stroom blokkeert: het verzoek komt nooit aan.
  await t.ctx.route('**/api/stream', (route) => route.abort('connectionrefused'));
  await t.pagina.getByRole('button', { name: /Joris$/ }).click();
  await expect(t.pagina).toHaveURL(/\/play/, { timeout: 15_000 });
  await expect(t.pagina.getByText('verbonden (navragen)')).toBeVisible({ timeout: 20_000 });

  await qm.doe('naar-ronde', { ronde: 0 });
  await qm.doe('start-ronde');
  await expect(t.pagina.locator('.vraagtekst')).toBeVisible({ timeout: 15_000 });
  await t.pagina.getByRole('button', { name: 'Waar', exact: true }).click();
  await expect(qm.pagina.getByText(/Ingeleverd — 1 van/)).toBeVisible({ timeout: 15_000 });

  for (const x of [t, qm]) await x.ctx.close();
});

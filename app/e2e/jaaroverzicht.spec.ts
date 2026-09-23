import { test, expect, type Browser } from '@playwright/test';
import { JAAROVERZICHT } from '../src/lib/content/jaaroverzicht';

/**
 * Het jaaroverzicht: de film waarmee de avond opent.
 *
 * Waar het hier om gaat is de belofte van de film: je ziet het hele jaar
 * langskomen zonder dat er één antwoord van vanavond uitlekt. Daarom kijkt
 * deze proef niet alleen of de dia's op het scherm komen, maar ook of het
 * woord onder een balk écht nergens in de pagina staat, of onze eigen
 * taarten, landen en koplopers dicht zitten, of regels die pas in de
 * herhaling horen wegblijven — en of het er na de uitslag allemaal wél staat.
 */

async function quizmaster(browser: Browser) {
  const ctx = await browser.newContext();
  const pagina = await ctx.newPage();
  await pagina.goto('/');
  await pagina.getByPlaceholder('Pincode').fill('2627');
  await pagina.getByRole('button', { name: 'Hostscherm' }).click();
  await expect(pagina).toHaveURL(/\/host/, { timeout: 15_000 });
  const doe = async (opdracht: string, extra: Record<string, unknown> = {}) => {
    const r = await pagina.request.post('/api/host', { data: { opdracht, ...extra } });
    expect(r.ok(), `${opdracht}: ${r.status()} ${await r.text()}`).toBeTruthy();
    return r.json();
  };
  const staat = async () => (await (await pagina.request.get('/api/state')).json()).staat;
  return { ctx, pagina, doe, staat };
}

test('de film draait het jaar af zonder één antwoord te verklappen', async ({ browser }) => {
  const qm = await quizmaster(browser);
  await qm.doe('nieuw-spel', { pakket: 'jaar2026' });

  const tvCtx = await browser.newContext();
  const tv = await tvCtx.newPage();
  await tv.goto('/tv');

  await qm.doe('jaaroverzicht', { stap: 0 });
  await expect(tv.getByRole('heading', { name: '2026' })).toBeVisible({ timeout: 15_000 });

  const eerste = await qm.staat();
  expect(eerste.fase).toBe('jaaroverzicht');
  expect(eerste.jaaroverzicht.soort).toBe('titel');
  // De film loopt op de klok van de server, zodat elk scherm gelijk loopt.
  expect(eerste.klok.loopt).toBe(true);

  const stappen: number = eerste.jaaroverzicht.stappen;
  expect(stappen).toBeGreaterThan(4);

  // Wat er per maand onder een balk zit, rechtstreeks uit de tijdlijn: dan
  // groeit deze proef vanzelf mee met wat er bijgeschreven wordt.
  const verborgenIn = (maand: number | null) => {
    const m = JAAROVERZICHT.maanden.find((x) => x.nr === maand);
    if (!m) return [];
    const tekst = m.momenten.map((x) => `${x.tekst} ${x.bij ?? ''}`).join(' ');
    return [...tekst.matchAll(/\[\[(.+?)\]\]/g)].map((x) => x[1]);
  };
  // En de open tekst van regels die pas na de uitslag in beeld horen.
  const pasLaterIn = (maand: number | null) =>
    (JAAROVERZICHT.maanden.find((x) => x.nr === maand)?.momenten ?? [])
      .filter((x) => x.pasNaAfloop)
      .flatMap((x) => x.tekst.split(/\[\[.+?\]\]/))
      .map((stuk) => stuk.trim())
      .filter((stuk) => stuk.length >= 10);

  for (let stap = 0; stap < stappen; stap++) {
    const uit = await qm.doe('jaaroverzicht', { stap });
    expect(uit.ok).toBe(true);
    const st = await qm.staat();
    expect(st.jaaroverzicht.stap).toBe(stap);
    expect(st.jaaroverzicht.onthuld).toBe(false);

    // Het pakketje naar de clients draagt het woord niet, en ook niet hoe lang het is.
    const pakketje = JSON.stringify(st.jaaroverzicht);
    for (const woord of verborgenIn(st.jaaroverzicht.maand)) {
      expect(pakketje, `dia ${stap} lekt "${woord}"`).not.toContain(woord);
    }
    expect(pakketje).not.toContain('lengte');
    for (const stuk of pasLaterIn(st.jaaroverzicht.maand)) {
      expect(pakketje, `dia ${stap} laat al zien: "${stuk}"`).not.toContain(stuk);
    }

    // Onze eigen cijfers: wat de recap-rondes vragen, zit er nog niet in.
    const eigen = st.jaaroverzicht.eigen;
    if (eigen) {
      expect(eigen.taart).toBeNull();
      expect(eigen.landen).toEqual([]);
      expect(eigen.perPersoon).toEqual([]);
      expect(eigen.totaal).toBeNull();
      if (eigen.koploper) expect(eigen.koploper.naam).toBeNull();
    }
    if (st.jaaroverzicht.soort === 'slot') expect(st.jaaroverzicht.jaartotaal).toBeNull();

    // En op de televisie zelf staat het ook niet: de balken zijn leeg.
    if (st.jaaroverzicht.maand !== null) {
      await expect(tv.locator('.film')).toBeVisible({ timeout: 10_000 });
      await tv.waitForTimeout(150);
      const opScherm = await tv.locator('.romp').innerText();
      for (const woord of verborgenIn(st.jaaroverzicht.maand)) {
        expect(opScherm, `de televisie toont "${woord}" bij dia ${stap}`).not.toContain(woord);
      }
      await expect(tv.locator('.vlagchip')).toHaveCount(0);
    }
  }

  // Na de laatste dia begint de quiz vanzelf bij ronde 1.
  await qm.doe('volgende');
  const na = await qm.staat();
  expect(na.fase).toBe('ronde');
  expect(na.rondeIndex).toBe(0);

  await tvCtx.close();
  await qm.ctx.close();
});

test('na de uitslag draait dezelfde film zonder balken', async ({ browser }) => {
  const qm = await quizmaster(browser);
  await qm.doe('nieuw-spel', { pakket: 'jaar2026' });

  // Voor de uitslag: balken.
  await qm.doe('jaaroverzicht', { stap: 1 });
  expect((await qm.staat()).jaaroverzicht.onthuld).toBe(false);

  // Na de uitslag: dezelfde dia, nu te lezen.
  await qm.doe('naar-einde');
  await qm.doe('jaaroverzicht', { stap: 1 });
  const open = await qm.staat();
  expect(open.jaaroverzicht.onthuld).toBe(true);
  const delen = open.jaaroverzicht.regels.flatMap((r: { delen: { tekst: string; balk: boolean }[] }) => r.delen);
  expect(delen.some((d: { balk: boolean; tekst: string }) => d.balk && d.tekst.length > 0)).toBe(true);
  // Nu staan ook onze eigen cijfers erbij.
  expect(typeof open.jaaroverzicht.eigen.taart).toBe('number');
  expect(open.jaaroverzicht.eigen.totaal).not.toBeNull();

  // De slotkaart heeft nu het jaar in getallen.
  await qm.doe('jaaroverzicht', { stap: open.jaaroverzicht.stappen - 1 });
  const slot = await qm.staat();
  expect(slot.jaaroverzicht.soort).toBe('slot');
  expect(slot.jaaroverzicht.jaartotaal.taart).toBeGreaterThan(0);

  // Aan het eind van de herhaling staat het podium er weer.
  await qm.doe('volgende');
  expect((await qm.staat()).fase).toBe('einde');

  // En terug naar de lobby betekent: de avond begint opnieuw, balken erop.
  await qm.doe('naar-lobby');
  await qm.doe('jaaroverzicht', { stap: 1 });
  expect((await qm.staat()).jaaroverzicht.onthuld).toBe(false);

  await qm.ctx.close();
});

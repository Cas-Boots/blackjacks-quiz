import { test, expect, type Browser } from '@playwright/test';
import { JAAROVERZICHT } from '../src/lib/content/jaaroverzicht';

/**
 * Het jaaroverzicht: een trailer vóór de quiz, de film erna.
 *
 * Waar het hier om gaat is de belofte van de trailer: je ziet het jaar
 * langskomen zonder dat er één antwoord van vanavond uitlekt. Daarom kijkt
 * deze proef niet alleen of de dia's op het scherm komen, maar ook of er
 * geen regel met een antwoord in de pagina staat, geen maandkop, en niets
 * van onze taarten, landen en koplopers — en of het na de uitslag in de
 * film allemaal wél staat.
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

test('de trailer draait zonder één antwoord te verklappen, en gaat dan de quiz in', async ({ browser }) => {
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
  expect(eerste.jaaroverzicht.onthuld).toBe(false);
  // De trailer loopt op de klok van de server, zodat elk scherm gelijk loopt.
  expect(eerste.klok.loopt).toBe(true);

  const stappen: number = eerste.jaaroverzicht.stappen;
  expect(stappen).toBeGreaterThanOrEqual(3);

  // Wat er per maand tussen haken staat, en de open tekst van elke regel
  // die alleen in de film hoort — rechtstreeks uit de tijdlijn, zodat deze
  // proef vanzelf meegroeit met wat er bijgeschreven wordt.
  const antwoordenIn = (maand: number | null) => {
    const m = JAAROVERZICHT.maanden.find((x) => x.nr === maand);
    if (!m) return [];
    const tekst = m.momenten.map((x) => `${x.tekst} ${x.bij ?? ''}`).join(' ');
    return [...tekst.matchAll(/\[\[(.+?)\]\]/g)].map((x) => x[1]);
  };
  const alleenInDeFilm = JAAROVERZICHT.maanden.flatMap((m) =>
    m.momenten
      .filter((x) => !x.teVullen && (x.pasNaAfloop || /\[\[/.test(`${x.tekst} ${x.bij ?? ''}`)))
      .flatMap((x) => `${x.tekst} ${x.bij ?? ''}`.split(/\[\[.+?\]\]/))
      .map((stuk) => stuk.trim())
      .filter((stuk) => stuk.length >= 10),
  );

  for (let stap = 0; stap < stappen; stap++) {
    const uit = await qm.doe('jaaroverzicht', { stap });
    expect(uit.ok).toBe(true);
    const st = await qm.staat();
    const dia = st.jaaroverzicht;
    expect(dia.stap).toBe(stap);
    expect(dia.onthuld).toBe(false);

    // In het pakketje naar de clients: geen regel met een antwoord.
    const pakketje = JSON.stringify(dia);
    expect(pakketje).not.toContain('"balk":true');
    for (const woord of antwoordenIn(dia.maand)) {
      expect(pakketje, `dia ${stap} lekt "${woord}"`).not.toContain(woord);
    }
    for (const stuk of alleenInDeFilm) {
      expect(pakketje, `dia ${stap} laat al zien: "${stuk}"`).not.toContain(stuk);
    }

    // Geen maandkop, en van onze eigen cijfers alleen het sporten.
    if (dia.soort === 'maand') expect(dia.kop).toBe('');
    if (dia.eigen) {
      expect(dia.eigen.taart).toBeNull();
      expect(dia.eigen.landen).toEqual([]);
      expect(dia.eigen.perPersoon).toEqual([]);
      expect(dia.eigen.totaal).toBeNull();
      expect(dia.eigen.koploper).toBeNull();
    }
    if (dia.soort === 'slot') expect(dia.jaartotaal).toBeNull();

    // En op de televisie zelf staat het ook niet.
    if (dia.maand !== null) {
      await expect(tv.locator('.film')).toBeVisible({ timeout: 10_000 });
      await tv.waitForTimeout(150);
      const opScherm = await tv.locator('.romp').innerText();
      for (const woord of antwoordenIn(dia.maand)) {
        expect(opScherm, `de televisie toont "${woord}" bij dia ${stap}`).not.toContain(woord);
      }
      await expect(tv.locator('.vlagchip')).toHaveCount(0);
      await expect(tv.locator('.maandhoed')).toHaveCount(0);
      await expect(tv.locator('.zwart')).toHaveCount(0);
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

test('na de uitslag draait de hele film, met de antwoorden erin', async ({ browser }) => {
  const qm = await quizmaster(browser);
  await qm.doe('nieuw-spel', { pakket: 'jaar2026' });

  // Vóór de uitslag: de trailer.
  await qm.doe('jaaroverzicht', { stap: 1 });
  expect((await qm.staat()).jaaroverzicht.onthuld).toBe(false);

  // Na de uitslag: de film, met juli en alles erin.
  await qm.doe('naar-einde');
  await qm.doe('jaaroverzicht', { stap: 0 });
  const begin = (await qm.staat()).jaaroverzicht;
  expect(begin.onthuld).toBe(true);
  expect(begin.stappen).toBeGreaterThan(5);

  await qm.doe('jaaroverzicht', { stap: begin.strook.indexOf(7) + 1 });
  const juli = (await qm.staat()).jaaroverzicht;
  expect(juli.maand).toBe(7);
  expect(juli.kop).not.toBe('');
  const tekst = juli.regels.map((r: { delen: { tekst: string }[] }) => r.delen.map((d) => d.tekst).join('')).join(' ');
  expect(tekst).toContain('Marokko');
  expect(typeof juli.eigen.taart).toBe('number');
  expect(juli.eigen.totaal).not.toBeNull();

  // De slotkaart heeft nu het jaar in getallen.
  await qm.doe('jaaroverzicht', { stap: begin.stappen - 1 });
  const slot = (await qm.staat()).jaaroverzicht;
  expect(slot.soort).toBe('slot');
  expect(slot.jaartotaal.taart).toBeGreaterThan(0);

  // Aan het eind van de film staat het podium er weer.
  await qm.doe('volgende');
  expect((await qm.staat()).fase).toBe('einde');

  // En terug naar de lobby betekent: de avond begint opnieuw, met de trailer.
  await qm.doe('naar-lobby');
  await qm.doe('jaaroverzicht', { stap: 1 });
  expect((await qm.staat()).jaaroverzicht.onthuld).toBe(false);

  await qm.ctx.close();
});

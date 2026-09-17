import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { spellen, antwoorden, uitdelingen, correcties, teams as teamsTabel, spelers } from '$lib/server/db/schema';
import {
  actiefSpel, huidige, deelnemersVan, teamsVoorRonde, schrijfTeams, sleutelVan, bumpVersie,
  vraagPunten, vraagTijd, verdeelOverTeams, bepaalDichtstbij, gissingenUitAntwoorden, verplaats,
} from '$lib/server/spel';
import { maakSpel } from '$lib/server/seed';

/**
 * Alle opdrachten van de quizmaster lopen hier langs.
 *
 * Eén ingang houdt de regels op één plek: elke opdracht eindigt met het
 * ophogen van de versie, waarna elke telefoon en de televisie vanzelf
 * meebewegen.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  if (locals.rol !== 'quizmaster') error(403, 'alleen de quizmaster');

  const spel = actiefSpel();
  if (!spel) error(409, 'geen actief spel');

  const body = await request.json().catch(() => ({}));
  const opdracht = String(body.opdracht ?? '');
  const { rondes, ronde, vraag } = huidige(spel);
  const lijst = deelnemersVan(spel.id);
  const sleutel = sleutelVan(spel.rondeIndex, spel.vraagIndex);

  const zet = (waarden: Partial<typeof spellen.$inferInsert>) =>
    db.update(spellen).set(waarden).where(eq(spellen.id, spel.id)).run();

  // Elke stap naar een andere dia zet ook het fragment stil: een liedje dat
  // doorspeelt over de volgende vraag heen is precies wat je niet wilt.
  const stopKlok = () => zet({ klokLoopt: false, klokEindigtOp: null, klokDuurMs: 0, klokRestMs: 0, mediaSpeelt: false });

  const startKlok = (seconden: number) => {
    const duur = seconden * 1000;
    zet({ klokLoopt: true, klokDuurMs: duur, klokEindigtOp: Date.now() + duur, klokRestMs: duur, mediaSpeelt: false });
  };

  switch (opdracht) {
    case 'naar-ronde': {
      const doel = Math.max(0, Math.min(Number(body.ronde ?? 0), rondes.length - 1));
      stopKlok();
      zet({ fase: 'ronde', rondeIndex: doel, vraagIndex: 0 });
      const r = rondes[doel];
      if (r) teamsVoorRonde(spel.id, doel, r, lijst);
      break;
    }
    case 'herverdeel': {
      if (!ronde) error(409, 'geen ronde');
      db.delete(teamsTabel).where(and(eq(teamsTabel.spelId, spel.id), eq(teamsTabel.rondeIndex, spel.rondeIndex))).run();
      teamsVoorRonde(spel.id, spel.rondeIndex, ronde, lijst);
      break;
    }
    case 'verplaats': {
      if (!ronde) error(409, 'geen ronde');
      const huidigeTeams = teamsVoorRonde(spel.id, spel.rondeIndex, ronde, lijst);
      schrijfTeams(spel.id, spel.rondeIndex, verplaats(huidigeTeams, Number(body.spelerId)));
      break;
    }
    case 'start-ronde': {
      if (!ronde) error(409, 'geen ronde');
      zet({ fase: 'vraag', vraagIndex: 0 });
      startKlok(vraagTijd(ronde, ronde.vragen[0]));
      break;
    }
    case 'klok-pauze': {
      if (spel.klokLoopt) {
        const rest = Math.max(0, (spel.klokEindigtOp ?? 0) - Date.now());
        zet({ klokLoopt: false, klokRestMs: rest });
      } else if (spel.klokRestMs > 0) {
        zet({ klokLoopt: true, klokEindigtOp: Date.now() + spel.klokRestMs });
      }
      break;
    }
    case 'klok-start': {
      if (!ronde || !vraag) error(409, 'geen vraag');
      startKlok(vraagTijd(ronde, vraag));
      break;
    }
    case 'klok-verleng': {
      const extra = Number(body.seconden ?? 30) * 1000;
      zet({
        klokDuurMs: spel.klokDuurMs + extra,
        klokEindigtOp: spel.klokLoopt ? (spel.klokEindigtOp ?? Date.now()) + extra : spel.klokEindigtOp,
        klokRestMs: spel.klokRestMs + extra,
      });
      break;
    }
    case 'toon-antwoord': {
      stopKlok();
      zet({ fase: 'antwoord' });
      break;
    }
    case 'media-wissel': {
      if (!vraag?.media) error(409, 'deze vraag heeft geen fragment');
      zet({ mediaSpeelt: !spel.mediaSpeelt });
      break;
    }
    case 'volgende': {
      if (!ronde) error(409, 'geen ronde');
      stopKlok();
      if (spel.vraagIndex + 1 < ronde.vragen.length) {
        const volgendeIndex = spel.vraagIndex + 1;
        zet({ fase: 'vraag', vraagIndex: volgendeIndex });
        startKlok(vraagTijd(ronde, ronde.vragen[volgendeIndex]));
      } else {
        zet({ fase: 'stand' });
      }
      break;
    }
    case 'vorige': {
      stopKlok();
      if (spel.fase === 'antwoord') zet({ fase: 'vraag' });
      else if (spel.fase === 'vraag' && spel.vraagIndex > 0) zet({ fase: 'antwoord', vraagIndex: spel.vraagIndex - 1 });
      else if (spel.fase === 'vraag') zet({ fase: 'ronde' });
      else if (spel.fase === 'stand' && ronde) zet({ fase: 'antwoord', vraagIndex: ronde.vragen.length - 1 });
      break;
    }
    case 'naar-stand': {
      stopKlok();
      zet({ fase: 'stand' });
      break;
    }
    case 'naar-einde': {
      stopKlok();
      zet({ fase: 'einde', geeindigdOp: new Date().toISOString() });
      break;
    }
    case 'ken-toe': {
      if (!ronde || !vraag) error(409, 'geen vraag');
      const winnaars: string[] = Array.isArray(body.inzenders) ? body.inzenders.map(String) : [];
      const teamLijst = teamsVoorRonde(spel.id, spel.rondeIndex, ronde, lijst);
      const verdeling = verdeelOverTeams(teamLijst, winnaars, {}, vraagPunten(ronde, vraag));
      schrijfUitdeling(spel.id, sleutel, verdeling);
      // Markeer de antwoorden zelf, zodat het hostscherm laat zien wat er geteld is.
      const rijen = db.select().from(antwoorden).where(and(eq(antwoorden.spelId, spel.id), eq(antwoorden.vraagSleutel, sleutel))).all();
      for (const r of rijen) {
        db.update(antwoorden).set({ isGoed: winnaars.includes(r.inzender) }).where(eq(antwoorden.id, r.id)).run();
      }
      break;
    }
    case 'bereken-dichtstbij': {
      if (!ronde || !vraag || typeof vraag.getal !== 'number') error(409, 'geen dichtstbij-vraag');
      const rijen = db
        .select({ inzender: antwoorden.inzender, tekst: antwoorden.tekst })
        .from(antwoorden)
        .where(and(eq(antwoorden.spelId, spel.id), eq(antwoorden.vraagSleutel, sleutel)))
        .all();
      const uitslag = bepaalDichtstbij(gissingenUitAntwoorden(rijen), vraag.getal, vraagPunten(ronde, vraag));
      if (!uitslag) {
        schrijfUitdeling(spel.id, sleutel, {});
        break;
      }
      const teamLijst = teamsVoorRonde(spel.id, spel.rondeIndex, ronde, lijst);
      const verdeling = verdeelOverTeams(teamLijst, uitslag.winnaars, uitslag.puntenPerTeam, vraagPunten(ronde, vraag));
      schrijfUitdeling(spel.id, sleutel, verdeling);
      for (const r of rijen) {
        db.update(antwoorden)
          .set({ isGoed: uitslag.winnaars.includes(r.inzender) })
          .where(and(eq(antwoorden.spelId, spel.id), eq(antwoorden.vraagSleutel, sleutel), eq(antwoorden.inzender, r.inzender)))
          .run();
      }
      break;
    }
    case 'corrigeer': {
      db.insert(correcties)
        .values({ spelId: spel.id, spelerId: Number(body.spelerId), punten: Number(body.punten ?? 0), reden: body.reden ?? null })
        .run();
      break;
    }
    case 'nieuw-spel': {
      maakSpel(String(body.pakket ?? 'jaar2026'));
      break;
    }
    case 'zet-samenstelling': {
      zet({ samenstelling: JSON.stringify(body.samenstelling ?? {}) });
      break;
    }
    case 'zet-foto': {
      const foto = String(body.foto ?? '').slice(0, 200_000);
      db.update(spelers).set({ foto: foto || null }).where(eq(spelers.id, Number(body.spelerId))).run();
      break;
    }
    default:
      error(400, `onbekende opdracht: ${opdracht}`);
  }

  const versie = bumpVersie(spel.id);
  return json({ ok: true, versie });
};

/** Vervangt de verdeling van één vraag in zijn geheel. Zie scoring.ts. */
function schrijfUitdeling(spelId: number, vraagSleutel: string, verdeling: Record<number, number>) {
  const bestaand = db
    .select()
    .from(uitdelingen)
    .where(and(eq(uitdelingen.spelId, spelId), eq(uitdelingen.vraagSleutel, vraagSleutel)))
    .get();
  const json = JSON.stringify(verdeling);
  if (bestaand) {
    db.update(uitdelingen).set({ verdeling: json }).where(eq(uitdelingen.id, bestaand.id)).run();
  } else {
    db.insert(uitdelingen).values({ spelId, vraagSleutel, verdeling: json }).run();
  }
}

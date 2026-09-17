import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { spellen, antwoorden, uitdelingen, correcties, teams as teamsTabel, spelers } from '$lib/server/db/schema';
import {
  actiefSpel, huidige, deelnemersVan, teamsVoorRonde, schrijfTeams, sleutelVan, bumpVersie,
  vraagPunten, vraagTijd, verdeelOverTeams, verplaats, schrijfUitdeling, markeerAntwoorden,
  scoorAutomatisch, voegDeelnemerToe, MAX_NAAM_TEKENS,
} from '$lib/server/spel';
import { momentopname, schrijfLog, draaiTerug, type Momentopname } from '$lib/server/logboek';
import { meldPor } from '$lib/server/bus';
import { geldigeFoto } from '$lib/server/foto';
import { maakSpel } from '$lib/server/seed';
import { PAKKETTEN } from '$lib/content/packs';

/**
 * Alle opdrachten van de quizmaster lopen hier langs.
 *
 * Eén ingang houdt de regels op één plek: elke opdracht eindigt met het
 * ophogen van de versie, waarna elke telefoon en de televisie vanzelf
 * meebewegen. Elke opdracht die de stand of de plek in de quiz verandert
 * komt in het logboek, met een momentopname van ervoor, zodat hij met
 * 'ongedaan' in zijn geheel terug kan.
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
  const naamVan = (id: number) => lijst.find((s) => s.id === id)?.naam ?? '?';
  const inzenderNaam = (inzender: string) => {
    const t = ronde ? teamsVoorRonde(spel.id, spel.rondeIndex, ronde, lijst).find((x) => x.id === inzender) : undefined;
    return t ? (t.leden.length === 1 ? naamVan(t.leden[0]) : t.naam) : inzender;
  };

  const zet = (waarden: Partial<typeof spellen.$inferInsert>) =>
    db.update(spellen).set(waarden).where(eq(spellen.id, spel.id)).run();

  // Elke stap naar een andere dia zet ook het fragment stil: een liedje dat
  // doorspeelt over de volgende vraag heen is precies wat je niet wilt.
  const stopKlok = () => zet({ klokLoopt: false, klokEindigtOp: null, klokDuurMs: 0, klokRestMs: 0, mediaSpeelt: false });

  const startKlok = (seconden: number) => {
    const duur = seconden * 1000;
    zet({ klokLoopt: true, klokDuurMs: duur, klokEindigtOp: Date.now() + duur, klokRestMs: duur, mediaSpeelt: false });
  };

  /** Wat er in het logboek komt. null betekent: niet loggen. */
  let log: { omschrijving: string; terug: boolean } | null = null;
  const voor: Momentopname = momentopname(spel);
  let correctieId: number | undefined;

  switch (opdracht) {
    case 'naar-ronde': {
      const doel = Math.max(0, Math.min(Number(body.ronde ?? 0), rondes.length - 1));
      stopKlok();
      zet({ fase: 'ronde', rondeIndex: doel, vraagIndex: 0 });
      const r = rondes[doel];
      if (r) teamsVoorRonde(spel.id, doel, r, lijst);
      log = { omschrijving: `Naar ronde ${doel + 1}: ${r?.naam ?? ''}`, terug: true };
      break;
    }
    case 'herverdeel': {
      if (!ronde) error(409, 'geen ronde');
      db.delete(teamsTabel).where(and(eq(teamsTabel.spelId, spel.id), eq(teamsTabel.rondeIndex, spel.rondeIndex))).run();
      teamsVoorRonde(spel.id, spel.rondeIndex, ronde, lijst);
      log = { omschrijving: 'Teams opnieuw verdeeld', terug: true };
      break;
    }
    case 'verplaats': {
      if (!ronde) error(409, 'geen ronde');
      const huidigeTeams = teamsVoorRonde(spel.id, spel.rondeIndex, ronde, lijst);
      schrijfTeams(spel.id, spel.rondeIndex, verplaats(huidigeTeams, Number(body.spelerId)));
      log = { omschrijving: `${naamVan(Number(body.spelerId))} naar een ander team`, terug: true };
      break;
    }
    case 'start-ronde': {
      if (!ronde) error(409, 'geen ronde');
      zet({ fase: 'vraag', vraagIndex: 0 });
      startKlok(vraagTijd(ronde, ronde.vragen[0]));
      log = { omschrijving: `Ronde gestart: ${ronde.naam}`, terug: true };
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
      // Dichtstbij en stem rekent de machine meteen uit; de quizmaster hoeft
      // er niet meer aan te denken en kan het altijd nog bijsturen.
      if (ronde && vraag && spel.fase !== 'antwoord') scoorAutomatisch(spel, ronde, vraag, lijst);
      log = { omschrijving: `Antwoord getoond bij vraag ${spel.vraagIndex + 1}`, terug: true };
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
        log = { omschrijving: `Door naar vraag ${volgendeIndex + 1}`, terug: true };
      } else {
        zet({ fase: 'stand' });
        log = { omschrijving: `Tussenstand na ${ronde.naam}`, terug: true };
      }
      break;
    }
    case 'vorige': {
      stopKlok();
      if (spel.fase === 'antwoord') zet({ fase: 'vraag' });
      else if (spel.fase === 'vraag' && spel.vraagIndex > 0) zet({ fase: 'antwoord', vraagIndex: spel.vraagIndex - 1 });
      else if (spel.fase === 'vraag') zet({ fase: 'ronde' });
      else if (spel.fase === 'stand' && ronde) zet({ fase: 'antwoord', vraagIndex: ronde.vragen.length - 1 });
      // Vanaf de titelkaart terug naar de tussenstand van de vorige ronde,
      // en vanaf de eerste ronde terug naar de lobby.
      else if (spel.fase === 'ronde' && spel.rondeIndex > 0) {
        const vorigeRonde = rondes[spel.rondeIndex - 1];
        zet({ fase: 'stand', rondeIndex: spel.rondeIndex - 1, vraagIndex: Math.max(0, (vorigeRonde?.vragen.length ?? 1) - 1) });
      } else if (spel.fase === 'ronde') zet({ fase: 'lobby', rondeIndex: 0, vraagIndex: 0 });
      // Vanaf de uitslag terug naar de laatste tussenstand.
      else if (spel.fase === 'einde') zet({ fase: 'stand', geeindigdOp: null });
      log = { omschrijving: 'Een stap terug', terug: true };
      break;
    }
    case 'naar-stand': {
      stopKlok();
      zet({ fase: 'stand' });
      log = { omschrijving: 'Naar de tussenstand', terug: true };
      break;
    }
    case 'naar-einde': {
      stopKlok();
      zet({ fase: 'einde', geeindigdOp: new Date().toISOString() });
      log = { omschrijving: 'Naar de uitslag', terug: true };
      break;
    }
    case 'ken-toe': {
      if (!ronde || !vraag) error(409, 'geen vraag');
      const winnaars: string[] = Array.isArray(body.inzenders) ? body.inzenders.map(String) : [];
      const teamLijst = teamsVoorRonde(spel.id, spel.rondeIndex, ronde, lijst);
      const verdeling = verdeelOverTeams(teamLijst, winnaars, {}, vraagPunten(ronde, vraag));
      schrijfUitdeling(spel.id, sleutel, verdeling);
      // Markeer de antwoorden zelf, zodat het hostscherm laat zien wat er geteld is.
      markeerAntwoorden(spel.id, sleutel, winnaars);
      log = {
        omschrijving: winnaars.length ? `Punten voor ${winnaars.map(inzenderNaam).join(', ')}` : 'Alle punten van deze vraag weggehaald',
        terug: true,
      };
      break;
    }
    case 'bereken-dichtstbij':
    case 'bereken-stem':
    case 'bereken': {
      if (!ronde || !vraag) error(409, 'geen vraag');
      if (!scoorAutomatisch(spel, ronde, vraag, lijst)) error(409, 'deze vraag rekent de machine niet uit');
      const rij = db.select().from(uitdelingen).where(and(eq(uitdelingen.spelId, spel.id), eq(uitdelingen.vraagSleutel, sleutel))).get();
      let ids: number[] = [];
      try {
        ids = Object.keys(JSON.parse(rij?.verdeling ?? '{}')).map(Number);
      } catch { /* leeg */ }
      log = { omschrijving: ids.length ? `Uitgerekend: punten voor ${ids.map(naamVan).join(', ')}` : 'Uitgerekend: niemand punten', terug: true };
      break;
    }
    case 'corrigeer': {
      const punten = Number(body.punten ?? 0);
      const spelerId = Number(body.spelerId);
      const rij = db.insert(correcties)
        .values({ spelId: spel.id, spelerId, punten, reden: body.reden ? String(body.reden) : 'handmatig via het hostscherm' })
        .returning()
        .get();
      correctieId = rij.id;
      log = { omschrijving: `${punten > 0 ? '+' : ''}${punten} voor ${naamVan(spelerId)}`, terug: true };
      break;
    }
    case 'por': {
      // Een por naar wie nog niet heeft ingeleverd, of naar één speler.
      if (spel.fase !== 'vraag' || !ronde) error(409, 'er staat nu geen vraag open');
      const teamLijst = teamsVoorRonde(spel.id, spel.rondeIndex, ronde, lijst);
      const binnen = new Set(
        db.select({ inzender: antwoorden.inzender }).from(antwoorden)
          .where(and(eq(antwoorden.spelId, spel.id), eq(antwoorden.vraagSleutel, sleutel))).all().map((r) => r.inzender),
      );
      let doelen: number[];
      if (body.spelerId !== undefined) doelen = [Number(body.spelerId)];
      else doelen = teamLijst.filter((t) => !binnen.has(t.id)).flatMap((t) => t.leden);
      const tekst = String(body.tekst ?? 'De quizmaster wacht op je. Schiet op!').slice(0, 120);
      meldPor(doelen, tekst);
      return json({ ok: true, aantal: doelen.length });
    }
    case 'voeg-speler-toe': {
      const naam = String(body.naam ?? '').trim();
      if (!naam) error(400, 'vul een naam in');
      if (naam.length > MAX_NAAM_TEKENS) error(400, `een naam is hooguit ${MAX_NAAM_TEKENS} tekens`);
      let speler: { naam: string };
      let nieuw = false;
      try {
        ({ speler, nieuw } = voegDeelnemerToe(spel, naam));
      } catch (e) {
        error(400, (e as Error).message);
      }
      if (nieuw) log = { omschrijving: `${speler.naam} doet mee`, terug: false };
      break;
    }
    case 'ongedaan': {
      const omschrijving = draaiTerug(spel.id);
      if (!omschrijving) error(409, 'Er is niets om terug te draaien.');
      schrijfLog(spel.id, 'ongedaan', `Teruggedraaid: ${omschrijving}`, null);
      break;
    }
    case 'nieuw-spel': {
      const pakketId = String(body.pakket ?? 'jaar2026');
      if (!PAKKETTEN[pakketId]) error(400, 'onbekend pakket');
      const nieuw = maakSpel(pakketId);
      schrijfLog(nieuw.id, 'nieuw-spel', `Nieuw spel: ${PAKKETTEN[pakketId].naam}`, null);
      break;
    }
    case 'zet-samenstelling': {
      // De teamindeling en de uitdelingen hangen aan de rondenummers van de
      // gespeelde volgorde. Zodra er gespeeld is, zou een andere samenstelling
      // die nummers verschuiven en de stand door elkaar gooien. Dan kan het
      // alleen nog met een nieuw spel.
      const gespeeld = db.select({ id: antwoorden.id }).from(antwoorden).where(eq(antwoorden.spelId, spel.id)).get()
        ?? db.select({ id: uitdelingen.id }).from(uitdelingen).where(eq(uitdelingen.spelId, spel.id)).get();
      if (spel.fase !== 'lobby' || gespeeld) {
        error(409, 'De samenstelling kan alleen veranderen zolang er nog niet gespeeld is. Begin daarvoor een nieuw spel.');
      }
      const keuze: Record<string, number[]> = {};
      const invoer = body.samenstelling && typeof body.samenstelling === 'object' ? body.samenstelling : {};
      for (const [k, v] of Object.entries(invoer as Record<string, unknown>)) {
        if (!/^\d+$/.test(k) || !Array.isArray(v)) continue;
        keuze[k] = v.map(Number).filter((n) => Number.isInteger(n) && n >= 0);
      }
      // De teamindeling hangt aan de rondenummers, en de lobby heeft voor
      // ronde 0 al een indeling aangemaakt. Die hoort bij de oude volgorde.
      db.delete(teamsTabel).where(eq(teamsTabel.spelId, spel.id)).run();
      zet({ samenstelling: JSON.stringify(keuze), rondeIndex: 0, vraagIndex: 0 });
      log = { omschrijving: 'Samenstelling aangepast', terug: true };
      break;
    }
    case 'naar-lobby': {
      stopKlok();
      zet({ fase: 'lobby', rondeIndex: 0, vraagIndex: 0 });
      log = { omschrijving: 'Terug naar de lobby', terug: true };
      break;
    }
    case 'zet-foto': {
      const foto = String(body.foto ?? '');
      if (foto && !geldigeFoto(foto)) error(400, 'geen geldige afbeelding');
      db.update(spelers).set({ foto: foto || null }).where(eq(spelers.id, Number(body.spelerId))).run();
      break;
    }
    default:
      error(400, `onbekende opdracht: ${opdracht}`);
  }

  if (log) {
    schrijfLog(spel.id, opdracht, log.omschrijving, log.terug ? { ...voor, correctieId } : null);
  }

  // Na 'nieuw spel' is er een ander actief spel; dat moet de versie krijgen.
  const versie = bumpVersie(actiefSpel()?.id ?? spel.id);
  return json({ ok: true, versie });
};

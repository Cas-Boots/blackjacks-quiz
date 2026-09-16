/**
 * De spelmotor: leest en schrijft de stand van de avond.
 *
 * De server is de enige bron van waarheid. Clients sturen opdrachten en
 * krijgen een momentopname terug; ze rekenen zelf niets uit behalve hoeveel
 * seconden er nog op de klok staan, en dat doen ze op basis van de servertijd
 * die in elke momentopname meekomt.
 */
import { eq, and, desc } from 'drizzle-orm';
import { db } from './db/index';
import { spelers, spellen, deelnemers, teams, antwoorden, uitdelingen, correcties, apparaten } from './db/schema';
import { PAKKETTEN } from '$lib/content/packs';
import type { Pakket, Ronde, Vraag } from '$lib/content/types';
import { maakTeams, verplaats, type Team } from './teams';
import { vraagPunten, vraagTijd, verdeelOverTeams, bepaalDichtstbij, gissingenUitAntwoorden, telStand } from './scoring';
import { beoordeel } from './antwoord';
import { meldWijziging } from './bus';
import type { PubliekeStaat, Fase, Rol } from '$lib/shared/state';

/** Een apparaat geldt als verbonden zolang het zich binnen deze tijd meldde. */
const STIL_DREMPEL_MS = 20_000;

export function actiefSpel() {
  return db.select().from(spellen).where(eq(spellen.isActief, true)).orderBy(desc(spellen.id)).get();
}

export function pakketVan(spel: { pakket: string }): Pakket {
  const p = PAKKETTEN[spel.pakket];
  if (!p) throw new Error(`onbekend pakket: ${spel.pakket}`);
  return p;
}

/** De rondes die daadwerkelijk meedoen, met alleen de gekozen vragen. */
export function samengesteld(spel: { pakket: string; samenstelling: string }): Ronde[] {
  const pakket = pakketVan(spel);
  let keuze: Record<string, number[]>;
  try {
    keuze = JSON.parse(spel.samenstelling || '{}');
  } catch {
    keuze = {};
  }
  const uit: Ronde[] = [];
  pakket.rondes.forEach((r, ri) => {
    const idx = keuze[String(ri)] ?? (r.optioneel ? [] : r.vragen.map((_, i) => i));
    if (!idx.length) return;
    uit.push({ ...r, vragen: idx.slice().sort((a, b) => a - b).map((i) => r.vragen[i]).filter(Boolean) });
  });
  return uit;
}

export function standaardSamenstelling(pakketId: string): string {
  const pakket = PAKKETTEN[pakketId];
  const uit: Record<string, number[]> = {};
  pakket.rondes.forEach((r, ri) => {
    uit[String(ri)] = r.optioneel ? [] : r.vragen.map((_, i) => i);
  });
  return JSON.stringify(uit);
}

export function sleutelVan(rondeIndex: number, vraagIndex: number) {
  return `${rondeIndex}:${vraagIndex}`;
}

export function teamsVoorRonde(spelId: number, rondeIndex: number, ronde: Ronde, deelnemerLijst: { id: number; naam: string }[]): Team[] {
  const rijen = db.select().from(teams).where(and(eq(teams.spelId, spelId), eq(teams.rondeIndex, rondeIndex))).all();
  if (rijen.length) {
    return rijen.map((r) => ({ id: r.teamKey, naam: r.naam, suit: r.suit, leden: JSON.parse(r.leden) as number[] }));
  }
  const nieuw = maakTeams(ronde, deelnemerLijst);
  schrijfTeams(spelId, rondeIndex, nieuw);
  return nieuw;
}

export function schrijfTeams(spelId: number, rondeIndex: number, lijst: Team[]) {
  db.delete(teams).where(and(eq(teams.spelId, spelId), eq(teams.rondeIndex, rondeIndex))).run();
  for (const t of lijst) {
    db.insert(teams).values({
      spelId, rondeIndex, teamKey: t.id, naam: t.naam, suit: t.suit, leden: JSON.stringify(t.leden),
    }).run();
  }
}

export function deelnemersVan(spelId: number) {
  return db
    .select({ id: spelers.id, naam: spelers.naam, foto: spelers.foto })
    .from(deelnemers)
    .innerJoin(spelers, eq(deelnemers.spelerId, spelers.id))
    .where(eq(deelnemers.spelId, spelId))
    .all();
}

export function standVan(spelId: number) {
  const rijen = db.select().from(uitdelingen).where(eq(uitdelingen.spelId, spelId)).all();
  const cor = db.select().from(correcties).where(eq(correcties.spelId, spelId)).all();
  return telStand(
    rijen.map((r) => JSON.parse(r.verdeling)),
    cor.map((c) => ({ spelerId: c.spelerId, punten: c.punten })),
  );
}

/** Bump de versie en laat de luisteraars weten dat er iets veranderd is. */
export function bumpVersie(spelId: number): number {
  const spel = db.select().from(spellen).where(eq(spellen.id, spelId)).get();
  if (!spel) return 0;
  const versie = spel.versie + 1;
  db.update(spellen).set({ versie }).where(eq(spellen.id, spelId)).run();
  meldWijziging(versie);
  return versie;
}

export function raakApparaatAan(token: string, rol: Rol, spelerId: number | null, naam: string | null) {
  const nu = Date.now();
  const bestaand = db.select().from(apparaten).where(eq(apparaten.token, token)).get();
  if (bestaand) {
    db.update(apparaten).set({ laatstGezien: nu, rol, spelerId, naam }).where(eq(apparaten.token, token)).run();
  } else {
    db.insert(apparaten).values({ token, rol, spelerId, naam, laatstGezien: nu }).run();
  }
}

/**
 * De momentopname die naar de clients gaat.
 *
 * In de fase 'vraag' zit er geen antwoord in het pakketje — ook niet voor de
 * quizmaster, want diens scherm hangt vaak aan dezelfde televisie.
 */
export function bouwStaat(rol: Rol): PubliekeStaat | null {
  const spel = actiefSpel();
  if (!spel) return null;

  const rondes = samengesteld(spel);
  const ronde: Ronde | undefined = rondes[spel.rondeIndex];
  const vraag: Vraag | undefined = ronde?.vragen[spel.vraagIndex];
  const lijst = deelnemersVan(spel.id);
  const teamLijst = ronde ? teamsVoorRonde(spel.id, spel.rondeIndex, ronde, lijst) : [];
  const stand = standVan(spel.id);
  const nu = Date.now();

  const apparaatRijen = db.select().from(apparaten).all();
  const laatsteVan = new Map<number, number>();
  for (const a of apparaatRijen) {
    if (a.spelerId == null) continue;
    laatsteVan.set(a.spelerId, Math.max(laatsteVan.get(a.spelerId) ?? 0, a.laatstGezien));
  }

  const sleutel = sleutelVan(spel.rondeIndex, spel.vraagIndex);
  const ingeleverd = db
    .select({ inzender: antwoorden.inzender })
    .from(antwoorden)
    .where(and(eq(antwoorden.spelId, spel.id), eq(antwoorden.vraagSleutel, sleutel)))
    .all()
    .map((r) => r.inzender);

  // Waar/niet waar is óók een keuzevraag. Door hier twee opties mee te
  // sturen ziet de kamer op de televisie waar tussen gekozen wordt, in
  // plaats van alleen de stelling.
  const opties =
    ronde?.type === 'waarnietwaar' ? ['Waar', 'Niet waar'] : vraag?.opties;
  const goedeOptieIndex = !ronde || !vraag
    ? undefined
    : ronde.type === 'waarnietwaar'
      ? (vraag.goed === true ? 0 : 1)
      : typeof vraag.goed === 'number'
        ? vraag.goed
        : undefined;

  let onthulling = null;
  if (spel.fase === 'antwoord' && ronde && vraag) {
    let tekst = vraag.a ?? '';
    if (ronde.type === 'waarnietwaar') tekst = vraag.goed === true ? 'Waar' : 'Niet waar';
    if (ronde.type === 'meerkeuze' && vraag.opties && typeof vraag.goed === 'number') {
      tekst = `${String.fromCharCode(65 + vraag.goed)} — ${vraag.opties[vraag.goed]}`;
    }
    if (ronde.type === 'dichtstbij' && typeof vraag.getal === 'number') {
      tekst = `${vraag.getal.toLocaleString('nl-NL')}${vraag.eenheid ? ' ' + vraag.eenheid : ''}`;
    }
    onthulling = {
      antwoord: tekst,
      toelichting: vraag.toelichting,
      goedeOptie: goedeOptieIndex,
    };
  }

  return {
    versie: spel.versie,
    fase: spel.fase as Fase,
    quizNaam: pakketVan(spel).naam,
    rondeIndex: spel.rondeIndex,
    rondeAantal: rondes.length,
    ronde: ronde
      ? {
          naam: ronde.naam, suit: ronde.suit, thema: ronde.thema,
          sfeer: ronde.sfeer ?? 'vilt', uitleg: ronde.uitleg,
          teamModus: ronde.teamModus, vragenAantal: ronde.vragen.length,
        }
      : null,
    vraag:
      vraag && ronde && (spel.fase === 'vraag' || spel.fase === 'antwoord')
        ? {
            index: spel.vraagIndex,
            aantal: ronde.vragen.length,
            type: ronde.type,
            tekst: vraag.v,
            opties,
            emoji: vraag.emoji,
            lyric: vraag.lyric,
            eenheid: vraag.eenheid,
            media: vraag.media,
            punten: vraagPunten(ronde, vraag),
          }
        : null,
    onthulling,
    teams: teamLijst,
    spelers: lijst.map((s) => {
      const laatste = laatsteVan.get(s.id) ?? null;
      return {
        id: s.id, naam: s.naam, foto: s.foto,
        stilSinds: laatste ? Math.round((nu - laatste) / 1000) : null,
        verbonden: laatste != null && nu - laatste < STIL_DREMPEL_MS,
      };
    }),
    stand: lijst
      .map((s) => ({ spelerId: s.id, naam: s.naam, foto: s.foto, punten: stand[s.id] ?? 0 }))
      .sort((a, b) => b.punten - a.punten || a.naam.localeCompare(b.naam, 'nl')),
    serverTijd: nu,
    klok: {
      eindigtOp: spel.klokLoopt ? spel.klokEindigtOp : null,
      duurMs: spel.klokDuurMs,
      loopt: spel.klokLoopt,
    },
    ingeleverd: rol === 'quizmaster' || spel.fase === 'antwoord' ? ingeleverd : ingeleverd,
  };
}

/** De huidige ronde en vraag, of null als het spel daar niet staat. */
export function huidige(spel: { pakket: string; samenstelling: string; rondeIndex: number; vraagIndex: number }) {
  const rondes = samengesteld(spel);
  const ronde = rondes[spel.rondeIndex];
  const vraag = ronde?.vragen[spel.vraagIndex];
  return { rondes, ronde, vraag };
}

export { vraagPunten, vraagTijd, verdeelOverTeams, bepaalDichtstbij, gissingenUitAntwoorden, beoordeel, verplaats };

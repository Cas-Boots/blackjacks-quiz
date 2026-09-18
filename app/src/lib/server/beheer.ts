/**
 * Het beheerscherm: wat er buiten de avond om te regelen valt.
 *
 * Het hostscherm bedient de quiz terwijl hij loopt. Dit bestand doet de rest:
 * de vaste spelers bijhouden, oude spellen opruimen of terughalen, een
 * telefoon van de verkeerde naam afhalen, controleren of de bestanden bij de
 * vragen er echt staan, en een back-up van de database meenemen. Alles wat
 * hier gebeurt is bedoeld voor vóór of ná de avond — nooit tijdens een vraag.
 *
 * De leesfuncties bouwen één overzicht; de schrijffuncties gooien een Error
 * met een leesbare Nederlandse reden, die de API één op één doorgeeft.
 */
import { and, desc, eq, sql } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { db, sqlite } from './db/index';
import {
  spelers, spellen, deelnemers, teams, antwoorden, uitdelingen, correcties, apparaten, logboek,
} from './db/schema';
import { PAKKETTEN } from '$lib/content/packs';
import type { Pakketten } from '$lib/content/types';
import { actiefSpel, bumpVersie, deelnemersVan, standVan, voegDeelnemerToe, MAX_NAAM_TEKENS } from './spel';
import { maakSpel } from './seed';
import { geldigeFoto } from './foto';
import { aantalLuisteraars } from './bus';
import { inProductie, omgevingsFouten, omgevingsWaarschuwingen } from './omgeving';
import { recapStatus, type RecapStatus } from './recap/bron';
import { netwerkAdressen, type NetwerkAdres } from './netwerk';

/* ---- Wat het scherm te zien krijgt ------------------------------------- */

export interface BeheerSpeler {
  id: number;
  naam: string;
  foto: string | null;
  isQuizmaster: boolean;
  isGast: boolean;
  aangemaaktOp: string;
  /** Aan hoeveel spellen deze persoon meedeed. */
  avonden: number;
  /** Of hij aan het actieve spel meedoet. */
  doetNuMee: boolean;
  /** Seconden sinds een telefoon met deze naam zich meldde; null als dat nooit gebeurde. */
  stilSinds: number | null;
  /** Weghalen kan alleen zolang er geen avond aan hangt, anders raakt een uitslag zijn naam kwijt. */
  verwijderbaar: boolean;
}

export interface BeheerSpel {
  id: number;
  naam: string;
  pakket: string;
  pakketNaam: string;
  fase: string;
  isActief: boolean;
  gestartOp: string;
  geeindigdOp: string | null;
  aantalSpelers: number;
  aantalAntwoorden: number;
  aantalHandelingen: number;
  winnaars: string[];
  punten: number;
}

export interface BeheerApparaat {
  /** Een afgeleide van het token, nooit het token zelf: dat is het sessiecookie van die telefoon. */
  id: string;
  rol: string;
  naam: string | null;
  spelerNaam: string | null;
  laatstGezien: number;
  stilSinds: number;
  /** Het scherm waar de beheerder nu zelf op zit; dat koppel je niet los. */
  ditApparaat: boolean;
}

export interface MediaVerwacht {
  bron: string;
  soort: string;
  pakket: string;
  ronde: string;
  vraag: string;
  aanwezig: boolean;
}

export interface MediaControle {
  map: string;
  mapBestaat: boolean;
  verwacht: MediaVerwacht[];
  /** Bestanden in de map waar geen vraag naar verwijst. */
  ongebruikt: string[];
  ontbrekend: number;
}

export interface InhoudPakket {
  id: string;
  naam: string;
  rondes: number;
  vragen: number;
  /** Vragen die nog een antwoord missen. */
  teVullen: number;
  /** Vragen die op de avond zelf uit de cijfers worden uitgerekend. */
  live: number;
}

export interface Serverstatus {
  productie: boolean;
  fouten: string[];
  waarschuwingen: string[];
  origin: string | null;
  /** De adressen van deze computer op het thuisnetwerk; leeg in productie en in een container. */
  adressen: NetwerkAdres[];
  poort: string;
  databasePad: string;
  databaseBytes: number | null;
  tabellen: number;
  schermenVerbonden: number;
  nodeVersie: string;
  /** Hoeveel seconden dit proces al draait. */
  draaitSinds: number;
  recap: RecapStatus;
}

export interface BeheerOverzicht {
  server: Serverstatus;
  inhoud: InhoudPakket[];
  media: MediaControle;
  spelers: BeheerSpeler[];
  spellen: BeheerSpel[];
  apparaten: BeheerApparaat[];
}

/** Een apparaat dat zich langer dan dit niet meldde, geldt als vergeten. */
export const OUD_APPARAAT_MS = 24 * 60 * 60 * 1000;

/* ---- Zuivere hulpjes, los van de database ------------------------------ */

/** Een korte, vaste afgeleide van een apparaat-token, veilig om aan het scherm te geven. */
export function apparaatId(token: string): string {
  return createHash('sha256').update(token).digest('hex').slice(0, 16);
}

/** Telt per pakket wat erin zit en wat er nog aan ontbreekt. */
export function telInhoud(pakketten: Pakketten): InhoudPakket[] {
  return Object.entries(pakketten).map(([id, p]) => {
    const vragen = p.rondes.flatMap((r) => r.vragen);
    return {
      id,
      naam: p.naam,
      rondes: p.rondes.length,
      vragen: vragen.length,
      teVullen: vragen.filter((v) => v.teVullen).length,
      live: vragen.filter((v) => v.live).length,
    };
  });
}

/**
 * Legt de bestanden waar de vragen naar verwijzen naast wat er in de map
 * staat. Ingebakken fragmenten (data:) tellen niet mee: die hebben geen
 * bestand nodig.
 */
export function controleerMedia(pakketten: Pakketten, aanwezig: string[], map: string, mapBestaat: boolean): MediaControle {
  const bestanden = new Set(aanwezig);
  const verwacht: MediaVerwacht[] = [];
  for (const p of Object.values(pakketten)) {
    for (const r of p.rondes) {
      for (const v of r.vragen) {
        if (!v.media || v.media.bron.startsWith('data:')) continue;
        verwacht.push({
          bron: v.media.bron,
          soort: v.media.soort,
          pakket: p.naam,
          ronde: r.naam,
          vraag: v.v,
          aanwezig: bestanden.has(v.media.bron),
        });
      }
    }
  }
  const gebruikt = new Set(verwacht.map((v) => v.bron));
  return {
    map,
    mapBestaat,
    verwacht,
    ongebruikt: aanwezig.filter((b) => !gebruikt.has(b) && !b.startsWith('.') && b !== 'README.md').sort(),
    ontbrekend: verwacht.filter((v) => !v.aanwezig).length,
  };
}

/** Een naam zoals hij in de database mag: één spatie tussen woorden, niet leeg, niet te lang. */
export function schoneNaam(invoer: unknown): string {
  const naam = String(invoer ?? '').replace(/\s+/g, ' ').trim();
  if (!naam) throw new Error('Vul een naam in.');
  if (naam.length > MAX_NAAM_TEKENS) throw new Error(`Een naam is hooguit ${MAX_NAAM_TEKENS} tekens.`);
  return naam;
}

/* ---- Lezen -------------------------------------------------------------- */

function mediaMap(): string {
  return process.env.MEDIA_DIR ?? resolve(process.cwd(), 'media');
}

export function serverstatus(): Serverstatus {
  const databasePad = process.env.DATABASE_PATH ?? 'local.db';
  let databaseBytes: number | null = null;
  try {
    databaseBytes = statSync(databasePad).size;
  } catch {
    /* in het geheugen, of nog niet geschreven */
  }
  const tabellen = (sqlite.prepare("select count(*) as n from sqlite_master where type='table'").get() as { n: number }).n;
  return {
    productie: inProductie(),
    fouten: omgevingsFouten(),
    waarschuwingen: omgevingsWaarschuwingen(),
    origin: process.env.ORIGIN ?? null,
    adressen: inProductie() ? [] : netwerkAdressen(),
    poort: process.env.PORT ?? '3000',
    databasePad,
    databaseBytes,
    tabellen,
    schermenVerbonden: aantalLuisteraars(),
    nodeVersie: process.version,
    draaitSinds: Math.round(process.uptime()),
    recap: recapStatus(),
  };
}

export function mediaControle(): MediaControle {
  const map = mediaMap();
  let bestanden: string[] = [];
  let bestaat = false;
  try {
    bestanden = readdirSync(map).filter((b) => {
      try {
        return statSync(resolve(map, b)).isFile();
      } catch {
        return false;
      }
    });
    bestaat = true;
  } catch {
    bestaat = existsSync(map);
  }
  return controleerMedia(PAKKETTEN, bestanden, map, bestaat);
}

export function beheerSpelers(): BeheerSpeler[] {
  const nu = Date.now();
  const actief = actiefSpel();
  const rijen = db.select().from(spelers).orderBy(spelers.id).all();
  const deelnames = db
    .select({ spelerId: deelnemers.spelerId, spelId: deelnemers.spelId })
    .from(deelnemers)
    .all();
  const laatsteVan = new Map<number, number>();
  for (const a of db.select().from(apparaten).all()) {
    if (a.spelerId == null) continue;
    laatsteVan.set(a.spelerId, Math.max(laatsteVan.get(a.spelerId) ?? 0, a.laatstGezien));
  }
  return rijen.map((s) => {
    const eigen = deelnames.filter((d) => d.spelerId === s.id);
    const laatste = laatsteVan.get(s.id) ?? null;
    return {
      id: s.id,
      naam: s.naam,
      foto: s.foto,
      isQuizmaster: s.isQuizmaster,
      isGast: s.isGast,
      aangemaaktOp: s.aangemaaktOp,
      avonden: eigen.length,
      doetNuMee: !!actief && eigen.some((d) => d.spelId === actief.id),
      stilSinds: laatste ? Math.round((nu - laatste) / 1000) : null,
      verwijderbaar: eigen.length === 0 && !s.isQuizmaster,
    };
  });
}

export function beheerSpellen(): BeheerSpel[] {
  return db
    .select()
    .from(spellen)
    .orderBy(desc(spellen.id))
    .all()
    .map((spel) => {
      const lijst = deelnemersVan(spel.id);
      const stand = standVan(spel.id);
      const rijen = lijst.map((s) => ({ naam: s.naam, punten: stand[s.id] ?? 0 })).sort((a, b) => b.punten - a.punten);
      const top = rijen[0]?.punten ?? 0;
      const tel = (t: { n: number } | undefined) => t?.n ?? 0;
      return {
        id: spel.id,
        naam: spel.naam,
        pakket: spel.pakket,
        pakketNaam: PAKKETTEN[spel.pakket]?.naam ?? spel.pakket,
        fase: spel.fase,
        isActief: spel.isActief,
        gestartOp: spel.gestartOp,
        geeindigdOp: spel.geeindigdOp,
        aantalSpelers: lijst.length,
        aantalAntwoorden: tel(db.select({ n: sql<number>`count(*)` }).from(antwoorden).where(eq(antwoorden.spelId, spel.id)).get()),
        aantalHandelingen: tel(db.select({ n: sql<number>`count(*)` }).from(logboek).where(eq(logboek.spelId, spel.id)).get()),
        winnaars: top > 0 ? rijen.filter((r) => r.punten === top).map((r) => r.naam) : [],
        punten: top,
      };
    });
}

export function beheerApparaten(eigenToken: string | undefined): BeheerApparaat[] {
  const nu = Date.now();
  const namen = new Map(db.select({ id: spelers.id, naam: spelers.naam }).from(spelers).all().map((s) => [s.id, s.naam]));
  return db
    .select()
    .from(apparaten)
    .orderBy(desc(apparaten.laatstGezien))
    .all()
    .map((a) => ({
      id: apparaatId(a.token),
      rol: a.rol,
      naam: a.naam,
      spelerNaam: a.spelerId != null ? (namen.get(a.spelerId) ?? null) : null,
      laatstGezien: a.laatstGezien,
      stilSinds: Math.round((nu - a.laatstGezien) / 1000),
      ditApparaat: eigenToken !== undefined && a.token === eigenToken,
    }));
}

export function beheerOverzicht(eigenToken: string | undefined): BeheerOverzicht {
  return {
    server: serverstatus(),
    inhoud: telInhoud(PAKKETTEN),
    media: mediaControle(),
    spelers: beheerSpelers(),
    spellen: beheerSpellen(),
    apparaten: beheerApparaten(eigenToken),
  };
}

/* ---- Schrijven: spelers ------------------------------------------------- */

function spelerOfFout(id: number) {
  const s = db.select().from(spelers).where(eq(spelers.id, id)).get();
  if (!s) throw new Error('Onbekende speler.');
  return s;
}

/** Laat de schermen die open staan meebewegen, als er een spel loopt. */
function meld() {
  const spel = actiefSpel();
  if (spel) bumpVersie(spel.id);
}

/**
 * Een nieuwe vaste speler. Anders dan een gast doet hij vanzelf mee aan elk
 * volgend spel; staat het huidige spel nog in de lobby, dan schuift hij daar
 * meteen aan.
 */
export function voegSpelerToe(invoer: unknown) {
  const naam = schoneNaam(invoer);
  if (db.select().from(spelers).where(eq(spelers.naam, naam)).get()) throw new Error('Die naam is er al.');
  const speler = db.insert(spelers).values({ naam, isGast: false }).returning().get();
  const spel = actiefSpel();
  if (spel && spel.fase === 'lobby') voegDeelnemerToe(spel, naam);
  meld();
  return speler;
}

export function hernoemSpeler(id: number, invoer: unknown) {
  const speler = spelerOfFout(id);
  const naam = schoneNaam(invoer);
  if (naam === speler.naam) return speler;
  const bezet = db.select().from(spelers).where(eq(spelers.naam, naam)).get();
  if (bezet) throw new Error('Die naam is er al.');
  db.update(spelers).set({ naam }).where(eq(spelers.id, id)).run();
  // Bij een individuele ronde heet het team naar de speler; dat naamplaatje
  // moet mee, anders staat de oude naam nog op de televisie.
  const spel = actiefSpel();
  if (spel) {
    db.update(teams)
      .set({ naam })
      .where(and(eq(teams.spelId, spel.id), eq(teams.leden, JSON.stringify([id])), eq(teams.naam, speler.naam)))
      .run();
  }
  meld();
  return { ...speler, naam };
}

/** Een gast wordt vast (doet vanzelf mee aan het volgende spel), of andersom. */
export function zetGast(id: number, isGast: boolean) {
  const speler = spelerOfFout(id);
  if (speler.isQuizmaster) throw new Error('De quizmaster speelt niet mee.');
  db.update(spelers).set({ isGast }).where(eq(spelers.id, id)).run();
  meld();
}

/** Zet of verwijdert een portret. Een lege foto haalt hem weg. */
export function zetFoto(id: number, foto: unknown) {
  spelerOfFout(id);
  const waarde = foto == null || foto === '' ? null : String(foto);
  if (waarde !== null && !geldigeFoto(waarde)) throw new Error('Geen geldige afbeelding.');
  db.update(spelers).set({ foto: waarde }).where(eq(spelers.id, id)).run();
  meld();
}

/**
 * Weghalen kan alleen als er nooit een avond aan hing: een uitslag zonder
 * naam is geen uitslag. Zit er wel een avond aan, maak hem dan gast.
 */
export function verwijderSpeler(id: number) {
  const speler = spelerOfFout(id);
  if (speler.isQuizmaster) throw new Error('De quizmaster kun je niet weghalen.');
  const deelname = db.select().from(deelnemers).where(eq(deelnemers.spelerId, id)).get();
  if (deelname) throw new Error(`${speler.naam} deed aan een avond mee. Maak hem gast als hij niet meer vanzelf moet meedoen.`);
  db.delete(spelers).where(eq(spelers.id, id)).run();
  meld();
}

/* ---- Schrijven: spellen ------------------------------------------------- */

function spelOfFout(id: number) {
  const s = db.select().from(spellen).where(eq(spellen.id, id)).get();
  if (!s) throw new Error('Onbekend spel.');
  return s;
}

/** Zet een eerder spel weer op actief; de schermen springen er meteen naar. */
export function activeerSpel(id: number) {
  const spel = spelOfFout(id);
  if (spel.isActief) return;
  db.update(spellen).set({ isActief: false }).where(eq(spellen.isActief, true)).run();
  db.update(spellen).set({ isActief: true }).where(eq(spellen.id, id)).run();
  bumpVersie(id);
}

export function hernoemSpel(id: number, invoer: unknown) {
  spelOfFout(id);
  const naam = String(invoer ?? '').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (!naam) throw new Error('Vul een naam in.');
  db.update(spellen).set({ naam }).where(eq(spellen.id, id)).run();
  meld();
}

/**
 * Gooit een spel weg, met alles wat erbij hoort. Was het het actieve spel,
 * dan wordt het jongste overgebleven spel actief; is er geen, dan komt er een
 * leeg spel met hetzelfde pakket, zodat de schermen nooit zonder zitten.
 */
export function verwijderSpel(id: number) {
  const spel = spelOfFout(id);
  db.delete(spellen).where(eq(spellen.id, id)).run();
  if (!spel.isActief) return;
  const jongste = db.select().from(spellen).orderBy(desc(spellen.id)).get();
  if (jongste) {
    db.update(spellen).set({ isActief: true }).where(eq(spellen.id, jongste.id)).run();
    bumpVersie(jongste.id);
  } else {
    const nieuw = maakSpel(PAKKETTEN[spel.pakket] ? spel.pakket : Object.keys(PAKKETTEN)[0]);
    bumpVersie(nieuw.id);
  }
}

/* ---- Schrijven: apparaten ----------------------------------------------- */

/**
 * Haalt een telefoon van zijn naam af. Die telefoon wordt weer gast en kiest
 * opnieuw — handig als iemand op de verkeerde naam zit. Je eigen scherm
 * koppel je niet los, anders zit je meteen buiten.
 */
export function koppelLos(id: string, eigenToken: string | undefined) {
  const rij = db.select().from(apparaten).all().find((a) => apparaatId(a.token) === id);
  if (!rij) throw new Error('Onbekend apparaat.');
  if (eigenToken !== undefined && rij.token === eigenToken) throw new Error('Dit is het scherm waar je nu op zit.');
  db.delete(apparaten).where(eq(apparaten.token, rij.token)).run();
  meld();
}

/** Vergeet apparaten die zich al een dag niet meldden. Geeft terug hoeveel er weg zijn. */
export function ruimApparatenOp(eigenToken: string | undefined, ouderDanMs = OUD_APPARAAT_MS): number {
  const grens = Date.now() - ouderDanMs;
  const oud = db.select().from(apparaten).all().filter((a) => a.laatstGezien <= grens && a.token !== eigenToken);
  for (const a of oud) db.delete(apparaten).where(eq(apparaten.token, a.token)).run();
  if (oud.length) meld();
  return oud.length;
}

/* ---- Back-up ------------------------------------------------------------ */

/**
 * Alles uit de database als één JSON, om mee te nemen op een usb-stick.
 *
 * De apparaten blijven eruit: hun tokens zijn de sessiecookies van de
 * telefoons, en die horen nergens anders dan in die telefoons.
 */
export function exportVanAlles() {
  return {
    exportSchemaVersion: 1,
    exportedAt: new Date().toISOString(),
    spelers: db.select().from(spelers).all(),
    spellen: db.select().from(spellen).all(),
    deelnemers: db.select().from(deelnemers).all(),
    teams: db.select().from(teams).all(),
    antwoorden: db.select().from(antwoorden).all(),
    uitdelingen: db.select().from(uitdelingen).all(),
    correcties: db.select().from(correcties).all(),
    logboek: db.select().from(logboek).all(),
  };
}

/**
 * Proefritten: de hele avond uitproberen zonder de echte te raken.
 *
 * Een proefrit is een spel met een eigen database in het geheugen. Elk
 * verzoek met `?proef=<id>` in de adresregel (of de kop `x-proef`) draait
 * tegen die database; zie hooks.server.ts en db/index.ts. De echte
 * televisie, de echte telefoons en de uitslagen zien er dus nooit iets van,
 * en een echte avond kan gewoon doorlopen terwijl je oefent.
 *
 * Aan tafel zitten bots: ze spelen de vaste spelers (en desgewenst een
 * plus-één) zolang geen echte telefoon op die naam zit, en leveren op een
 * geloofwaardig moment een antwoord in — goed zo vaak als ingesteld.
 *
 * Met `springNaar` open je elk onderdeel van de avond direct. De bots
 * beantwoorden dan alles wat ervoor kwam, zodat de stand eruitziet als bij
 * een echte avond; wat erna komt wordt gewist, zodat je elk stuk zo vaak kunt
 * proberen als je wilt.
 *
 * Een proefrit verdwijnt na vier uur zonder gebruik, en bij een herstart.
 */
import { randomUUID } from 'node:crypto';
import { and, eq, inArray } from 'drizzle-orm';
import { binnen, db, echte, geheugenDb, type Context } from './db/index';
import { migreer } from './db/migrate';
import { spelers, spellen, antwoorden, uitdelingen, apparaten } from './db/schema';
import {
  actiefSpel, samengesteld, deelnemersVan, teamsVoorRonde, sleutelVan, bumpVersie, raakApparaatAan,
  leverIn, schrijfUitdeling, markeerAntwoorden, scoorAutomatisch, voegDeelnemerToe, vraagPunten, vraagTijd,
  verdeelOverTeams, beoordeel, vergeetProefPakketten, huidige,
} from './spel';
import { maakSpel } from './seed';
import { luister } from './bus';
import { jaaroverzichtVoor } from './jaaroverzicht';
import { recapAnalyse } from './recap/bron';
import { isAfrekening } from '$lib/shared/state';
import type { Ronde, Vraag } from '$lib/content/types';

const LEVENSDUUR_MS = 4 * 60 * 60 * 1000;
/** Een echte telefoon die zich zo lang niet meldde, laat zijn naam weer aan een bot. */
const MENS_STIL_MS = 60_000;
const BOT = 'bot:';

export interface ProefInstellingen {
  /** Kans dat een bot het goede antwoord geeft, 0–1. */
  kansGoed: number;
  /** Of de bots meespelen. Uit: alleen echte telefoons leveren in. */
  bots: boolean;
  /** De naam van een plus-één, of null. */
  gast: string | null;
}

interface Proef {
  id: string;
  context: Context;
  instellingen: ProefInstellingen;
  aangemaakt: number;
  laatst: number;
  /** Welke vragen de bots al hebben ingepland: sleutel plus klok, zodat een heropende vraag opnieuw telt. */
  ingepland: Set<string>;
  timers: Set<ReturnType<typeof setTimeout>>;
  stop: () => void;
}

const proeven = new Map<string, Proef>();

export function tokenVoor(proefId: string, apparaat: string): string {
  return `proef:${proefId}:${apparaat}`;
}

/** Alleen letters, cijfers en een streepje, zodat een apparaatnaam nooit iets anders wordt dan een naam. */
export function geldigApparaat(naam: string | null): string | null {
  return naam && /^[a-z0-9-]{1,24}$/i.test(naam) ? naam : null;
}

export function zoekProef(id: string | null): Context | null {
  if (!id) return null;
  const p = proeven.get(id);
  if (!p) return null;
  p.laatst = Date.now();
  return p.context;
}

export function proefInstellingen(id: string): ProefInstellingen | null {
  return proeven.get(id)?.instellingen ?? null;
}

/**
 * Begint een proefrit. Neemt de spelers (met portret) en de samenstelling van
 * de echte avond over, zodat je oefent met wat je gaat spelen.
 */
export function maakProef(opties: Partial<ProefInstellingen> = {}): string {
  ruimOp();
  const id = randomUUID();
  const context: Context = { proefId: id, db: geheugenDb() };
  const instellingen: ProefInstellingen = {
    kansGoed: Math.min(1, Math.max(0, opties.kansGoed ?? 0.7)),
    bots: opties.bots ?? true,
    gast: opties.gast?.trim() ? opties.gast.trim().slice(0, 24) : null,
  };

  // Wat de echte avond speelt, buiten de proefrit gelezen.
  const echtSpel = echte.select().from(spellen).where(eq(spellen.isActief, true)).get();
  const echteSpelers = echte.select().from(spelers).all().filter((s) => !s.isGast);

  binnen(context, () => {
    migreer(context.db);
    for (const s of echteSpelers) {
      db.insert(spelers).values({ naam: s.naam, foto: s.foto, isQuizmaster: s.isQuizmaster }).run();
    }
    const spel = maakSpel(echtSpel?.pakket ?? 'jaar2026');
    if (echtSpel) db.update(spellen).set({ samenstelling: echtSpel.samenstelling }).where(eq(spellen.id, spel.id)).run();
    if (instellingen.gast) voegDeelnemerToe({ ...spel, samenstelling: echtSpel?.samenstelling ?? spel.samenstelling }, instellingen.gast);
    // Het hostscherm op de proefpagina is meteen quizmaster.
    raakApparaatAan(tokenVoor(id, 'host'), 'quizmaster', null, 'Quizmaster');
  });

  const proef: Proef = {
    id, context, instellingen, aangemaakt: Date.now(), laatst: Date.now(),
    ingepland: new Set(), timers: new Set(), stop: () => {},
  };
  proeven.set(id, proef);

  // De bots luisteren binnen de proefrit mee, net als een telefoon.
  binnen(context, () => {
    const stopLuisteren = luister(() => botsKijken(proef));
    const hartslag = setInterval(() => binnen(context, () => botsMelden(proef)), 8_000);
    hartslag.unref?.();
    proef.stop = () => {
      stopLuisteren();
      clearInterval(hartslag);
      for (const t of proef.timers) clearTimeout(t);
    };
    botsMelden(proef);
  });
  return id;
}

export function stopProef(id: string) {
  const p = proeven.get(id);
  if (!p) return;
  p.stop();
  proeven.delete(id);
  vergeetProefPakketten(id);
}

export function zetInstellingen(id: string, nieuw: Partial<ProefInstellingen>) {
  const p = proeven.get(id);
  if (!p) return;
  if (nieuw.kansGoed !== undefined) p.instellingen.kansGoed = Math.min(1, Math.max(0, Number(nieuw.kansGoed) || 0));
  if (nieuw.bots !== undefined) p.instellingen.bots = !!nieuw.bots;
  binnen(p.context, () => {
    if (nieuw.gast !== undefined && nieuw.gast && !p.instellingen.gast) {
      const spel = actiefSpel();
      if (spel) voegDeelnemerToe(spel, nieuw.gast);
      p.instellingen.gast = nieuw.gast.trim().slice(0, 24);
    }
    botsMelden(p);
    const spel = actiefSpel();
    if (spel) bumpVersie(spel.id);
  });
}

function ruimOp() {
  const nu = Date.now();
  for (const [id, p] of proeven) if (nu - p.laatst > LEVENSDUUR_MS) stopProef(id);
}
setInterval(ruimOp, 10 * 60 * 1000).unref?.();

/* ---- De bots -------------------------------------------------------- */

/** Wie er door een echte telefoon gespeeld wordt; de rest is van de bots. */
function mensen(): Set<number> {
  const grens = Date.now() - MENS_STIL_MS;
  return new Set(
    db.select().from(apparaten).all()
      .filter((a) => a.rol === 'speler' && a.spelerId != null && !a.token.startsWith(BOT) && a.laatstGezien >= grens)
      .map((a) => a.spelerId!),
  );
}

/** De bots melden zich, zodat het hostscherm ze als verbonden ziet. */
function botsMelden(p: Proef) {
  const spel = actiefSpel();
  if (!spel) return;
  const bezet = mensen();
  for (const s of deelnemersVan(spel.id)) {
    const token = `${BOT}${s.id}`;
    if (p.instellingen.bots && !bezet.has(s.id)) raakApparaatAan(token, 'speler', s.id, s.naam);
    else db.delete(apparaten).where(eq(apparaten.token, token)).run();
  }
}

/** Kijkt na elke wijziging of er een vraag openstaat waar een bot nog iets op moet zeggen. */
function botsKijken(p: Proef) {
  if (!p.instellingen.bots) return;
  const spel = actiefSpel();
  if (!spel || spel.fase !== 'vraag' || !spel.klokEindigtOp) return;
  const { ronde, vraag } = huidige(spel);
  if (!ronde || !vraag) return;
  const sleutel = sleutelVan(spel.rondeIndex, spel.vraagIndex);
  const plan = `${sleutel}@${spel.klokEindigtOp - spel.klokDuurMs}`;
  if (p.ingepland.has(plan)) return;
  p.ingepland.add(plan);

  const lijst = deelnemersVan(spel.id);
  const bezet = mensen();
  const teamLijst = teamsVoorRonde(spel.id, spel.rondeIndex, ronde, lijst);
  const tijd = vraagTijd(ronde, vraag) * 1000;
  for (const team of teamLijst) {
    // Zit er een echte telefoon in het team, dan beslist die.
    if (team.leden.some((id) => bezet.has(id))) continue;
    const speler = team.leden[0];
    if (speler === undefined) continue;
    // Tussen anderhalve seconde en driekwart van de klok, zoals mensen aan tafel.
    const wacht = 1500 + Math.random() * Math.max(0, tijd * 0.75 - 1500);
    const t = setTimeout(() => {
      p.timers.delete(t);
      binnen(p.context, () => {
        const nu = actiefSpel();
        if (!nu || nu.fase !== 'vraag' || sleutelVan(nu.rondeIndex, nu.vraagIndex) !== sleutel) return;
        if (mensen().has(speler)) return;
        const r = leverIn(nu, speler, botAntwoord(ronde, vraag, lijst, p.instellingen.kansGoed));
        if (!('fout' in r)) bumpVersie(nu.id);
      });
    }, wacht);
    p.timers.add(t);
  }
}

const ONZIN = ['geen idee', 'Amsterdam', 'Spanje', 'de bakker', '42', 'Taylor Swift', 'februari', 'een olifant'];
const kies = <T>(lijst: T[]): T => lijst[Math.floor(Math.random() * lijst.length)];

/** Wat een bot intikt: het goede antwoord met kans `kansGoed`, anders iets ernaast. */
export function botAntwoord(ronde: Ronde, vraag: Vraag, lijst: { naam: string }[], kansGoed: number): string {
  const goed = Math.random() < kansGoed;
  switch (ronde.type) {
    case 'waarnietwaar':
      return (vraag.goed === true) === goed ? 'Waar' : 'Niet waar';
    case 'meerkeuze': {
      const n = vraag.opties?.length ?? 4;
      const juist = typeof vraag.goed === 'number' ? vraag.goed : 0;
      const keuze = goed ? juist : (juist + 1 + Math.floor(Math.random() * (n - 1))) % n;
      return String.fromCharCode(65 + keuze);
    }
    case 'dichtstbij': {
      const doel = typeof vraag.getal === 'number' ? vraag.getal : 100;
      const factor = goed ? 1 + (Math.random() - 0.5) * 0.1 : 0.4 + Math.random() * 1.4;
      return String(Math.round(doel * factor));
    }
    case 'stem':
      // Een 'goede' stem gaat naar de eerste naam, zodat er een meerderheid ontstaat.
      return goed ? (lijst[0]?.naam ?? '') : kies(lijst).naam;
    default:
      return goed && vraag.a ? vraag.a : kies(ONZIN);
  }
}

/* ---- Springen ------------------------------------------------------- */

export interface Onderdeel {
  id: string;
  hoofdstuk: string;
  label: string;
  /** Een kort etiket: 'open', 'antwoord', 'stand'… */
  soort: string;
}

type Doel =
  | { soort: 'lobby' }
  | { soort: 'trailer' }
  | { soort: 'ronde'; ri: number }
  | { soort: 'vraag'; ri: number; vi: number }
  | { soort: 'antwoord'; ri: number; vi: number }
  | { soort: 'cijfers'; ri: number }
  | { soort: 'stand'; ri: number }
  | { soort: 'einde' }
  | { soort: 'film' };

function leesDoel(id: string): Doel | null {
  if (id === 'lobby' || id === 'trailer' || id === 'einde' || id === 'film') return { soort: id };
  const m = /^r(\d+)(?:v(\d+)(a?)|(c)|(s))?$/.exec(id);
  if (!m) return null;
  const ri = Number(m[1]);
  if (m[2] !== undefined) return { soort: m[3] ? 'antwoord' : 'vraag', ri, vi: Number(m[2]) };
  if (m[4]) return { soort: 'cijfers', ri };
  if (m[5]) return { soort: 'stand', ri };
  return { soort: 'ronde', ri };
}

/** Elk onderdeel van de avond, in de volgorde waarin het voorbijkomt. */
export function onderdelen(id: string): Onderdeel[] {
  const ctx = zoekProef(id);
  if (!ctx) return [];
  return binnen(ctx, () => {
    const spel = actiefSpel();
    if (!spel) return [];
    const uit: Onderdeel[] = [
      { id: 'lobby', hoofdstuk: 'Begin', label: 'De lobby: aanmelden', soort: 'lobby' },
      { id: 'trailer', hoofdstuk: 'Begin', label: 'De trailer van het jaar', soort: 'film' },
    ];
    samengesteld(spel).forEach((r, ri) => {
      const hoofdstuk = `${ri + 1}. ${r.naam}`;
      uit.push({ id: `r${ri}`, hoofdstuk, label: 'Titelkaart', soort: 'ronde' });
      if (!isAfrekening(r)) {
        r.vragen.forEach((v, vi) => {
          const kort = v.v.length > 70 ? `${v.v.slice(0, 68)}…` : v.v;
          uit.push({ id: `r${ri}v${vi}`, hoofdstuk, label: `${vi + 1}. ${kort}`, soort: 'open' });
          uit.push({ id: `r${ri}v${vi}a`, hoofdstuk, label: `${vi + 1}. onthulling`, soort: 'antwoord' });
        });
      }
      if (r.cijfers) uit.push({ id: `r${ri}c`, hoofdstuk, label: isAfrekening(r) ? 'De voorspellingen' : 'De cijfers van het jaar', soort: 'cijfers' });
      uit.push({ id: `r${ri}s`, hoofdstuk, label: 'Tussenstand', soort: 'stand' });
    });
    uit.push({ id: 'einde', hoofdstuk: 'Einde', label: 'Het podium en de prijzen', soort: 'einde' });
    uit.push({ id: 'film', hoofdstuk: 'Einde', label: 'De film van het hele jaar', soort: 'film' });
    return uit;
  });
}

/** Het onderdeel waar de proefrit nu staat, in de vorm van `onderdelen`. */
export function huidigOnderdeel(spel: typeof spellen.$inferSelect): string {
  const ri = spel.rondeIndex;
  switch (spel.fase) {
    case 'lobby': return 'lobby';
    case 'jaaroverzicht': return spel.geeindigdOp ? 'film' : 'trailer';
    case 'ronde': return `r${ri}`;
    case 'vraag': return `r${ri}v${spel.vraagIndex}`;
    case 'antwoord': return `r${ri}v${spel.vraagIndex}a`;
    case 'cijfers': return `r${ri}c`;
    case 'stand': return `r${ri}s`;
    case 'einde': return 'einde';
    default: return '';
  }
}

/**
 * Laat de bots een vraag uit het verleden beantwoorden en rekent hem uit,
 * zoals de quizmaster zou doen. Antwoorden die er al staan (van een echte
 * telefoon) blijven staan.
 */
function vulVraag(spelId: number, rondes: Ronde[], ri: number, vi: number, kansGoed: number) {
  const ronde = rondes[ri];
  const vraag = ronde?.vragen[vi];
  if (!ronde || !vraag) return;
  const lijst = deelnemersVan(spelId);
  const teamLijst = teamsVoorRonde(spelId, ri, ronde, lijst);
  const sleutel = sleutelVan(ri, vi);
  const al = new Set(
    db.select({ inzender: antwoorden.inzender }).from(antwoorden)
      .where(and(eq(antwoorden.spelId, spelId), eq(antwoorden.vraagSleutel, sleutel))).all().map((r) => r.inzender),
  );
  const tijd = vraagTijd(ronde, vraag) * 1000;
  for (const team of teamLijst) {
    if (al.has(team.id) || team.leden[0] === undefined) continue;
    db.insert(antwoorden).values({
      spelId, vraagSleutel: sleutel, inzender: team.id, spelerId: team.leden[0],
      tekst: botAntwoord(ronde, vraag, lijst, kansGoed), ingediendOp: Date.now(),
      naMs: Math.round(1500 + Math.random() * tijd * 0.7),
    }).run();
  }
  if (scoorAutomatisch({ id: spelId, rondeIndex: ri, vraagIndex: vi }, ronde, vraag, lijst)) return;
  const rijen = db.select().from(antwoorden).where(and(eq(antwoorden.spelId, spelId), eq(antwoorden.vraagSleutel, sleutel))).all();
  const winnaars = rijen.filter((r) => beoordeel(ronde, vraag, r.tekst).goed).map((r) => r.inzender);
  schrijfUitdeling(spelId, sleutel, verdeelOverTeams(teamLijst, winnaars, {}, vraagPunten(ronde, vraag)));
  markeerAntwoorden(spelId, sleutel, winnaars);
}

/** Opent een onderdeel direct, met alles ervoor gespeeld en alles erna leeg. */
export function springNaar(id: string, onderdeel: string): boolean {
  const ctx = zoekProef(id);
  const p = proeven.get(id);
  const doel = leesDoel(onderdeel);
  if (!ctx || !p || !doel) return false;
  return binnen(ctx, () => {
    const spel = actiefSpel();
    if (!spel) return false;
    const rondes = samengesteld(spel);
    const ri = 'ri' in doel ? doel.ri : doel.soort === 'einde' || doel.soort === 'film' ? rondes.length : 0;
    if ('ri' in doel && !rondes[doel.ri]) return false;

    // Welke vragen er al gespeeld zijn als je hier binnenkomt.
    const gespeeld = (r: number, v: number) => {
      if (doel.soort === 'lobby' || doel.soort === 'trailer') return false;
      if (doel.soort === 'vraag') return r < doel.ri || (r === doel.ri && v < doel.vi);
      if (doel.soort === 'antwoord') return r < doel.ri || (r === doel.ri && v <= doel.vi);
      if (doel.soort === 'ronde') return r < ri;
      return r <= ri;
    };
    const weg: string[] = [];
    rondes.forEach((r, rr) => {
      if (isAfrekening(r)) return;
      r.vragen.forEach((_, vv) => {
        if (gespeeld(rr, vv)) {
          const heeft = db.select({ id: uitdelingen.id }).from(uitdelingen)
            .where(and(eq(uitdelingen.spelId, spel.id), eq(uitdelingen.vraagSleutel, sleutelVan(rr, vv)))).get();
          if (!heeft) vulVraag(spel.id, rondes, rr, vv, p.instellingen.kansGoed);
        } else {
          weg.push(sleutelVan(rr, vv));
        }
      });
    });
    if (weg.length) {
      db.delete(antwoorden).where(and(eq(antwoorden.spelId, spel.id), inArray(antwoorden.vraagSleutel, weg))).run();
      db.delete(uitdelingen).where(and(eq(uitdelingen.spelId, spel.id), inArray(uitdelingen.vraagSleutel, weg))).run();
    }

    const leeg = { klokLoopt: false, klokEindigtOp: null, klokDuurMs: 0, klokRestMs: 0, mediaSpeelt: false };
    const zet = (waarden: Partial<typeof spellen.$inferInsert>) =>
      db.update(spellen).set({ ...leeg, ...waarden }).where(eq(spellen.id, spel.id)).run();
    const klok = (ms: number) => ({ klokLoopt: true, klokDuurMs: ms, klokEindigtOp: Date.now() + ms, klokRestMs: ms });
    const laatste = Math.max(0, rondes.length - 1);

    switch (doel.soort) {
      case 'lobby':
        zet({ fase: 'lobby', rondeIndex: 0, vraagIndex: 0, geeindigdOp: null });
        break;
      case 'trailer':
        zet({ fase: 'jaaroverzicht', rondeIndex: 0, vraagIndex: 0, geeindigdOp: null, ...klok(jaaroverzichtVoor(recapAnalyse(), 0, false).seconden * 1000) });
        break;
      case 'ronde':
        teamsVoorRonde(spel.id, doel.ri, rondes[doel.ri], deelnemersVan(spel.id));
        zet({ fase: 'ronde', rondeIndex: doel.ri, vraagIndex: 0, geeindigdOp: null });
        break;
      case 'vraag': {
        const r = rondes[doel.ri];
        const v = r.vragen[doel.vi];
        if (!v) return false;
        teamsVoorRonde(spel.id, doel.ri, r, deelnemersVan(spel.id));
        zet({ fase: 'vraag', rondeIndex: doel.ri, vraagIndex: doel.vi, geeindigdOp: null, ...klok(vraagTijd(r, v) * 1000) });
        break;
      }
      case 'antwoord':
        if (!rondes[doel.ri].vragen[doel.vi]) return false;
        zet({ fase: 'antwoord', rondeIndex: doel.ri, vraagIndex: doel.vi, geeindigdOp: null });
        break;
      case 'cijfers':
        if (!rondes[doel.ri].cijfers) return false;
        zet({ fase: 'cijfers', rondeIndex: doel.ri, vraagIndex: 0, geeindigdOp: null });
        break;
      case 'stand':
        zet({ fase: 'stand', rondeIndex: doel.ri, vraagIndex: Math.max(0, rondes[doel.ri].vragen.length - 1), geeindigdOp: null });
        break;
      case 'einde':
        zet({ fase: 'einde', rondeIndex: laatste, vraagIndex: 0, geeindigdOp: spel.geeindigdOp ?? new Date().toISOString() });
        break;
      case 'film':
        zet({
          fase: 'jaaroverzicht', rondeIndex: laatste, vraagIndex: 0, geeindigdOp: spel.geeindigdOp ?? new Date().toISOString(),
          ...klok(jaaroverzichtVoor(recapAnalyse(), 0, true).seconden * 1000),
        });
        break;
    }
    bumpVersie(spel.id);
    return true;
  });
}

/** Een korte stand van zaken voor de proefpagina. */
export function proefOverzicht(id: string) {
  const ctx = zoekProef(id);
  const p = proeven.get(id);
  if (!ctx || !p) return null;
  return binnen(ctx, () => {
    const spel = actiefSpel();
    const bezet = mensen();
    return {
      id,
      instellingen: p.instellingen,
      nu: spel ? huidigOnderdeel(spel) : '',
      fase: spel?.fase ?? '',
      spelers: spel
        ? deelnemersVan(spel.id).map((s) => ({ id: s.id, naam: s.naam, mens: bezet.has(s.id) }))
        : [],
      aangemaakt: p.aangemaakt,
    };
  });
}

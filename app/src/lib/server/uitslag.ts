/**
 * De uitslag van een avond, ook van een eerdere.
 *
 * Oude spellen blijven in de database staan; dit leest er één terug in de
 * vorm die de uitslagpagina nodig heeft: de eindstand, de prijzen, en per
 * ronde en per vraag wie er punten kreeg.
 */
import { eq, desc } from 'drizzle-orm';
import { db } from './db/index';
import { spellen, uitdelingen, antwoorden, correcties } from './db/schema';
import { PAKKETTEN } from '$lib/content/packs';
import { samengesteld, deelnemersVan, standVan, prijzenVan, antwoordTekst, sleutelVan } from './spel';
import { telStand } from './scoring';
import type { Prijs } from './prijzen';

export interface UitslagOverzicht {
  id: number;
  naam: string;
  pakket: string;
  fase: string;
  isActief: boolean;
  gestartOp: string;
  geeindigdOp: string | null;
  aantalSpelers: number;
  winnaars: string[];
  punten: number;
}

export interface Uitslag {
  id: number;
  naam: string;
  pakket: string;
  fase: string;
  isActief: boolean;
  gestartOp: string;
  geeindigdOp: string | null;
  stand: { spelerId: number; naam: string; foto: string | null; punten: number; plek: number }[];
  prijzen: Prijs[];
  /** Per ronde de punten per speler, in de volgorde van de eindstand. */
  rondes: { naam: string; suit: string; type: string; punten: Record<number, number>; gespeeld: boolean }[];
  /** Elke gespeelde vraag met het antwoord en wie er punten kreeg. */
  vragen: { ronde: number; nummer: number; tekst: string; antwoord: string; goed: string[]; inzenders: number }[];
  correcties: { naam: string; punten: number; reden: string | null }[];
}

function naamVanPakket(id: string) {
  return PAKKETTEN[id]?.naam ?? id;
}

export function alleUitslagen(): UitslagOverzicht[] {
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
      return {
        id: spel.id,
        naam: spel.naam,
        pakket: naamVanPakket(spel.pakket),
        fase: spel.fase,
        isActief: spel.isActief,
        gestartOp: spel.gestartOp,
        geeindigdOp: spel.geeindigdOp,
        aantalSpelers: lijst.length,
        winnaars: top > 0 ? rijen.filter((r) => r.punten === top).map((r) => r.naam) : [],
        punten: top,
      };
    });
}

export function uitslagVan(spelId: number): Uitslag | null {
  const spel = db.select().from(spellen).where(eq(spellen.id, spelId)).get();
  if (!spel || !PAKKETTEN[spel.pakket]) return null;

  const lijst = deelnemersVan(spel.id);
  const totaal = standVan(spel.id);
  const gesorteerd = lijst
    .map((s) => ({ spelerId: s.id, naam: s.naam, foto: s.foto, punten: totaal[s.id] ?? 0 }))
    .sort((a, b) => b.punten - a.punten || a.naam.localeCompare(b.naam, 'nl'));
  // Gelijke punten, gelijke plek.
  const stand = gesorteerd.map((r, i) => ({
    ...r,
    plek: i > 0 && gesorteerd[i - 1].punten === r.punten ? 0 : i + 1,
  }));
  for (let i = 1; i < stand.length; i++) if (stand[i].plek === 0) stand[i].plek = stand[i - 1].plek;

  const rondesLijst = samengesteld(spel);
  const uitdelingRijen = db.select().from(uitdelingen).where(eq(uitdelingen.spelId, spel.id)).all();
  const antwoordRijen = db.select().from(antwoorden).where(eq(antwoorden.spelId, spel.id)).all();
  const correctieRijen = db.select().from(correcties).where(eq(correcties.spelId, spel.id)).all();
  const verdelingVan = new Map<string, Record<number, number>>();
  for (const r of uitdelingRijen) {
    try {
      verdelingVan.set(r.vraagSleutel, JSON.parse(r.verdeling));
    } catch { /* kapotte rij, telt niet mee */ }
  }
  const naamVan = (id: number) => lijst.find((s) => s.id === id)?.naam ?? '?';

  const rondes = rondesLijst.map((r, ri) => {
    const sleutels = r.vragen.map((_, vi) => sleutelVan(ri, vi));
    const punten = telStand(sleutels.map((k) => verdelingVan.get(k) ?? {}));
    return {
      naam: r.naam,
      suit: r.suit,
      type: r.type,
      punten,
      gespeeld: sleutels.some((k) => verdelingVan.has(k) || antwoordRijen.some((a) => a.vraagSleutel === k)),
    };
  });

  const vragen: Uitslag['vragen'] = [];
  rondesLijst.forEach((r, ri) => {
    r.vragen.forEach((v, vi) => {
      const sleutel = sleutelVan(ri, vi);
      const verdeling = verdelingVan.get(sleutel);
      const inzenders = antwoordRijen.filter((a) => a.vraagSleutel === sleutel).length;
      if (!verdeling && !inzenders) return;
      vragen.push({
        ronde: ri,
        nummer: vi + 1,
        tekst: v.v,
        antwoord: r.type === 'stem' ? 'de groep besliste' : antwoordTekst(r, v),
        goed: Object.entries(verdeling ?? {}).filter(([, p]) => p > 0).map(([id]) => naamVan(Number(id))),
        inzenders,
      });
    });
  });

  return {
    id: spel.id,
    naam: spel.naam,
    pakket: naamVanPakket(spel.pakket),
    fase: spel.fase,
    isActief: spel.isActief,
    gestartOp: spel.gestartOp,
    geeindigdOp: spel.geeindigdOp,
    stand,
    prijzen: prijzenVan(spel, lijst),
    rondes,
    vragen,
    correcties: correctieRijen.map((c) => ({ naam: naamVan(c.spelerId), punten: c.punten, reden: c.reden })),
  };
}

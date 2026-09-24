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
import {
  vraagPunten, vraagTijd, verdeelOverTeams, bepaalDichtstbij, bepaalStem, gissingenUitAntwoorden, telStand,
} from './scoring';
import { beoordeel, leesGetal } from './antwoord';
import { bepaalPrijzen, type Prijs } from './prijzen';
import { meldWijziging } from './bus';
import type { PubliekeStaat, PubliekeInzending, Fase, Rol, Onthulling } from '$lib/shared/state';
import { nieuwjaarRond, leesNieuwjaarOp, type Nieuwjaar } from '$lib/shared/nieuwjaar';
import { recapAnalyse } from './recap/bron';
import { verlevendig } from './recap/vragen';
import { cijfersVoor } from './recap/cijfers';
import { jaaroverzichtVoor } from './jaaroverzicht';
import { beoordeelVoorspellingen, type Omgeving } from './recap/voorspellingen';
import type { Analyse } from './recap/analyse';

/** Een apparaat geldt als verbonden zolang het zich binnen deze tijd meldde. */
const STIL_DREMPEL_MS = 20_000;

/** Een naam van een gast: kort genoeg voor een naamplaat op de televisie. */
export const MAX_NAAM_TEKENS = 24;

export function actiefSpel() {
  return db.select().from(spellen).where(eq(spellen.isActief, true)).orderBy(desc(spellen.id)).get();
}

/* De levende vragen krijgen hun tekst en antwoord uit de cijfers van
   resolution-recap. Dat gebeurt één keer per set cijfers; daarna geeft
   pakketVan steeds dezelfde objecten terug, zodat een vraag overal in de
   server hetzelfde object is. */
const levend = new Map<string, { analyse: Analyse; aantalSpelers: number | null; pakket: Pakket }>();

/** Wat de voorspellingen nodig hebben buiten de recap om: wie er vanavond meespeelt. */
export function omgevingVan(spelId: number): Omgeving {
  // De quizmaster speelt niet mee, maar is er wel: 'met hoeveel mensen spelen
  // we de quiz' telt hem gewoon mee.
  const n = db.select({ id: deelnemers.spelerId }).from(deelnemers).where(eq(deelnemers.spelId, spelId)).all().length;
  const quizmaster = db.select({ id: spelers.id }).from(spelers).where(eq(spelers.isQuizmaster, true)).all().length;
  return { analyse: recapAnalyse(), aantalSpelers: n > 0 ? n + quizmaster : null };
}

export function pakketVan(spel: { id?: number; pakket: string }): Pakket {
  const p = PAKKETTEN[spel.pakket];
  if (!p) throw new Error(`onbekend pakket: ${spel.pakket}`);
  const analyse = recapAnalyse();
  const omgeving = spel.id !== undefined ? omgevingVan(spel.id) : { analyse, aantalSpelers: null };
  const bekend = levend.get(spel.pakket);
  if (bekend && bekend.analyse === analyse && bekend.aantalSpelers === omgeving.aantalSpelers) return bekend.pakket;
  const uitslag = beoordeelVoorspellingen(omgeving);
  const pakket: Pakket = {
    ...p,
    rondes: p.rondes.map((r) => {
      const vragen = r.vragen.map((v) => verlevendig(v, analyse, uitslag));
      // Een ronde die op cijfers wacht, is klaar zodra al zijn vragen leven.
      return { ...r, vragen, teVullen: r.teVullen && vragen.some((v) => v.teVullen) };
    }),
  };
  levend.set(spel.pakket, { analyse, aantalSpelers: omgeving.aantalSpelers, pakket });
  return pakket;
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

/**
 * Een gast schuift aan, ook midden in de avond.
 *
 * Een bestaande naam wordt hergebruikt (zodat "Tom" van vorig jaar zijn
 * portret terugkrijgt), een nieuwe naam wordt als gast aangemaakt: die doet
 * niet vanzelf mee aan het volgende spel. Loopt er al een ronde, dan krijgt
 * de gast meteen een plek in de teamindeling van die ronde, anders zou zijn
 * telefoon niets kunnen inleveren.
 */
export function voegDeelnemerToe(spel: { id: number; pakket: string; samenstelling: string; rondeIndex: number }, naam: string) {
  const schoon = naam.replace(/\s+/g, ' ').trim().slice(0, MAX_NAAM_TEKENS);
  if (!schoon) throw new Error('geen naam');

  let speler = db.select().from(spelers).where(eq(spelers.naam, schoon)).get();
  if (!speler) {
    speler = db.insert(spelers).values({ naam: schoon, isGast: true }).returning().get();
  }
  if (speler.isQuizmaster) throw new Error('de quizmaster speelt niet mee');

  const alDeelnemer = db
    .select()
    .from(deelnemers)
    .where(and(eq(deelnemers.spelId, spel.id), eq(deelnemers.spelerId, speler.id)))
    .get();
  if (alDeelnemer) return { speler, nieuw: false };
  db.insert(deelnemers).values({ spelId: spel.id, spelerId: speler.id }).run();

  // Zit er al een teamindeling voor de huidige ronde, dan hoort de gast daar bij.
  const ronde = samengesteld(spel)[spel.rondeIndex];
  if (ronde) {
    const rijen = db.select().from(teams).where(and(eq(teams.spelId, spel.id), eq(teams.rondeIndex, spel.rondeIndex))).all();
    if (rijen.length) {
      const lijst: Team[] = rijen.map((r) => ({ id: r.teamKey, naam: r.naam, suit: r.suit, leden: JSON.parse(r.leden) as number[] }));
      if (!lijst.some((t) => t.leden.includes(speler.id))) {
        const modus = ronde.teamModus ?? 'individueel';
        if (modus === 'individueel') {
          lijst.push({ id: `s_${speler.id}`, naam: speler.naam, suit: ronde.suit, leden: [speler.id] });
        } else {
          // Bij 'samen' is er één team; bij 'teams' het kleinste.
          const kleinste = lijst.reduce((a, b) => (b.leden.length < a.leden.length ? b : a));
          kleinste.leden.push(speler.id);
        }
        schrijfTeams(spel.id, spel.rondeIndex, lijst);
      }
    }
  }
  return { speler, nieuw: true };
}

export function standVan(spelId: number) {
  const rijen = db.select().from(uitdelingen).where(eq(uitdelingen.spelId, spelId)).all();
  const cor = db.select().from(correcties).where(eq(correcties.spelId, spelId)).all();
  return telStand(
    rijen.map((r) => JSON.parse(r.verdeling)),
    cor.map((c) => ({ spelerId: c.spelerId, punten: c.punten })),
  );
}

/**
 * De prijzen voor de uitslag. Rekent alleen bij de uitslag zelf, want het
 * leest alle antwoorden van de avond — vaak genoeg, niet bij elke tik.
 */
export function prijzenVan(spel: { id: number; pakket: string; samenstelling: string }, lijst: { id: number; naam: string }[]): Prijs[] {
  const rondes = samengesteld(spel);
  const uitdelingRijen = db.select().from(uitdelingen).where(eq(uitdelingen.spelId, spel.id)).all();
  const antwoordRijen = db.select().from(antwoorden).where(eq(antwoorden.spelId, spel.id)).all();
  const teamRijen = db.select().from(teams).where(eq(teams.spelId, spel.id)).all();
  const ledenVan = (rondeIndex: number, inzender: string): number[] => {
    const t = teamRijen.find((r) => r.rondeIndex === rondeIndex && r.teamKey === inzender);
    try {
      return t ? (JSON.parse(t.leden) as number[]) : [];
    } catch {
      return [];
    }
  };
  const uitdelingLijst = uitdelingRijen.map((r) => {
    try {
      return { vraagSleutel: r.vraagSleutel, verdeling: JSON.parse(r.verdeling) as Record<number, number> };
    } catch {
      return { vraagSleutel: r.vraagSleutel, verdeling: {} };
    }
  });

  // Alleen vragen die echt aan bod kwamen tellen mee voor reeksen en de
  // moeilijkste vraag: een avond die vroeg stopt heeft geen "onbeantwoorde" rest.
  const gespeeld = new Set([...uitdelingRijen.map((r) => r.vraagSleutel), ...antwoordRijen.map((r) => r.vraagSleutel)]);
  const vragen: { sleutel: string; tekst: string; inzenders: number }[] = [];
  rondes.forEach((r, ri) => {
    r.vragen.forEach((v, vi) => {
      const sleutel = sleutelVan(ri, vi);
      if (!gespeeld.has(sleutel)) return;
      vragen.push({ sleutel, tekst: v.v, inzenders: antwoordRijen.filter((a) => a.vraagSleutel === sleutel).length });
    });
  });

  return bepaalPrijzen({
    spelers: lijst,
    uitdelingen: uitdelingLijst,
    goedeAntwoorden: antwoordRijen
      .filter((r) => r.isGoed === true)
      .map((r) => ({
        spelerIds: ledenVan(Number(r.vraagSleutel.split(':')[0]), r.inzender),
        naMs: r.naMs,
      })),
    rondeNamen: rondes.map((r) => r.naam),
    vragen,
  });
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

/** De tekst waarmee het juiste antwoord op het scherm komt. */
export function antwoordTekst(ronde: Ronde, vraag: Vraag): string {
  if (ronde.type === 'waarnietwaar') return vraag.goed === true ? 'Waar' : 'Niet waar';
  if (ronde.type === 'meerkeuze' && vraag.opties && typeof vraag.goed === 'number') {
    return `${String.fromCharCode(65 + vraag.goed)} — ${vraag.opties[vraag.goed]}`;
  }
  if (ronde.type === 'dichtstbij' && typeof vraag.getal === 'number') {
    return `${vraag.getal.toLocaleString('nl-NL')}${vraag.eenheid ? ' ' + vraag.eenheid : ''}`;
  }
  return vraag.a ?? '';
}

/**
 * De momentopname die naar de clients gaat.
 *
 * In de fase 'vraag' zit er geen antwoord in het pakketje — ook niet voor de
 * quizmaster, want diens scherm hangt vaak aan dezelfde televisie.
 *
 * Bij elke wijziging vraagt elke open verbinding om deze momentopname. Die is
 * per versie en rol steeds dezelfde, dus hij wordt heel even bewaard: met
 * zeven schermen scheelt dat zeven keer dezelfde reeks databasevragen.
 */
const GEHEUGEN_MS = 1000;
let geheugen: { sleutel: string; op: number; staat: PubliekeStaat } | null = null;

export function bouwStaat(rol: Rol): PubliekeStaat | null {
  const spel = actiefSpel();
  if (!spel) return null;

  const sleutelGeheugen = `${spel.id}:${spel.versie}:${rol}`;
  const nu = Date.now();
  if (geheugen && geheugen.sleutel === sleutelGeheugen && nu - geheugen.op < GEHEUGEN_MS) return geheugen.staat;

  const rondes = samengesteld(spel);
  const ronde: Ronde | undefined = rondes[spel.rondeIndex];
  const vraag: Vraag | undefined = ronde?.vragen[spel.vraagIndex];
  const lijst = deelnemersVan(spel.id);
  const teamLijst = ronde ? teamsVoorRonde(spel.id, spel.rondeIndex, ronde, lijst) : [];
  const stand = standVan(spel.id);

  const apparaatRijen = db.select().from(apparaten).all();
  const laatsteVan = new Map<number, number>();
  for (const a of apparaatRijen) {
    if (a.spelerId == null) continue;
    laatsteVan.set(a.spelerId, Math.max(laatsteVan.get(a.spelerId) ?? 0, a.laatstGezien));
  }

  const sleutel = sleutelVan(spel.rondeIndex, spel.vraagIndex);
  const inzendingRijen = db
    .select()
    .from(antwoorden)
    .where(and(eq(antwoorden.spelId, spel.id), eq(antwoorden.vraagSleutel, sleutel)))
    .all()
    .sort((a, b) => a.ingediendOp - b.ingediendOp);
  const ingeleverd = inzendingRijen.map((r) => r.inzender);

  // Pas bij de onthulling mag de kamer zien wat iedereen heeft ingetikt.
  // Tot die tijd blijft het bij namen, anders kan een team meelezen.
  const onthuld = spel.fase === 'antwoord';
  const inzendingen: PubliekeInzending[] = onthuld
    ? inzendingRijen.map((r) => ({
        inzender: r.inzender,
        tekst: r.tekst,
        isGoed: r.isGoed,
        naMs: r.naMs,
        getal: ronde?.type === 'dichtstbij' ? leesGetal(r.tekst) : null,
      }))
    : [];
  const uitdelingRij = onthuld
    ? db.select().from(uitdelingen).where(and(eq(uitdelingen.spelId, spel.id), eq(uitdelingen.vraagSleutel, sleutel))).get()
    : undefined;
  let uitdeling: Record<number, number> = {};
  try {
    uitdeling = uitdelingRij ? JSON.parse(uitdelingRij.verdeling) : {};
  } catch {
    uitdeling = {};
  }

  // Waar/niet waar is óók een keuzevraag. Door hier twee opties mee te
  // sturen ziet de kamer op de televisie waar tussen gekozen wordt, in
  // plaats van alleen de stelling. Bij een stemvraag zijn de opties de
  // mensen aan tafel.
  const opties =
    ronde?.type === 'waarnietwaar' ? ['Waar', 'Niet waar']
      : ronde?.type === 'stem' ? lijst.map((s) => s.naam)
        : vraag?.opties;
  const goedeOptieIndex = !ronde || !vraag
    ? undefined
    : ronde.type === 'waarnietwaar'
      ? (vraag.goed === true ? 0 : 1)
      : typeof vraag.goed === 'number'
        ? vraag.goed
        : undefined;

  let onthulling: Onthulling | null = null;
  if (spel.fase === 'antwoord' && ronde && vraag) {
    let tekst = antwoordTekst(ronde, vraag);
    let stemmen: Onthulling['stemmen'];
    if (ronde.type === 'stem') {
      const uitslag = bepaalStem(inzendingRijen);
      stemmen = uitslag?.telling ?? [];
      tekst = uitslag
        ? uitslag.gekozen.join(' & ')
        : 'Niemand heeft gestemd';
    }
    onthulling = {
      antwoord: tekst,
      toelichting: vraag.toelichting,
      goedeOptie: goedeOptieIndex,
      getal: ronde.type === 'dichtstbij' && typeof vraag.getal === 'number' ? vraag.getal : undefined,
      eenheid: ronde.type === 'dichtstbij' ? vraag.eenheid : undefined,
      stemmen,
    };
  }

  const staat: PubliekeStaat = {
    versie: spel.versie,
    spelId: spel.id,
    fase: spel.fase as Fase,
    quizNaam: pakketVan(spel).naam,
    rondeIndex: spel.rondeIndex,
    rondeAantal: rondes.length,
    ronde: ronde
      ? {
          naam: ronde.naam, suit: ronde.suit, thema: ronde.thema,
          sfeer: ronde.sfeer ?? 'vilt', uitleg: ronde.uitleg,
          teamModus: ronde.teamModus, vragenAantal: ronde.vragen.length,
          cijfers: ronde.cijfers ?? null,
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
    mediaSpeelt: spel.mediaSpeelt,
    pauze: spel.pauze === 'pauze' || spel.pauze === 'nieuwjaar' ? spel.pauze : null,
    nieuwjaar: nieuwjaarVoor(nu),
    prijzen: spel.fase === 'einde' ? prijzenVan(spel, lijst) : [],
    cijfers: spel.fase === 'cijfers' && ronde?.cijfers ? cijfersVoor(ronde.cijfers, recapAnalyse(), spel.vraagIndex, omgevingVan(spel.id)) : null,
    // De balken gaan eraf zodra de avond voorbij is: dan is alles gevraagd,
    // en draait dezelfde film als jaaroverzicht mét de antwoorden erin.
    jaaroverzicht:
      spel.fase === 'jaaroverzicht'
        ? jaaroverzichtVoor(recapAnalyse(), spel.vraagIndex, spel.geeindigdOp !== null)
        : null,
    ingeleverd,
    inzendingen,
    uitdeling,
  };
  geheugen = { sleutel: sleutelGeheugen, op: nu, staat };
  return staat;
}

/* Voor een generale repetitie kan middernacht verzet worden met NIEUWJAAR_OP
   (zie nieuwjaar.ts). '+10' telt vanaf de eerste keer dat de server het leest,
   niet bij elke momentopname opnieuw — anders schuift middernacht mee. */
let repetitie: { waarde: string; op: number | null } | null = null;

export function nieuwjaarVoor(nu: number): Nieuwjaar {
  const waarde = process.env.NIEUWJAAR_OP ?? '';
  if (!repetitie || repetitie.waarde !== waarde) repetitie = { waarde, op: leesNieuwjaarOp(waarde, nu) };
  if (repetitie.op === null) return nieuwjaarRond(nu);
  return { op: repetitie.op, jaar: nieuwjaarRond(nu).jaar };
}

/** De huidige ronde en vraag, of null als het spel daar niet staat. */
export function huidige(spel: { pakket: string; samenstelling: string; rondeIndex: number; vraagIndex: number }) {
  const rondes = samengesteld(spel);
  const ronde = rondes[spel.rondeIndex];
  const vraag = ronde?.vragen[spel.vraagIndex];
  return { rondes, ronde, vraag };
}

/** Vervangt de verdeling van één vraag in zijn geheel. Zie scoring.ts. */
export function schrijfUitdeling(spelId: number, vraagSleutel: string, verdeling: Record<number, number>) {
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

/** Zet de vinkjes op de antwoorden van één vraag: goed voor de winnaars, fout voor de rest. */
export function markeerAntwoorden(spelId: number, vraagSleutel: string, winnaars: string[]) {
  const rijen = db.select().from(antwoorden).where(and(eq(antwoorden.spelId, spelId), eq(antwoorden.vraagSleutel, vraagSleutel))).all();
  for (const r of rijen) {
    db.update(antwoorden).set({ isGoed: winnaars.includes(r.inzender) }).where(eq(antwoorden.id, r.id)).run();
  }
}

/**
 * Rekent de vragen uit waar de machine dat zeker kan: dichtstbij en stem.
 * Draait vanzelf bij de onthulling en op verzoek van de quizmaster; die
 * kan het resultaat daarna altijd nog met de hand bijsturen.
 *
 * Geeft terug of er iets te rekenen viel.
 */
export function scoorAutomatisch(
  spel: { id: number; rondeIndex: number; vraagIndex: number },
  ronde: Ronde,
  vraag: Vraag,
  lijst: { id: number; naam: string }[],
): boolean {
  const sleutel = sleutelVan(spel.rondeIndex, spel.vraagIndex);
  const rijen = db
    .select({ inzender: antwoorden.inzender, tekst: antwoorden.tekst })
    .from(antwoorden)
    .where(and(eq(antwoorden.spelId, spel.id), eq(antwoorden.vraagSleutel, sleutel)))
    .all();
  const punten = vraagPunten(ronde, vraag);

  let winnaars: string[] = [];
  let puntenPerTeam: Record<string, number> = {};
  if (ronde.type === 'dichtstbij' && typeof vraag.getal === 'number') {
    const uitslag = bepaalDichtstbij(gissingenUitAntwoorden(rijen), vraag.getal, punten);
    if (uitslag) {
      winnaars = uitslag.winnaars;
      puntenPerTeam = uitslag.puntenPerTeam;
    }
  } else if (ronde.type === 'stem') {
    const uitslag = bepaalStem(rijen);
    if (uitslag) winnaars = uitslag.winnaars;
  } else {
    return false;
  }

  const teamLijst = teamsVoorRonde(spel.id, spel.rondeIndex, ronde, lijst);
  schrijfUitdeling(spel.id, sleutel, verdeelOverTeams(teamLijst, winnaars, puntenPerTeam, punten));
  markeerAntwoorden(spel.id, sleutel, winnaars);
  return true;
}

export { vraagPunten, vraagTijd, verdeelOverTeams, bepaalDichtstbij, bepaalStem, gissingenUitAntwoorden, beoordeel, verplaats };

/**
 * De spelmotor: leest en schrijft de stand van de avond.
 *
 * De server is de enige bron van waarheid. Clients sturen opdrachten en
 * krijgen een momentopname terug; ze rekenen zelf niets uit behalve hoeveel
 * seconden er nog op de klok staan, en dat doen ze op basis van de servertijd
 * die in elke momentopname meekomt.
 */
import { eq, and, desc } from 'drizzle-orm';
import { db, huidigeProef } from './db/index';
import { spelers, spellen, deelnemers, teams, antwoorden, uitdelingen, correcties, apparaten } from './db/schema';
import { PAKKETTEN } from '$lib/content/packs';
import type { Pakket, Ronde, Vraag } from '$lib/content/types';
import { maakTeams, verplaats, type Team } from './teams';
import { zorgVoorDieren } from './dieren';
import {
  vraagPunten, vraagTijd, verdeelOverTeams, bepaalDichtstbij, bepaalStem, gissingenUitAntwoorden, telStand,
} from './scoring';
import { beoordeel, leesGetal } from './antwoord';
import { bepaalPrijzen, type Prijs } from './prijzen';
import { meldWijziging } from './bus';
import { isAfrekening, type PubliekeStaat, type PubliekeInzending, type Fase, type Rol, type Onthulling } from '$lib/shared/state';
import { recapAnalyse } from './recap/bron';
import { verlevendig } from './recap/vragen';
import { cijfersVoor } from './recap/cijfers';
import { jaaroverzichtVoor } from './jaaroverzicht';
import { beoordeelVoorspellingen, verdelingUitVoorspellingen, type Omgeving } from './recap/voorspellingen';
import type { Analyse } from './recap/analyse';
import { berekenBonussen, opScorebord, PUNT_WAARDE, type BonusVraag } from './bonus';
import { vermenigvuldigers, vermenigvuldigerVan } from './vermenigvuldiger';
import { ingekort } from './klok';
import type { Verdeling } from './scoring';
import { dierVan } from '$lib/shared/dieren';

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
  const namen = deelnemersVan(spelId).map((s) => s.naam);
  const quizmasters = db.select({ naam: spelers.naam }).from(spelers).where(eq(spelers.isQuizmaster, true)).all();
  return {
    analyse: recapAnalyse(),
    aantalSpelers: namen.length > 0 ? namen.length + quizmasters.length : null,
    deelnemers: namen,
    quizmaster: quizmasters[0]?.naam ?? null,
  };
}

/** Ruimt de bewaarde pakketten van een opgeruimde proefrit op. */
export function vergeetProefPakketten(proefId: string) {
  for (const sleutel of levend.keys()) if (sleutel.startsWith(`${proefId}:`)) levend.delete(sleutel);
}

export function pakketVan(spel: { id?: number; pakket: string }): Pakket {
  const p = PAKKETTEN[spel.pakket];
  if (!p) throw new Error(`onbekend pakket: ${spel.pakket}`);
  const analyse = recapAnalyse();
  const omgeving = spel.id !== undefined ? omgevingVan(spel.id) : { analyse, aantalSpelers: null };
  // Een proefrit heeft een eigen database en dus een eigen aantal spelers.
  const cacheSleutel = `${huidigeProef() ?? ''}:${spel.pakket}`;
  const bekend = levend.get(cacheSleutel);
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
  levend.set(cacheSleutel, { analyse, aantalSpelers: omgeving.aantalSpelers, pakket });
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
    .select({ id: spelers.id, naam: spelers.naam, foto: spelers.foto, dier: spelers.dier, dierNaam: spelers.dierNaam })
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
    zorgVoorDieren();
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

/**
 * De punten van de afrekening van de voorspellingen, zodra die ronde
 * voorbij is. Ze worden niet opgeslagen maar afgeleid van waar het spel
 * staat: een stap terug of 'ongedaan' neemt ze vanzelf weer mee terug, en
 * een uitkomst die je vóór de uitslag nog invult telt gewoon mee.
 *
 * Ze staan onder de sleutel van de eerste vraag van die ronde, zodat de
 * uitslag en de prijzen ze bij de juiste ronde optellen.
 */
export function afrekeningVan(spel: { id: number; pakket: string; samenstelling: string; fase: string; rondeIndex: number; geeindigdOp: string | null }) {
  const ri = samengesteld(spel).findIndex((r) => isAfrekening(r));
  if (ri < 0) return null;
  const voorbij =
    spel.fase === 'einde' ||
    // De film na de uitslag: de avond is voorbij, ook als dit de laatste ronde was.
    (spel.fase === 'jaaroverzicht' && spel.geeindigdOp !== null) ||
    spel.rondeIndex > ri ||
    (spel.rondeIndex === ri && spel.fase === 'stand');
  if (!voorbij) return null;
  const uitslag = beoordeelVoorspellingen(omgevingVan(spel.id));
  return { rondeIndex: ri, vraagSleutel: sleutelVan(ri, 0), verdeling: verdelingUitVoorspellingen(uitslag.stand, deelnemersVan(spel.id)) };
}

/** Alle uitdelingen van een spel, met de afrekening van de voorspellingen erbij. */
export function uitdelingenVan(spel: Parameters<typeof afrekeningVan>[0]): { vraagSleutel: string; verdeling: Record<number, number> }[] {
  const lijst = db
    .select()
    .from(uitdelingen)
    .where(eq(uitdelingen.spelId, spel.id))
    .all()
    .flatMap((r) => {
      try {
        return [{ vraagSleutel: r.vraagSleutel, verdeling: JSON.parse(r.verdeling) as Record<number, number> }];
      } catch {
        return [];
      }
    });
  const afrekening = afrekeningVan(spel);
  if (afrekening) lijst.push({ vraagSleutel: afrekening.vraagSleutel, verdeling: afrekening.verdeling });
  return lijst;
}

/**
 * De bonussen van een spel, afgeleid uit wat er vastligt. Zie bonus.ts.
 * `verdelingen` geeft per sleutel de punten mét bonus, de afrekening van de
 * voorspellingen inbegrepen.
 */
export function bonussenVan(spel: Parameters<typeof afrekeningVan>[0]) {
  const verdelingVan = new Map<string, Verdeling>();
  for (const u of uitdelingenVan(spel)) {
    // Twee uitdelingen onder één sleutel (een vraag én de afrekening) tellen allebei.
    const eerder = verdelingVan.get(u.vraagSleutel);
    verdelingVan.set(u.vraagSleutel, eerder ? telStand([eerder, u.verdeling]) : u.verdeling);
  }
  const rondes = PAKKETTEN[spel.pakket] ? samengesteld(spel) : [];
  const dubbel = vermenigvuldigers(spel.id, rondes);
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

  const vragen: BonusVraag[] = [];
  rondes.forEach((r, ri) => {
    // De afrekening van de voorspellingen is geen vraag: die maakt geen reeks en breekt er ook geen.
    if (isAfrekening(r)) return;
    r.vragen.forEach((v, vi) => {
      const sleutel = sleutelVan(ri, vi);
      vragen.push({
        sleutel,
        type: r.type,
        teamModus: r.teamModus ?? 'individueel',
        duurMs: vraagTijd(r, v) * 1000,
        vermenigvuldiger: vermenigvuldigerVan(dubbel[ri], vi),
        verdeling: verdelingVan.get(sleutel) ?? null,
        antwoorden: antwoordRijen
          .filter((a) => a.vraagSleutel === sleutel)
          .map((a) => ({ inzender: a.inzender, isGoed: a.isGoed, naMs: a.naMs, leden: ledenVan(ri, a.inzender) })),
      });
    });
  });

  const bonus = berekenBonussen(vragen);
  const verdelingen = new Map<string, Verdeling>();
  // De afrekening en uitdelingen bij vragen die niet (meer) in de
  // samenstelling staan, tellen gewoon mee tegen de puntwaarde, zonder
  // snelheid of bonus: de stand verliest nooit punten.
  for (const [sleutel, v] of verdelingVan) verdelingen.set(sleutel, bonus.perVraag.get(sleutel)?.punten ?? opScorebord(v));
  return { verdelingen, bonus, dubbel };
}

export function standVan(spelId: number) {
  const spel = db.select().from(spellen).where(eq(spellen.id, spelId)).get();
  if (!spel) return {};
  const cor = db.select().from(correcties).where(eq(correcties.spelId, spelId)).all();
  return telStand(
    [...bonussenVan(spel).verdelingen.values()],
    cor.map((c) => ({ spelerId: c.spelerId, punten: c.punten })),
  );
}

/**
 * De prijzen voor de uitslag. Rekent alleen bij de uitslag zelf, want het
 * leest alle antwoorden van de avond — vaak genoeg, niet bij elke tik.
 */
export function prijzenVan(spel: Parameters<typeof afrekeningVan>[0], lijst: { id: number; naam: string }[]): Prijs[] {
  const rondes = samengesteld(spel);
  // Met bonus, zodat 'beste ronde' en 'comeback' kloppen met de stand.
  const uitdelingLijst = [...bonussenVan(spel).verdelingen].map(([vraagSleutel, verdeling]) => ({ vraagSleutel, verdeling }));
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

  // Alleen vragen die echt aan bod kwamen tellen mee voor reeksen en de
  // moeilijkste vraag: een avond die vroeg stopt heeft geen "onbeantwoorde" rest.
  // De afrekening van de voorspellingen had geen vragen; die telt alleen
  // mee voor de rondeprijzen.
  const gespeeld = new Set([...uitdelingLijst.map((r) => r.vraagSleutel), ...antwoordRijen.map((r) => r.vraagSleutel)]);
  const vragen: { sleutel: string; tekst: string; inzenders: number }[] = [];
  rondes.forEach((r, ri) => {
    if (isAfrekening(r)) return;
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

  // Een proefrit heeft een eigen database, dus spelnummers kunnen samenvallen.
  const sleutelGeheugen = `${huidigeProef() ?? ''}:${spel.id}:${spel.versie}:${rol}`;
  const nu = Date.now();
  if (geheugen && geheugen.sleutel === sleutelGeheugen && nu - geheugen.op < GEHEUGEN_MS) return geheugen.staat;

  const rondes = samengesteld(spel);
  const ronde: Ronde | undefined = rondes[spel.rondeIndex];
  const vraag: Vraag | undefined = ronde?.vragen[spel.vraagIndex];
  const lijst = deelnemersVan(spel.id);
  const teamLijst = ronde ? teamsVoorRonde(spel.id, spel.rondeIndex, ronde, lijst) : [];
  const cor = db.select().from(correcties).where(eq(correcties.spelId, spel.id)).all();
  const bonussen = bonussenVan(spel);
  const stand = telStand(
    [...bonussen.verdelingen.values()],
    cor.map((c) => ({ spelerId: c.spelerId, punten: c.punten })),
  );

  const dezeRonde = telStand(
    [...bonussen.verdelingen.entries()].filter(([k]) => k.startsWith(`${spel.rondeIndex}:`)).map(([, v]) => v),
  );

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
  const uitdeling: Record<number, number> = onthuld ? (bonussen.verdelingen.get(sleutel) ?? {}) : {};
  const vraagBonus = onthuld ? bonussen.bonus.perVraag.get(sleutel) : undefined;
  const bonusLijst: PubliekeStaat['bonussen'] = [];
  if (vraagBonus) {
    for (const id of Object.keys(vraagBonus.reeks)) {
      bonusLijst.push({ spelerId: Number(id), soort: 'reeks', punten: vraagBonus.reeks[Number(id)], opRij: vraagBonus.opRij[Number(id)] });
    }
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
          teamModus: ronde.teamModus, type: ronde.type, vragenAantal: ronde.vragen.length,
          cijfers: ronde.cijfers ?? null,
          dubbel: bonussen.dubbel[spel.rondeIndex]?.dubbel ?? false,
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
            maximaal: vraagPunten(ronde, vraag) * PUNT_WAARDE * vermenigvuldigerVan(bonussen.dubbel[spel.rondeIndex], spel.vraagIndex),
            vermenigvuldiger: vermenigvuldigerVan(bonussen.dubbel[spel.rondeIndex], spel.vraagIndex),
            goud: bonussen.dubbel[spel.rondeIndex]?.goud === spel.vraagIndex,
          }
        : null,
    onthulling,
    teams: teamLijst,
    spelers: lijst.map((s) => {
      const laatste = laatsteVan.get(s.id) ?? null;
      return {
        id: s.id, naam: s.naam, foto: s.foto, dier: dierVan(s.dier, s.naam).sleutel, dierNaam: s.dierNaam,
        stilSinds: laatste ? Math.round((nu - laatste) / 1000) : null,
        verbonden: laatste != null && nu - laatste < STIL_DREMPEL_MS,
      };
    }),
    stand: lijst
      .map((s) => ({ spelerId: s.id, naam: s.naam, foto: s.foto, dier: dierVan(s.dier, s.naam).sleutel, punten: stand[s.id] ?? 0, dezeRonde: dezeRonde[s.id] ?? 0 }))
      .sort((a, b) => b.punten - a.punten || a.naam.localeCompare(b.naam, 'nl')),
    serverTijd: nu,
    klok: {
      eindigtOp: spel.klokLoopt ? spel.klokEindigtOp : null,
      duurMs: spel.klokDuurMs,
      loopt: spel.klokLoopt,
    },
    mediaSpeelt: spel.mediaSpeelt,
    prijzen: spel.fase === 'einde' ? prijzenVan(spel, lijst) : [],
    cijfers: spel.fase === 'cijfers' && ronde?.cijfers ? cijfersVoor(ronde.cijfers, recapAnalyse(), spel.vraagIndex, omgevingVan(spel.id)) : null,
    // De balken gaan eraf zodra de avond voorbij is: dan is alles gevraagd,
    // en draait dezelfde film als jaaroverzicht mét de antwoorden erin.
    jaaroverzicht:
      spel.fase === 'jaaroverzicht'
        ? jaaroverzichtVoor(recapAnalyse(), spel.vraagIndex, spel.geeindigdOp !== null)
        : null,
    // Bij de afrekening heeft de quizmaster de vragen van die ronde als
    // spiekbriefje; de televisie en de telefoons krijgen ze nooit.
    praatpunten:
      rol === 'quizmaster' && spel.fase === 'cijfers' && ronde && isAfrekening(ronde)
        ? ronde.vragen.map((v) => ({ v: v.v, a: v.a ?? '', toelichting: v.toelichting }))
        : undefined,
    ingeleverd,
    inzendingen,
    uitdeling,
    bonussen: bonusLijst,
    reeksen: bonussen.bonus.lopend,
  };
  geheugen = { sleutel: sleutelGeheugen, op: nu, staat };
  return staat;
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

/**
 * Een speler levert een antwoord in voor zijn team.
 *
 * Inleveren mag zolang de quizmaster het antwoord nog niet heeft onthuld, ook
 * als de klok al op nul staat. De servertijd wordt vastgelegd, zodat te laat
 * ingeleverde antwoorden zichtbaar zijn op het hostscherm in plaats van
 * geruisloos te verdwijnen — dat scheelt discussie aan tafel.
 *
 * Een telefoon en een bot van een proefrit gaan hier allebei langs.
 */
export function leverIn(spel: typeof spellen.$inferSelect, spelerId: number, invoer: string): { inzender: string; teLaat: boolean } | { fout: string } {
  if (spel.fase !== 'vraag') return { fout: 'er staat nu geen vraag open' };
  const { ronde } = huidige(spel);
  if (!ronde) return { fout: 'geen ronde' };
  const tekst = invoer.slice(0, 300);

  const lijst = deelnemersVan(spel.id);
  const teamLijst = teamsVoorRonde(spel.id, spel.rondeIndex, ronde, lijst);
  const mijnTeam = teamLijst.find((t) => t.leden.includes(spelerId));
  if (!mijnTeam) return { fout: 'je zit niet in een team voor deze ronde' };

  const sleutel = sleutelVan(spel.rondeIndex, spel.vraagIndex);
  const nu = Date.now();

  // Hoe lang na het opengaan van de vraag dit binnenkwam. De klok kan
  // gepauzeerd of verlengd zijn; verstreken = totale duur min wat er nog
  // op staat, en dat klopt in alle drie de gevallen.
  const rest = spel.klokLoopt ? Math.max(0, (spel.klokEindigtOp ?? nu) - nu) : spel.klokRestMs;
  const naMs = spel.klokDuurMs > 0 ? Math.max(0, spel.klokDuurMs - rest) : null;

  const bestaand = db
    .select()
    .from(antwoorden)
    .where(and(eq(antwoorden.spelId, spel.id), eq(antwoorden.vraagSleutel, sleutel), eq(antwoorden.inzender, mijnTeam.id)))
    .get();

  if (bestaand) {
    db.update(antwoorden)
      .set({ tekst, ingediendOp: nu, naMs, spelerId, isGoed: null })
      .where(eq(antwoorden.id, bestaand.id))
      .run();
  } else {
    db.insert(antwoorden)
      .values({ spelId: spel.id, vraagSleutel: sleutel, inzender: mijnTeam.id, spelerId, tekst, ingediendOp: nu, naMs })
      .run();
  }

  // Iedereen is binnen: niemand hoeft nog op de klok te wachten. Er blijven
  // een paar seconden over, lang genoeg om nog iets te veranderen en voor
  // de televisie om het te laten horen. Alleen als de klok loopt: een
  // gepauzeerde klok is een bewuste keuze van de quizmaster.
  if (spel.klokLoopt && spel.klokEindigtOp != null) {
    const binnen = new Set(
      db
        .select({ inzender: antwoorden.inzender })
        .from(antwoorden)
        .where(and(eq(antwoorden.spelId, spel.id), eq(antwoorden.vraagSleutel, sleutel)))
        .all()
        .map((r) => r.inzender),
    );
    const eindigtOp = ingekort(spel.klokEindigtOp, nu, teamLijst, binnen);
    if (eindigtOp !== spel.klokEindigtOp) {
      db.update(spellen).set({ klokEindigtOp: eindigtOp }).where(eq(spellen.id, spel.id)).run();
    }
  }

  const teLaat = spel.klokEindigtOp != null && nu > spel.klokEindigtOp;
  return { inzender: mijnTeam.id, teLaat };
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

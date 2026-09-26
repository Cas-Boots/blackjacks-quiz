/**
 * De testmodus van de televisie: `/tv?test`.
 *
 * Voedt het televisiescherm met verzonnen momentopnamen — zonder spel op de
 * server, zonder telefoons en zonder quizmaster. Elke dia is een moment uit
 * de avond: de lobby, een vraag van elk type, de onthulling in al zijn
 * smaken, de cijfers van het jaar, de tussenstand en het podium. Je loopt
 * erdoorheen met de pijltjestoetsen en oefent de gekke momenten met knoppen:
 * een telefoon die binnenkomt, iemand die inlevert, de klok die afloopt.
 *
 * Het scherm zelf weet van niets: het toont `live.staat`, precies zoals het
 * dat op de avond doet. Alleen komt die staat nu hiervandaan in plaats van
 * uit de live stroom. Zo test je het echte scherm, niet een kopie ervan.
 *
 * Er wordt niets naar de server gestuurd: de televisie meldt zich niet aan,
 * de database blijft zoals hij is, en de vragen hier zijn verzonnen — de
 * echte antwoorden horen niet in de browser van de televisie.
 */
import { replaceState } from '$app/navigation';
import { live } from './live.svelte';
import { PUNT_WAARDE } from '$lib/shared/bonus';
import { REACTIES, hash } from '$lib/shared/kwinkslagen';
import type {
  Cijfers, CijfersPersoon, Fase, JaarDia, JaarRegel, Onthulling, PubliekeInzending, PubliekeSpeler, PubliekeStaat,
  PubliekTeam, PubliekeVraag, VoorspellingUitslag, VoorspellerStand,
} from '$lib/shared/state';

/* ---- De tafel ------------------------------------------------------- */

/* De vaste vijf en een plus-één: Tom is de gast van de avond. Cas is de
   quizmaster en staat dus niet aan tafel, behalve bij de voorspellingen. */
const NAMEN = ['Liz', 'Bastiaan', 'Joris', 'Rik', 'Eva', 'Tom'] as const;
const GAST = 'Tom';
const QUIZMASTER = 'Cas';
/** Wie in januari voorspelde: de vaste vijf en de quizmaster, niet de gast. */
const VOORSPELLERS = [...NAMEN.filter((n) => n !== GAST), QUIZMASTER];
type Punten = Record<number, number>;

/** Waar iedereen staat als de proefavond begint. */
const START: Punten = { 1: 5640, 2: 5170, 3: 4230, 4: 3760, 5: 3760, 6: 1410 };

/** Een silhouet als portret, zodat ook de weg met een foto te zien is. */
function portret(kleur: string): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='${kleur}'/>` +
    `<circle cx='32' cy='25' r='12' fill='#f7f3e8' opacity='.92'/><ellipse cx='32' cy='60' rx='21' ry='16' fill='#f7f3e8' opacity='.92'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Elk een dier met een andere gang: lopen, springen, slingeren, zwemmen, vliegen, graven. */
const TESTDIEREN = ['lama', 'kangoeroe', 'aap', 'goudvis', 'bij', 'das', 'pinguin', 'slak'];
/** Een paar maatjes met een eigen naam, een paar zonder: allebei moet er goed uitzien. */
const TESTNAMEN: Record<string, string> = { Liz: 'Dolly', Joris: 'Bubbels', Tom: 'Turbo' };

function spelers(verbonden: number | boolean = true): PubliekeSpeler[] {
  return NAMEN.map((naam, i) => {
    const aan = typeof verbonden === 'boolean' ? verbonden : i < verbonden;
    return { id: i + 1, naam, foto: naam === 'Eva' ? portret('#7d6312') : null, dier: TESTDIEREN[i % TESTDIEREN.length], dierNaam: TESTNAMEN[naam] ?? null, stilSinds: aan ? 2 : null, verbonden: aan };
  });
}

/** Ieder voor zich: elke speler zijn eigen team, zoals de server dat doet. */
function los(suit = '♠'): PubliekTeam[] {
  return NAMEN.map((naam, i) => ({ id: `s_${i + 1}`, naam, suit, leden: [i + 1] }));
}

const TEAMS: PubliekTeam[] = [
  { id: 't0', naam: 'Schoppen', suit: '♠', leden: [1, 4] },
  { id: 't1', naam: 'Harten', suit: '♥', leden: [2, 5] },
  { id: 't2', naam: 'Ruiten', suit: '♦', leden: [3, 6] },
];

function stand(punten: Punten): PubliekeStaat['stand'] {
  return spelers()
    .map((s) => ({ spelerId: s.id, naam: s.naam, foto: s.foto, dier: s.dier, punten: punten[s.id] ?? 0 }))
    .sort((a, b) => b.punten - a.punten || a.naam.localeCompare(b.naam, 'nl'));
}

function puntenVan(st: PubliekeStaat): Punten {
  return Object.fromEntries(st.stand.map((r) => [r.spelerId, r.punten]));
}

/* ---- De rondes ------------------------------------------------------ */

interface Rondekop {
  index: number;
  naam: string;
  suit: string;
  thema: string;
  sfeer: string;
  uitleg: string;
  teamModus: 'individueel' | 'teams' | 'samen';
  vragenAantal: number;
  cijfers: 'sport' | 'taart' | 'voorspellingen' | null;
  type: string;
  tijd: number;
  punten: number;
}

const RONDE_AANTAL = 10;
const R = {
  waar: {
    index: 0, naam: 'Waar of Niet Waar', suit: '♠', thema: 'Om warm te draaien', sfeer: 'vilt',
    uitleg: 'Tien stellingen over 2026. Waar of niet waar — meer smaken zijn er niet.',
    teamModus: 'individueel', vragenAantal: 10, cijfers: null, type: 'waarnietwaar', tijd: 30, punten: 1,
  },
  cijfers: {
    index: 1, naam: 'De Cijfers', suit: '♦', thema: '2026 in cijfers', sfeer: 'staal',
    uitleg: 'Een getal raden. Wie er het dichtst bij zit krijgt de punten; precies goed telt dubbel.',
    teamModus: 'individueel', vragenAantal: 6, cijfers: null, type: 'dichtstbij', tijd: 40, punten: 2,
  },
  meerkeuze: {
    index: 2, naam: 'Vier Kaarten', suit: '♣', thema: 'Meerkeuze, in teams', sfeer: 'oranje',
    uitleg: 'Vier antwoorden, één goed. Jullie zitten in teams: overleg, en één telefoon levert in.',
    teamModus: 'teams', vragenAantal: 8, cijfers: null, type: 'meerkeuze', tijd: 30, punten: 2,
  },
  muziek: {
    index: 3, naam: 'De Soundtrack', suit: '♠', thema: 'De nummers van het jaar', sfeer: 'nacht',
    uitleg: 'Een regel uit een nummer. Welke artiest zong hem?',
    teamModus: 'individueel', vragenAantal: 8, cijfers: null, type: 'open', tijd: 45, punten: 2,
  },
  beeld: {
    index: 4, naam: 'Beeld & Geluid', suit: '♥', thema: 'Eigen foto’s, video’s en muziek', sfeer: 'bioscoop',
    uitleg: 'Een foto, een filmpje of een fragment. Kijk, luister en typ.',
    teamModus: 'individueel', vragenAantal: 6, cijfers: null, type: 'open', tijd: 45, punten: 2,
  },
  sport: {
    index: 5, naam: 'Onze Sportcompetitie', suit: '♥', thema: 'Resolution Recap — echte cijfers', sfeer: 'gras',
    uitleg: 'Over onszelf. Wie sportte het vaakst, wie kwam nooit in de sportschool?',
    teamModus: 'individueel', vragenAantal: 5, cijfers: 'sport', type: 'open', tijd: 40, punten: 2,
  },
  taart: {
    index: 6, naam: 'Taart & Verre Landen', suit: '♦', thema: 'Resolution Recap — de rest', sfeer: 'suiker',
    uitleg: 'De taartteller en de landenteller van dit jaar.',
    teamModus: 'individueel', vragenAantal: 5, cijfers: 'taart', type: 'open', tijd: 40, punten: 2,
  },
  voorspellingen: {
    index: 7, naam: 'De Voorspellingen', suit: '♣', thema: 'Wat jullie in januari dachten', sfeer: 'violet',
    uitleg: 'Veertien voorspellingen van januari. Wat kwam er van terecht?',
    teamModus: 'individueel', vragenAantal: 4, cijfers: 'voorspellingen', type: 'meerkeuze', tijd: 30, punten: 2,
  },
  stem: {
    index: 8, naam: 'Wie van de Blackjacks?', suit: '♥', thema: 'Slotronde', sfeer: 'vilt',
    uitleg: 'Iedereen stemt op een medespeler. De meerderheid beslist; wie meestemde krijgt de punten.',
    teamModus: 'individueel', vragenAantal: 5, cijfers: null, type: 'stem', tijd: 30, punten: 2,
  },
  bliksem: {
    index: 9, naam: 'De Bliksemronde', suit: '♣', thema: 'Tien seconden per vraag', sfeer: 'bliksem',
    uitleg: 'Tien seconden. Niet nadenken, tikken.',
    teamModus: 'individueel', vragenAantal: 12, cijfers: null, type: 'waarnietwaar', tijd: 10, punten: 1,
  },
} satisfies Record<string, Rondekop>;

/* ---- Bestanden bij de vragen, zonder de map media/ ------------------ */

/** Een breed proefbeeld, zodat je ziet hoe een foto op de kaart komt. */
function proefbeeld(): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#1d3b30'/><stop offset='1' stop-color='#081511'/></linearGradient></defs>` +
    `<rect width='1600' height='900' fill='url(#g)'/><circle cx='1180' cy='260' r='150' fill='#f0d98c' opacity='.85'/>` +
    `<path d='M0 700 Q 300 560 600 660 T 1200 640 T 1600 700 V900 H0Z' fill='#152e25'/>` +
    `<text x='80' y='820' font-family='Georgia,serif' font-size='72' fill='#f7f3e8'>Proefbeeld · 1600 × 900</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Twee seconden zachte toon als wav, zodat 'Fragment afspelen' echt iets doet. */
let fragmentCache: string | null = null;
function proeffragment(): string {
  if (fragmentCache) return fragmentCache;
  const rate = 8000;
  const n = rate * 2;
  const buf = new ArrayBuffer(44 + n);
  const v = new DataView(buf);
  const tekst = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  tekst(0, 'RIFF'); v.setUint32(4, 36 + n, true); tekst(8, 'WAVE');
  tekst(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  tekst(36, 'data'); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const toon = Math.sin(t * 2 * Math.PI * 440) * 0.6 + Math.sin(t * 2 * Math.PI * 660) * 0.4;
    v.setUint8(44 + i, 128 + Math.round(toon * 28 * (1 - i / n)));
  }
  let bin = '';
  for (const b of new Uint8Array(buf)) bin += String.fromCharCode(b);
  fragmentCache = `data:audio/wav;base64,${btoa(bin)}`;
  return fragmentCache;
}

/* ---- Bouwstenen voor een momentopname ------------------------------- */

function basis(over: Partial<PubliekeStaat> = {}): PubliekeStaat {
  return {
    versie: 1,
    spelId: 999,
    fase: 'lobby',
    quizNaam: 'Blackjack Quiz 26/27',
    rondeIndex: 0,
    rondeAantal: RONDE_AANTAL,
    ronde: null,
    vraag: null,
    onthulling: null,
    teams: [],
    spelers: spelers(),
    stand: stand(START),
    serverTijd: Date.now(),
    klok: null,
    mediaSpeelt: false,
    prijzen: [],
    ingeleverd: [],
    inzendingen: [],
    uitdeling: {},
    bonussen: [],
    reeksen: {},
    cijfers: null,
    jaaroverzicht: null,
    ...over,
  };
}

function metRonde(r: Rondekop, over: Partial<PubliekeStaat> = {}): PubliekeStaat {
  return basis({
    rondeIndex: r.index,
    ronde: {
      naam: r.naam, suit: r.suit, thema: r.thema, sfeer: r.sfeer, uitleg: r.uitleg,
      teamModus: r.teamModus, vragenAantal: r.vragenAantal, cijfers: r.cijfers,
      dubbel: r.index >= RONDE_AANTAL - 2,
    },
    teams: r.teamModus === 'teams' ? TEAMS : los(r.suit),
    klok: { eindigtOp: null, duurMs: r.tijd * 1000, loopt: false },
    ...over,
  });
}

type Vraagdeel = Pick<PubliekeVraag, 'index' | 'tekst'> & Partial<PubliekeVraag>;

function vraagVan(r: Rondekop, v: Vraagdeel): PubliekeVraag {
  const vermenigvuldiger = r.index >= RONDE_AANTAL - 2 ? 2 : 1;
  return {
    aantal: r.vragenAantal, type: r.type, punten: r.punten,
    maximaal: r.punten * PUNT_WAARDE * vermenigvuldiger, vermenigvuldiger, goud: false,
    ...v,
  };
}

/** Een open vraag met een lopende klok. */
function vraag(r: Rondekop, v: Vraagdeel, over: Partial<PubliekeStaat> = {}): PubliekeStaat {
  const duur = r.tijd * 1000;
  return metRonde(r, {
    fase: 'vraag',
    vraag: vraagVan(r, v),
    klok: { eindigtOp: Date.now() + duur, duurMs: duur, loopt: true },
    ...over,
  });
}

/** De onthulling van een vraag, met wat er was ingeleverd. */
function antwoord(
  r: Rondekop,
  v: Vraagdeel,
  onthulling: Onthulling,
  inzendingen: PubliekeInzending[],
  over: Partial<PubliekeStaat> = {},
): PubliekeStaat {
  return metRonde(r, {
    fase: 'antwoord',
    vraag: vraagVan(r, v),
    onthulling,
    ingeleverd: inzendingen.map((i) => i.inzender),
    inzendingen,
    ...over,
  });
}

function inz(inzender: string, tekst: string, isGoed: boolean | null, naMs: number | null = 4000, getal: number | null = null): PubliekeInzending {
  return { inzender, tekst, isGoed, naMs, getal };
}

/** START plus wat deze vraag opleverde. */
function erbij(uitdeling: Punten): Punten {
  const uit: Punten = { ...START };
  for (const [id, p] of Object.entries(uitdeling)) uit[Number(id)] = (uit[Number(id)] ?? 0) + p;
  return uit;
}

/* ---- De vragen ------------------------------------------------------ */

const V = {
  waar: { index: 2, tekst: 'In 2026 stond Nederland in de finale van het WK voetbal.', opties: ['Waar', 'Niet waar'] },
  meerkeuze: {
    index: 4, emoji: '⛷️', tekst: 'Welke stad organiseerde in februari 2026 de Olympische Winterspelen?',
    opties: ['Milaan & Cortina d’Ampezzo', 'Salt Lake City', 'Sapporo', 'Stockholm'],
  },
  muziek: { index: 1, lyric: 'We waren jong en de zomer was lang, en niemand keek op de klok', tekst: 'Van welke artiest is deze regel?' },
  beeld: {
    index: 0, tekst: 'Waar is deze foto genomen?',
    media: { soort: 'beeld', bron: proefbeeld(), bijschrift: 'Een echte vraag haalt zijn foto uit de map media/.' },
  },
  fragment: { index: 1, tekst: 'Welk nummer hoor je hier?', media: { soort: 'muziek', bron: '', bijschrift: 'Fragment van twee seconden' } },
  video: { index: 2, tekst: 'Wat gebeurt er hierna?', media: { soort: 'video', bron: 'proef-ontbreekt.mp4' } },
  dichtstbij: { index: 3, tekst: 'Hoeveel kilometer fietste Bastiaan in 2026, volgens zijn eigen app?', eenheid: 'km' },
  stem: { index: 0, tekst: 'Wie van de Blackjacks appt het vaakst “ik ben er over vijf minuten” terwijl dat niet zo is?', opties: [...NAMEN] },
  bliksem: { index: 7, tekst: 'Een jaar heeft 52 weken.', opties: ['Waar', 'Niet waar'] },
  lang: {
    index: 5, emoji: '📜',
    tekst:
      'Deze vraag is met opzet veel te lang, zodat je op de televisie kunt zien wat er gebeurt met een vraagtekst die maar door- en doorgaat, ' +
      'over meerdere regels heen, met een komma hier en een bijzin daar, en dan ook nog vier antwoordmogelijkheden die zelf ook aan de lange kant zijn — ' +
      'past dat allemaal op het scherm zonder dat de inleverrij van de tafel valt?',
    opties: [
      'Ja, alles past, ook op een televisie van 32 inch met een oud lettertype',
      'Nee, de inleverrij valt onderaan van het scherm en dat wil je vóór de avond weten',
      'Het hangt ervan af hoe ver de bank van de televisie staat, en hoeveel wijn er al op is',
      'Deze optie is er alleen om het raster vol te maken en heeft verder geen inhoud',
    ],
  },
} satisfies Record<string, Vraagdeel>;

/* ---- De cijfers van het jaar ---------------------------------------- */

const JAAR = 2026;
const PEILDATUM = '2026-11-15';

interface Profiel {
  emoji: string;
  sportKans: number;
  doel: number | null;
  soorten: [string, string][];
  taartKans: number;
  landen: [string, string, string, string][];
}
/** Wie er in resolution-recap staat: net als bij de voorspellingen Cas wel, de gast niet. */
const PROFIEL: Record<string, Profiel> = {
  Liz: { emoji: '🏃‍♀️', sportKans: 58, doel: 180, soorten: [['Hardlopen', '🏃‍♀️'], ['Yoga', '🧘‍♀️'], ['Zwemmen', '🏊‍♀️']], taartKans: 6, landen: [['NL', 'Nederland', '🇳🇱', '2026-01-01'], ['FR', 'Frankrijk', '🇫🇷', '2026-02-14'], ['JP', 'Japan', '🇯🇵', '2026-05-03'], ['IT', 'Italië', '🇮🇹', '2026-08-10']] },
  Bastiaan: { emoji: '🚴', sportKans: 44, doel: 150, soorten: [['Fietsen', '🚴'], ['Padel', '🎾']], taartKans: 9, landen: [['NL', 'Nederland', '🇳🇱', '2026-01-01'], ['DE', 'Duitsland', '🇩🇪', '2026-04-18']] },
  Joris: { emoji: '🏋️', sportKans: 71, doel: 200, soorten: [['Krachttraining', '🏋️'], ['Hardlopen', '🏃'], ['Klimmen', '🧗']], taartKans: 4, landen: [['NL', 'Nederland', '🇳🇱', '2026-01-01'], ['ES', 'Spanje', '🇪🇸', '2026-03-22'], ['PT', 'Portugal', '🇵🇹', '2026-03-28'], ['NO', 'Noorwegen', '🇳🇴', '2026-07-05'], ['US', 'de Verenigde Staten', '🇺🇸', '2026-10-02']] },
  Rik: { emoji: '⚽', sportKans: 22, doel: 100, soorten: [['Voetbal', '⚽'], ['Wandelen', '🥾']], taartKans: 14, landen: [['NL', 'Nederland', '🇳🇱', '2026-01-01']] },
  Eva: { emoji: '🧘', sportKans: 39, doel: null, soorten: [['Yoga', '🧘'], ['Tennis', '🎾'], ['Boulderen', '🧗‍♀️']], taartKans: 7, landen: [['NL', 'Nederland', '🇳🇱', '2026-01-01'], ['GR', 'Griekenland', '🇬🇷', '2026-06-12'], ['TR', 'Turkije', '🇹🇷', '2026-06-20']] },
  Cas: { emoji: '🏓', sportKans: 30, doel: 160, soorten: [['Tafeltennis', '🏓'], ['Hardlopen', '🏃']], taartKans: 12, landen: [['NL', 'Nederland', '🇳🇱', '2026-01-01'], ['BE', 'België', '🇧🇪', '2026-09-09']] },
};

/** Dagen met iets erop, stabiel per naam: dezelfde kaart bij elke herlading. */
function dagenVan(naam: string, kans: number, soort: string): Record<string, number> {
  const uit: Record<string, number> = {};
  const d = new Date(Date.UTC(JAAR, 0, 1));
  for (;;) {
    const datum = d.toISOString().slice(0, 10);
    if (datum > PEILDATUM) break;
    const h = hash(`${soort}:${naam}:${datum}`) % 100;
    if (h < kans) uit[datum] = h < kans / 7 ? 2 : 1;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return uit;
}

function langsteReeks(dagen: Record<string, number>): number {
  const lijst = Object.keys(dagen).sort();
  let beste = 0;
  let reeks = 0;
  let vorige: number | null = null;
  for (const datum of lijst) {
    const dag = Date.parse(datum) / 86_400_000;
    reeks = vorige !== null && dag - vorige === 1 ? reeks + 1 : 1;
    vorige = dag;
    beste = Math.max(beste, reeks);
  }
  return beste;
}

function personen(): CijfersPersoon[] {
  return VOORSPELLERS.map((naam) => {
    const p = PROFIEL[naam];
    const sportDagen = dagenVan(naam, p.sportKans, 'sport');
    const totaal = Object.values(sportDagen).reduce((a, b) => a + b, 0);
    const gewichten = [0.6, 0.3, 0.1];
    let rest = totaal;
    const soorten = p.soorten.map(([n, emoji], i) => {
      const aantal = i === p.soorten.length - 1 ? rest : Math.round(totaal * gewichten[i]);
      rest -= aantal;
      return { naam: n, emoji, aantal };
    });
    const taartDagen = dagenVan(naam, p.taartKans, 'taart');
    return {
      naam,
      emoji: p.emoji,
      sport: { totaal, doel: p.doel, dagen: sportDagen, soorten, langsteReeks: langsteReeks(sportDagen) },
      taart: { totaal: Object.values(taartDagen).reduce((a, b) => a + b, 0), dagen: taartDagen },
      landen: p.landen.map(([code, n, vlag, datum]) => ({ code, naam: n, vlag, datum })),
    };
  });
}

function cijfers(soort: 'sport' | 'taart', stap: number): Cijfers {
  const lijst = personen();
  return { soort, stap, stappen: lijst.length, jaar: JAAR, peildatum: PEILDATUM, personen: lijst };
}

function voorspellingen(stap: number): Cijfers {
  const zet = (nr: number, vraag: string, soort: VoorspellingUitslag['soort'], uitkomst: string | null, antwoorden: [string, string, number, boolean | null, string?][], extra: Partial<VoorspellingUitslag> = {}): VoorspellingUitslag => ({
    nr, vraag, soort, uitkomst, open: uitkomst === null, voorlopig: false,
    antwoorden: antwoorden.map(([naam, a, inzet, goed, werkelijk]) => ({ naam, antwoord: a, inzet, goed, werkelijk })),
    ...extra,
  });
  const vragen: VoorspellingUitslag[] = [
    zet(1, 'Wordt Nederland in 2026 wereldkampioen voetbal?', 'janee', 'Nee', [
      ['Liz', 'Nee', 1, true], ['Bastiaan', 'Ja', 3, false], ['Joris', 'Nee', 1, true], ['Rik', 'Ja', 3, false], ['Eva', 'Nee', 1, true], ['Cas', 'Nee', 1, true],
    ], { toelichting: 'Uit in de kwartfinale, na strafschoppen. Natuurlijk.' }),
    zet(2, 'Hoeveel landen bezoekt Joris dit jaar?', 'getal', '5', [
      ['Liz', '4', 2, false, '5'], ['Bastiaan', '5', 2, true], ['Joris', '6', 2, false, '5'], ['Rik', '3', 2, false, '5'], ['Eva', '5', 2, true], ['Cas', '7', 2, false, '5'],
    ], { voorlopig: true, toelichting: 'Tot nu toe. December kan er nog een bij doen.' }),
    zet(3, 'Wie haalt als eerste zijn sportdoel?', 'naam', 'Joris', [
      ['Liz', 'Joris', 2, true], ['Bastiaan', 'Liz', 2, false], ['Joris', 'Joris', 2, true], ['Rik', 'Bastiaan', 2, false], ['Eva', 'Joris', 2, true], ['Cas', 'Eva', 2, false],
    ]),
    zet(4, 'Wat wordt het woord van het jaar?', 'open', null, [
      ['Liz', 'Slaaptoerisme', 1, null], ['Bastiaan', 'Padelknie', 1, null], ['Joris', 'Doomscrollpauze', 1, null], ['Rik', 'Wintersportspijt', 1, null], ['Eva', 'Prikkelarm', 1, null], ['Cas', 'AI-moe', 1, null],
    ]),
  ];
  const standLijst: VoorspellerStand[] = VOORSPELLERS.map((naam) => {
    const mijn = vragen.flatMap((v) => v.antwoorden.filter((a) => a.naam === naam));
    return {
      naam,
      ...(naam === QUIZMASTER ? { quizmaster: true } : {}),
      goed: mijn.filter((a) => a.goed === true).length,
      fout: mijn.filter((a) => a.goed === false).length,
      open: mijn.filter((a) => a.goed === null).length,
      punten: mijn.filter((a) => a.goed === true).reduce((n, a) => n + a.inzet, 0),
    };
  }).sort((a, b) => b.punten - a.punten || a.naam.localeCompare(b.naam, 'nl'));
  return {
    soort: 'voorspellingen', stap, stappen: vragen.length, jaar: JAAR, peildatum: PEILDATUM, personen: personen(),
    voorspellingen: { vragen, stand: standLijst, open: vragen.filter((v) => v.open).length, zitUit: [GAST] },
  };
}

/* ---- Het jaaroverzicht ----------------------------------------------
   Verzonnen maanden, net als de vragen hierboven: de echte tijdlijn en de
   echte antwoorden horen niet in de browser van de televisie. Het gaat hier
   om de vorm — de trailer zonder quizfeiten, en de film met de antwoorden
   onderstreept. */

function jaarRegel(tekst: string, onthuld: boolean, emoji: string | null = null, bij: string | null = null): JaarRegel {
  const knip = (regel: string) => {
    const delen = [];
    const patroon = /\[\[(.+?)\]\]/g;
    let laatste = 0;
    for (let m = patroon.exec(regel); m; m = patroon.exec(regel)) {
      if (m.index > laatste) delen.push({ tekst: regel.slice(laatste, m.index), balk: false });
      delen.push({ tekst: onthuld ? m[1] : '', balk: true });
      laatste = m.index + m[0].length;
    }
    if (laatste < regel.length) delen.push({ tekst: regel.slice(laatste), balk: false });
    return delen;
  };
  return { emoji, delen: knip(tekst), bij: bij ? knip(bij) : null };
}

/** De trailer heeft alleen de maanden met iets wat de quiz niet vraagt; de film alles. */
const TRAILER_STROOK = [1, 5, 9, 12];
const FILM_STROOK = [1, 2, 3, 5, 6, 7, 9, 11, 12];
const MAANDEN_VOL = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

function jaaroverzicht(stap: number, onthuld = false): JaarDia {
  const strook = onthuld ? FILM_STROOK : TRAILER_STROOK;
  const stappen = strook.length + 2;
  const basisDia = {
    stap, stappen, jaar: JAAR, strook, onthuld, peildatum: PEILDATUM,
  };
  if (stap === 0) {
    return {
      ...basisDia, soort: 'titel', titel: String(JAAR), maand: null,
      kop: onthuld ? 'Het jaar in twee minuten' : 'De trailer',
      regels: [
        jaarRegel(
          onthuld
            ? 'Het hele jaar, zo snel als het voorbijging. Wat onderstreept staat, werd vanavond gevraagd.'
            : 'Alvast een voorproefje van ons jaar. Wat er in de wereld gebeurde, laten we nog even weg.',
          onthuld,
        ),
      ],
      eigen: null, seconden: 7, jaartotaal: null,
    };
  }
  if (stap >= stappen - 1) {
    return {
      ...basisDia, soort: 'slot', maand: null,
      titel: onthuld ? `Dat was ${JAAR}` : 'Straks het hele jaar',
      kop: onthuld ? 'Dat was het jaar, en dat was de quiz.' : 'De rest is een vraag van vanavond. Na de uitslag draait de hele film.',
      regels: [], eigen: null, seconden: 12,
      jaartotaal: onthuld ? { sport: 421, taart: 43, landen: 12, dagen: 188 } : null,
    };
  }
  const nr = strook[Math.min(stap, strook.length) - 1];
  if (!onthuld) {
    // De trailer: geen kop, geen regel met een antwoord, en van ons alleen het sporten.
    return {
      ...basisDia, soort: 'maand', titel: MAANDEN_VOL[nr - 1], kop: '', maand: nr,
      regels: [
        jaarRegel('We vieren een verjaardag die niemand meer vergeet.', false, '🎂', 'Met taart, uiteraard.'),
        jaarRegel('En iemand begint aan een nieuwe hobby.', false, '🎸'),
      ],
      eigen: { sport: 37, taart: null, landen: [], bijStart: null, koploper: null, perPersoon: [], totaal: null },
      seconden: 10, jaartotaal: null,
    };
  }
  return {
    ...basisDia, soort: 'maand', titel: MAANDEN_VOL[nr - 1], kop: 'Een maand met van alles erin', maand: nr,
    regels: [
      jaarRegel('Een ploeg uit [[een land hier]] wint iets groots.', true, '🏆', 'Met een invaller die [[een naam]] heet.'),
      jaarRegel('We vieren een verjaardag die niemand meer vergeet.', true, '🎂'),
      jaarRegel('En er gebeurt iets in [[Den Haag]] waar nog lang over gepraat wordt.', true, '🏛️'),
    ],
    eigen: {
      sport: 37, taart: 4,
      landen: [{ vlag: '🇫🇷', naam: 'Frankrijk', wie: 'Eva', datum: `${JAAR}-0${Math.min(9, nr)}-12` }],
      bijStart: nr === 1 ? 4 : 0,
      koploper: { naam: 'Joris', aantal: 12 },
      perPersoon: NAMEN.map((naam, i) => ({ naam, sport: 12 - i, taart: (i % 3) + 1, landen: i === 4 ? ['🇫🇷'] : [] })),
      totaal: { sport: 37 * stap, taart: 4 * stap, landen: Math.min(12, 2 + stap) },
    },
    seconden: 12, jaartotaal: null,
  };
}

/* ---- De dia's ------------------------------------------------------- */

export interface Dia {
  id: string;
  hoofdstuk: string;
  titel: string;
  /** Waar je op let bij deze dia. */
  let: string;
  maak: () => PubliekeStaat | null;
  /** De stand van vóór deze dia, zodat het scorebord telt en schuift. */
  vorigePunten?: Punten;
}

const NA_STAND: Punten = { 1: 6110, 2: 5170, 3: 7050, 4: 3760, 5: 4700, 6: 1410 };
const EIND: Punten = { 1: 19, 2: 16, 3: 21, 4: 10, 5: 12, 6: 4 };

const PRIJZEN: PubliekeStaat['prijzen'] = [
  { sleutel: 'scherpschutter', titel: 'Scherpschutter', namen: ['Joris'], detail: '11 van de 14 vragen goed' },
  { sleutel: 'snelste', titel: 'Snelste vinger', namen: ['Eva'], detail: 'In 2,4 seconden goed bij Vier Kaarten' },
  { sleutel: 'beste-ronde', titel: 'Beste ronde', namen: ['Liz'], detail: '2.940 punten in De Cijfers' },
  { sleutel: 'reeks', titel: 'Langste reeks', namen: ['Joris'], detail: 'Vijf op rij goed' },
  { sleutel: 'comeback', titel: 'Comeback van de avond', namen: ['Eva'], detail: 'Van de vijfde naar de vierde plek' },
  { sleutel: 'moeilijkste-vraag', titel: 'Moeilijkste vraag', namen: [], detail: '“Hoeveel kilometer fietste Bastiaan in 2026?” — niemand had hem goed' },
];

export const DIAS: Dia[] = [
  /* ── Aanmelden ── */
  {
    id: 'lobby', hoofdstuk: 'Aanmelden', titel: 'De lobby',
    let: 'De QR-code, de naamplaten die groen worden, de wachtzinnen die om de zeven seconden wisselen. Laat een telefoon binnenkomen voor de begroeting en de boing.',
    maak: () => basis({ fase: 'lobby', spelers: spelers(2), stand: stand({}) }),
  },
  {
    id: 'lobby-vol', hoofdstuk: 'Aanmelden', titel: 'Iedereen is erbij',
    let: '“Iedereen is erbij. We kunnen beginnen.”',
    maak: () => basis({ fase: 'lobby', stand: stand({}) }),
  },

  /* ── Jaaroverzicht ── */
  {
    id: 'film-titel', hoofdstuk: 'Jaaroverzicht', titel: 'De trailer: titelkaart',
    let: 'Het jaartal groot in beeld, de strook onderaan met de maanden die in de trailer zitten, en de lijn die de dia uittelt.',
    maak: () => basis({ fase: 'jaaroverzicht', jaaroverzicht: jaaroverzicht(0), klok: { eindigtOp: Date.now() + 7000, duurMs: 7000, loopt: true } }),
  },
  {
    id: 'film-maand', hoofdstuk: 'Jaaroverzicht', titel: 'De trailer: een maand',
    let: 'Alleen wat de quiz niet vraagt: geen kop, geen regel met een antwoord, en van ons alleen hoe vaak er gesport is.',
    maak: () => basis({ fase: 'jaaroverzicht', jaaroverzicht: jaaroverzicht(2), klok: { eindigtOp: Date.now() + 10000, duurMs: 10000, loopt: true } }),
  },
  {
    id: 'film-slot', hoofdstuk: 'Jaaroverzicht', titel: 'De trailer: slotkaart',
    let: 'Geen getallen: die vragen de recap-rondes. Alleen de belofte van de hele film na de uitslag. Hierna begint ronde 1.',
    maak: () => basis({ fase: 'jaaroverzicht', jaaroverzicht: jaaroverzicht(TRAILER_STROOK.length + 1) }),
  },
  {
    id: 'film-onthuld', hoofdstuk: 'Jaaroverzicht', titel: 'De film: een maand',
    let: 'Na de uitslag: de kop, alle regels, en onder elk antwoord van vanavond een messing streep waar een zwarte balk vanaf schuift. Onder de streep onze landen, taarten, de koploper en de stand van het jaar.',
    maak: () => basis({ fase: 'jaaroverzicht', jaaroverzicht: jaaroverzicht(3, true) }),
  },
  {
    id: 'film-slot-onthuld', hoofdstuk: 'Jaaroverzicht', titel: 'De film: slotkaart',
    let: 'Het jaar in vier getallen; de tellers lopen van nul omhoog.',
    maak: () => basis({ fase: 'jaaroverzicht', jaaroverzicht: jaaroverzicht(FILM_STROOK.length + 1, true) }),
  },

  /* ── Ronde ── */
  {
    id: 'ronde', hoofdstuk: 'Ronde', titel: 'Titelkaart, ieder voor zich',
    let: 'De sfeer van de ronde, de naam die opkomt, de rij naamplaten. Twee noten omhoog als geluid.',
    maak: () => metRonde(R.waar, { fase: 'ronde' }),
  },
  {
    id: 'ronde-teams', hoofdstuk: 'Ronde', titel: 'Titelkaart, in teams',
    let: 'De teamkaarten met wie bij wie zit, in de oranje sfeer.',
    maak: () => metRonde(R.meerkeuze, { fase: 'ronde' }),
  },
  {
    id: 'ronde-cijfers', hoofdstuk: 'Ronde', titel: 'Titelkaart van een recap-ronde',
    let: 'Zelfde kaart, andere sfeer (gras). Na deze ronde volgen de cijfers van het jaar.',
    maak: () => metRonde(R.sport, { fase: 'ronde' }),
  },
  {
    id: 'ronde-voorspellingen', hoofdstuk: 'Ronde', titel: 'Titelkaart van de voorspellingen',
    let: 'Geen vragen op de telefoon: met Start gaat het hostscherm meteen naar de voorspellingen van januari. Onder de uitleg staat dat de telefoons weg mogen.',
    maak: () => metRonde(R.voorspellingen, { fase: 'ronde' }),
  },
  {
    id: 'ronde-dubbel', hoofdstuk: 'Ronde', titel: 'Titelkaart van een slotronde',
    let: 'De laatste twee rondes tellen dubbel. Onder de uitleg van de punten gloeit de gouden banier “×2 · Slotronde”.',
    maak: () => metRonde(R.stem, { fase: 'ronde' }),
  },

  /* ── Vraag ── */
  {
    id: 'vraag-waar', hoofdstuk: 'Vraag', titel: 'Waar of niet waar',
    let: 'De kaart ligt scheef, de klok loopt 30 seconden, de inleverrij vult zich. Zet de klok op de laatste seconden voor het tikken, de trilling en de stempel TIJD!.',
    maak: () => vraag(R.waar, V.waar),
  },
  {
    id: 'vraag-meerkeuze', hoofdstuk: 'Vraag', titel: 'Meerkeuze, in teams',
    let: 'Vier keuzes met letters, de emoji erboven, en in de inleverrij de teams in plaats van de namen.',
    maak: () => vraag(R.meerkeuze, V.meerkeuze, { ingeleverd: ['t1'] }),
  },
  {
    id: 'vraag-open', hoofdstuk: 'Vraag', titel: 'Open vraag met songtekst',
    let: 'De regel tussen aanhalingstekens boven de vraag, in de nachtsfeer.',
    maak: () => vraag(R.muziek, V.muziek),
  },
  {
    id: 'vraag-goud', hoofdstuk: 'Vraag', titel: 'De gouden kaart',
    let: 'Eén vraag per ronde telt dubbel. Onder “tot 2.000 punten” gloeit het gouden label.',
    maak: () => vraag(R.muziek, { ...V.muziek, goud: true, vermenigvuldiger: 2, maximaal: 2 * PUNT_WAARDE * 2 }),
  },
  {
    id: 'vraag-dichtstbij', hoofdstuk: 'Vraag', titel: 'Dichtstbij',
    let: '“Antwoord in km.” onder de vraag, en een klok van 40 seconden.',
    maak: () => vraag(R.cijfers, V.dichtstbij),
  },
  {
    id: 'vraag-stem', hoofdstuk: 'Vraag', titel: 'Stemvraag',
    let: 'De mensen aan tafel als keuzes.',
    maak: () => vraag(R.stem, V.stem),
  },
  {
    id: 'vraag-beeld', hoofdstuk: 'Vraag', titel: 'Vraag met foto',
    let: 'De foto op de kaart met een bijschrift, in de bioscoopsfeer.',
    maak: () => vraag(R.beeld, V.beeld),
  },
  {
    id: 'vraag-fragment', hoofdstuk: 'Vraag', titel: 'Vraag met muziekfragment',
    let: '“Fragment staat klaar”, en met Fragment afspelen de balkjes en “Luister…”. Het fragment is twee seconden toon.',
    maak: () => vraag(R.beeld, { ...V.fragment, media: { ...V.fragment.media, bron: proeffragment() } }),
  },
  {
    id: 'vraag-bliksem', hoofdstuk: 'Vraag', titel: 'Bliksemronde, tien seconden',
    let: 'De klok begint bij tien; halverwege begint het tikken al.',
    maak: () => vraag(R.bliksem, V.bliksem),
  },

  /* ── Onthulling ── */
  {
    id: 'antwoord-gemengd', hoofdstuk: 'Onthulling', titel: 'Gemengd: goed en fout',
    let: 'De goede keuze klapt om, de rest valt één voor één af. Daaronder de kaartjes met wat iedereen intikte, met vinkje of kruisje en een fiche met de punten. Liz was het snelst en pakt de meeste punten; Joris zit op vier op rij en krijgt een reeksbonus. Tom leverde niets in.',
    vorigePunten: START,
    maak: () => antwoord(
      R.waar, V.waar,
      { antwoord: 'Niet waar', toelichting: 'Kwartfinale, strafschoppen. Het is een traditie.', goedeOptie: 1 },
      [inz('s_1', 'Niet waar', true, 3100), inz('s_2', 'Waar', false, 5400), inz('s_3', 'Niet waar', true, 6800), inz('s_4', 'Waar', false, 9900), inz('s_5', 'Niet waar', true, 12000)],
      {
        stand: stand(erbij({ 1: 474, 3: 743, 5: 400 })),
        uitdeling: { 1: 474, 3: 743, 5: 400 },
        bonussen: [
          { spelerId: 3, soort: 'reeks', punten: 300, opRij: 4 },
        ],
        reeksen: { 1: 1, 3: 4, 5: 1 },
      },
    ),
  },
  {
    id: 'antwoord-beoordelen', hoofdstuk: 'Onthulling', titel: 'Nog te beoordelen',
    let: 'Een open vraag: de kaartjes staan er zonder oordeel. Beoordeel ze één voor één, zoals de quizmaster op het hostscherm doet; bij een goed antwoord komen de punten binnen.',
    vorigePunten: START,
    maak: () => antwoord(
      R.muziek, V.muziek,
      { antwoord: 'De Proefartiest', toelichting: 'Het nummer stond de hele zomer op één. Zeggen we.' },
      [inz('s_1', 'de proefartiest', null, 8000), inz('s_2', 'Geen idee', null, 14000), inz('s_3', 'De Proefartiest', null, 9500), inz('s_4', 'Marco Borsato', null, 20000), inz('s_5', 'proefartiest', null, 11000), inz('s_6', '', null, 30000)],
    ),
  },
  {
    id: 'antwoord-teams', hoofdstuk: 'Onthulling', titel: 'Een teamronde',
    let: 'De kaartjes dragen de teamnaam met de kaartkleur ervoor; de punten gaan naar elk teamlid.',
    vorigePunten: START,
    maak: () => antwoord(
      R.meerkeuze, V.meerkeuze,
      { antwoord: 'A — Milaan & Cortina d’Ampezzo', toelichting: 'Twee steden, één Spelen, driehonderd kilometer ertussen.', goedeOptie: 0 },
      [inz('t0', 'A', true, 7000), inz('t1', 'B', false, 12000), inz('t2', 'A', true, 15500)],
      { stand: stand(erbij({ 1: 870, 4: 870, 3: 870, 6: 870 })), uitdeling: { 1: 870, 4: 870, 3: 870, 6: 870 } },
    ),
  },
  {
    id: 'antwoord-iedereen-goed', hoofdstuk: 'Onthulling', titel: 'Iedereen goed',
    let: 'De groene stempel en een kwinkslag eronder.',
    vorigePunten: START,
    maak: () => antwoord(
      R.bliksem, V.bliksem,
      { antwoord: 'Niet waar', toelichting: 'Tweeënvijftig weken en een dag. Dit jaar zelfs.', goedeOptie: 1 },
      NAMEN.map((_, i) => inz(`s_${i + 1}`, 'Niet waar', true, 1500 + i * 700)),
      { stand: stand(erbij({ 1: 430, 2: 430, 3: 430, 4: 430, 5: 430, 6: 430 })), uitdeling: { 1: 430, 2: 430, 3: 430, 4: 430, 5: 430, 6: 430 } },
    ),
  },
  {
    id: 'antwoord-iedereen-fout', hoofdstuk: 'Onthulling', titel: 'Iedereen fout',
    let: 'De rode stempel, de treurige trombone, en een kwinkslag.',
    vorigePunten: START,
    maak: () => antwoord(
      R.waar, { ...V.waar, index: 6, tekst: 'De Elfstedentocht werd in 2026 gereden.' },
      { antwoord: 'Niet waar', toelichting: 'Er lag ijs. Er lag niet genoeg ijs.', goedeOptie: 1 },
      NAMEN.map((_, i) => inz(`s_${i + 1}`, 'Waar', false, 2000 + i * 900)),
    ),
  },
  {
    id: 'antwoord-niemand', hoofdstuk: 'Onthulling', titel: 'Niemand leverde in',
    let: 'Alleen het antwoord en een kwinkslag: “Niemand? Echt niemand?”',
    vorigePunten: START,
    maak: () => antwoord(R.muziek, { ...V.muziek, index: 5, lyric: 'Ik tel de dagen, jij telt de nachten', tekst: 'Wie zong dit in 2026?' }, { antwoord: 'De Proefartiest' }, []),
  },
  {
    id: 'antwoord-dichtstbij', hoofdstuk: 'Onthulling', titel: 'Dichtstbij: de getallenlijn',
    let: 'Het doel als messing streep, de gokken als stippen, de winnaar groen, en een label bij wie er hopeloos naast zat. Tom typte geen getal en staat er niet op.',
    vorigePunten: START,
    maak: () => antwoord(
      R.cijfers, V.dichtstbij,
      { antwoord: '3.140 km', toelichting: 'Zeg maar Amsterdam–Rome, en dan nog een stukje.', getal: 3140, eenheid: 'km' },
      [inz('s_1', '3000', true, 9000, 3000), inz('s_2', '2500', false, 12000, 2500), inz('s_3', '4100', false, 6000, 4100), inz('s_4', '9000', false, 20000, 9000), inz('s_5', '3300', false, 15000, 3300), inz('s_6', 'geen idee', false, 25000, null)],
      { stand: stand(erbij({ 1: 870 })), uitdeling: { 1: 870 } },
    ),
  },
  {
    id: 'antwoord-stem', hoofdstuk: 'Onthulling', titel: 'Stemvraag: de telling',
    let: 'De balkjes per genoemde naam, het kroontje bij de meeste stemmen, en wie op wie stemde.',
    vorigePunten: START,
    maak: () => antwoord(
      R.stem, V.stem,
      {
        antwoord: 'Rik',
        stemmen: [
          { naam: 'Rik', aantal: 3, van: ['s_1', 's_3', 's_5'] },
          { naam: 'Joris', aantal: 2, van: ['s_2', 's_4'] },
          { naam: 'Liz', aantal: 1, van: ['s_6'] },
        ],
      },
      [inz('s_1', 'Rik', true, 4000), inz('s_2', 'Joris', false, 6000), inz('s_3', 'Rik', true, 5000), inz('s_4', 'Joris', false, 9000), inz('s_5', 'Rik', true, 3000), inz('s_6', 'Liz', false, 12000)],
      { stand: stand(erbij({ 1: 870, 3: 870, 5: 870 })), uitdeling: { 1: 870, 3: 870, 5: 870 } },
    ),
  },

  /* ── Cijfers van het jaar ── */
  {
    id: 'cijfers-sport', hoofdstuk: 'Cijfers van het jaar', titel: 'Sport: iedereen naast elkaar',
    let: 'De balken groeien, met een streep bij ieders doel. Stap verder voor de jaarkaart per persoon.',
    maak: () => metRonde(R.sport, { fase: 'cijfers', cijfers: cijfers('sport', 0) }),
  },
  {
    id: 'cijfers-sport-persoon', hoofdstuk: 'Cijfers van het jaar', titel: 'Sport: één persoon',
    let: 'De jaarkaart met een hokje per dag, het aantal per maand, de sporten en de langste reeks. De dagen na 15 november zijn nog leeg.',
    maak: () => metRonde(R.sport, { fase: 'cijfers', cijfers: cijfers('sport', 1) }),
  },
  {
    id: 'cijfers-taart', hoofdstuk: 'Cijfers van het jaar', titel: 'Taart: iedereen naast elkaar',
    let: 'De taartteller met de vlaggen erachter.',
    maak: () => metRonde(R.taart, { fase: 'cijfers', cijfers: cijfers('taart', 0) }),
  },
  {
    id: 'cijfers-taart-persoon', hoofdstuk: 'Cijfers van het jaar', titel: 'Taart: één persoon',
    let: 'De taartdagen en de landen in volgorde van bezoek.',
    maak: () => metRonde(R.taart, { fase: 'cijfers', cijfers: cijfers('taart', 3) }),
  },
  {
    id: 'cijfers-voorspellingen', hoofdstuk: 'Cijfers van het jaar', titel: 'Voorspellingen: de stand',
    let: 'Goed, mis, open en punten per persoon; één voorspelling staat nog open. Cas staat erin als quizmaster (zijn punten blijven in deze ronde), Tom niet: die was er in januari niet bij en zit deze ronde uit.',
    maak: () => metRonde(R.voorspellingen, { fase: 'cijfers', cijfers: voorspellingen(0) }),
  },
  {
    id: 'cijfers-voorspelling', hoofdstuk: 'Cijfers van het jaar', titel: 'Eén voorspelling',
    let: 'De uitkomst en wat de vaste vijf en Cas in januari zeiden; Tom, de plus-één, staat er niet bij. Stap verder: een voorlopige uitkomst, en een die nog open staat.',
    maak: () => metRonde(R.voorspellingen, { fase: 'cijfers', cijfers: voorspellingen(1) }),
  },

  /* ── Stand ── */
  {
    id: 'stand', hoofdstuk: 'Stand', titel: 'De tussenstand',
    let: 'Eerst de oude volgorde, dan schuift alles: Joris klimt naar één en krijgt Stijger, de koploper het kroontje, Tom de rode lantaarn met een zin.',
    vorigePunten: START,
    maak: () => metRonde(R.cijfers, {
      fase: 'stand',
      // Met een fiche voor de punten van deze ronde, en een vlammetje voor wie op dreef is.
      stand: stand(NA_STAND).map((r) => ({ ...r, dezeRonde: r.punten - (START[r.spelerId] ?? 0) })),
      reeksen: { 3: 3 },
    }),
  },

  /* ── Uitslag ── */
  {
    id: 'einde', hoofdstuk: 'Uitslag', titel: 'Het podium',
    let: 'Confetti, drie treden die uit de vloer rijzen, de fanfare als de winnaar bovenaan staat, dan de prijzen, de poedelprijs en de rest van de stand.',
    vorigePunten: NA_STAND,
    maak: () => basis({ fase: 'einde', rondeIndex: RONDE_AANTAL - 1, stand: stand(EIND), prijzen: PRIJZEN }),
  },
  {
    id: 'einde-gelijk', hoofdstuk: 'Uitslag', titel: 'Gelijkspel bovenaan',
    let: '“Joris & Liz winnen” — twee winnaars, één trede.',
    vorigePunten: NA_STAND,
    maak: () => basis({ fase: 'einde', rondeIndex: RONDE_AANTAL - 1, stand: stand({ ...EIND, 1: 21 }), prijzen: PRIJZEN.slice(0, 3) }),
  },

  /* ── Randgevallen ── */
  {
    id: 'vraag-lang', hoofdstuk: 'Randgevallen', titel: 'Een veel te lange vraag',
    let: 'Past de tekst met vier lange keuzes nog op het scherm, en blijft de inleverrij zichtbaar?',
    maak: () => vraag(R.meerkeuze, V.lang),
  },
  {
    id: 'vraag-video-ontbreekt', hoofdstuk: 'Randgevallen', titel: 'Een filmpje dat ontbreekt',
    let: 'Het bestand staat niet in media/. In plaats van een kapot pictogram komt er een nette melding, en de vraag blijft bruikbaar.',
    maak: () => vraag(R.beeld, V.video),
  },
  {
    id: 'verbinden', hoofdstuk: 'Randgevallen', titel: 'Nog geen verbinding',
    let: 'Wat de televisie toont voordat de eerste momentopname binnen is.',
    maak: () => null,
  },
];

/* ---- De bediening ---------------------------------------------------- */

/**
 * Een fase die het scherm niet kent, voor de knip tussen twee dia's met
 * dezelfde fase. Het scherm speelt geluiden en het schuiven van de stand
 * bij een wisseling van fase; twee onthullingen achter elkaar zouden anders
 * stilletjes in elkaar overgaan. Even naar een lege fase en terug, en de
 * tweede onthulling klinkt weer als een onthulling.
 */
const KNIP = 'tussen' as unknown as Fase;
const KNIP_MS = 90;

export interface Actie {
  label: string;
  toets?: string;
  doe: () => void;
}

export class Testmodus {
  dias = DIAS;
  index = $state(0);
  paneelOpen = $state(true);

  /** De momentopname waar de knoppen aan sleutelen. */
  #huidig: PubliekeStaat | null = null;
  #versie = 1;
  #knipTimer: ReturnType<typeof setTimeout> | null = null;
  #reactieTimers = new Set<ReturnType<typeof setTimeout>>();
  #reactieTeller = 0;
  /** Hoeveel er nog op de klok stond toen hij werd gepauzeerd. */
  #restMs = 0;

  get dia(): Dia {
    return this.dias[this.index];
  }

  /** Begint bij de dia uit de URL (`?test=stand`), anders bij de eerste. */
  start(gevraagd: string | null) {
    const i = this.dias.findIndex((d) => d.id === gevraagd);
    live.stop();
    live.bron = 'geen';
    live.verbonden = true;
    live.afwijking = 0;
    this.ga(i >= 0 ? i : 0, false);
  }

  stop() {
    if (this.#knipTimer) clearTimeout(this.#knipTimer);
    for (const t of this.#reactieTimers) clearTimeout(t);
    this.#reactieTimers.clear();
    live.reacties = [];
  }

  ga(i: number, knip = true) {
    if (i < 0 || i >= this.dias.length) return;
    this.index = i;
    const dia = this.dias[i];
    const nieuw = dia.maak();
    const vorige = live.staat;
    // Punten van vóór de dia, zodat het scorebord telt in plaats van springt.
    live.vorigePunten = dia.vorigePunten ?? (nieuw ? puntenVan(nieuw) : {});
    this.#onthoud(dia.id);
    if (knip && nieuw && vorige && vorige.fase === nieuw.fase) {
      this.#knipNaar(nieuw);
    } else {
      this.#toon(nieuw);
    }
  }

  volgende() {
    this.ga(Math.min(this.dias.length - 1, this.index + 1));
  }

  vorige() {
    this.ga(Math.max(0, this.index - 1));
  }

  /** Dezelfde dia opnieuw, met alle overgangen en geluiden. */
  opnieuw() {
    const dia = this.dia;
    live.vorigePunten = dia.vorigePunten ?? {};
    this.#knipNaar(dia.maak());
  }

  /** De knoppen die bij deze dia passen. Leest live.staat, dus reactief in een $derived. */
  acties(): Actie[] {
    const st = live.staat;
    const uit: Actie[] = [];
    if (!st) return uit;
    if (st.fase === 'lobby') {
      uit.push({ label: 'Telefoon komt binnen', toets: 'B', doe: () => this.telefoonErbij() });
      uit.push({ label: 'Telefoon valt weg', doe: () => this.telefoonWeg() });
    }
    if (st.fase === 'vraag') {
      uit.push({ label: 'Iemand levert in', toets: 'I', doe: () => this.levertIn() });
      uit.push({ label: 'Nog 8 seconden', toets: 'K', doe: () => this.klokNaar(8) });
      uit.push({ label: st.klok?.loopt ? 'Klok pauzeren' : 'Klok hervatten', toets: 'P', doe: () => this.klokPauze() });
      uit.push({ label: 'Tijd is om', doe: () => this.klokNaar(0) });
      uit.push({ label: 'Nieuwe klok', doe: () => this.klokNaar((st.klok?.duurMs ?? 30000) / 1000) });
    }
    if (st.fase === 'antwoord') {
      const open = st.inzendingen.some((i) => i.isGoed === null);
      uit.push({ label: open ? 'Beoordeel de volgende' : 'Alles is beoordeeld', toets: 'I', doe: () => this.beoordeel() });
    }
    if ((st.fase === 'vraag' || st.fase === 'antwoord') && st.vraag?.media && st.vraag.media.soort !== 'beeld') {
      uit.push({ label: st.mediaSpeelt ? 'Fragment stoppen' : 'Fragment afspelen', toets: 'M', doe: () => this.mediaWissel() });
    }
    if (st.fase === 'cijfers' && st.cijfers) {
      uit.push({ label: 'Stap terug', doe: () => this.cijfersStap(-1) });
      uit.push({ label: `Stap verder (${st.cijfers.stap} / ${st.cijfers.stappen})`, toets: 'N', doe: () => this.cijfersStap(1) });
    }
    if (st.fase !== 'lobby') {
      uit.push({ label: 'Reactie van een telefoon', toets: 'E', doe: () => this.reactie() });
    }
    return uit;
  }

  /* ---- De handelingen ---- */

  telefoonErbij() {
    this.#wijzig((st) => {
      const s = st.spelers.find((x) => !x.verbonden);
      if (!s) return;
      s.verbonden = true;
      s.stilSinds = 1;
    });
  }

  telefoonWeg() {
    this.#wijzig((st) => {
      const s = [...st.spelers].reverse().find((x) => x.verbonden);
      if (!s) return;
      s.verbonden = false;
      s.stilSinds = 25;
    });
  }

  levertIn() {
    this.#wijzig((st) => {
      const t = st.teams.find((x) => !st.ingeleverd.includes(x.id));
      if (t) st.ingeleverd = [...st.ingeleverd, t.id];
    });
  }

  klokNaar(seconden: number) {
    this.#wijzig((st) => {
      const duurMs = st.klok?.duurMs ?? 30000;
      st.klok = { eindigtOp: Date.now() + seconden * 1000 - (seconden === 0 ? 1 : 0), duurMs, loopt: true };
    });
  }

  klokPauze() {
    this.#wijzig((st) => {
      if (!st.klok) return;
      if (st.klok.loopt) {
        this.#restMs = Math.max(0, (st.klok.eindigtOp ?? Date.now()) - Date.now());
        st.klok = { ...st.klok, eindigtOp: null, loopt: false };
      } else {
        st.klok = { ...st.klok, eindigtOp: Date.now() + (this.#restMs || st.klok.duurMs), loopt: true };
      }
    });
  }

  /** Beoordeelt de eerstvolgende inzending zonder oordeel, zoals de quizmaster dat zou doen. */
  beoordeel() {
    this.#wijzig((st) => {
      const i = st.inzendingen.find((x) => x.isGoed === null);
      if (!i || !st.onthulling) return;
      const norm = (s: string) => s.trim().toLowerCase();
      const goed = norm(i.tekst) !== '' && norm(i.tekst) === norm(st.onthulling.antwoord);
      i.isGoed = goed;
      if (!goed) return;
      // Zoals een antwoord halverwege de klok: driekwart van het maximum.
      const punten = Math.round((st.vraag?.maximaal ?? PUNT_WAARDE) * 0.75);
      const team = st.teams.find((t) => t.id === i.inzender);
      const nu = puntenVan(st);
      live.vorigePunten = nu;
      for (const id of team?.leden ?? []) {
        nu[id] = (nu[id] ?? 0) + punten;
        st.uitdeling = { ...st.uitdeling, [id]: punten };
      }
      st.stand = stand(nu);
    });
  }

  mediaWissel() {
    this.#wijzig((st) => {
      st.mediaSpeelt = !st.mediaSpeelt;
    });
  }

  cijfersStap(richting: 1 | -1) {
    this.#wijzig((st) => {
      if (!st.cijfers) return;
      const stap = Math.max(0, Math.min(st.cijfers.stappen, st.cijfers.stap + richting));
      st.cijfers = { ...st.cijfers, stap };
    });
  }

  reactie() {
    const st = live.staat;
    if (!st) return;
    const n = ++this.#reactieTeller;
    const emoji = REACTIES[n % REACTIES.length];
    const naam = NAMEN[(n * 7) % NAMEN.length];
    const r = { id: -n, emoji, naam, x: 8 + ((n * 37) % 84) };
    live.reacties = [...live.reacties.slice(-24), r];
    const t = setTimeout(() => {
      live.reacties = live.reacties.filter((x) => x.id !== r.id);
      this.#reactieTimers.delete(t);
    }, 3200);
    this.#reactieTimers.add(t);
  }

  /* ---- Onder de motorkap ---- */

  #wijzig(doe: (st: PubliekeStaat) => void) {
    if (!this.#huidig) return;
    const st = structuredClone(this.#huidig);
    doe(st);
    this.#toon(st);
  }

  #toon(st: PubliekeStaat | null) {
    if (this.#knipTimer) {
      clearTimeout(this.#knipTimer);
      this.#knipTimer = null;
    }
    this.#huidig = st;
    if (st) {
      st.versie = ++this.#versie;
      st.serverTijd = Date.now();
    }
    live.afwijking = 0;
    live.staat = st;
  }

  #knipNaar(st: PubliekeStaat | null) {
    const tussen = st ? { ...st, fase: KNIP, klok: null, cijfers: null, vraag: null, onthulling: null } : basis({ fase: KNIP });
    this.#toon(tussen);
    this.#knipTimer = setTimeout(() => this.#toon(st), KNIP_MS);
  }

  /** Zet de dia in de URL, zodat herladen op dezelfde plek uitkomt. */
  #onthoud(id: string) {
    if (typeof window === 'undefined') return;
    // Even wachten: bij de eerste dia is de router van SvelteKit nog niet klaar.
    setTimeout(() => {
      try {
        const url = new URL(location.href);
        url.searchParams.set('test', id);
        replaceState(url, {});
      } catch {
        /* geen geschiedenis, geen ramp */
      }
    }, 0);
  }
}

export const testmodus = new Testmodus();

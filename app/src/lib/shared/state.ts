/** Types die server en client delen. De client krijgt nooit meer te zien dan
 *  bij de huidige fase hoort: in de fase 'vraag' zit er geen antwoord in. */

export type Rol = 'gast' | 'speler' | 'quizmaster';
export type Fase = 'lobby' | 'jaaroverzicht' | 'ronde' | 'vraag' | 'antwoord' | 'cijfers' | 'stand' | 'einde';

export interface PubliekeSpeler {
  id: number;
  naam: string;
  foto: string | null;
  /** Aantal seconden sinds dit apparaat zich voor het laatst meldde. */
  stilSinds: number | null;
  verbonden: boolean;
}

export interface PubliekTeam {
  id: string;
  naam: string;
  suit: string;
  leden: number[];
}

export interface PubliekeVraag {
  index: number;
  aantal: number;
  type: string;
  tekst: string;
  opties?: string[];
  emoji?: string;
  lyric?: string;
  eenheid?: string;
  media?: { soort: string; bron: string; bijschrift?: string };
  punten: number;
}

export interface Onthulling {
  antwoord: string;
  toelichting?: string;
  goedeOptie?: number;
  /** Bij dichtstbij: het doelgetal, voor de getallenlijn op de televisie. */
  getal?: number;
  eenheid?: string;
  /** Bij stem: de telling per genoemde naam, meeste stemmen eerst. */
  stemmen?: { naam: string; aantal: number; van: string[] }[];
}

/** Een por van de quizmaster: "schiet op", voor wie nog niet heeft ingeleverd. */
export interface Por {
  id: number;
  spelerIds: number[];
  tekst: string;
}

/** Een regel uit het logboek van de quizmaster. */
export interface LogRegel {
  id: number;
  opdracht: string;
  omschrijving: string;
  /** Of deze handeling nog terug te draaien is. */
  terugTeDraaien: boolean;
  isOngedaan: boolean;
  aangemaaktOp: number;
}

/** Een ingeleverd antwoord zoals de kamer het na de onthulling mag zien. */
export interface PubliekeInzending {
  inzender: string;
  tekst: string;
  /** null zolang de quizmaster nog niet heeft beoordeeld. */
  isGoed: boolean | null;
  /** Milliseconden na het opengaan van de vraag; null als dat onbekend is. */
  naMs: number | null;
  /** Bij dichtstbij: het getal dat uit de tekst is gelezen. */
  getal: number | null;
}

export interface PubliekeStaat {
  /** Loopt op bij elke wijziging; de client negeert oudere pakketjes. */
  versie: number;
  /** Het nummer van dit spel, voor de uitslagpagina. */
  spelId: number;
  fase: Fase;
  quizNaam: string;
  rondeIndex: number;
  rondeAantal: number;
  ronde: {
    naam: string;
    suit: string;
    thema: string;
    sfeer: string;
    uitleg: string;
    teamModus: string;
    vragenAantal: number;
    /** Na de laatste vraag volgen de cijfers van het jaar. */
    cijfers: 'sport' | 'taart' | 'voorspellingen' | null;
  } | null;
  vraag: PubliekeVraag | null;
  onthulling: Onthulling | null;
  teams: PubliekTeam[];
  spelers: PubliekeSpeler[];
  stand: { spelerId: number; naam: string; punten: number; foto: string | null }[];
  /** Servertijd in ms bij het versturen — de client corrigeert zijn eigen klok hiermee. */
  serverTijd: number;
  klok: { eindigtOp: number | null; duurMs: number; loopt: boolean } | null;
  /** Of het fragment (video of muziek) bij deze vraag hoort te spelen. */
  mediaSpeelt: boolean;
  /** De prijzen van de avond. Alleen gevuld in de fase 'einde'. */
  prijzen: { sleutel: string; titel: string; namen: string[]; detail: string }[];
  /** Antwoorden die al binnen zijn, per speler- of team-id. Alleen namen, geen inhoud. */
  ingeleverd: string[];
  /** De ingeleverde antwoorden zelf. Alleen gevuld in de fase 'antwoord'. */
  inzendingen: PubliekeInzending[];
  /** Punten die bij de huidige vraag zijn uitgedeeld, per speler. Alleen in de fase 'antwoord'. */
  uitdeling: Record<number, number>;
  /** De cijfers van het jaar. Alleen gevuld in de fase 'cijfers'. */
  cijfers: Cijfers | null;
  /** De dia van het jaaroverzicht. Alleen gevuld in de fase 'jaaroverzicht'. */
  jaaroverzicht: JaarDia | null;
}

/* ---- De cijfers van het jaar ------------------------------------------
   Wat de televisie na een recap-ronde laat zien: per persoon de tijdlijn
   van het jaar, de sporten en de landen. Komt uit resolution-recap. */

export interface CijfersSport {
  totaal: number;
  doel: number | null;
  /** Aantal keer per dag, 'JJJJ-MM-DD' → aantal. Alleen dagen met iets erop. */
  dagen: Record<string, number>;
  soorten: { naam: string; emoji: string; aantal: number }[];
  langsteReeks: number;
}

export interface CijfersTaart {
  totaal: number;
  dagen: Record<string, number>;
}

export interface CijfersLand {
  code: string;
  naam: string;
  vlag: string;
  datum: string;
}

export interface CijfersPersoon {
  naam: string;
  emoji: string;
  sport: CijfersSport;
  taart: CijfersTaart;
  landen: CijfersLand[];
}

/* ---- De voorspellingen van januari ------------------------------------ */

export interface VoorspellingUitslag {
  nr: number;
  vraag: string;
  soort: 'janee' | 'getal' | 'naam' | 'open';
  /** Wat er echt gebeurde; null zolang dat nog niet bekend is. */
  uitkomst: string | null;
  open: boolean;
  /** De uitkomst komt uit cijfers die nog kunnen veranderen tot het jaar om is. */
  voorlopig: boolean;
  toelichting?: string;
  antwoorden: {
    naam: string;
    antwoord: string;
    inzet: number;
    /** null: nog niet te zeggen. */
    goed: boolean | null;
    /** Wat er voor deze persoon echt uitkwam, als dat per persoon verschilt. */
    werkelijk?: string;
  }[];
}

export interface VoorspellerStand {
  naam: string;
  goed: number;
  fout: number;
  open: number;
  punten: number;
}

export interface VoorspellingenUitslag {
  vragen: VoorspellingUitslag[];
  stand: VoorspellerStand[];
  /** Hoeveel voorspellingen nog geen uitkomst hebben. */
  open: number;
}

export interface Cijfers {
  soort: 'sport' | 'taart' | 'voorspellingen';
  /** 0 is het overzicht, daarna één persoon per stap. */
  stap: number;
  stappen: number;
  jaar: number;
  /** Tot welke dag de cijfers lopen, 'JJJJ-MM-DD'. */
  peildatum: string;
  personen: CijfersPersoon[];
  /** Alleen bij soort 'voorspellingen'. */
  voorspellingen?: VoorspellingenUitslag;
}

export interface AntwoordInzending {
  vraagSleutel: string;
  tekst: string;
  /** Lokale tijd van de client; de server gebruikt zijn eigen klok voor de beoordeling. */
  ingediendOp: number;
}

/* ---- Het jaaroverzicht -------------------------------------------------
   De film waarmee de avond opent: het jaar maand voor maand, met een
   zwarte balk over alles wat de quiz nog gaat vragen. Zolang die balken
   liggen, staat het woord er niet in — ook niet verborgen in het pakketje,
   precies zoals een antwoord ook pas bij de onthulling meekomt. */

/** Een stukje regel: gewone tekst, of een balk waar een antwoord onder zit. */
export interface JaarDeel {
  /** Leeg zolang de balk ligt. */
  tekst: string;
  balk: boolean;
  /** Hoe breed de balk moet zijn: het aantal tekens dat eronder zit. */
  lengte: number;
}

export interface JaarRegel {
  emoji: string | null;
  delen: JaarDeel[];
  /** Het bijschrift, of null als de regel er geen heeft. */
  bij: JaarDeel[] | null;
}

/** Wat wij die maand zelf deden. Komt uit resolution-recap. */
export interface JaarEigen {
  sport: number;
  taart: number;
  /** Landen die deze maand voor het eerst op de lijst kwamen. */
  landen: { vlag: string; naam: string; wie: string; datum: string }[];
  /** Landen die al op de lijst stonden toen het jaar begon; geen uitje. */
  bijStart: number;
  /** Wie er deze maand het vaakst sportte; null als niemand iets noteerde. */
  koploper: { naam: string; aantal: number } | null;
  /** Per persoon, zodat je op je eigen telefoon je eigen maand ziet. */
  perPersoon: { naam: string; sport: number; taart: number; landen: string[] }[];
  /** De stand van het jaar tot en met deze maand. */
  totaal: { sport: number; taart: number; landen: number };
}

export interface JaarDia {
  soort: 'titel' | 'maand' | 'slot';
  /** 0 is de titelkaart, daarna één maand per stap, en tot slot de slotkaart. */
  stap: number;
  stappen: number;
  jaar: number;
  /** De grote regel: de naam van de maand, of de titel van de film. */
  titel: string;
  /** De regel eronder. */
  kop: string;
  /** Het nummer van de maand (1-12), of null op de titel- en slotkaart. */
  maand: number | null;
  regels: JaarRegel[];
  eigen: JaarEigen | null;
  /** De maandnummers die in deze film zitten, voor de filmstrook. */
  strook: number[];
  /** Of de balken eraf zijn. Dat gebeurt vanzelf na de uitslag. */
  onthuld: boolean;
  /** Hoelang deze dia in beeld blijft als de film vanzelf doorloopt. */
  seconden: number;
  /** Het jaar in getallen. Alleen op de slotkaart. */
  jaartotaal: { sport: number; taart: number; landen: number; dagen: number } | null;
  /** Tot welke dag de eigen cijfers lopen, 'JJJJ-MM-DD'. */
  peildatum: string;
}

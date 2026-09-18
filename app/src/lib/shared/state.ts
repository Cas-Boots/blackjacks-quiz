/** Types die server en client delen. De client krijgt nooit meer te zien dan
 *  bij de huidige fase hoort: in de fase 'vraag' zit er geen antwoord in. */

export type Rol = 'gast' | 'speler' | 'quizmaster';
export type Fase = 'lobby' | 'ronde' | 'vraag' | 'antwoord' | 'stand' | 'einde';

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
}

export interface AntwoordInzending {
  vraagSleutel: string;
  tekst: string;
  /** Lokale tijd van de client; de server gebruikt zijn eigen klok voor de beoordeling. */
  ingediendOp: number;
}

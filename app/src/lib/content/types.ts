/** De vorm van de quizinhoud. Gelijk aan die van de losse HTML-quiz, zodat
 *  beide varianten dezelfde vragen kunnen draaien. */

export type VraagType = 'waarnietwaar' | 'meerkeuze' | 'open' | 'dichtstbij';
export type TeamModus = 'individueel' | 'teams' | 'samen';
export type MediaSoort = 'beeld' | 'video' | 'muziek';

export interface Media {
  soort: MediaSoort;
  /** Bestandsnaam uit de mediabibliotheek, of een data:-URI. */
  bron: string;
  bijschrift?: string;
}

export interface Vraag {
  /** De vraagtekst. */
  v: string;
  /** Het antwoord bij open vragen. */
  a?: string;
  /** Bij waarnietwaar: de stelling klopt. Bij meerkeuze: index van het goede antwoord. */
  goed?: boolean | number;
  opties?: string[];
  getal?: number;
  eenheid?: string;
  emoji?: string;
  lyric?: string;
  toelichting?: string;
  media?: Media;
  /** Overschrijft de rondewaarde. */
  tijd?: number;
  punten?: number;
  /** Het antwoord moet nog worden ingevuld. */
  teVullen?: boolean;
}

export interface Ronde {
  naam: string;
  suit: string;
  thema: string;
  type: VraagType;
  tijd: number;
  punten: number;
  teamModus: TeamModus;
  aantalTeams?: number;
  uitleg: string;
  /** Standaard uitgevinkt bij het samenstellen. */
  optioneel?: boolean;
  teVullen?: boolean;
  vragen: Vraag[];
}

export interface Pakket {
  naam: string;
  beschrijving: string;
  rondes: Ronde[];
}

export type Pakketten = Record<string, Pakket>;

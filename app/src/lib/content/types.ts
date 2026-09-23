/** De vorm van de quizinhoud. Gelijk aan die van de losse HTML-quiz, zodat
 *  beide varianten dezelfde vragen kunnen draaien. */

/** 'stem': iedereen kiest een medespeler; wie met de meerderheid meestemt krijgt de punten. */
export type VraagType = 'waarnietwaar' | 'meerkeuze' | 'open' | 'dichtstbij' | 'stem';
export type TeamModus = 'individueel' | 'teams' | 'samen';
export type MediaSoort = 'beeld' | 'video' | 'muziek';
export type CijfersSoort = 'sport' | 'taart' | 'voorspellingen';

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
  /**
   * Sleutel van een levende vraag: de meespeelversie rekent vraag, antwoord
   * en toelichting uit op de cijfers uit resolution-recap. Zie
   * server/recap/vragen.ts voor de sleutels. De tekst hier is de achtervang
   * voor de losse HTML-quiz.
   */
  live?: string;
}

export interface Ronde {
  naam: string;
  suit: string;
  thema: string;
  /** Kleursfeer van de ronde. Zie de sfeerblokken in app.css. */
  sfeer?: string;
  type: VraagType;
  tijd: number;
  punten: number;
  teamModus: TeamModus;
  aantalTeams?: number;
  uitleg: string;
  /** Standaard uitgevinkt bij het samenstellen. */
  optioneel?: boolean;
  teVullen?: boolean;
  /** Na de laatste vraag laat de televisie de cijfers van het jaar zien. */
  cijfers?: CijfersSoort;
  vragen: Vraag[];
}

export interface Pakket {
  naam: string;
  beschrijving: string;
  rondes: Ronde[];
}

export type Pakketten = Record<string, Pakket>;

/* ---- Het jaaroverzicht -------------------------------------------------
   De film waarmee de avond begint: het jaar maand voor maand langs, met
   een zwarte balk over alles wat de quiz later vraagt. Zie
   content/jaaroverzicht.ts voor de tijdlijn zelf. */

export interface JaarMoment {
  /**
   * De regel zoals hij op het scherm komt. Wat tussen dubbele haken staat
   * is een antwoord van vanavond: vóór de quiz een zwarte balk, na afloop
   * gewoon te lezen. Bijvoorbeeld: "[[Bulgarije]] wint het Songfestival."
   */
  tekst: string;
  /** Een klein bijschrift eronder. Hier nooit iets wat een antwoord verraadt. */
  bij?: string;
  emoji?: string;
  /** Deze regel wacht nog op invulling; de televisie slaat hem over. */
  teVullen?: boolean;
  /**
   * Alleen in de herhaling na de uitslag. Voor een regel die met balken en
   * al nog een antwoord weggeeft: omdat de hele zin een waar-of-niet-waar
   * beantwoordt, of omdat de maand waarin hij staat zelf de vraag is.
   */
  pasNaAfloop?: boolean;
}

export interface JaarMaand {
  /** 1 tot en met 12. */
  nr: number;
  /** De kop boven de maand. */
  kop: string;
  momenten: JaarMoment[];
}

export interface Jaaroverzicht {
  jaar: number;
  titel: string;
  /** Wat er op de titelkaart staat, vóór de eerste maand. */
  inleiding: string;
  /** Wat er op de slotkaart staat, vlak voor de eerste ronde. */
  slot: string;
  /** Dezelfde slotkaart, maar bij de herhaling aan het eind van de avond. */
  slotNaAfloop: string;
  maanden: JaarMaand[];
}

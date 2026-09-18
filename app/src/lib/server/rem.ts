/**
 * Een rem op herhaalde mislukte pogingen, per sleutel (meestal een IP-adres).
 *
 * Bedoeld voor de pincode van de quizmaster: vier cijfers zijn in een paar
 * minuten geraden als je dat ongeremd mag proberen. Na een handvol missers
 * binnen het venster gaat de sleutel een tijdje op slot. Een geslaagde poging
 * maakt de teller leeg.
 *
 * Alles zit in het geheugen van het ene proces; bij een herstart is het weg.
 * Dat is prima: het doel is een gokreeks afremmen, niet een grootboek.
 */
export interface RemOpties {
  /** Hoeveel missers er binnen het venster mogen zijn vóór de blokkade. */
  maxMissers: number;
  /** Hoe lang missers meetellen, in ms. */
  vensterMs: number;
  /** Hoe lang een sleutel op slot gaat, in ms. */
  blokkadeMs: number;
}

interface Stand {
  missers: number[];
  geblokkeerdTot: number | null;
}

export class Rem {
  #standen = new Map<string, Stand>();
  #opties: RemOpties;
  #klok: () => number;

  constructor(opties: Partial<RemOpties> = {}, klok: () => number = () => Date.now()) {
    this.#opties = { maxMissers: 5, vensterMs: 60_000, blokkadeMs: 5 * 60_000, ...opties };
    this.#klok = klok;
  }

  /** Tot wanneer deze sleutel op slot zit (unix-ms), of null als hij vrij is. */
  geblokkeerdTot(sleutel: string): number | null {
    const stand = this.#standen.get(sleutel);
    if (!stand) return null;
    const nu = this.#klok();
    if (stand.geblokkeerdTot != null && stand.geblokkeerdTot > nu) return stand.geblokkeerdTot;
    if (stand.geblokkeerdTot != null) {
      // De blokkade is voorbij: schone lei.
      this.#standen.delete(sleutel);
      return null;
    }
    return null;
  }

  /** Registreert een misser. Geeft terug tot wanneer de sleutel nu op slot zit, of null. */
  misser(sleutel: string): number | null {
    const nu = this.#klok();
    this.#opruimen(nu);
    const stand = this.#standen.get(sleutel) ?? { missers: [], geblokkeerdTot: null };
    stand.missers = stand.missers.filter((t) => nu - t < this.#opties.vensterMs);
    stand.missers.push(nu);
    if (stand.missers.length >= this.#opties.maxMissers) {
      stand.geblokkeerdTot = nu + this.#opties.blokkadeMs;
      stand.missers = [];
    }
    this.#standen.set(sleutel, stand);
    return stand.geblokkeerdTot;
  }

  /** Een geslaagde poging: de sleutel is weer vrij. */
  gelukt(sleutel: string) {
    this.#standen.delete(sleutel);
  }

  /** Voor de tests en de gezondheidscontrole. */
  get aantalSleutels() {
    return this.#standen.size;
  }

  /** Vergeet sleutels waar niets meer van meetelt, zodat de map niet oneindig groeit. */
  #opruimen(nu: number) {
    for (const [sleutel, stand] of this.#standen) {
      const blokkadeVoorbij = stand.geblokkeerdTot == null || stand.geblokkeerdTot <= nu;
      const missersVerlopen = stand.missers.every((t) => nu - t >= this.#opties.vensterMs);
      if (blokkadeVoorbij && missersVerlopen) this.#standen.delete(sleutel);
    }
  }
}

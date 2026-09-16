/**
 * Kleine pub/sub binnen het proces, voor de SSE-stroom.
 *
 * De app draait als één Node-proces (adapter-node, één container), dus een
 * eenvoudige verzameling luisteraars volstaat. Zou je ooit meerdere processen
 * draaien, dan moet dit een gedeeld kanaal worden — vandaar dat alles hier
 * door één functie loopt.
 */

type Luisteraar = (versie: number) => void;

const luisteraars = new Set<Luisteraar>();

export function luister(fn: Luisteraar): () => void {
  luisteraars.add(fn);
  return () => luisteraars.delete(fn);
}

export function meldWijziging(versie: number) {
  for (const fn of [...luisteraars]) {
    try {
      fn(versie);
    } catch (err) {
      // Een kapotte luisteraar mag de rest niet meeslepen.
      console.error('[bus] luisteraar faalde:', err);
    }
  }
}

export function aantalLuisteraars() {
  return luisteraars.size;
}

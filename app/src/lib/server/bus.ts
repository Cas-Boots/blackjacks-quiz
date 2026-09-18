/**
 * Kleine pub/sub binnen het proces, voor de SSE-stroom.
 *
 * De app draait als één Node-proces (adapter-node, één container), dus een
 * eenvoudige verzameling luisteraars volstaat. Zou je ooit meerdere processen
 * draaien, dan moet dit een gedeeld kanaal worden — vandaar dat alles hier
 * door één functie loopt.
 *
 * Twee kanalen: wijzigingen van de stand (met versienummer, uit de database)
 * en reacties van telefoons (vluchtig: ze worden nergens bewaard, alleen
 * doorgegeven aan wie op dat moment kijkt).
 */

import type { Por } from '$lib/shared/state';

type Luisteraar = (versie: number) => void;
export interface ReactieBericht {
  id: number;
  emoji: string;
  naam: string;
  /** Horizontale plek op de televisie, 0–100, zodat alle schermen hem op dezelfde plek zien. */
  x: number;
}
type ReactieLuisteraar = (bericht: ReactieBericht) => void;
type PorLuisteraar = (por: Por) => void;

const luisteraars = new Set<Luisteraar>();
const reactieLuisteraars = new Set<ReactieLuisteraar>();
const porLuisteraars = new Set<PorLuisteraar>();
let porTeller = 0;

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

export function luisterReacties(fn: ReactieLuisteraar): () => void {
  reactieLuisteraars.add(fn);
  return () => reactieLuisteraars.delete(fn);
}

export function meldReactie(bericht: ReactieBericht) {
  for (const fn of [...reactieLuisteraars]) {
    try {
      fn(bericht);
    } catch (err) {
      console.error('[bus] reactieluisteraar faalde:', err);
    }
  }
}

export function luisterPorren(fn: PorLuisteraar): () => void {
  porLuisteraars.add(fn);
  return () => porLuisteraars.delete(fn);
}

/** Een por van de quizmaster naar één of meer telefoons. Vluchtig, net als een reactie. */
export function meldPor(spelerIds: number[], tekst: string): Por {
  const por: Por = { id: ++porTeller, spelerIds, tekst };
  for (const fn of [...porLuisteraars]) {
    try {
      fn(por);
    } catch (err) {
      console.error('[bus] porluisteraar faalde:', err);
    }
  }
  return por;
}

export function aantalLuisteraars() {
  return luisteraars.size;
}

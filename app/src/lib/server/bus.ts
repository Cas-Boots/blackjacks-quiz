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

import { AsyncResource } from 'node:async_hooks';
import type { Por } from '$lib/shared/state';
import { huidigeProef } from './db/index';

/*
 * Elke luisteraar hoort bij één spel: de echte avond of een proefrit. Een
 * melding gaat alleen naar luisteraars van hetzelfde spel, en een luisteraar
 * draait in zijn eigen context. Anders zou een tik in een proefrit de echte
 * televisie de stand van die proefrit laten ophalen.
 */
interface Aangemeld<F> {
  proef: string | null;
  fn: F;
}
function meld<F>(lijst: Set<Aangemeld<F>>, fn: F): () => void {
  const a = { proef: huidigeProef(), fn: AsyncResource.bind(fn as (...args: unknown[]) => unknown) as F };
  lijst.add(a);
  return () => lijst.delete(a);
}
function roep<A>(lijst: Set<Aangemeld<(a: A) => void>>, waarde: A, soort: string) {
  const proef = huidigeProef();
  for (const a of [...lijst]) {
    if (a.proef !== proef) continue;
    try {
      a.fn(waarde);
    } catch (err) {
      // Een kapotte luisteraar mag de rest niet meeslepen.
      console.error(`[bus] ${soort} faalde:`, err);
    }
  }
}

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

const luisteraars = new Set<Aangemeld<Luisteraar>>();
const reactieLuisteraars = new Set<Aangemeld<ReactieLuisteraar>>();
const porLuisteraars = new Set<Aangemeld<PorLuisteraar>>();
let porTeller = 0;

export function luister(fn: Luisteraar): () => void {
  return meld(luisteraars, fn);
}

export function meldWijziging(versie: number) {
  roep(luisteraars, versie, 'luisteraar');
}

export function luisterReacties(fn: ReactieLuisteraar): () => void {
  return meld(reactieLuisteraars, fn);
}

export function meldReactie(bericht: ReactieBericht) {
  roep(reactieLuisteraars, bericht, 'reactieluisteraar');
}

export function luisterPorren(fn: PorLuisteraar): () => void {
  return meld(porLuisteraars, fn);
}

/** Een por van de quizmaster naar één of meer telefoons. Vluchtig, net als een reactie. */
export function meldPor(spelerIds: number[], tekst: string): Por {
  const por: Por = { id: ++porTeller, spelerIds, tekst };
  roep(porLuisteraars, por, 'porluisteraar');
  return por;
}

/** Hoeveel schermen er naar de echte avond kijken; proefritten tellen niet mee. */
export function aantalLuisteraars() {
  return [...luisteraars].filter((a) => a.proef === null).length;
}

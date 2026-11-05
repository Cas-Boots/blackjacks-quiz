import type { Ronde, Vraag, VraagType } from './types';

/**
 * De antwoordvorm van één vraag: die van de vraag zelf als hij er een heeft,
 * anders die van de ronde. Zo kan een ronde open vragen, meerkeuze en
 * waar-of-niet-waar mengen.
 */
export function typeVan(ronde: Pick<Ronde, 'type'>, vraag?: Pick<Vraag, 'type'> | null): VraagType {
  return vraag?.type ?? ronde.type;
}

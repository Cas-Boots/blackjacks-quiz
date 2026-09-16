import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sqlite } from '$lib/server/db/index';
import { aantalLuisteraars } from '$lib/server/bus';

/**
 * Gezondheidscontrole voor Dokploy en dergelijke.
 *
 * Raakt de database echt aan: een proces dat luistert maar geen tabellen heeft
 * is niet gezond, en juist dát is het geval dat je wilt vangen vóór de avond.
 */
export const GET: RequestHandler = () => {
  try {
    const rij = sqlite.prepare("select count(*) as n from sqlite_master where type='table'").get() as { n: number };
    const spelers = sqlite.prepare('select count(*) as n from spelers').get() as { n: number };
    return json({
      status: 'ok',
      tabellen: rij.n,
      spelers: spelers.n,
      schermenVerbonden: aantalLuisteraars(),
    });
  } catch (err) {
    return json({ status: 'fout', reden: (err as Error).message }, { status: 503 });
  }
};

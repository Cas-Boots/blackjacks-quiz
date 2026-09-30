import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { mkdirSync, existsSync, accessSync, constants } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { AsyncLocalStorage } from 'node:async_hooks';

const dbPad = process.env.DATABASE_PATH ?? 'local.db';
const map = dirname(dbPad);
if (map !== '.' && !existsSync(map)) mkdirSync(map, { recursive: true });

// Een onleesbare of onschrijfbare map geeft anders een cryptische
// SQLITE_CANTOPEN. Dit is de fout die je krijgt als de container als 'node'
// draait op een volume dat nog van root is; zie de README.
try {
  accessSync(map === '.' ? process.cwd() : map, constants.R_OK | constants.W_OK);
} catch {
  throw new Error(
    `Geen schrijfrechten in ${resolve(map)} voor de database ${dbPad}. ` +
      'Draait de app als een andere gebruiker dan de eigenaar van die map? ' +
      'In Docker: zie "Een bestaand volume" in de README.',
  );
}

const sqlite = new Database(dbPad);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

type Db = ReturnType<typeof drizzle<typeof schema>>;
const echteDb: Db = drizzle(sqlite, { schema });

/**
 * Een proefrit (zie proef.ts) heeft een eigen database in het geheugen. Een
 * verzoek dat bij een proefrit hoort, draait binnen `binnen()`, en dan wijst
 * `db` voor alles in dat verzoek naar die database. Zo raakt een proefrit de
 * echte avond nergens, zonder dat elke query dat hoeft te weten.
 */
export interface Context {
  proefId: string;
  db: Db;
}
const opslag = new AsyncLocalStorage<Context>();

/** Draait fn binnen een proefrit. Alles wat daaruit volgt, ook timers, ziet diens database. */
export function binnen<T>(context: Context, fn: () => T): T {
  return opslag.run(context, fn);
}

/** De proefrit van dit verzoek, of null voor de echte avond. */
export function huidigeProef(): string | null {
  return opslag.getStore()?.proefId ?? null;
}

/** Een nieuwe, lege database in het geheugen, voor een proefrit. */
export function geheugenDb(): Db {
  const geheugen = new Database(':memory:');
  geheugen.pragma('foreign_keys = ON');
  return drizzle(geheugen, { schema });
}

/** De echte database, ook vanuit een proefrit. Alleen om spelers over te nemen. */
export const echte = echteDb;

export const db: Db = new Proxy(echteDb, {
  get(_, sleutel) {
    const doel = opslag.getStore()?.db ?? echteDb;
    const waarde = Reflect.get(doel, sleutel, doel);
    return typeof waarde === 'function' ? waarde.bind(doel) : waarde;
  },
});
export { sqlite };

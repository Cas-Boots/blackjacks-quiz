import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { mkdirSync, existsSync, accessSync, constants } from 'node:fs';
import { dirname, resolve } from 'node:path';

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

export const db = drizzle(sqlite, { schema });
export { sqlite };

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

const dbPad = process.env.DATABASE_PATH ?? 'local.db';
const map = dirname(dbPad);
if (map !== '.' && !existsSync(map)) mkdirSync(map, { recursive: true });

const sqlite = new Database(dbPad);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
export { sqlite };

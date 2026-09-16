import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './index';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

let gedaan = false;

/** Draait de migraties één keer per proces. Faalt hard: een verkeerd schema
 *  is niet iets om doorheen te serveren. */
export function zorgVoorMigraties() {
  if (gedaan) return;
  const hier = dirname(fileURLToPath(import.meta.url));
  const map = resolve(hier, '../../../../drizzle/migrations');
  if (!existsSync(map)) {
    console.warn('[migratie] map niet gevonden, overgeslagen:', map);
    gedaan = true;
    return;
  }
  migrate(db, { migrationsFolder: map });
  gedaan = true;
}

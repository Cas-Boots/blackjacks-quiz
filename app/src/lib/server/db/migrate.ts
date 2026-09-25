import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './index';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

let gedaan = false;

/**
 * Waar de migraties staan.
 *
 * Bewust vanaf de werkmap en niet vanaf dit bestand: in de gebouwde versie
 * wordt deze code in een chunk gepropt en klopt een relatief pad vanaf
 * `import.meta.url` alleen zolang die chunk toevallig even diep zit. Dat is
 * geen fundament om een avond op te bouwen. De werkmap is in dev, in Docker en
 * onder Dokploy hetzelfde: de hoofdmap van de app.
 */
function migratieMap(): string {
  return process.env.MIGRATIONS_DIR ?? resolve(process.cwd(), 'drizzle/migrations');
}

/**
 * Draait de migraties één keer per proces.
 *
 * Faalt hard als de map ontbreekt. Een ontbrekend schema stilletjes overslaan
 * levert een app op die start en pas omvalt zodra iemand een vraag beantwoordt
 * — veel liever een container die weigert op te komen, want dat zie je meteen.
 */
/** Zet het schema in een andere database, zoals die van een proefrit. */
export function migreer(doel: Parameters<typeof migrate>[0]) {
  migrate(doel, { migrationsFolder: migratieMap() });
}

export function zorgVoorMigraties() {
  if (gedaan) return;
  const map = migratieMap();
  if (!existsSync(map)) {
    throw new Error(
      `Migratiemap niet gevonden op ${map}. ` +
        'Draai vanuit de hoofdmap van de app, of zet MIGRATIONS_DIR naar de juiste map.',
    );
  }
  migrate(db, { migrationsFolder: map });
  gedaan = true;
}

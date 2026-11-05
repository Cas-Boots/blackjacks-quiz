/**
 * Ververst de ingebouwde momentopname (src/lib/content/recap-snapshot.json)
 * vanuit een dagelijkse back-up van resolution-recap.
 *
 *   npm run recap:snapshot -- --backup ../../resolution-recap/backups/db-2026-11-05.db.gz
 *
 * De back-up is de SQLite-database zelf (gzip). Dit script haalt er
 * dezelfde tabellen en velden uit als `/api/export` levert, zodat de quiz
 * er niets van merkt. `exportedAt` wordt de datum van de back-up.
 *
 * Draai daarna `npm run content:sync`: de losse HTML-quiz krijgt de
 * momentopname ook mee.
 */
import Database from 'better-sqlite3';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { join, basename, resolve } from 'node:path';
import { leesArgs } from './lib/args';

const args = leesArgs();
const backup = args.get('backup');
if (!backup) {
  console.error('Gebruik: npm run recap:snapshot -- --backup <pad naar db-JJJJ-MM-DD.db.gz>');
  process.exit(1);
}

const map = mkdtempSync(join(tmpdir(), 'recap-'));
const dbPad = join(map, 'recap.db');
writeFileSync(dbPad, backup.endsWith('.gz') ? gunzipSync(readFileSync(backup)) : readFileSync(backup));

const db = new Database(dbPad, { readonly: true });
const alle = (sql: string) => db.prepare(sql).all();
const datum = /db-(\d{4}-\d{2}-\d{2})/.exec(basename(backup))?.[1];

const uit = {
  exportSchemaVersion: 2,
  seasons: alle('SELECT id, year, name, is_active, created_at FROM seasons ORDER BY id'),
  people: alle('SELECT id, name, emoji, is_active, created_at FROM people ORDER BY id'),
  metrics: alle('SELECT id, name, is_active, created_at, emoji, name_nl FROM metrics ORDER BY id'),
  goals: alle('SELECT id, season_id, person_id, metric_id, target, created_at, updated_at FROM goals ORDER BY id'),
  countries_visited: alle('SELECT id, season_id, person_id, country_code, country_name, visited_at FROM countries_visited ORDER BY id'),
  exportedAt: datum ? `${datum}T00:00:00.000Z` : new Date().toISOString(),
  entries: alle('SELECT id, season_id, person_id, metric_id, entry_date, deleted_at, tags FROM entries ORDER BY id'),
};
db.close();
rmSync(map, { recursive: true, force: true });

const doel = resolve(import.meta.dirname, '../src/lib/content/recap-snapshot.json');
writeFileSync(doel, JSON.stringify(uit));
console.log(`Momentopname ververst uit ${basename(backup)}: ${uit.entries.length} regels, ${uit.countries_visited.length} landen.`);

import { zorgVoorMigraties } from '../src/lib/server/db/migrate';
zorgVoorMigraties();
console.log('migraties uitgevoerd');

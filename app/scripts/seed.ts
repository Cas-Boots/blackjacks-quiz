import { zorgVoorMigraties } from '../src/lib/server/db/migrate';
import { zorgVoorBasis } from '../src/lib/server/seed';
zorgVoorMigraties();
zorgVoorBasis();
console.log('basis klaargezet: spelers en een leeg spel');

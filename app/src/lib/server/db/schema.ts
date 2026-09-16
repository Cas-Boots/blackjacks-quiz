import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/** De vaste vriendengroep. Blijft staan tussen spellen door. */
export const spelers = sqliteTable('spelers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  naam: text('naam').notNull().unique(),
  /** Portret als data-URI; klein gehouden (256x256 JPEG). */
  foto: text('foto'),
  isQuizmaster: integer('is_quizmaster', { mode: 'boolean' }).notNull().default(false),
  aangemaaktOp: text('aangemaakt_op').notNull().default(sql`(datetime('now'))`),
});

/** Eén avond. Er is er hooguit één actief, maar oude spellen blijven bewaard
 *  zodat je de uitslag van vorig jaar kunt terugkijken. */
export const spellen = sqliteTable('spellen', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  pakket: text('pakket').notNull(),
  naam: text('naam').notNull(),
  fase: text('fase').notNull().default('lobby'),
  rondeIndex: integer('ronde_index').notNull().default(0),
  vraagIndex: integer('vraag_index').notNull().default(0),
  /** JSON: welke vraagindexen per ronde meedoen. */
  samenstelling: text('samenstelling').notNull().default('{}'),
  /** Unix-ms waarop de klok afloopt; null als er geen klok loopt. */
  klokEindigtOp: integer('klok_eindigt_op'),
  klokDuurMs: integer('klok_duur_ms').notNull().default(0),
  klokLoopt: integer('klok_loopt', { mode: 'boolean' }).notNull().default(false),
  /** Rest bij pauze, zodat hervatten exact doorloopt. */
  klokRestMs: integer('klok_rest_ms').notNull().default(0),
  /** Loopt op bij elke wijziging. Clients negeren pakketjes met een lagere versie. */
  versie: integer('versie').notNull().default(0),
  isActief: integer('is_actief', { mode: 'boolean' }).notNull().default(true),
  gestartOp: text('gestart_op').notNull().default(sql`(datetime('now'))`),
  geeindigdOp: text('geeindigd_op'),
});

/** Wie er meedoet aan dit spel. */
export const deelnemers = sqliteTable(
  'deelnemers',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    spelId: integer('spel_id').notNull().references(() => spellen.id, { onDelete: 'cascade' }),
    spelerId: integer('speler_id').notNull().references(() => spelers.id, { onDelete: 'cascade' }),
  },
  (t) => [uniqueIndex('deelnemers_spel_speler').on(t.spelId, t.spelerId)],
);

/** De teamindeling per ronde. Teams wisselen, punten gaan naar de persoon. */
export const teams = sqliteTable(
  'teams',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    spelId: integer('spel_id').notNull().references(() => spellen.id, { onDelete: 'cascade' }),
    rondeIndex: integer('ronde_index').notNull(),
    teamKey: text('team_key').notNull(),
    naam: text('naam').notNull(),
    suit: text('suit').notNull(),
    /** JSON-array van spelerIds. */
    leden: text('leden').notNull().default('[]'),
  },
  (t) => [uniqueIndex('teams_spel_ronde_key').on(t.spelId, t.rondeIndex, t.teamKey)],
);

/** Wat er op een telefoon is ingetikt. Eén rij per inzender per vraag. */
export const antwoorden = sqliteTable(
  'antwoorden',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    spelId: integer('spel_id').notNull().references(() => spellen.id, { onDelete: 'cascade' }),
    /** "rondeIndex:vraagIndex" */
    vraagSleutel: text('vraag_sleutel').notNull(),
    /** De inzender: een speler, of een team tijdens een teamronde. */
    inzender: text('inzender').notNull(),
    spelerId: integer('speler_id').references(() => spelers.id, { onDelete: 'set null' }),
    tekst: text('tekst').notNull(),
    /** Unix-ms volgens de serverklok. */
    ingediendOp: integer('ingediend_op').notNull(),
    /** Door de quizmaster goedgekeurd; null zolang er niet beoordeeld is. */
    isGoed: integer('is_goed', { mode: 'boolean' }),
  },
  (t) => [
    uniqueIndex('antwoorden_spel_vraag_inzender').on(t.spelId, t.vraagSleutel, t.inzender),
    index('antwoorden_spel_vraag').on(t.spelId, t.vraagSleutel),
  ],
);

/** Wat er per vraag is uitgedeeld. Eén rij per vraag met de volledige
 *  verdeling erin, zodat een correctie de vorige uitdeling exact terugdraait
 *  en de stand nooit scheef kan lopen. */
export const uitdelingen = sqliteTable(
  'uitdelingen',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    spelId: integer('spel_id').notNull().references(() => spellen.id, { onDelete: 'cascade' }),
    vraagSleutel: text('vraag_sleutel').notNull(),
    /** JSON: { spelerId: punten }. */
    verdeling: text('verdeling').notNull().default('{}'),
    bijgewerktOp: text('bijgewerkt_op').notNull().default(sql`(datetime('now'))`),
  },
  (t) => [uniqueIndex('uitdelingen_spel_vraag').on(t.spelId, t.vraagSleutel)],
);

/** Handmatige correcties buiten een vraag om, los bijgehouden zodat ze
 *  zichtbaar blijven in de uitslag. */
export const correcties = sqliteTable('correcties', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  spelId: integer('spel_id').notNull().references(() => spellen.id, { onDelete: 'cascade' }),
  spelerId: integer('speler_id').notNull().references(() => spelers.id, { onDelete: 'cascade' }),
  punten: integer('punten').notNull(),
  reden: text('reden'),
  aangemaaktOp: text('aangemaakt_op').notNull().default(sql`(datetime('now'))`),
});

/** Een geopend scherm: een telefoon, het hostscherm of de televisie. */
export const apparaten = sqliteTable(
  'apparaten',
  {
    token: text('token').primaryKey(),
    rol: text('rol').notNull(),
    spelerId: integer('speler_id').references(() => spelers.id, { onDelete: 'cascade' }),
    naam: text('naam'),
    laatstGezien: integer('laatst_gezien').notNull(),
  },
  (t) => [index('apparaten_speler').on(t.spelerId)],
);

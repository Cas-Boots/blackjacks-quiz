CREATE TABLE `antwoorden` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`spel_id` integer NOT NULL,
	`vraag_sleutel` text NOT NULL,
	`inzender` text NOT NULL,
	`speler_id` integer,
	`tekst` text NOT NULL,
	`ingediend_op` integer NOT NULL,
	`is_goed` integer,
	FOREIGN KEY (`spel_id`) REFERENCES `spellen`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`speler_id`) REFERENCES `spelers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `antwoorden_spel_vraag_inzender` ON `antwoorden` (`spel_id`,`vraag_sleutel`,`inzender`);--> statement-breakpoint
CREATE INDEX `antwoorden_spel_vraag` ON `antwoorden` (`spel_id`,`vraag_sleutel`);--> statement-breakpoint
CREATE TABLE `apparaten` (
	`token` text PRIMARY KEY NOT NULL,
	`rol` text NOT NULL,
	`speler_id` integer,
	`naam` text,
	`laatst_gezien` integer NOT NULL,
	FOREIGN KEY (`speler_id`) REFERENCES `spelers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `apparaten_speler` ON `apparaten` (`speler_id`);--> statement-breakpoint
CREATE TABLE `correcties` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`spel_id` integer NOT NULL,
	`speler_id` integer NOT NULL,
	`punten` integer NOT NULL,
	`reden` text,
	`aangemaakt_op` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`spel_id`) REFERENCES `spellen`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`speler_id`) REFERENCES `spelers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `deelnemers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`spel_id` integer NOT NULL,
	`speler_id` integer NOT NULL,
	FOREIGN KEY (`spel_id`) REFERENCES `spellen`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`speler_id`) REFERENCES `spelers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deelnemers_spel_speler` ON `deelnemers` (`spel_id`,`speler_id`);--> statement-breakpoint
CREATE TABLE `spelers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`naam` text NOT NULL,
	`foto` text,
	`is_quizmaster` integer DEFAULT false NOT NULL,
	`aangemaakt_op` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `spelers_naam_unique` ON `spelers` (`naam`);--> statement-breakpoint
CREATE TABLE `spellen` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pakket` text NOT NULL,
	`naam` text NOT NULL,
	`fase` text DEFAULT 'lobby' NOT NULL,
	`ronde_index` integer DEFAULT 0 NOT NULL,
	`vraag_index` integer DEFAULT 0 NOT NULL,
	`samenstelling` text DEFAULT '{}' NOT NULL,
	`klok_eindigt_op` integer,
	`klok_duur_ms` integer DEFAULT 0 NOT NULL,
	`klok_loopt` integer DEFAULT false NOT NULL,
	`klok_rest_ms` integer DEFAULT 0 NOT NULL,
	`versie` integer DEFAULT 0 NOT NULL,
	`is_actief` integer DEFAULT true NOT NULL,
	`gestart_op` text DEFAULT (datetime('now')) NOT NULL,
	`geeindigd_op` text
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`spel_id` integer NOT NULL,
	`ronde_index` integer NOT NULL,
	`team_key` text NOT NULL,
	`naam` text NOT NULL,
	`suit` text NOT NULL,
	`leden` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`spel_id`) REFERENCES `spellen`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teams_spel_ronde_key` ON `teams` (`spel_id`,`ronde_index`,`team_key`);--> statement-breakpoint
CREATE TABLE `uitdelingen` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`spel_id` integer NOT NULL,
	`vraag_sleutel` text NOT NULL,
	`verdeling` text DEFAULT '{}' NOT NULL,
	`bijgewerkt_op` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`spel_id`) REFERENCES `spellen`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uitdelingen_spel_vraag` ON `uitdelingen` (`spel_id`,`vraag_sleutel`);
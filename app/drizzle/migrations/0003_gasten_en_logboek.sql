CREATE TABLE `logboek` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`spel_id` integer NOT NULL,
	`opdracht` text NOT NULL,
	`omschrijving` text NOT NULL,
	`vorige` text,
	`is_ongedaan` integer DEFAULT false NOT NULL,
	`aangemaakt_op` integer NOT NULL,
	FOREIGN KEY (`spel_id`) REFERENCES `spellen`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `logboek_spel` ON `logboek` (`spel_id`);--> statement-breakpoint
ALTER TABLE `spelers` ADD `is_gast` integer DEFAULT false NOT NULL;
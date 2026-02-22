CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`upload_id` integer NOT NULL,
	`date` text NOT NULL,
	`description` text NOT NULL,
	`merchant` text,
	`branch` text,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`balance` real NOT NULL,
	`category_id` integer,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`upload_id`) REFERENCES `uploads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`uploaded_at` text DEFAULT (datetime('now')) NOT NULL,
	`month` integer NOT NULL,
	`year` integer NOT NULL,
	`opening_balance` real,
	`closing_balance` real,
	`total_credit` real,
	`total_debit` real,
	`transaction_count` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL
);

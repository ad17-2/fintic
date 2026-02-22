CREATE INDEX `idx_transactions_upload_id` ON `transactions` (`upload_id`);--> statement-breakpoint
CREATE INDEX `idx_transactions_category_id` ON `transactions` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_transactions_type` ON `transactions` (`type`);--> statement-breakpoint
CREATE INDEX `idx_uploads_status` ON `uploads` (`status`);--> statement-breakpoint
CREATE INDEX `idx_uploads_month_year` ON `uploads` (`month`,`year`);
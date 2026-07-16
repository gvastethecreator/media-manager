-- media-manager: foreign-keys-off
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_QueueJob` (
	`id` text PRIMARY KEY NOT NULL,
	`queue` text NOT NULL,
	`idempotencyKey` text,
	`data` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`maxAttempts` integer DEFAULT 3 NOT NULL,
	`error` text,
	`progress` integer DEFAULT 0 NOT NULL,
	`startedAt` integer,
	`finishedAt` integer,
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	`priority` integer DEFAULT 0 NOT NULL,
	`metadata` text,
	`retryAt` integer,
	CONSTRAINT "QueueJob_status_check" CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'retrying', 'cancelled', 'paused')),
	CONSTRAINT "QueueJob_attempts_check" CHECK(attempts >= 0 AND maxAttempts > 0 AND attempts <= maxAttempts),
	CONSTRAINT "QueueJob_progress_check" CHECK(progress BETWEEN 0 AND 100),
	CONSTRAINT "QueueJob_idempotency_key_check" CHECK(idempotencyKey IS NULL OR length(idempotencyKey) BETWEEN 1 AND 200)
);
--> statement-breakpoint
INSERT INTO `__new_QueueJob`("id", "queue", "idempotencyKey", "data", "status", "attempts", "maxAttempts", "error", "progress", "startedAt", "finishedAt", "createdAt", "updatedAt", "priority", "metadata", "retryAt") SELECT "id", "queue", NULL, "data", "status", "attempts", "maxAttempts", "error", "progress", "startedAt", "finishedAt", "createdAt", "updatedAt", "priority", "metadata", "retryAt" FROM `QueueJob`;--> statement-breakpoint
DROP TABLE `QueueJob`;--> statement-breakpoint
ALTER TABLE `__new_QueueJob` RENAME TO `QueueJob`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `QueueJob_queue_status_idx` ON `QueueJob` (`queue`,`status`);--> statement-breakpoint
CREATE INDEX `QueueJob_status_createdAt_idx` ON `QueueJob` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `QueueJob_priority_status_createdAt_idx` ON `QueueJob` (`priority`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `QueueJob_retryAt_idx` ON `QueueJob` (`retryAt`);--> statement-breakpoint
CREATE UNIQUE INDEX `QueueJob_queue_idempotencyKey_key` ON `QueueJob` (`queue`,`idempotencyKey`);

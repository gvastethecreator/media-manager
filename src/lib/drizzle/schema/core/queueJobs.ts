/**
 * =================================================================================
 * QUEUE JOBS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla queueJobs para el sistema de colas de trabajo
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para el sistema de colas
export const queueJobs = sqliteTable(
	'QueueJob',
	{
		id: text('id').primaryKey(),
		queue: text('queue').notNull(),
		idempotencyKey: text('idempotencyKey'),
		data: text('data').notNull(),
		status: text('status').notNull().default('pending'),
		attempts: integer('attempts').notNull().default(0),
		maxAttempts: integer('maxAttempts').notNull().default(3),
		error: text('error'),
		progress: integer('progress').notNull().default(0),
		startedAt: integer('startedAt', { mode: 'timestamp_ms' }),
		finishedAt: integer('finishedAt', { mode: 'timestamp_ms' }),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(
				sql`(CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER))`
			),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
		priority: integer('priority').notNull().default(0),
		metadata: text('metadata'),
		retryAt: integer('retryAt', { mode: 'timestamp_ms' }),
	},
	(table) => ({
		queueStatusIdx: index('QueueJob_queue_status_idx').on(table.queue, table.status),
		statusCreatedIdx: index('QueueJob_status_createdAt_idx').on(table.status, table.createdAt),
		priorityStatusCreatedIdx: index('QueueJob_priority_status_createdAt_idx').on(
			table.priority,
			table.status,
			table.createdAt
		),
		retryAtIdx: index('QueueJob_retryAt_idx').on(table.retryAt),
		queueIdempotencyKeyIdx: uniqueIndex('QueueJob_queue_idempotencyKey_key').on(table.queue, table.idempotencyKey),
		statusCheck: check(
			'QueueJob_status_check',
			sql`status IN ('pending', 'processing', 'completed', 'failed', 'retrying', 'cancelled', 'paused')`
		),
		attemptsCheck: check('QueueJob_attempts_check', sql`attempts >= 0 AND maxAttempts > 0 AND attempts <= maxAttempts`),
		progressCheck: check('QueueJob_progress_check', sql`progress BETWEEN 0 AND 100`),
		idempotencyKeyCheck: check(
			'QueueJob_idempotency_key_check',
			sql`idempotencyKey IS NULL OR length(idempotencyKey) BETWEEN 1 AND 200`
		),
	})
);

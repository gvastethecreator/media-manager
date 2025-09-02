/**
 * =================================================================================
 * QUEUE JOBS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla queueJobs para el sistema de colas de trabajo
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Modelo para el sistema de colas
export const queueJobs = sqliteTable(
	'QueueJob',
	{
		id: text('id').primaryKey(),
		queue: text('queue').notNull(),
		data: text('data').notNull(),
		status: text('status').notNull().default('pending'),
		attempts: integer('attempts').notNull().default(0),
		maxAttempts: integer('maxAttempts').notNull().default(3),
		error: text('error'),
		progress: integer('progress').notNull().default(0),
		startedAt: integer('startedAt', { mode: 'timestamp_ms' }),
		finishedAt: integer('finishedAt', { mode: 'timestamp_ms' }),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
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
	})
);

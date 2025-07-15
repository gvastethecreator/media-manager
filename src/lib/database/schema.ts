import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const queueJobs = sqliteTable('QueueJob', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	queue: text('queue').notNull(),
	data: text('data').notNull(),
	status: text('status').notNull().default('pending'),
	attempts: integer('attempts').notNull().default(0),
	maxAttempts: integer('maxAttempts').notNull().default(3),
	error: text('error'),
	progress: integer('progress').notNull().default(0),
	startedAt: integer('startedAt', { mode: 'timestamp' }),
	finishedAt: integer('finishedAt', { mode: 'timestamp' }),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`), // Drizzle automatically updates this
	priority: integer('priority').notNull().default(0),
	metadata: text('metadata'),
	retryAt: integer('retryAt', { mode: 'timestamp' }),
});

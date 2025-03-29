import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { baseFields } from '../base/common';

export const queueJobs = sqliteTable(
    'QueueJob',
    {
        ...baseFields,
        queue: text('queue').notNull(),
        data: text('data').notNull(),
        status: text('status').notNull().default('pending'),
        attempts: integer('attempts').notNull().default(0),
        maxAttempts: integer('maxAttempts').notNull().default(3),
        error: text('error'),
        progress: integer('progress').notNull().default(0),
        startedAt: integer('startedAt', { mode: 'timestamp_ms' }),
        finishedAt: integer('finishedAt', { mode: 'timestamp_ms' }),
        priority: integer('priority').notNull().default(0),
        metadata: text('metadata'),
        retryAt: integer('retryAt', { mode: 'timestamp_ms' }),
    },
    (table) => ({
        queueStatusIdx: primaryKey({ columns: [table.queue, table.status] }),
        statusCreatedAtIdx: primaryKey({ columns: [table.status, table.createdAt] }),
        priorityStatusCreatedAtIdx: primaryKey({ columns: [table.priority, table.status, table.createdAt] }),
        retryAtIdx: primaryKey({ columns: [table.retryAt] }),
    })
);
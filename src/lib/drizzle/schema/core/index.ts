/**
 * =================================================================================
 * CORE DOMAIN SCHEMA - DRIZZLE ORM
 * =================================================================================
 * Definiciones de tablas para el dominio Core del sistema
 *
 * Tablas incluidas:
 * - queueJobs: Sistema de colas de trabajo
 * - profiles: Perfiles de usuario
 * - settings: Configuraciones del sistema
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

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

// Modelo para el perfil de usuario
export const profiles = sqliteTable('Profile', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	emoji: text('emoji').notNull().default('👤'),
	color: text('color').notNull().default('#3b82f6'),
	description: text('description'),
	isActive: integer('isActive', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	settingsId: text('settingsId'),
	imageId: text('imageId'),
});

// Settings para el sistema
export const settings = sqliteTable(
	'Settings',
	{
		id: text('id').primaryKey(),
		theme: text('theme').notNull().default('system'),
		language: text('language').notNull().default('es'),
		data: text('data').notNull(), // Prisma's Json maps to TEXT in SQLite
		profileId: text('profileId').notNull(),
	},
	(table) => ({
		profileIdIdx: uniqueIndex('Settings_profileId_key').on(table.profileId),
	})
);

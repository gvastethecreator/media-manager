import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Enums para TypeScript (no exportados de drizzle-orm/sqlite-core)
export const featureStatusEnum = ['pending', 'in-progress', 'completed', 'cancelled'] as const;
export const alertLevelEnum = ['info', 'warning', 'error', 'critical'] as const;

/**
 * Tabla de Features (Roadmap simple) - SQLite
 */
export const devFeatures = sqliteTable(
	'dev_features',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		name: text('name').notNull(),
		description: text('description').notNull(),
		status: text('status', { enum: ['pending', 'in-progress', 'completed', 'cancelled'] })
			.notNull()
			.default('pending'),
		progress: integer('progress').notNull().default(0),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => ({
		statusIdx: index('feature_status_idx').on(table.status),
	})
);

/**
 * Tabla de Server Alerts (Logs del sistema) - SQLite
 */
export const serverAlerts = sqliteTable(
	'server_alerts',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		level: text('level', { enum: ['info', 'warning', 'error', 'critical'] })
			.notNull()
			.default('info'),
		service: text('service'),
		title: text('title').notNull(),
		message: text('message').notNull(),
		details: text('details'),
		resolved: integer('resolved', { mode: 'boolean' }).notNull().default(false),
		resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => ({
		levelIdx: index('alert_level_idx').on(table.level),
		serviceIdx: index('alert_service_idx').on(table.service),
		resolvedIdx: index('alert_resolved_idx').on(table.resolved),
	})
);

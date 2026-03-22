/**
 * =================================================================================
 * ACTIVITIES ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla activities para actividades del sistema
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Modelo para las actividades
export const activities = sqliteTable(
	'Activity',
	{
		id: text('id').primaryKey(),
		type: text('type').notNull(),
		entityType: text('entityType').notNull(),
		entityId: text('entityId').notNull(),
		userId: text('userId'),
		action: text('action').notNull(),
		description: text('description'),
		metadata: text('metadata'),
		ipAddress: text('ipAddress'),
		userAgent: text('userAgent'),
		sessionId: text('sessionId'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => ({
		typeIdx: index('Activity_type_idx').on(table.type),
		entityTypeIdx: index('Activity_entityType_idx').on(table.entityType),
		entityIdIdx: index('Activity_entityId_idx').on(table.entityId),
		userIdIdx: index('Activity_userId_idx').on(table.userId),
		actionIdx: index('Activity_action_idx').on(table.action),
		createdAtIdx: index('Activity_createdAt_idx').on(table.createdAt),
	})
);

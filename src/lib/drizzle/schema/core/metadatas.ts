/**
 * =================================================================================
 * METADATAS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla metadatas para metadatos genéricos
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Modelo para metadatos
export const metadatas = sqliteTable(
	'Metadata',
	{
		id: text('id').primaryKey(),
		entityType: text('entityType').notNull(),
		entityId: text('entityId').notNull(),
		key: text('key').notNull(),
		value: text('value'),
		type: text('type').default('string'),
		category: text('category'),
		description: text('description'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		entityTypeEntityIdIdx: index('Metadata_entityType_entityId_idx').on(table.entityType, table.entityId),
		keyIdx: index('Metadata_key_idx').on(table.key),
	})
);

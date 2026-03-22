/**
 * =================================================================================
 * FAVORITES ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla favorites para sistema de favoritos
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para favoritos
export const favorites = sqliteTable(
	'Favorite',
	{
		id: text('id').primaryKey(),
		entityType: text('entityType').notNull(), // 'image', 'video', 'album', etc.
		entityId: text('entityId').notNull(),
		addedAt: integer('addedAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => ({
		entityTypeEntityIdIdx: uniqueIndex('Favorite_entityType_entityId_key').on(table.entityType, table.entityId),
		entityTypeIdx: index('Favorite_entityType_idx').on(table.entityType),
		addedAtIdx: index('Favorite_addedAt_idx').on(table.addedAt),
	})
);

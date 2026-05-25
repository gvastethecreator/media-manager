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
		profileId: text('profileId').notNull(),
		entityType: text('entityType').notNull(), // 'image', 'video', 'album', etc.
		entityId: text('entityId').notNull(),
		addedAt: integer('addedAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => ({
		profileEntityIdx: uniqueIndex('Favorite_profileId_entityType_entityId_key').on(
			table.profileId,
			table.entityType,
			table.entityId
		),
		profileIdIdx: index('Favorite_profileId_idx').on(table.profileId),
		profileIdAddedAtIdx: index('Favorite_profileId_addedAt_idx').on(table.profileId, table.addedAt),
		entityTypeIdx: index('Favorite_entityType_idx').on(table.entityType),
		addedAtIdx: index('Favorite_addedAt_idx').on(table.addedAt),
	})
);

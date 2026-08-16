/**
 * =================================================================================
 * FAVORITES ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla favorites para sistema de favoritos
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { profiles } from '../core/profiles';

// Modelo para favoritos
export const favorites = sqliteTable(
	'Favorite',
	{
		id: text('id').primaryKey(),
		profileId: text('profileId')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
		entityType: text('entityType').notNull(), // 'image', 'video', 'album', etc.
		entityId: text('entityId').notNull(),
		addedAt: integer('addedAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(
				sql`(CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER))`
			),
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
		entityTypeCheck: check(
			'Favorite_entity_type_check',
			sql`entityType IN ('image', 'video', 'audio', 'document', 'jsonFile', 'file3d', 'album', 'collection', 'folder', 'group', 'tag', 'character', 'place', 'worldItem', 'concept', 'property', 'prompt', 'note', 'wildcard')`
		),
	})
);

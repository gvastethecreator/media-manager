/**
 * =================================================================================
 * COLLECTIONS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla collections para colecciones de elementos
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { type AnySQLiteColumn, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para las colecciones
export const collections = sqliteTable(
	'Collection',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('📚'),
		color: text('color').default('#3b82f6'),
		featuredImage: text('featuredImage'),
		// @deprecated Usar tabla canónica `favorites`. ADR-0002 + batch bridge Favorite.
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		// Agregados movidos a EntityAggregates tabla genérica
		lastImageAddedAt: integer('lastImageAddedAt', { mode: 'timestamp_ms' }),
		lastVideoAddedAt: integer('lastVideoAddedAt', { mode: 'timestamp_ms' }),
		parentId: text('parentId').references((): AnySQLiteColumn => collections.id, {
			onDelete: 'set null',
			onUpdate: 'cascade',
		}),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(
				sql`(CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER))`
			),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Collection_name_key').on(table.name),
		parentIdIdx: index('Collection_parentId_idx').on(table.parentId),
	})
);

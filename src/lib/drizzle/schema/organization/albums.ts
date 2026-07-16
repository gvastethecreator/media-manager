/**
 * =================================================================================
 * ALBUMS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla albums para álbumes de contenido
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { generateUniqueId } from '@/lib/utils/id-generator';

// Modelo para los álbumes
export const albums = sqliteTable(
	'Album',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => generateUniqueId('album')),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('📔'),
		color: text('color').default('#f59e0b'),
		featuredImage: text('featuredImage'),
		// @deprecated Usar tabla canónica `favorites`. ADR-0002 + batch bridge Favorite.
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		// Agregados movidos a EntityAggregates tabla genérica
		filters: text('filters'),
		category: text('category'),
		metadata: text('metadata'),
		lastImageAddedAt: integer('lastImageAddedAt', { mode: 'timestamp_ms' }),
		lastVideoAddedAt: integer('lastVideoAddedAt', { mode: 'timestamp_ms' }),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(
				sql`(CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER))`
			),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Album_name_key').on(table.name),
	})
);

/**
 * =================================================================================
 * ALBUMS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla albums para álbumes de contenido
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para los álbumes
export const albums = sqliteTable(
	'Album',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('📔'),
		color: text('color').default('#3b82f6'),
		featuredImage: text('featuredImage'),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		// Agregados movidos a EntityAggregates tabla genérica
		filters: text('filters'),
		category: text('category'),
		metadata: text('metadata'),
		lastImageAddedAt: integer('lastImageAddedAt', { mode: 'timestamp_ms' }),
		lastVideoAddedAt: integer('lastVideoAddedAt', { mode: 'timestamp_ms' }),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Album_name_key').on(table.name),
	})
);

/**
 * =================================================================================
 * COLLECTIONS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla collections para colecciones de elementos
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

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
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		totalImages: integer('totalImages').notNull().default(0),
		totalVideos: integer('totalVideos').notNull().default(0),
		totalFiles: integer('totalFiles').notNull().default(0),
		totalSize: integer('totalSize').notNull().default(0),
		lastImageAddedAt: integer('lastImageAddedAt', { mode: 'timestamp_ms' }),
		lastVideoAddedAt: integer('lastVideoAddedAt', { mode: 'timestamp_ms' }),
		parentId: text('parentId'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Collection_name_key').on(table.name),
	})
);

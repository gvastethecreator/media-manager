/**
 * =================================================================================
 * THUMBNAILS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla thumbnails para miniaturas
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para miniaturas
export const thumbnails = sqliteTable(
	'Thumbnail',
	{
		id: text('id').primaryKey(),
		entityType: text('entityType').notNull(),
		entityId: text('entityId').notNull(),
		size: text('size').notNull(),
		path: text('path').notNull(),
		width: integer('width').notNull(),
		height: integer('height').notNull(),
		format: text('format').notNull(),
		quality: integer('quality').default(80),
		fileSize: integer('fileSize').notNull(),
		isGenerated: integer('isGenerated', { mode: 'boolean' }).notNull().default(true),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		entityTypeEntityIdSizeIdx: uniqueIndex('Thumbnail_entityType_entityId_size_key').on(
			table.entityType,
			table.entityId,
			table.size
		),
		pathIdx: uniqueIndex('Thumbnail_path_key').on(table.path),
	})
);

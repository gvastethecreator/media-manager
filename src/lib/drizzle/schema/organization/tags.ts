/**
 * =================================================================================
 * TAGS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla tags para etiquetas de clasificación
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para las etiquetas
export const tags = sqliteTable(
	'Tag',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('🏷️'),
		color: text('color').default('#22c55e'),
		category: text('category'),
		featuredImage: text('featuredImage'),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		parentId: text('parentId'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Tag_name_key').on(table.name),
	})
);

/**
 * =================================================================================
 * WILDCARDS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla wildcards para comodines de búsquedas
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para los comodines
export const wildcards = sqliteTable(
	'Wildcard',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('🎭'),
		color: text('color').default('#8b5cf6'),
		category: text('category'),
		children: text('children'),
		featuredImage: text('featuredImage'),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		parentId: text('parentId'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Wildcard_name_key').on(table.name),
	})
);

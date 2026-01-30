/**
 * =================================================================================
 * PROPERTIES ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla properties para propiedades de elementos
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para las propiedades
export const properties = sqliteTable(
	'Property',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('🔍'),
		color: text('color').default('#f97316'),
		category: text('category'),
		featuredImage: text('featuredImage'),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Property_name_key').on(table.name),
	})
);

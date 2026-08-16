/**
 * =================================================================================
 * NOTES ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla notes para notas del sistema
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para las notas - CORREGIDO según estructura real de BD
export const notes = sqliteTable(
	'Note',
	{
		id: text('id').primaryKey(),
		title: text('title').notNull(), // Campo real en BD
		content: text('content').notNull().default(''),
		category: text('category').notNull().default('general'),
		featuredImage: text('featuredImage'),
		// @deprecated Usar tabla canónica `favorites`. ADR-0002 + batch bridge Favorite.
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(
				sql`(CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER))`
			),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		titleIdx: uniqueIndex('Note_title_key').on(table.title),
	})
);

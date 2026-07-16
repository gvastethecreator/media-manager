/**
 * =================================================================================
 * CHARACTERS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla characters para personajes del sistema
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { type AnySQLiteColumn, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para los personajes
export const characters = sqliteTable(
	'Character',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('👤'),
		color: text('color').default('#ec4899'),
		category: text('category'),
		filters: text('filters'),
		// @deprecated Usar tabla canónica `favorites`. ADR-0002 + batch bridge Favorite.
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		metadata: text('metadata'),
		// Agregados movidos a EntityAggregates tabla genérica
		age: text('age'),
		gender: text('gender'),
		species: text('species'),
		occupation: text('occupation'),
		personality: text('personality'),
		background: text('background'),
		relationships: text('relationships'),
		skills: text('skills'),
		equipment: text('equipment'),
		notes: text('notes'),
		featuredImage: text('featuredImage'),
		parentId: text('parentId').references((): AnySQLiteColumn => characters.id, {
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
		nameIdx: uniqueIndex('Character_name_key').on(table.name),
		parentIdIdx: index('Character_parentId_idx').on(table.parentId),
	})
);

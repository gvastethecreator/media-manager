/**
 * =================================================================================
 * WORLD ITEMS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla worldItems para objetos del mundo
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { type AnySQLiteColumn, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para los objetos del mundo
export const worldItems = sqliteTable(
	'WorldItem',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('🎯'),
		color: text('color').default('#a855f7'),
		category: text('category'),
		subtype: text('subtype'),
		// @deprecated Usar tabla canónica `favorites`. ADR-0002 + batch bridge Favorite.
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		isArchived: integer('isArchived', { mode: 'boolean' }).notNull().default(false),
		// Agregados movidos a EntityAggregates tabla genérica
		type: text('type'),
		rarity: text('rarity'),
		value: text('value'),
		weight: text('weight'),
		size: text('size'),
		material: text('material'),
		materials: text('materials'),
		crafting: text('crafting'),
		requirements: text('requirements'),
		effects: text('effects'),
		origin: text('origin'),
		properties: text('properties'),
		uses: text('uses'),
		history: text('history'),
		notes: text('notes'),
		lore: text('lore'),
		sortBy: text('sortBy'),
		filters: text('filters'),
		featuredImage: text('featuredImage'),
		parentId: text('parentId').references((): AnySQLiteColumn => worldItems.id, {
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
		nameIdx: uniqueIndex('WorldItem_name_key').on(table.name),
		parentIdIdx: index('WorldItem_parentId_idx').on(table.parentId),
	})
);

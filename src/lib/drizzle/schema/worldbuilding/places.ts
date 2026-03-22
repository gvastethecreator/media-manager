/**
 * =================================================================================
 * PLACES ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla places para lugares y ubicaciones
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para los lugares
export const places = sqliteTable(
	'Place',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('📍'),
		color: text('color').default('#14b8a6'),
		category: text('category'),
		filters: text('filters'),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		metadata: text('metadata'),
		// Agregados movidos a EntityAggregates tabla genérica
		type: text('type'),
		location: text('location'),
		climate: text('climate'),
		population: text('population'),
		government: text('government'),
		economy: text('economy'),
		culture: text('culture'),
		history: text('history'),
		geography: text('geography'),
		landmarks: text('landmarks'),
		dangers: text('dangers'),
		resources: text('resources'),
		notes: text('notes'),
		featuredImage: text('featuredImage'),
		parentId: text('parentId'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Place_name_key').on(table.name),
	})
);

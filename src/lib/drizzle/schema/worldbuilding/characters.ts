/**
 * =================================================================================
 * CHARACTERS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla characters para personajes del sistema
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para los personajes
export const characters = sqliteTable(
	'Character',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('👤'),
		color: text('color').default('#3b82f6'),
		category: text('category'),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		totalImages: integer('totalImages').notNull().default(0),
		totalVideos: integer('totalVideos').notNull().default(0),
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
		parentId: text('parentId'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Character_name_key').on(table.name),
	})
);

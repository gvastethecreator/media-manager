/**
 * =================================================================================
 * PROMPTS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla prompts para prompts de generación
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para los prompts
export const prompts = sqliteTable(
	'Prompt',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		content: text('content'),
		emoji: text('emoji').default('🔮'),
		color: text('color').default('var(--entity-prompt)'),
		category: text('category'),
		filters: text('filters'),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		metadata: text('metadata'),
		// Agregados movidos a EntityAggregates tabla genérica
		type: text('type'),
		notes: text('notes'),
		featuredImage: text('featuredImage'),
		parentId: text('parentId'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Prompt_name_key').on(table.name),
	})
);

/**
 * =================================================================================
 * CONCEPTS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla concepts para conceptos abstractos
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para los conceptos
export const concepts = sqliteTable(
	'Concept',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('💡'),
		color: text('color').default('#f59e0b'),
		category: text('category'),
		filters: text('filters'),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		metadata: text('metadata'),
		// Agregados movidos a EntityAggregates tabla genérica
		type: text('type'),
		complexity: text('complexity'),
		applications: text('applications'),
		examples: text('examples'),
		relatedConcepts: text('relatedConcepts'),
		notes: text('notes'),
		featuredImage: text('featuredImage'),
		parentId: text('parentId'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Concept_name_key').on(table.name),
	})
);

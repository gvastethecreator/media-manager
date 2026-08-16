/**
 * =================================================================================
 * CONCEPTS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla concepts para conceptos abstractos
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { type AnySQLiteColumn, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

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
		// @deprecated Usar tabla canónica `favorites`. ADR-0002 + batch bridge Favorite.
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
		parentId: text('parentId').references((): AnySQLiteColumn => concepts.id, {
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
		nameIdx: uniqueIndex('Concept_name_key').on(table.name),
		parentIdIdx: index('Concept_parentId_idx').on(table.parentId),
	})
);

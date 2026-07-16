/**
 * =================================================================================
 * GROUPS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla groups para grupos de elementos
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para los grupos
export const groups = sqliteTable(
	'Group',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(
				sql`(CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER))`
			),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Group_name_key').on(table.name),
	})
);

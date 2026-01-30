/**
 * =================================================================================
 * IMAGE TAGS RELATION - DRIZZLE ORM
 * =================================================================================
 * Definición de la relación many-to-many Image-Tag
 * =================================================================================
 */

import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Relación Image-Tag
export const imageTags = sqliteTable(
	'_ImageToTag',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // tagId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToTag_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToTag_B_index').on(table.B),
	})
);

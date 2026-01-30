/**
 * =================================================================================
 * IMAGE COLLECTIONS RELATION - DRIZZLE ORM
 * =================================================================================
 * Definición de la relación many-to-many Image-Collection
 * =================================================================================
 */

import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Relación Image-Collection
export const imageCollections = sqliteTable(
	'_ImageToCollection',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // collectionId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToCollection_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToCollection_B_index').on(table.B),
	})
);

/**
 * =================================================================================
 * VIDEO COLLECTIONS RELATION - DRIZZLE ORM
 * =================================================================================
 * Definición de la relación many-to-many Video-Collection
 * =================================================================================
 */

import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Relación Video-Collection
export const videoCollections = sqliteTable(
	'_VideoToCollection',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // collectionId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToCollection_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToCollection_B_index').on(table.B),
	})
);

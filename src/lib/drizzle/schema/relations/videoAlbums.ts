/**
 * =================================================================================
 * VIDEO ALBUMS RELATION - DRIZZLE ORM
 * =================================================================================
 * Definición de la relación many-to-many Video-Album
 * =================================================================================
 */

import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Relación Video-Album
export const videoAlbums = sqliteTable(
	'_VideoToAlbum',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // albumId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToAlbum_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToAlbum_B_index').on(table.B),
	})
);

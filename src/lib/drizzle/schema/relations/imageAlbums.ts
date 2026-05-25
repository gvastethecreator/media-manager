/**
 * =================================================================================
 * IMAGE ALBUMS RELATION - DRIZZLE ORM
 * =================================================================================
 * Definición de la relación many-to-many Image-Album
 *
 * @deprecated Esta tabla de unión per-type duplica la lógica de asociación.
 * Converger a una relación `_AssetToAlbum` según ADR-0004 y 03-media-core-context.md.
 * =================================================================================
 */

import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Relación Image-Album
export const imageAlbums = sqliteTable(
	'_ImageToAlbum',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // albumId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToAlbum_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToAlbum_B_index').on(table.B),
	})
);

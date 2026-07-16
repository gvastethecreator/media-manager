/**
 * =================================================================================
 * VIDEO ALBUMS RELATION - DRIZZLE ORM
 * =================================================================================
 * Definición de la relación many-to-many Video-Album
 *
 * @deprecated Esta tabla de unión per-type duplica la lógica de asociación.
 * Converger a una relación `_AssetToAlbum` según ADR-0004 y 03-media-core-context.md.
 * =================================================================================
 */

import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { videos } from '../files/videos';
import { albums } from '../organization/albums';

// Relación Video-Album
export const videoAlbums = sqliteTable(
	'_VideoToAlbum',
	{
		A: text('A')
			.notNull()
			.references(() => videos.id, { onDelete: 'cascade', onUpdate: 'cascade' }), // videoId
		B: text('B')
			.notNull()
			.references(() => albums.id, { onDelete: 'cascade', onUpdate: 'cascade' }), // albumId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToAlbum_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToAlbum_B_index').on(table.B),
	})
);

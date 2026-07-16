/**
 * =================================================================================
 * VIDEO COLLECTIONS RELATION - DRIZZLE ORM
 * =================================================================================
 * Definición de la relación many-to-many Video-Collection
 *
 * @deprecated Esta tabla de unión per-type duplica la lógica de asociación.
 * Converger a una relación `_AssetToCollection` según ADR-0004 y 03-media-core-context.md.
 * =================================================================================
 */

import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { videos } from '../files/videos';
import { collections } from '../organization/collections';

// Relación Video-Collection
export const videoCollections = sqliteTable(
	'_VideoToCollection',
	{
		A: text('A')
			.notNull()
			.references(() => videos.id, { onDelete: 'cascade', onUpdate: 'cascade' }), // videoId
		B: text('B')
			.notNull()
			.references(() => collections.id, { onDelete: 'cascade', onUpdate: 'cascade' }), // collectionId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToCollection_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToCollection_B_index').on(table.B),
	})
);

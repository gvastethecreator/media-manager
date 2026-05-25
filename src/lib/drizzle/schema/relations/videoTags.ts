/**
 * =================================================================================
 * VIDEO TAGS RELATION - DRIZZLE ORM
 * =================================================================================
 * Definición de la relación many-to-many Video-Tag
 *
 * @deprecated Esta tabla de unión per-type duplica la lógica de asociación.
 * Converger a una relación `_AssetToTag` según ADR-0004 y 03-media-core-context.md.
 * =================================================================================
 */

import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Relación Video-Tag
export const videoTags = sqliteTable(
	'_VideoToTag',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // tagId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToTag_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToTag_B_index').on(table.B),
	})
);

/**
 * =================================================================================
 * VIDEO PROPERTIES RELATION - DRIZZLE ORM
 * =================================================================================
 * Definición de la relación many-to-many Video-Property
 *
 * @deprecated Esta tabla de unión per-type duplica la lógica de asociación.
 * Converger a una relación `_AssetToProperty` según ADR-0004 y 03-media-core-context.md.
 * =================================================================================
 */

import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Relación Video-Property
export const videoProperties = sqliteTable(
	'_VideoToProperty',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // propertyId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToProperty_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToProperty_B_index').on(table.B),
	})
);

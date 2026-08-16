/**
 * =================================================================================
 * IMAGE TAGS RELATION - DRIZZLE ORM
 * =================================================================================
 * Definición de la relación many-to-many Image-Tag
 *
 * @deprecated Esta tabla de unión per-type duplica la lógica de asociación.
 * Converger a una relación `_AssetToTag` según ADR-0004 y 03-media-core-context.md.
 * =================================================================================
 */

import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { images } from '../files/images';
import { tags } from '../organization/tags';

// Relación Image-Tag
export const imageTags = sqliteTable(
	'_ImageToTag',
	{
		A: text('A')
			.notNull()
			.references(() => images.id, { onDelete: 'cascade', onUpdate: 'cascade' }), // imageId
		B: text('B')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade', onUpdate: 'cascade' }), // tagId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToTag_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToTag_B_index').on(table.B),
	})
);

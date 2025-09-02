/**
 * =================================================================================
 * IMAGE PROPERTIES RELATION - DRIZZLE ORM
 * =================================================================================
 * Definición de la relación many-to-many Image-Property
 * =================================================================================
 */

import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Relación Image-Property
export const imageProperties = sqliteTable(
	'_ImageToProperty',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // propertyId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToProperty_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToProperty_B_index').on(table.B),
	})
);

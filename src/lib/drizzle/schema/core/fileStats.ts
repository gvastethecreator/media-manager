/**
 * =================================================================================
 * IMAGE STATS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla imageStats para estadísticas de imágenes
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para estadísticas de archivos
export const fileStats = sqliteTable(
	'FileStats',
	{
		id: text('id').primaryKey(),
		fileId: text('fileId').notNull(),
		views: integer('views').notNull().default(0),
		rating: integer('rating').default(0),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		fileIdIdx: uniqueIndex('FileStats_fileId_key').on(table.fileId),
		ratingIdx: index('FileStats_rating_idx').on(table.rating),
	})
);

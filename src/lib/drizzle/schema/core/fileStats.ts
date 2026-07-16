/**
 * =================================================================================
 * IMAGE STATS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla imageStats para estadísticas de imágenes
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { images } from '../files/images';

// Modelo para estadísticas de archivos
export const fileStats = sqliteTable(
	'FileStats',
	{
		id: text('id').primaryKey(),
		fileId: text('fileId')
			.notNull()
			.references(() => images.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
		views: integer('views').notNull().default(0),
		rating: integer('rating').default(0),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(
				sql`(CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER))`
			),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		fileIdIdx: uniqueIndex('FileStats_fileId_key').on(table.fileId),
		ratingIdx: index('FileStats_rating_idx').on(table.rating),
		viewsCheck: check('FileStats_views_check', sql`views >= 0`),
		ratingCheck: check('FileStats_rating_check', sql`rating IS NULL OR rating BETWEEN 0 AND 5`),
	})
);

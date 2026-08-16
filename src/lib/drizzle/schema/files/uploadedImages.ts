/**
 * =================================================================================
 * UPLOADED IMAGES ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla uploadedImages para imágenes subidas al sistema
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { images } from './images';

// Modelo para las imágenes subidas
export const uploadedImages = sqliteTable(
	'UploadedImage',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		path: text('path').notNull(),
		size: integer('size').notNull(),
		hash: text('hash').notNull(),
		metadata: text('metadata'),
		imageId: text('imageId')
			.notNull()
			.references(() => images.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
		// Campos adicionales requeridos por el servicio
		type: text('type').notNull().default('thumbnail'),
		category: text('category').notNull().default('user'),
		width: integer('width'),
		height: integer('height'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(
				sql`(CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER))`
			),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		pathUniqueIdx: uniqueIndex('UploadedImage_path_key').on(table.path),
		imageIdIdx: index('UploadedImage_imageId_idx').on(table.imageId),
		hashIdx: index('UploadedImage_hash_idx').on(table.hash),
		typeIdx: index('UploadedImage_type_idx').on(table.type),
		categoryIdx: index('UploadedImage_category_idx').on(table.category),
		sizeCheck: check('UploadedImage_size_check', sql`size >= 0 AND size <= 107374182400`),
		hashFormatCheck: check('UploadedImage_hash_format_check', sql`length(hash) = 64`),
		pathLengthCheck: check('UploadedImage_path_length_check', sql`length(path) BETWEEN 1 AND 1000`),
		dimensionsCheck: check(
			'UploadedImage_dimensions_check',
			sql`(width IS NULL OR width > 0) AND (height IS NULL OR height > 0)`
		),
	})
);

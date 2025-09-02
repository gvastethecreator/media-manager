/**
 * =================================================================================
 * UPLOADED IMAGES ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla uploadedImages para imágenes subidas al sistema
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

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
		imageId: text('imageId').notNull(),
		// Campos adicionales requeridos por el servicio
		type: text('type').notNull().default('thumbnail'),
		category: text('category').notNull().default('user'),
		width: integer('width'),
		height: integer('height'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		pathUniqueIdx: uniqueIndex('UploadedImage_path_key').on(table.path),
		imageIdIdx: index('UploadedImage_imageId_idx').on(table.imageId),
		hashIdx: index('UploadedImage_hash_idx').on(table.hash),
		typeIdx: index('UploadedImage_type_idx').on(table.type),
		categoryIdx: index('UploadedImage_category_idx').on(table.category),
	})
);

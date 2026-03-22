/**
 * =================================================================================
 * FOLDERS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla folders para gestión de carpetas
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { generateUniqueId } from '@/lib/utils/id-generator';

// Modelo para las carpetas
export const folders = sqliteTable(
	'Folder',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => generateUniqueId('folder')),
		name: text('name').notNull(),
		description: text('description'),
		path: text('path').notNull(),
		emoji: text('emoji').default('📁'),
		color: text('color').default('#3b82f6'),
		featuredImage: text('featuredImage'),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		totalImages: integer('totalImages').notNull().default(0),
		totalVideos: integer('totalVideos').notNull().default(0),
		totalFiles: integer('totalFiles').notNull().default(0),
		totalSize: integer('totalSize').notNull().default(0),
		lastIndexed: integer('lastIndexed', { mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
		parentId: text('parentId'),
		presetId: text('presetId'),
	},
	(table) => ({
		pathUniqueIdx: uniqueIndex('Folder_path_key').on(table.path),
		lastIndexedIdx: index('Folder_lastIndexed_idx').on(table.lastIndexed),
		createdAtIdx: index('Folder_createdAt_idx').on(table.createdAt),
		// Constraints de validación
		pathLengthCheck: check('Folder_path_length_check', sql`length(path) BETWEEN 1 AND 1000`),
		nameCheck: check('Folder_name_length_check', sql`length(name) BETWEEN 1 AND 255`),
		colorCheck: check('Folder_color_format_check', sql`color IS NULL OR (color LIKE '#%' AND length(color) = 7)`),
		totalFilesCheck: check('Folder_total_files_check', sql`totalFiles >= 0`),
		totalSizeCheck: check('Folder_total_size_check', sql`totalSize >= 0`),
	})
);

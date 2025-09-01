/**
 * =================================================================================
 * MEDIA DOMAIN SCHEMA - DRIZZLE ORM
 * =================================================================================
 * Definiciones de tablas para el dominio Media del sistema
 *
 * Tablas incluidas:
 * - folders: Gestión de carpetas
 * - images: Archivos de imagen
 * - videos: Archivos de video
 * - uploadedImages: Imágenes subidas al sistema
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para las carpetas
export const folders = sqliteTable(
	'Folder',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		path: text('path').notNull(),
		emoji: text('emoji').default('📁'),
		color: text('color').default('#3b82f6'),
		featuredImage: text('featuredImage'),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		totalFiles: integer('totalFiles').notNull().default(0),
		totalSize: integer('totalSize').notNull().default(0),
		lastIndexed: integer('lastIndexed', { mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
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

// Modelo para las imágenes
export const images = sqliteTable(
	'Image',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		path: text('path').notNull(),
		hash: text('hash').notNull(),
		size: integer('size').notNull(),
		width: integer('width').notNull(),
		height: integer('height').notNull(),
		metadata: text('metadata'),
		thumbnail: text('thumbnail'), // Using TEXT for base64 encoded thumbnail
		thumbnailSize: integer('thumbnailSize'),
		thumbnailWidth: integer('thumbnailWidth'),
		thumbnailHeight: integer('thumbnailHeight'),
		thumbnailMimeType: text('thumbnailMimeType'),
		thumbnailError: text('thumbnailError'),
		thumbnailErrorAt: integer('thumbnailErrorAt', { mode: 'timestamp_ms' }),
		thumbnailOptimizedAt: integer('thumbnailOptimizedAt', {
			mode: 'timestamp_ms',
		}),
		// AI Metadata columns
		aiEngine: text('aiEngine'),
		aiModel: text('aiModel'),
		aiOriginDetected: integer('aiOriginDetected', { mode: 'boolean' }).default(false),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		folderId: text('folderId').notNull(),
		noteId: text('noteId'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
		addedAt: integer('addedAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => ({
		pathFolderUniqueIdx: uniqueIndex('Image_path_folderId_key').on(table.path, table.folderId),
		folderIdIdx: index('Image_folderId_idx').on(table.folderId),
		hashIdx: index('Image_hash_idx').on(table.hash),
		createdAtIdx: index('Image_createdAt_idx').on(table.createdAt),
		updatedAtIdx: index('Image_updatedAt_idx').on(table.updatedAt),
		isFavoriteIdx: index('Image_isFavorite_idx').on(table.isFavorite),
		aiEngineIdx: index('Image_aiEngine_idx').on(table.aiEngine),
		aiOriginDetectedIdx: index('Image_aiOriginDetected_idx').on(table.aiOriginDetected),
		// Constraints de validación
		sizeCheck: check('Image_size_check', sql`size >= 0 AND size <= 107374182400`), // Max 100GB
		dimensionsCheck: check(
			'Image_dimensions_check',
			sql`width > 0 AND width <= 32768 AND height > 0 AND height <= 32768`
		),
		hashFormatCheck: check('Image_hash_format_check', sql`length(hash) = 64`), // SHA-256
		pathLengthCheck: check('Image_path_length_check', sql`length(path) BETWEEN 1 AND 1000`),
	})
);

// Modelo para los videos
export const videos = sqliteTable(
	'Video',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		path: text('path').notNull(),
		hash: text('hash').notNull(),
		size: integer('size').notNull(),
		duration: integer('duration').notNull(),
		width: integer('width'),
		height: integer('height'),
		metadata: text('metadata'),
		thumbnail: text('thumbnail'), // Using TEXT for base64 encoded thumbnail
		thumbnailSize: integer('thumbnailSize'),
		thumbnailWidth: integer('thumbnailWidth'),
		thumbnailHeight: integer('thumbnailHeight'),

		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		isHidden: integer('isHidden', { mode: 'boolean' }).notNull().default(false),
		folderId: text('folderId').notNull(),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		pathUniqueIdx: uniqueIndex('Video_path_key').on(table.path),
		folderIdIdx: index('Video_folderId_idx').on(table.folderId),
		hashIdx: index('Video_hash_idx').on(table.hash),
		createdAtIdx: index('Video_createdAt_idx').on(table.createdAt),
		updatedAtIdx: index('Video_updatedAt_idx').on(table.updatedAt),
		// Constraints de validación
		sizeCheck: check('Video_size_check', sql`size >= 0 AND size <= 107374182400`), // Max 100GB
		durationCheck: check('Video_duration_check', sql`duration >= 0 AND duration <= 86400`), // Max 24 horas
		hashFormatCheck: check('Video_hash_format_check', sql`length(hash) = 64`), // SHA-256
		pathLengthCheck: check('Video_path_length_check', sql`length(path) BETWEEN 1 AND 1000`),
	})
);

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

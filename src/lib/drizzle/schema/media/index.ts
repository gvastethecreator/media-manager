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
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

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
		autoReindex: integer('autoReindex', { mode: 'boolean' }).notNull().default(false),
		lastIndexed: integer('lastIndexed', { mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
		parentId: text('parentId'),
		presetId: text('presetId'),
	},
	(table) => ({
		pathIdx: uniqueIndex('Folder_path_key').on(table.path),
		path_idx: index('Folder_path_idx').on(table.path),
		lastIndexed_idx: index('Folder_lastIndexed_idx').on(table.lastIndexed),
		createdAt_idx: index('Folder_createdAt_idx').on(table.createdAt),
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
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		folderId: text('folderId').notNull(),
		noteId: text('noteId'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
		addedAt: integer('addedAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => ({
		pathFolderIdIdx: uniqueIndex('Image_path_folderId_key').on(table.path, table.folderId),
		folderId_idx: index('Image_folderId_idx').on(table.folderId),
		hash_idx: index('Image_hash_idx').on(table.hash),
		createdAt_idx: index('Image_createdAt_idx').on(table.createdAt),
		updatedAt_idx: index('Image_updatedAt_idx').on(table.updatedAt),
		isFavorite_idx: index('Image_isFavorite_idx').on(table.isFavorite),
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
		isPublic: integer('isPublic', { mode: 'boolean' }).notNull().default(false),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		isHidden: integer('isHidden', { mode: 'boolean' }).notNull().default(false),
		folderId: text('folderId').notNull(),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		pathIdx: uniqueIndex('Video_path_key').on(table.path),
		folderId_idx: index('Video_folderId_idx').on(table.folderId),
		hash_idx: index('Video_hash_idx').on(table.hash),
		createdAt_idx: index('Video_createdAt_idx').on(table.createdAt),
		updatedAt_idx: index('Video_updatedAt_idx').on(table.updatedAt),
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
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => ({
		pathIdx: uniqueIndex('UploadedImage_path_key').on(table.path),
		imageId_idx: index('UploadedImage_imageId_idx').on(table.imageId),
		hash_idx: index('UploadedImage_hash_idx').on(table.hash),
	})
);

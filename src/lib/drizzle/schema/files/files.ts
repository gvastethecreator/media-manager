/**
 * =================================================================================
 * FILES ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla files para archivos genéricos del sistema
 *
 * Esta es la tabla proto-Asset destino. Las tablas per-type (images, videos, audios,
 * documents, jsonFiles, file3Ds) deben converger aquí según ADR-0004 y
 * 03-media-core-context.md.
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { folders } from '../organization/folders';

// Modelo para archivos genéricos
export const files = sqliteTable(
	'File',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		path: text('path').notNull(),
		size: integer('size').notNull(),
		hash: text('hash').notNull(),
		mimeType: text('mimeType').notNull(),
		extension: text('extension').notNull(),
		fileType: text('fileType').notNull(), // 'image', 'video', 'audio', 'document', etc.
		folderId: text('folderId')
			.notNull()
			.references(() => folders.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
		// @deprecated Usar tabla canónica `favorites`. ADR-0002 + batch bridge Favorite.
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		isArchived: integer('isArchived', { mode: 'boolean' }).notNull().default(false),
		description: text('description'),
		tags: text('tags'), // JSON array de tags
		metadata: text('metadata'), // JSON con metadatos específicos del tipo
		lastAccessed: integer('lastAccessed', { mode: 'timestamp_ms' }),
		accessCount: integer('accessCount').default(0),
		isProcessed: integer('isProcessed', { mode: 'boolean' }).default(false),
		processingError: text('processingError'),
		processingStatus: text('processingStatus').default('pending'), // 'pending', 'processing', 'completed', 'failed'
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(
				sql`(CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER))`
			),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		pathIdx: uniqueIndex('File_path_key').on(table.path),
		folderId_idx: index('File_folderId_idx').on(table.folderId),
		hash_idx: index('File_hash_idx').on(table.hash),
		folderHashIdx: index('File_folderId_hash_idx').on(table.folderId, table.hash),
		fileType_idx: index('File_fileType_idx').on(table.fileType),
		createdAt_idx: index('File_createdAt_idx').on(table.createdAt),
		updatedAt_idx: index('File_updatedAt_idx').on(table.updatedAt),
		isFavorite_idx: index('File_isFavorite_idx').on(table.isFavorite),
		processingStatus_idx: index('File_processingStatus_idx').on(table.processingStatus),
		sizeCheck: check('File_size_check', sql`size >= 0 AND size <= 107374182400`),
		hashFormatCheck: check('File_hash_format_check', sql`length(hash) = 64`),
		pathLengthCheck: check('File_path_length_check', sql`length(path) BETWEEN 1 AND 1000`),
		accessCountCheck: check('File_access_count_check', sql`accessCount IS NULL OR accessCount >= 0`),
		processingStatusCheck: check(
			'File_processing_status_check',
			sql`processingStatus IS NULL OR processingStatus IN ('pending', 'processing', 'completed', 'failed')`
		),
	})
);

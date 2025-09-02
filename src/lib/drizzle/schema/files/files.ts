/**
 * =================================================================================
 * FILES ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla files para archivos genéricos del sistema
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

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
		folderId: text('folderId').notNull(),
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
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		pathIdx: uniqueIndex('File_path_key').on(table.path),
		folderId_idx: index('File_folderId_idx').on(table.folderId),
		hash_idx: index('File_hash_idx').on(table.hash),
		fileType_idx: index('File_fileType_idx').on(table.fileType),
		createdAt_idx: index('File_createdAt_idx').on(table.createdAt),
		updatedAt_idx: index('File_updatedAt_idx').on(table.updatedAt),
		isFavorite_idx: index('File_isFavorite_idx').on(table.isFavorite),
		processingStatus_idx: index('File_processingStatus_idx').on(table.processingStatus),
	})
);

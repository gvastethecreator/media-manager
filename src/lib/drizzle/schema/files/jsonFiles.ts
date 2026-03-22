/**
 * =================================================================================
 * JSON FILES ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla jsonFiles para archivos JSON
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para archivos JSON
export const jsonFiles = sqliteTable(
	'JsonFile',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		path: text('path').notNull(),
		size: integer('size').notNull(),
		hash: text('hash').notNull(),
		mimeType: text('mimeType').notNull(),
		extension: text('extension').notNull(),
		folderId: text('folderId').notNull(),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		isArchived: integer('isArchived', { mode: 'boolean' }).notNull().default(false),
		content: text('content'),
		schema: text('schema'),
		isValid: integer('isValid', { mode: 'boolean' }).default(true),
		validationErrors: text('validationErrors'),
		keyCount: integer('keyCount'),
		depth: integer('depth'),
		// Propiedades adicionales requeridas por el servicio
		description: text('description'),
		emoji: text('emoji'),
		color: text('color'),
		shortcut: text('shortcut'),
		category: text('category'),
		filePath: text('filePath'),
		fileName: text('fileName'),
		fileSize: integer('fileSize'),
		tags: text('tags'),
		metadata: text('metadata'),
		sortBy: text('sortBy'),
		filters: text('filters'),
		featuredImage: text('featuredImage'),
		// Propiedades de análisis JSON
		validJson: integer('validJson', { mode: 'boolean' }).default(false),
		schemaVersion: text('schemaVersion'),
		keys: text('keys'),
		values: text('values'),
		hasArrays: integer('hasArrays', { mode: 'boolean' }).default(false),
		hasObjects: integer('hasObjects', { mode: 'boolean' }).default(false),
		encoding: text('encoding'),
		compressed: integer('compressed', { mode: 'boolean' }).default(false),
		minified: integer('minified', { mode: 'boolean' }).default(false),
		prettyPrinted: integer('prettyPrinted', { mode: 'boolean' }).default(false),
		parsedContent: text('parsedContent'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		pathIdx: uniqueIndex('JsonFile_path_key').on(table.path),
		folderId_idx: index('JsonFile_folderId_idx').on(table.folderId),
		hash_idx: index('JsonFile_hash_idx').on(table.hash),
		createdAt_idx: index('JsonFile_createdAt_idx').on(table.createdAt),
		updatedAt_idx: index('JsonFile_updatedAt_idx').on(table.updatedAt),
	})
);

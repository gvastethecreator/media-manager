/**
 * =================================================================================
 * JSON FILES ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla jsonFiles para archivos JSON
 *
 * @deprecated Esta tabla duplica 10+ columnas comunes (id, name, path, hash, size,
 * folderId, createdAt, updatedAt, isFavorite, metadata, etc.). Converger a una tabla
 * raíz `Asset` según ADR-0004 y 03-media-core-context.md.
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { assets } from '../media-core/assets';
import { folders } from '../organization/folders';

// Modelo para archivos JSON
export const jsonFiles = sqliteTable(
	'JsonFile',
	{
		id: text('id').primaryKey(),
		assetId: text('assetId').references(() => assets.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
		name: text('name').notNull(),
		path: text('path').notNull(),
		size: integer('size').notNull(),
		hash: text('hash').notNull(),
		mimeType: text('mimeType').notNull(),
		extension: text('extension').notNull(),
		folderId: text('folderId')
			.notNull()
			.references(() => folders.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
		// @deprecated Usar tabla canónica `favorites`. ADR-0002 + batch bridge Favorite.
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
			.default(
				sql`(CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER))`
			),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		assetIdKey: uniqueIndex('JsonFile_assetId_key').on(table.assetId),
		pathIdx: uniqueIndex('JsonFile_path_key').on(table.path),
		folderId_idx: index('JsonFile_folderId_idx').on(table.folderId),
		hash_idx: index('JsonFile_hash_idx').on(table.hash),
		folderHashIdx: index('JsonFile_folderId_hash_idx').on(table.folderId, table.hash),
		folderCreatedAtIdx: index('JsonFile_folderId_createdAt_idx').on(table.folderId, table.createdAt, table.id),
		createdAt_idx: index('JsonFile_createdAt_idx').on(table.createdAt),
		updatedAt_idx: index('JsonFile_updatedAt_idx').on(table.updatedAt),
		sizeCheck: check('JsonFile_size_check', sql`size >= 0 AND size <= 107374182400`),
		hashFormatCheck: check('JsonFile_hash_format_check', sql`length(hash) = 64`),
		assetIdentityCheck: check(
			'JsonFile_asset_identity_check',
			sql`assetId IS NULL OR (typeof(assetId) = 'text' AND assetId = id)`
		),
		pathLengthCheck: check('JsonFile_path_length_check', sql`length(path) BETWEEN 1 AND 1000`),
		shapeCheck: check(
			'JsonFile_shape_check',
			sql`(fileSize IS NULL OR fileSize >= 0) AND (keyCount IS NULL OR keyCount >= 0) AND (depth IS NULL OR depth >= 0)`
		),
	})
);

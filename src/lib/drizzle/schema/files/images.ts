/**
 * =================================================================================
 * IMAGES ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla images para archivos de imagen
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
import { notes } from '../taxonomy/notes';

// Modelo para las imágenes
export const images = sqliteTable(
	'Image',
	{
		id: text('id').primaryKey(),
		// Expand-contract link. Legacy rows remain NULL until the explicit copy-only backfill.
		// Canonical Image rows deliberately reuse Asset Identity so existing typed junctions keep working.
		assetId: text('assetId').references(() => assets.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
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
		// @deprecated Usar tabla canónica `favorites`. ADR-0002 + batch bridge Favorite.
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		folderId: text('folderId')
			.notNull()
			.references(() => folders.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
		noteId: text('noteId').references(() => notes.id, { onDelete: 'set null', onUpdate: 'cascade' }),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(
				sql`(CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER))`
			),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
		addedAt: integer('addedAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(
				sql`(CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER))`
			),
	},
	(table) => ({
		assetIdKey: uniqueIndex('Image_assetId_key').on(table.assetId),
		pathFolderUniqueIdx: uniqueIndex('Image_path_folderId_key').on(table.path, table.folderId),
		folderIdIdx: index('Image_folderId_idx').on(table.folderId),
		hashIdx: index('Image_hash_idx').on(table.hash),
		folderHashIdx: index('Image_folderId_hash_idx').on(table.folderId, table.hash),
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
		assetIdentityCheck: check(
			'Image_asset_identity_check',
			sql`assetId IS NULL OR (typeof(assetId) = 'text' AND assetId = id)`
		),
		pathLengthCheck: check('Image_path_length_check', sql`length(path) BETWEEN 1 AND 1000`),
	})
);

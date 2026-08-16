/**
 * =================================================================================
 * FILE 3DS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla file3Ds para archivos 3D
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

// Modelo para archivos 3D
export const file3Ds = sqliteTable(
	'File3D',
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
		format: text('format'),
		version: text('version'),
		vertices: integer('vertices'),
		faces: integer('faces'),
		triangles: integer('triangles'),
		materials: integer('materials'),
		textures: integer('textures'),
		animations: integer('animations'),
		bones: integer('bones'),
		scenes: integer('scenes'),
		cameras: integer('cameras'),
		lights: integer('lights'),
		hasUV: integer('hasUV', { mode: 'boolean' }).default(false),
		hasNormals: integer('hasNormals', { mode: 'boolean' }).default(false),
		hasColors: integer('hasColors', { mode: 'boolean' }).default(false),
		boundingBox: text('boundingBox'),
		metadata: text('metadata'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(
				sql`(CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER))`
			),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		assetIdKey: uniqueIndex('File3D_assetId_key').on(table.assetId),
		pathIdx: uniqueIndex('File3D_path_key').on(table.path),
		folderId_idx: index('File3D_folderId_idx').on(table.folderId),
		hash_idx: index('File3D_hash_idx').on(table.hash),
		folderHashIdx: index('File3D_folderId_hash_idx').on(table.folderId, table.hash),
		folderCreatedAtIdx: index('File3D_folderId_createdAt_idx').on(table.folderId, table.createdAt, table.id),
		createdAt_idx: index('File3D_createdAt_idx').on(table.createdAt),
		updatedAt_idx: index('File3D_updatedAt_idx').on(table.updatedAt),
		sizeCheck: check('File3D_size_check', sql`size >= 0 AND size <= 107374182400`),
		hashFormatCheck: check('File3D_hash_format_check', sql`length(hash) = 64`),
		assetIdentityCheck: check(
			'File3D_asset_identity_check',
			sql`assetId IS NULL OR (typeof(assetId) = 'text' AND assetId = id)`
		),
		pathLengthCheck: check('File3D_path_length_check', sql`length(path) BETWEEN 1 AND 1000`),
		geometryCountsCheck: check(
			'File3D_geometry_counts_check',
			sql`(vertices IS NULL OR vertices >= 0) AND (faces IS NULL OR faces >= 0) AND (triangles IS NULL OR triangles >= 0) AND (materials IS NULL OR materials >= 0) AND (textures IS NULL OR textures >= 0) AND (animations IS NULL OR animations >= 0) AND (bones IS NULL OR bones >= 0) AND (scenes IS NULL OR scenes >= 0) AND (cameras IS NULL OR cameras >= 0) AND (lights IS NULL OR lights >= 0)`
		),
	})
);

/**
 * =================================================================================
 * VIDEOS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla videos para archivos de video
 *
 * @deprecated Esta tabla duplica 10+ columnas comunes (id, name, path, hash, size,
 * folderId, createdAt, updatedAt, isFavorite, metadata, etc.). Converger a una tabla
 * raíz `Asset` según ADR-0004 y 03-media-core-context.md.
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

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

		// @deprecated Usar tabla canónica `favorites`. ADR-0002 + batch bridge Favorite.
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		isHidden: integer('isHidden', { mode: 'boolean' }).notNull().default(false),
		folderId: text('folderId').notNull(),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
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

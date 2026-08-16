/**
 * =================================================================================
 * AUDIOS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla audios para archivos de audio
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

// Modelo para archivos de audio
export const audios = sqliteTable(
	'Audio',
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
		duration: integer('duration'),
		bitrate: integer('bitrate'),
		sampleRate: integer('sampleRate'),
		channels: integer('channels'),
		format: text('format'),
		codec: text('codec'),
		title: text('title'),
		artist: text('artist'),
		album: text('album'),
		year: integer('year'),
		genre: text('genre'),
		track: integer('track'),
		disc: integer('disc'),
		albumArtist: text('albumArtist'),
		composer: text('composer'),
		comment: text('comment'),
		lyrics: text('lyrics'),
		bpm: integer('bpm'),
		key: text('key'),
		mood: text('mood'),
		metadata: text('metadata'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(
				sql`(CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER))`
			),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		assetIdKey: uniqueIndex('Audio_assetId_key').on(table.assetId),
		pathIdx: uniqueIndex('Audio_path_key').on(table.path),
		folderId_idx: index('Audio_folderId_idx').on(table.folderId),
		hash_idx: index('Audio_hash_idx').on(table.hash),
		folderHashIdx: index('Audio_folderId_hash_idx').on(table.folderId, table.hash),
		folderCreatedAtIdx: index('Audio_folderId_createdAt_idx').on(table.folderId, table.createdAt, table.id),
		createdAt_idx: index('Audio_createdAt_idx').on(table.createdAt),
		updatedAt_idx: index('Audio_updatedAt_idx').on(table.updatedAt),
		sizeCheck: check('Audio_size_check', sql`size >= 0 AND size <= 107374182400`),
		durationCheck: check('Audio_duration_check', sql`duration IS NULL OR duration >= 0`),
		hashFormatCheck: check('Audio_hash_format_check', sql`length(hash) = 64`),
		assetIdentityCheck: check(
			'Audio_asset_identity_check',
			sql`assetId IS NULL OR (typeof(assetId) = 'text' AND assetId = id)`
		),
		pathLengthCheck: check('Audio_path_length_check', sql`length(path) BETWEEN 1 AND 1000`),
		numericMetadataCheck: check(
			'Audio_numeric_metadata_check',
			sql`(bitrate IS NULL OR bitrate >= 0) AND (sampleRate IS NULL OR sampleRate >= 0) AND (channels IS NULL OR channels >= 0) AND (track IS NULL OR track >= 0) AND (disc IS NULL OR disc >= 0) AND (bpm IS NULL OR bpm >= 0)`
		),
	})
);

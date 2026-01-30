/**
 * =================================================================================
 * AUDIOS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla audios para archivos de audio
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para archivos de audio
export const audios = sqliteTable(
	'Audio',
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
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		pathIdx: uniqueIndex('Audio_path_key').on(table.path),
		folderId_idx: index('Audio_folderId_idx').on(table.folderId),
		hash_idx: index('Audio_hash_idx').on(table.hash),
		createdAt_idx: index('Audio_createdAt_idx').on(table.createdAt),
		updatedAt_idx: index('Audio_updatedAt_idx').on(table.updatedAt),
	})
);

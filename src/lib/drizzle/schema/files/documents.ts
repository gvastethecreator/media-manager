/**
 * =================================================================================
 * DOCUMENTS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla documents para documentos
 *
 * @deprecated Esta tabla duplica 10+ columnas comunes (id, name, path, hash, size,
 * folderId, createdAt, updatedAt, isFavorite, metadata, etc.). Converger a una tabla
 * raíz `Asset` según ADR-0004 y 03-media-core-context.md.
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para documentos
export const documents = sqliteTable(
	'Document',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		path: text('path').notNull(),
		size: integer('size').notNull(),
		hash: text('hash').notNull(),
		mimeType: text('mimeType').notNull(),
		extension: text('extension').notNull(),
		thumbnail: text('thumbnail'),
		thumbnailSize: integer('thumbnailSize'),
		thumbnailWidth: integer('thumbnailWidth'),
		thumbnailHeight: integer('thumbnailHeight'),
		thumbnailMimeType: text('thumbnailMimeType'),
		thumbnailError: text('thumbnailError'),
		thumbnailErrorAt: integer('thumbnailErrorAt', { mode: 'timestamp_ms' }),
		folderId: text('folderId').notNull(),
		// @deprecated Usar tabla canónica `favorites`. ADR-0002 + batch bridge Favorite.
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		isArchived: integer('isArchived', { mode: 'boolean' }).notNull().default(false),
		pageCount: integer('pageCount'),
		wordCount: integer('wordCount'),
		language: text('language'),
		title: text('title'),
		author: text('author'),
		subject: text('subject'),
		keywords: text('keywords'),
		creator: text('creator'),
		producer: text('producer'),
		creationDate: integer('creationDate', { mode: 'timestamp_ms' }),
		modificationDate: integer('modificationDate', { mode: 'timestamp_ms' }),
		encrypted: integer('encrypted', { mode: 'boolean' }).default(false),
		version: text('version'),
		content: text('content'),
		summary: text('summary'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		pathIdx: uniqueIndex('Document_path_key').on(table.path),
		folderId_idx: index('Document_folderId_idx').on(table.folderId),
		hash_idx: index('Document_hash_idx').on(table.hash),
		createdAt_idx: index('Document_createdAt_idx').on(table.createdAt),
		updatedAt_idx: index('Document_updatedAt_idx').on(table.updatedAt),
	})
);

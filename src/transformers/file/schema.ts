import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { FileType } from '../../types/entities/file/enums';

/**
 * Enum para tipos de archivo compatible con Drizzle
 */
export const fileTypeEnum = {
	DIRECTORY: FileType.DIRECTORY,
	FILE: FileType.FILE,
	IMAGE: FileType.IMAGE,
	VIDEO: FileType.VIDEO,
	AUDIO: FileType.AUDIO,
	DOCUMENT: FileType.DOCUMENT,
	ARCHIVE: FileType.ARCHIVE,
	OTHER: FileType.OTHER,
} as const;

export const filesTable = sqliteTable('File', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	path: text('path').notNull(),
	size: integer('size').notNull(),
	hash: text('hash').notNull(),
	mimeType: text('mimeType').notNull(),
	extension: text('extension').notNull(),
	fileType: text('fileType').notNull(),
	folderId: text('folderId').notNull(),
	isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
	isArchived: integer('isArchived', { mode: 'boolean' }).notNull().default(false),
	isHidden: integer('isHidden', { mode: 'boolean' }).notNull().default(false),
	description: text('description'),
	tags: text('tags'),
	metadata: text('metadata'),
	lastAccessed: integer('lastAccessed', { mode: 'timestamp_ms' }),
	accessCount: integer('accessCount').default(0),
	isProcessed: integer('isProcessed', { mode: 'boolean' }).default(false),
	processingError: text('processingError'),
	processingStatus: text('processingStatus').default('pending'),
	createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
});

export type FileSchema = typeof filesTable.$inferSelect;
export type FileInsert = typeof filesTable.$inferInsert;

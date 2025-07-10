import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const documentsTable = sqliteTable('Document', {
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
    createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
});

export type DocumentSchema = typeof documentsTable.$inferSelect;
export type DocumentInsert = typeof documentsTable.$inferInsert;
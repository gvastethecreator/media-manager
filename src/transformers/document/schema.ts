/**
 * @file Schema de Drizzle para la entidad Document.
 * @module transformers/document/schema
 * @description Definición del schema de Document usando Drizzle ORM.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * 📄 Tabla de documentos en la base de datos.
 *
 * @description Representa documentos de texto (PDF, DOC, TXT, etc.) con metadatos y contenido.
 */
export const documentsTable = pgTable('documents', {
	// Identificación
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	path: text('path').notNull(),

	// Propiedades del archivo
	size: integer('size').notNull(),
	hash: text('hash').notNull(),
	mimeType: text('mime_type').notNull(),
	extension: text('extension').notNull(),

	// Relaciones
	folderId: uuid('folder_id').notNull(),

	// Estados
	isFavorite: boolean('is_favorite').notNull().default(false),
	isArchived: boolean('is_archived').notNull().default(false),

	// Metadatos de documento
	pageCount: integer('page_count'),
	wordCount: integer('word_count'),
	language: text('language'),

	// Metadatos de PDF/documento
	title: text('title'),
	author: text('author'),
	subject: text('subject'),
	keywords: text('keywords'),
	creator: text('creator'),
	producer: text('producer'),
	creationDate: timestamp('creation_date', { withTimezone: true }),
	modificationDate: timestamp('modification_date', { withTimezone: true }),
	encrypted: boolean('encrypted'),
	version: text('version'),

	// Contenido
	content: text('content'), // Texto extraído del documento
	summary: text('summary'), // Resumen generado automáticamente

	// Timestamps del sistema
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * 📊 Tipo inferido de la tabla de documentos.
 */
export type DocumentSchema = typeof documentsTable.$inferSelect;

/**
 * 🆕 Tipo para insertar documentos.
 */
export type DocumentInsert = typeof documentsTable.$inferInsert;

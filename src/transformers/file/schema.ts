/**
 * @file Schema de Drizzle para la entidad File.
 * @module transformers/file/schema
 * @description Definición del schema de File usando Drizzle ORM.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * 📁 Enum para tipos de archivos en PostgreSQL.
 */
export const fileTypeEnum = pgEnum('file_type', [
	'image',
	'video',
	'audio',
	'document',
	'text',
	'archive',
	'code',
	'executable',
	'font',
	'data',
	'unknown',
]);

/**
 * 📁 Tabla de archivos en la base de datos.
 * 
 * @description Representa archivos y directorios del sistema con metadatos y relaciones.
 */
export const filesTable = pgTable('files', {
	// Identificación
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	path: text('path').notNull(),
	
	// Propiedades del archivo
	size: integer('size').notNull(),
	hash: text('hash').notNull(),
	mimeType: text('mime_type').notNull(),
	extension: text('extension').notNull(),
	type: fileTypeEnum('type').notNull(),
	
	// Metadatos del sistema
	isDirectory: boolean('is_directory').notNull().default(false),
	parentPath: text('parent_path').notNull(),
	absolutePath: text('absolute_path').notNull(),
	relativePath: text('relative_path').notNull(),
	
	// Fechas del sistema de archivos
	modifiedAt: timestamp('modified_at', { withTimezone: true }).notNull(),
	accessedAt: timestamp('accessed_at', { withTimezone: true }).notNull(),
	
	// Relaciones
	folderId: uuid('folder_id'),
	
	// Estados
	isHidden: boolean('is_hidden').notNull().default(false),
	isReadonly: boolean('is_readonly').notNull().default(false),
	
	// Timestamps del sistema
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * 📊 Tipo inferido de la tabla de archivos.
 */
export type FileSchema = typeof filesTable.$inferSelect;

/**
 * 🆕 Tipo para insertar archivos.
 */
export type FileInsert = typeof filesTable.$inferInsert;

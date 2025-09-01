/**
 * =================================================================================
 * ORGANIZATION DOMAIN SCHEMA - DRIZZLE ORM
 * =================================================================================
 * Definiciones de tablas para el dominio Organization del sistema
 *
 * Tablas incluidas:
 * - groups: Grupos de elementos
 * - albums: Álbumes de contenido
 * - collections: Colecciones de elementos
 * - favorites: Sistema de favoritos
 * - files: Archivos genéricos del sistema
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para los grupos
export const groups = sqliteTable(
	'Group',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Group_name_key').on(table.name),
	})
);

// Modelo para los álbumes
export const albums = sqliteTable(
	'Album',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('📔'),
		color: text('color').default('#3b82f6'),
		featuredImage: text('featuredImage'),

		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		totalImages: integer('totalImages').notNull().default(0),
		totalVideos: integer('totalVideos').notNull().default(0),
		totalSize: integer('totalSize').notNull().default(0),
		filters: text('filters'),
		category: text('category'),
		metadata: text('metadata'),
		lastImageAddedAt: integer('lastImageAddedAt', { mode: 'timestamp_ms' }),
		lastVideoAddedAt: integer('lastVideoAddedAt', { mode: 'timestamp_ms' }),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Album_name_key').on(table.name),
	})
);

// Modelo para las colecciones
export const collections = sqliteTable(
	'Collection',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('📚'),
		color: text('color').default('#3b82f6'),
		featuredImage: text('featuredImage'),

		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		totalImages: integer('totalImages').notNull().default(0),
		totalVideos: integer('totalVideos').notNull().default(0),
		totalSize: integer('totalSize').notNull().default(0),
		lastImageAddedAt: integer('lastImageAddedAt', { mode: 'timestamp_ms' }),
		lastVideoAddedAt: integer('lastVideoAddedAt', { mode: 'timestamp_ms' }),
		parentId: text('parentId'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Collection_name_key').on(table.name),
	})
);

// Modelo para favoritos
export const favorites = sqliteTable(
	'Favorite',
	{
		id: text('id').primaryKey(),
		entityType: text('entityType').notNull(), // 'image', 'video', 'album', etc.
		entityId: text('entityId').notNull(),
		userId: text('userId'), // Opcional por ahora
		addedAt: integer('addedAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		notes: text('notes'), // Notas opcionales del usuario sobre por qué es favorito
		category: text('category'), // Categoría personalizada de favorito
		priority: integer('priority').default(0), // Prioridad del favorito (0-10)
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		entityTypeEntityIdIdx: uniqueIndex('Favorite_entityType_entityId_key').on(table.entityType, table.entityId),
		entityTypeIdx: index('Favorite_entityType_idx').on(table.entityType),
		userIdIdx: index('Favorite_userId_idx').on(table.userId),
		addedAtIdx: index('Favorite_addedAt_idx').on(table.addedAt),
		categoryIdx: index('Favorite_category_idx').on(table.category),
		priorityIdx: index('Favorite_priority_idx').on(table.priority),
	})
);

// Modelo para archivos genéricos
export const files = sqliteTable(
	'File',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		path: text('path').notNull(),
		size: integer('size').notNull(),
		hash: text('hash').notNull(),
		mimeType: text('mimeType').notNull(),
		extension: text('extension').notNull(),
		fileType: text('fileType').notNull(), // 'image', 'video', 'audio', 'document', etc.
		folderId: text('folderId').notNull(),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		isArchived: integer('isArchived', { mode: 'boolean' }).notNull().default(false),
		isHidden: integer('isHidden', { mode: 'boolean' }).notNull().default(false),
		description: text('description'),
		tags: text('tags'), // JSON array de tags
		metadata: text('metadata'), // JSON con metadatos específicos del tipo
		lastAccessed: integer('lastAccessed', { mode: 'timestamp_ms' }),
		accessCount: integer('accessCount').default(0),
		isProcessed: integer('isProcessed', { mode: 'boolean' }).default(false),
		processingError: text('processingError'),
		processingStatus: text('processingStatus').default('pending'), // 'pending', 'processing', 'completed', 'failed'
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		pathIdx: uniqueIndex('File_path_key').on(table.path),
		folderId_idx: index('File_folderId_idx').on(table.folderId),
		hash_idx: index('File_hash_idx').on(table.hash),
		fileType_idx: index('File_fileType_idx').on(table.fileType),
		createdAt_idx: index('File_createdAt_idx').on(table.createdAt),
		updatedAt_idx: index('File_updatedAt_idx').on(table.updatedAt),
		isFavorite_idx: index('File_isFavorite_idx').on(table.isFavorite),
		processingStatus_idx: index('File_processingStatus_idx').on(table.processingStatus),
	})
);

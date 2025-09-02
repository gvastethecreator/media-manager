/**
 * =================================================================================
 * FILE 3DS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla file3Ds para archivos 3D
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para archivos 3D
export const file3Ds = sqliteTable(
	'File3D',
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
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		pathIdx: uniqueIndex('File3D_path_key').on(table.path),
		folderId_idx: index('File3D_folderId_idx').on(table.folderId),
		hash_idx: index('File3D_hash_idx').on(table.hash),
		createdAt_idx: index('File3D_createdAt_idx').on(table.createdAt),
		updatedAt_idx: index('File3D_updatedAt_idx').on(table.updatedAt),
	})
);

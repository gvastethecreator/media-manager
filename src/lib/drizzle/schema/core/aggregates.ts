/**
 * =================================================================================
 * ENTITY AGGREGATES - DRIZZLE ORM
 * =================================================================================
 * Agregados genéricos por entidad (folder, collection, album, tag, ...)
 * Clave compuesta (entityType, entityId). Cachea conteos y tamaños por tipo.
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const entityAggregates = sqliteTable(
	'EntityAggregates',
	{
		entityType: text('entityType').notNull(),
		entityId: text('entityId').notNull(),
		// Conteos por tipo
		totalImages: integer('totalImages').notNull().default(0),
		totalVideos: integer('totalVideos').notNull().default(0),
		totalAudio: integer('totalAudio').notNull().default(0),
		totalDocuments: integer('totalDocuments').notNull().default(0),
		totalJsonFiles: integer('totalJsonFiles').notNull().default(0),
		totalFile3D: integer('totalFile3D').notNull().default(0),
		// Agregados globales
		totalFiles: integer('totalFiles').notNull().default(0),
		totalSize: integer('totalSize').notNull().default(0),
		// Timestamps
		lastIndexed: integer('lastIndexed', { mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.entityType, table.entityId], name: 'EntityAggregates_pk' }),
		lastIndexedIdx: index('EntityAggregates_lastIndexed_idx').on(table.lastIndexed),
	})
);

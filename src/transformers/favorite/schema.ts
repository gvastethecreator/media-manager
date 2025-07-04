/**
 * @file Schema de Drizzle para la entidad Favorite.
 * @module transformers/favorite/schema
 * @description Definición del schema de Favorite usando Drizzle ORM.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import { pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * ⭐ Enum para tipos de entidades favoritas en PostgreSQL.
 */
export const favoriteEntityTypeEnum = pgEnum('favorite_entity_type', [
	'image',
	'video',
	'album',
	'collection',
	'folder',
	'character',
	'place',
	'worldItem',
	'concept',
	'prompt',
	'note',
	'document',
	'file',
	'tag',
	'group',
]);

/**
 * ⭐ Tabla de favoritos en la base de datos.
 *
 * @description Representa las entidades marcadas como favoritas por los usuarios.
 */
export const favoritesTable = pgTable('favorites', {
	// Identificación
	id: uuid('id').primaryKey().defaultRandom(),

	// Entidad favorita
	entityId: uuid('entity_id').notNull(),
	entityType: favoriteEntityTypeEnum('entity_type').notNull(),

	// Usuario (opcional para compatibilidad)
	userId: uuid('user_id'),
	profileId: uuid('profile_id'),

	// Timestamps del sistema
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * 📊 Tipo inferido de la tabla de favoritos.
 */
export type FavoriteSchema = typeof favoritesTable.$inferSelect;

/**
 * 🆕 Tipo para insertar favoritos.
 */
export type FavoriteInsert = typeof favoritesTable.$inferInsert;

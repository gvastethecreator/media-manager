/**
 * =================================================================================
 * PROFILES ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla profiles para perfiles de usuario
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Modelo para el perfil de usuario
export const profiles = sqliteTable('Profile', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	emoji: text('emoji').notNull().default('👤'),
	color: text('color').notNull().default('#3b82f6'),
	description: text('description'),
	isActive: integer('isActive', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('createdAt', { mode: 'timestamp_ms' })
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	settingsId: text('settingsId'),
	imageId: text('imageId'),
});

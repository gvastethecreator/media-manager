/**
 * =================================================================================
 * PROFILES ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla profiles para perfiles de usuario
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uploadedImages } from '../files/uploadedImages';

// Modelo para el perfil de usuario
export const profiles = sqliteTable(
	'Profile',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		emoji: text('emoji').notNull().default('👤'),
		color: text('color').notNull().default('#3b82f6'),
		description: text('description'),
		isActive: integer('isActive', { mode: 'boolean' }).notNull().default(false),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(
				sql`(CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER))`
			),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
		settingsId: text('settingsId'),
		imageId: text('imageId').references(() => uploadedImages.id, { onDelete: 'set null', onUpdate: 'cascade' }),
	},
	(table) => ({
		colorCheck: check('Profile_color_format_check', sql`color LIKE '#%' AND length(color) = 7`),
	})
);

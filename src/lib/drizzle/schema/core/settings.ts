/**
 * =================================================================================
 * SETTINGS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla settings para configuraciones del sistema
 * =================================================================================
 */

import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { profiles } from './profiles';

// Settings para el sistema
export const settings = sqliteTable(
	'Settings',
	{
		id: text('id').primaryKey(),
		theme: text('theme').notNull().default('system'),
		language: text('language').notNull().default('es'),
		data: text('data').notNull(), // Prisma's Json maps to TEXT in SQLite
		profileId: text('profileId')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	},
	(table) => ({
		profileIdIdx: uniqueIndex('Settings_profileId_key').on(table.profileId),
	})
);

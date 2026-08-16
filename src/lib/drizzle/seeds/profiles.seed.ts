import { sql } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { profiles } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra perfiles minimalistas para verificación del sistema
 *
 * NOTA: Los colores hex en este archivo son datos de prueba para inicializar la DB.
 * No se usan directamente en la UI de producción - la UI usa tokens CSS
 * definidos en src/styles/tokens.css y src/styles/design-tokens.css.
 */
export async function seedProfiles(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('👤 Creando perfiles de prueba...');

	try {
		const sampleProfiles = [
			{
				id: '88888888-8888-4888-a888-888888888881',
				name: 'Primary User',
				emoji: '🎨',
				color: '#3b82f6',
				description: 'Perfil principal del sistema',
				isActive: true,
				settingsId: null,
				imageId: null,
			},
			{
				id: '88888888-8888-4888-a888-888888888882',
				name: 'Secondary User',
				emoji: '🎭',
				color: '#ef4444',
				description: 'Perfil secundario para pruebas',
				isActive: false,
				settingsId: null,
				imageId: null,
			},
			{
				id: '88888888-8888-4888-a888-888888888883',
				name: 'Artista Digital',
				emoji: '🖌️',
				color: '#a855f7',
				description: 'Profile for creative work',
				isActive: false,
				settingsId: null,
				imageId: null,
			},
			{
				id: '88888888-8888-4888-a888-888888888884',
				name: 'Fotógrafo',
				emoji: '📷',
				color: '#22c55e',
				description: 'Profile for photography',
				isActive: false,
				settingsId: null,
				imageId: null,
			},
		];

		await db
			.insert(profiles)
			.values(sampleProfiles)
			.onConflictDoUpdate({
				target: profiles.id,
				set: {
					name: sql`excluded.name`,
					emoji: sql`excluded.emoji`,
					color: sql`excluded.color`,
					description: sql`excluded.description`,
					isActive: sql`excluded.isActive`,
					updatedAt: sql`(CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER))`,
					settingsId: sql`excluded.settingsId`,
					imageId: sql`excluded.imageId`,
				},
			});

		seedLogger.success(`✅ ${sampleProfiles.length} perfiles creados`);
	} catch (error) {
		seedLogger.error('❌ Could not create profiles:', error);
		throw error;
	}
}

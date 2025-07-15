import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { settings } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra settings de ejemplo para verificación del sistema
 */
export async function seedSettings(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('⚙️ Creando settings de prueba...');

	try {
		const sampleSettings = [
			{
				id: 'settings-1',
				theme: 'dark',
				language: 'es',
				data: '{"notificaciones":true}',
				profileId: 'profile-1',
			},
			{
				id: 'settings-2',
				theme: 'light',
				language: 'en',
				data: '{"notificaciones":false}',
				profileId: 'profile-2',
			},
		];

		await db.insert(settings).values(sampleSettings);

		seedLogger.success(`✅ ${sampleSettings.length} settings creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando settings:', error);
		throw error;
	}
}

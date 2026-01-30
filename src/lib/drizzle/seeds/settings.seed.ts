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
				id: '12121212-1212-4121-a121-121212121211',
				theme: 'dark',
				language: 'es',
				data: '{"notificaciones":true}',
				profileId: '88888888-8888-4888-a888-888888888881',
			},
			{
				id: '12121212-1212-4121-a121-121212121212',
				theme: 'light',
				language: 'en',
				data: '{"notificaciones":false}',
				profileId: '88888888-8888-4888-a888-888888888882',
			},
		];

		await db.insert(settings).values(sampleSettings);

		seedLogger.success(`✅ ${sampleSettings.length} settings creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando settings:', error);
		throw error;
	}
}

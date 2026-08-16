import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { settings } from '../schema';
import { seedLogger } from './index';

/**
 * Seeds example settings for system verification.
 */
export async function seedSettings(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('⚙️ Creating test settings...');

	try {
		const sampleSettings = [
			{
				id: '12121212-1212-4121-a121-121212121211',
				theme: 'dark',
				language: 'en',
				data: '{"notifications":true}',
				profileId: '88888888-8888-4888-a888-888888888881',
			},
			{
				id: '12121212-1212-4121-a121-121212121212',
				theme: 'light',
				language: 'en',
				data: '{"notifications":false}',
				profileId: '88888888-8888-4888-a888-888888888882',
			},
		];

		await db.insert(settings).values(sampleSettings);

		seedLogger.success(`✅ ${sampleSettings.length} settings created`);
	} catch (error) {
		seedLogger.error('❌ Error creating settings:', error);
		throw error;
	}
}

import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { jsonFiles } from '../schema/index';
import { seedLogger } from './index';

/**
 * Seed para archivos JSON - datos de prueba sin asociaciones
 */
export async function seedJsonFiles(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📋 Creando archivos JSON de prueba (sin asociaciones)...');

	try {
		const sampleJsonFiles = [
			{
				id: 'json-seed-001',
				name: 'test-json.json',
				path: 'D:\\DEV\\image-manager\\test-files\\test-json.json',
				size: 2048,
				hash: 'c3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b864',
				mimeType: 'application/json',
				extension: 'json',
				folderId: 'test-files',
				isArchived: false,
				isValid: true,
			},
		];

		await db.insert(jsonFiles).values(sampleJsonFiles);
		seedLogger.success(`✅ ${sampleJsonFiles.length} JSON files created`);
	} catch (error) {
		seedLogger.error('❌ Could not create JSON files:', error);
		throw error;
	}
}

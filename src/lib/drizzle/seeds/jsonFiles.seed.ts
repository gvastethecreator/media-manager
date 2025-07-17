import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { jsonFiles } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra archivos JSON de ejemplo para verificación del sistema
 * NOTA: Estas son referencias de ejemplo, no archivos reales
 */
export async function seedJsonFiles(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📋 Creando archivos JSON de ejemplo...');

	try {
		const sampleJsonFiles = [
			{
				id: 'json-1',
				name: 'app-config.json',
				path: '/examples/json/app-config.json',
				size: 4096, // 4KB
				mimeType: 'application/json',
				extension: 'json',
				hash: 'json123abc456def',
				schema: 'config-schema-v1',
				version: '1.0',
				isValid: true,
				validationErrors: null,
				content: JSON.stringify({
					app: {
						name: 'Image Manager',
						version: '1.0.0',
						environment: 'production',
					},
					database: {
						type: 'sqlite',
						path: './db.sqlite',
					},
					features: {
						imageProcessing: true,
						videoProcessing: true,
						aiAnalysis: false,
					},
				}),
				folderId: 'config-files',
				isFavorite: true,
			},
			{
				id: 'json-2',
				name: 'user-preferences.json',
				path: '/examples/json/user-preferences.json',
				size: 2048, // 2KB
				mimeType: 'application/json',
				extension: 'json',
				hash: 'json456def789ghi',
				schema: 'user-prefs-schema-v2',
				version: '2.1',
				isValid: true,
				validationErrors: null,
				content: JSON.stringify({
					user: {
						id: 'profile-1',
						theme: 'dark',
						language: 'es',
					},
					interface: {
						gridSize: 'medium',
						showThumbnails: true,
						animations: true,
					},
					notifications: {
						email: true,
						push: false,
						sound: true,
					},
				}),
				folderId: 'user-data',
				isFavorite: false,
			},
		];

		await db.insert(jsonFiles).values(sampleJsonFiles);
		seedLogger.success(`✅ ${sampleJsonFiles.length} archivos JSON de ejemplo creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando archivos JSON de ejemplo:', error);
		throw error;
	}
}

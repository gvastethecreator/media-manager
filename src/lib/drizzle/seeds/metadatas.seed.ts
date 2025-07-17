import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { metadatas } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra metadatos minimalistas para verificación del sistema
 */
export async function seedMetadatas(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🏷️ Creando metadatos de prueba...');

	try {
		const sampleMetadatas = [
			{
				id: 'metadata-1',
				entityType: 'image',
				entityId: 'img-example-1',
				key: 'camera_model',
				value: 'Canon EOS R5',
				dataType: 'string',
				category: 'exif',
				isSearchable: true,
				isPublic: true,
			},
			{
				id: 'metadata-2',
				entityType: 'image',
				entityId: 'img-example-1',
				key: 'iso_speed',
				value: '400',
				dataType: 'number',
				category: 'exif',
				isSearchable: true,
				isPublic: true,
			},
		];

		await db.insert(metadatas).values(sampleMetadatas);
		seedLogger.success(`✅ ${sampleMetadatas.length} metadatos creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando metadatos:', error);
		throw error;
	}
}

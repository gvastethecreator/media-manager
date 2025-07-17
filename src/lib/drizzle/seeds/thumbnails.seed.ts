import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { thumbnails } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra miniaturas de ejemplo para verificación del sistema
 * NOTA: Estas son referencias de ejemplo, no archivos reales
 */
export async function seedThumbnails(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🖼️ Creando miniaturas de ejemplo...');

	try {
		const sampleThumbnails = [
			{
				id: 'thumb-1',
				entityType: 'image',
				entityId: 'img-example-1',
				size: 'small',
				path: '/thumbnails/images/img-example-1_150x150.jpg',
				width: 150,
				height: 150,
				format: 'jpeg',
				quality: 80,
				fileSize: 8192, // 8KB
				isGenerated: true,
			},
			{
				id: 'thumb-2',
				entityType: 'video',
				entityId: 'vid-example-1',
				size: 'medium',
				path: '/thumbnails/videos/vid-example-1_300x200.jpg',
				width: 300,
				height: 200,
				format: 'jpeg',
				quality: 85,
				fileSize: 16384, // 16KB
				isGenerated: true,
			},
		];

		await db.insert(thumbnails).values(sampleThumbnails);
		seedLogger.success(`✅ ${sampleThumbnails.length} miniaturas de ejemplo creadas`);
	} catch (error) {
		seedLogger.error('❌ Error creando miniaturas de ejemplo:', error);
		throw error;
	}
}

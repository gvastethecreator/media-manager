import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { thumbnails } from '../schema/index';
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
				id: '13131313-1313-4131-a131-131313131311',
				entityType: 'image',
				entityId: 'img-seed-001',
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
				id: '13131313-1313-4131-a131-131313131312',
				entityType: 'video',
				entityId: 'vid-seed-001',
				size: 'medium',
				path: '/thumbnails/videos/vid-example-1_300x200.jpg',
				width: 300,
				height: 200,
				format: 'jpeg',
				quality: 85,
				fileSize: 16_384, // 16KB
				isGenerated: true,
			},
		];

		await db.insert(thumbnails).values(sampleThumbnails);
		seedLogger.success(`✅ ${sampleThumbnails.length} miniaturas de ejemplo creadas`);
	} catch (error) {
		seedLogger.error('❌ Could not create sample thumbnails:', error);
		throw error;
	}
}

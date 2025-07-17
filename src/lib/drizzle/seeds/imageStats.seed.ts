import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { imageStats } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra estadísticas de imágenes minimalistas para verificación del sistema
 */
export async function seedImageStats(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📈 Creando estadísticas de imágenes de prueba...');

	try {
		const sampleImageStats = [
			{
				id: 'stats-1',
				imageId: 'img-example-1',
				views: 150,
				likes: 25,
				downloads: 8,
				shares: 3,
				comments: 5,
				rating: 4,
				lastViewedAt: new Date(),
				lastLikedAt: new Date(),
				lastDownloadedAt: new Date(),
				lastSharedAt: new Date(),
				lastCommentedAt: new Date(),
			},
			{
				id: 'stats-2',
				imageId: 'img-example-2',
				views: 89,
				likes: 12,
				downloads: 4,
				shares: 1,
				comments: 2,
				rating: 5,
				lastViewedAt: new Date(),
				lastLikedAt: new Date(),
				lastDownloadedAt: null,
				lastSharedAt: null,
				lastCommentedAt: new Date(),
			},
		];

		await db.insert(imageStats).values(sampleImageStats);
		seedLogger.success(`✅ ${sampleImageStats.length} estadísticas de imágenes creadas`);
	} catch (error) {
		seedLogger.error('❌ Error creando estadísticas de imágenes:', error);
		throw error;
	}
}

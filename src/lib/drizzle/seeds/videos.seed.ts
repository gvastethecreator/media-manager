import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { videos } from '../schema/index';
import { seedLogger } from './index';

/**
 * Seed para videos - datos de prueba sin asociaciones
 */
export async function seedVideos(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🎥 Creando videos de prueba (sin asociaciones)...');

	try {
		const sampleVideos = [
			{
				id: 'vid-seed-001',
				name: 'Seed Video 1',
				path: 'A:\\MOKLOS DATASETS\\! POSTERS\\seed_video1.mp4',
				hash: 'b3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b857',
				size: 10_240,
				duration: 60,
				folderId: 'posters',
				isFavorite: false,
			},
			{
				id: 'vid-seed-002',
				name: 'test-video.mp4',
				path: 'D:\\DEV\\image-manager\\test-files\\test-video.mp4',
				hash: 'd3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b859',
				size: 20_480,
				duration: 120,
				folderId: 'test-files',
				isFavorite: false,
			},
		];

		await db.insert(videos).values(sampleVideos);
		seedLogger.success(`✅ ${sampleVideos.length} videos creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando videos:', error);
		throw error;
	}
}

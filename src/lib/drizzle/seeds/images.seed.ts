import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { images } from '../schema/index';
import { seedLogger } from './index';

/**
 * Seed para imágenes - datos de prueba sin asociaciones
 */
export async function seedImages(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🖼️ Creando imágenes de prueba (sin asociaciones)...');

	try {
		const sampleImages = [
			{
				id: 'img-seed-001',
				name: 'Seed Image 1',
				path: 'A:\\MOKLOS DATASETS\\! POSTERS\\seed1.jpg',
				hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
				size: 1024,
				width: 1920,
				height: 1080,
				folderId: 'posters',
			},
			{
				id: 'img-seed-002',
				name: 'Seed Image 2',
				path: 'A:\\MOKLOS DATASETS\\! POSTERS\\seed2.png',
				hash: 'a3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b856',
				size: 2048,
				width: 800,
				height: 600,
				folderId: 'posters',
			},
			{
				id: 'img-seed-003',
				name: 'test-photo.png',
				path: 'D:\\DEV\\image-manager\\test-files\\test-photo.png',
				hash: 'c3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b858',
				size: 3072,
				width: 500,
				height: 500,
				folderId: 'test-files',
			},
		];

		await db.insert(images).values(sampleImages);
		seedLogger.success(`✅ ${sampleImages.length} images created`);
	} catch (error) {
		seedLogger.error('❌ Could not create images:', error);
		throw error;
	}
}

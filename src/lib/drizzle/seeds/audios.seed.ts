import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { audios } from '../schema/index';
import { seedLogger } from './index';

/**
 * Seed para audios - datos de prueba sin asociaciones
 */
export async function seedAudios(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🎵 Creando audios de prueba (sin asociaciones)...');

	try {
		const sampleAudios = [
			{
				id: 'aud-seed-001',
				name: 'test-audio.wav',
				path: 'D:\\DEV\\image-manager\\test-files\\test-audio.wav',
				size: 5120,
				hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b860',
				mimeType: 'audio/wav',
				extension: 'wav',
				folderId: 'test-files',
				isArchived: false,
			},
			{
				id: 'aud-seed-002',
				name: 'test-mp3.mp3',
				path: 'D:\\DEV\\image-manager\\test-files\\test-mp3.mp3',
				size: 3072,
				hash: 'f3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b861',
				mimeType: 'audio/mpeg',
				extension: 'mp3',
				folderId: 'test-files',
				isArchived: false,
			},
		];

		await db.insert(audios).values(sampleAudios);
		seedLogger.success(`✅ ${sampleAudios.length} audios creados`);
	} catch (error) {
		seedLogger.error('❌ Could not create audio files:', error);
		throw error;
	}
}

import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { audios } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra audios de ejemplo para verificación del sistema
 * NOTA: Estas son referencias de ejemplo, no archivos reales
 */
export async function seedAudios(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🎵 Creando audios de ejemplo...');

	try {
		const sampleAudios = [
			{
				id: 'audio-1',
				name: 'ambient-nature.mp3',
				path: '/examples/audios/ambient-nature.mp3',
				size: 5_242_880, // 5MB
				hash: 'sha256:audio123abc456def789ghi012jkl345mno678pqr901stu234vwx567yz890',
				mimeType: 'audio/mpeg',
				extension: 'mp3',
				duration: 180.5,
				bitRate: 192_000,
				sampleRate: 44_100,
				channels: 2,
				codec: 'MP3',
				checksum: 'audio123abc456def',
				metadata: JSON.stringify({
					artist: 'Nature Sounds',
					album: 'Ambient Collection',
					genre: 'Ambient',
					year: 2024,
				}),
				tags: JSON.stringify(['ambient', 'nature', 'relaxing', 'background']),
				folderId: 'audio-library',
				isProcessed: true,
				processingStatus: 'completed',
				isFavorite: true,
				isPublic: true,
			},
			{
				id: 'audio-2',
				name: 'podcast-episode-01.wav',
				path: '/examples/audios/podcast-episode-01.wav',
				size: 52_428_800, // 50MB
				hash: 'sha256:audio456def789ghi012jkl345mno678pqr901stu234vwx567yz890abc',
				mimeType: 'audio/wav',
				extension: 'wav',
				duration: 3600.0, // 1 hour
				bitRate: 1_411_200, // CD quality
				sampleRate: 44_100,
				channels: 2,
				codec: 'PCM',
				checksum: 'audio456def789ghi',
				metadata: JSON.stringify({
					artist: 'Tech Talk Podcast',
					album: 'Season 1',
					genre: 'Podcast',
					year: 2024,
					episode: 1,
				}),
				tags: JSON.stringify(['podcast', 'technology', 'interview', 'education']),
				folderId: 'podcast-library',
				isProcessed: true,
				processingStatus: 'completed',
				isFavorite: false,
				isPublic: false,
			},
		];

		await db.insert(audios).values(sampleAudios);
		seedLogger.success(`✅ ${sampleAudios.length} audios de ejemplo creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando audios de ejemplo:', error);
		throw error;
	}
}

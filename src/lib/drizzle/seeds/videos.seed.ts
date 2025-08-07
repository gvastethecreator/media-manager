import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { videos } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra videos de ejemplo para verificación del sistema
 * NOTA: Estas son referencias de ejemplo, no archivos reales
 */
export async function seedVideos(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🎥 Creando videos de ejemplo...');

	try {
		const sampleVideos = [
			{
				id: 'vid-example-1',
				name: 'timelapse-sunset.mp4',
				path: '/examples/videos/timelapse-sunset.mp4',
				hash: 'sha256:vid123abc456def789ghi012jkl345mno678pqr901stu234vwx567',
				size: 52_428_800, // 50MB
				mimeType: 'video/mp4',
				extension: 'mp4',
				width: 1920,
				height: 1080,
				aspectRatio: 1.78,
				duration: 30.5,
				frameRate: 24,
				bitRate: 8_000_000,
				codec: 'H.264',
				container: 'MP4',
				hasAudio: true,
				audioCodec: 'AAC',
				audioBitRate: 128_000,
				audioChannels: 2,
				audioSampleRate: 44_100,
				checksum: 'vid123abc456def789',
				thumbnailPath: '/examples/thumbnails/timelapse-sunset-thumb.jpg',
				previewPath: '/examples/previews/timelapse-sunset-preview.mp4',
				blurHash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH',
				dominantColor: '#ff6b35',
				palette: JSON.stringify(['#ff6b35', '#f7931e', '#ffd23f', '#06ffa5']),
				metadata: JSON.stringify({ camera: 'DJI Mavic Pro', location: 'Beach Sunset' }),
				location: JSON.stringify({ lat: 34.0522, lng: -118.2437, name: 'Santa Monica Beach' }),
				tags: JSON.stringify(['timelapse', 'sunset', 'nature', 'drone']),
				folderId: 'nature-videos',
				isProcessed: true,
				processingStatus: 'completed',
				isFavorite: true,
				isPublic: true,
				rating: 5,
			},
			{
				id: 'vid-example-2',
				name: 'interview-corporate.mp4',
				path: '/examples/videos/interview-corporate.mp4',
				hash: 'sha256:vid456def789ghi012jkl345mno678pqr901stu234vwx567yz890',
				size: 104_857_600, // 100MB
				mimeType: 'video/mp4',
				extension: 'mp4',
				width: 1920,
				height: 1080,
				aspectRatio: 1.78,
				duration: 120.0,
				frameRate: 30,
				bitRate: 6_000_000,
				codec: 'H.264',
				container: 'MP4',
				hasAudio: true,
				audioCodec: 'AAC',
				audioBitRate: 192_000,
				audioChannels: 2,
				audioSampleRate: 48_000,
				checksum: 'vid456def789ghi012',
				thumbnailPath: '/examples/thumbnails/interview-corporate-thumb.jpg',
				previewPath: '/examples/previews/interview-corporate-preview.mp4',
				blurHash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.',
				dominantColor: '#4a90e2',
				palette: JSON.stringify(['#4a90e2', '#7ed321', '#f5a623', '#d0021b']),
				metadata: JSON.stringify({ camera: 'Sony FX6', lighting: 'Studio Setup' }),
				location: null,
				tags: JSON.stringify(['interview', 'corporate', 'professional', 'business']),
				folderId: 'corporate-videos',
				isProcessed: true,
				processingStatus: 'completed',
				isFavorite: false,
				isPublic: false,
				rating: 4,
			},
		];

		await db.insert(videos).values(sampleVideos);
		seedLogger.success(`✅ ${sampleVideos.length} videos de ejemplo creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando videos de ejemplo:', error);
		throw error;
	}
}

import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { images } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra imágenes de ejemplo para verificación del sistema
 * NOTA: Estas son referencias de ejemplo, no archivos reales
 */
export async function seedImages(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🖼️ Creando imágenes de ejemplo...');

	try {
		const sampleImages = [
			{
				id: 'img-example-1',
				name: 'landscape-mountain.jpg',
				path: '/examples/images/landscape-mountain.jpg',
				hash: 'sha256:abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567',
				size: 2_048_000,
				mimeType: 'image/jpeg',
				extension: 'jpg',
				width: 1920,
				height: 1080,
				aspectRatio: 1.78,
				colorSpace: 'sRGB',
				hasAlpha: false,
				bitDepth: 8,
				compression: 'JPEG',
				quality: 85,
				checksum: 'abc123def456ghi789',
				blurHash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH',
				dominantColor: '#4a90e2',
				palette: JSON.stringify(['#4a90e2', '#7ed321', '#f5a623', '#d0021b']),
				exifData: JSON.stringify({ camera: 'Canon EOS R5', iso: 400, aperture: 'f/8' }),
				location: JSON.stringify({ lat: 40.7128, lng: -74.006, name: 'Mountain View' }),
				tags: JSON.stringify(['landscape', 'mountain', 'nature']),
				folderId: 'nature-photos',
				isProcessed: true,
				processingStatus: 'completed',
				isFavorite: true,
				isPublic: true,
				rating: 4,
			},
			{
				id: 'img-example-2',
				name: 'portrait-studio.jpg',
				path: '/examples/images/portrait-studio.jpg',
				hash: 'sha256:def456ghi789jkl012mno345pqr678stu901vwx234yz567abc123',
				size: 1_536_000,
				mimeType: 'image/jpeg',
				extension: 'jpg',
				width: 1080,
				height: 1350,
				aspectRatio: 0.8,
				colorSpace: 'sRGB',
				hasAlpha: false,
				bitDepth: 8,
				compression: 'JPEG',
				quality: 90,
				checksum: 'def456ghi789jkl012',
				blurHash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.',
				dominantColor: '#f5a623',
				palette: JSON.stringify(['#f5a623', '#4a90e2', '#7ed321', '#bd10e0']),
				exifData: JSON.stringify({ camera: 'Sony A7R IV', iso: 200, aperture: 'f/2.8' }),
				location: null,
				tags: JSON.stringify(['portrait', 'studio', 'professional']),
				folderId: 'portrait-photos',
				isProcessed: true,
				processingStatus: 'completed',
				isFavorite: false,
				isPublic: false,
				rating: 5,
			},
		];

		// 📦 Generar imágenes adicionales para la carpeta 'cursed-dump' (asegurar scroll en tests)
		for (let i = 1; i <= 30; i++) {
			// Reutilizamos las mismas claves que los ejemplos para mantener consistencia con el esquema actual
			sampleImages.push({
				id: `cursed-img-${i}`,
				name: `cursed-${i}.jpg`,
				path: `/examples/images/cursed/${i}.jpg`,
				hash: `sha256:cursed${i.toString().padStart(2, '0')}abcdef1234567890`,
				size: (800 + i) * 1000,
				mimeType: 'image/jpeg',
				extension: 'jpg',
				width: 1024,
				height: 768,
				aspectRatio: 1.33,
				colorSpace: 'sRGB',
				hasAlpha: false,
				bitDepth: 8,
				compression: 'JPEG',
				quality: 85,
				checksum: `cursed-${i}`,
				blurHash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH',
				dominantColor: '#888888',
				palette: JSON.stringify(['#888888', '#222222', '#bbbbbb']),
				exifData: JSON.stringify({ camera: 'TestCam', iso: 100 + i }),
				location: null,
				tags: JSON.stringify(['cursed', 'dump']),
				folderId: 'cursed-dump',
				isProcessed: true,
				processingStatus: 'completed',
				isFavorite: false,
				isPublic: false,
				rating: (i % 5) + 1,
			});
		}

		await db.insert(images).values(sampleImages);
		seedLogger.success(`✅ ${sampleImages.length} imágenes de ejemplo creadas`);
	} catch (error) {
		seedLogger.error('❌ Error creando imágenes de ejemplo:', error);
		throw error;
	}
}

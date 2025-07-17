import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { uploadedImages } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra imágenes subidas de ejemplo para verificación del sistema
 * NOTA: Estas son referencias de ejemplo, no archivos reales
 */
export async function seedUploadedImages(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📤 Creando imágenes subidas de ejemplo...');

	try {
		const sampleUploadedImages = [
			{
				id: 'upload-1',
				name: 'vacation-photo.jpg',
				originalName: 'vacation-photo.jpg',
				filename: 'upload_1704067200_vacation-photo.jpg',
				path: '/uploads/images/2024/01/upload_1704067200_vacation-photo.jpg',
				size: 1024000,
				mimeType: 'image/jpeg',
				extension: 'jpg',
				width: 1600,
				height: 1200,
				aspectRatio: 1.33,
				checksum: 'upload123abc456def',
				hash: 'sha256:upload123abc456def789ghi012jkl345mno678pqr901stu234',
				uploadedBy: 'profile-1',
				uploadSource: 'web_interface',
				isProcessed: true,
				processingStatus: 'completed',
				processingError: null,
				metadata: JSON.stringify({ device: 'iPhone 14', app_version: '1.0.0' }),
				tags: JSON.stringify(['vacation', 'travel', 'family']),
				isFavorite: true,
				isPublic: false,
				imageId: 'image-1',
			},
			{
				id: 'upload-2',
				name: 'work-presentation.png',
				originalName: 'work-presentation.png',
				filename: 'upload_1704153600_work-presentation.png',
				path: '/uploads/images/2024/01/upload_1704153600_work-presentation.png',
				size: 512000,
				mimeType: 'image/png',
				extension: 'png',
				width: 1920,
				height: 1080,
				aspectRatio: 1.78,
				checksum: 'upload456def789ghi',
				hash: 'sha256:upload456def789ghi012jkl345mno678pqr901stu234vwx567',
				uploadedBy: 'profile-1',
				uploadSource: 'api',
				isProcessed: true,
				processingStatus: 'completed',
				processingError: null,
				metadata: JSON.stringify({ software: 'Figma', export_quality: 'high' }),
				tags: JSON.stringify(['work', 'presentation', 'design']),
				isFavorite: false,
				isPublic: true,
				imageId: 'image-2',
			},
		];

		await db.insert(uploadedImages).values(sampleUploadedImages);
		seedLogger.success(`✅ ${sampleUploadedImages.length} imágenes subidas de ejemplo creadas`);
	} catch (error) {
		seedLogger.error('❌ Error creando imágenes subidas de ejemplo:', error);
		throw error;
	}
}

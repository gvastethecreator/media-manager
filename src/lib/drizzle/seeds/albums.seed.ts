import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { nanoid } from 'nanoid';
import { albums } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra álbumes minimalistas para verificación del sistema
 */
export async function seedAlbums(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📔 Creando álbumes de prueba...');

	try {
		const sampleAlbums = [
			{
				id: 'V1StGXR8_Z5jdHi6B-myc',
				name: 'Favoritos',
				description: 'Álbum de imágenes favoritas',
				emoji: '⭐',
				color: 'var(--dt-warning-500)',
				featuredImage: null,
				isPublic: false,
				isFavorite: true,
				totalImages: 0,
				totalVideos: 0,
				totalSize: 0,
				lastImageAddedAt: null,
				lastVideoAddedAt: null,
			},
			{
				id: 'V1StGXR8_Z5jdHi6B-myd',
				name: 'Colección Digital',
				description: 'Arte y diseño digital',
				emoji: '🎨',
				color: 'var(--preset-purple)',
				featuredImage: null,
				isPublic: true,
				isFavorite: false,
				totalImages: 0,
				totalVideos: 0,
				totalSize: 0,
				lastImageAddedAt: null,
				lastVideoAddedAt: null,
			},
			{
				id: 'V1StGXR8_Z5jdHi6B-mye',
				name: 'Paisajes Épicos',
				description: 'Vistas panorámicas y naturaleza',
				emoji: '🏔️',
				color: 'var(--dt-success-500)',
				featuredImage: null,
				isPublic: true,
				isFavorite: true,
				totalImages: 0,
				totalVideos: 0,
				totalSize: 0,
				lastImageAddedAt: null,
				lastVideoAddedAt: null,
			},
			{
				id: 'V1StGXR8_Z5jdHi6B-myf',
				name: 'Retratos Creativos',
				description: 'Retratos artísticos y expresivos',
				emoji: '📸',
				color: 'var(--preset-pink)',
				featuredImage: null,
				isPublic: false,
				isFavorite: false,
				totalImages: 0,
				totalVideos: 0,
				totalSize: 0,
				lastImageAddedAt: null,
				lastVideoAddedAt: null,
			},
		];

		await db.insert(albums).values(sampleAlbums);

		seedLogger.success(`✅ ${sampleAlbums.length} álbumes creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando álbumes:', error);
		throw error;
	}
}

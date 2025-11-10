import type { LibSQLDatabase } from 'drizzle-orm/libsql';
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
				id: 'album-1',
				name: 'Momentos Épicos',
				description: 'Escenas importantes y eventos clave de la historia',
				emoji: '⚡',
				color: '#f59e0b',
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
				id: 'album-2',
				name: 'Galería de Personajes',
				description: 'Portraits y diseños de los personajes de Nexus',
				emoji: '👤',
				color: '#8b5cf6',
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
				id: 'album-3',
				name: 'Concept Art del Mundo',
				description: 'Arte conceptual y worldbuilding visual',
				emoji: '🎨',
				color: '#06b6d4',
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

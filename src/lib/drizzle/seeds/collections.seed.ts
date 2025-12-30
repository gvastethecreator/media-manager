import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { collections } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra colecciones minimalistas para verificación del sistema
 */
export async function seedCollections(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📚 Creando colecciones de prueba...');

	try {
		const sampleCollections = [
			{
				id: '44444444-4444-4444-a444-444444444441',
				name: 'Biblioteca Principal',
				description: 'Colección principal de recursos',
				emoji: '📚',
				color: '#3b82f6',
				featuredImage: null,
				isPublic: true,
				isFavorite: true,
				totalImages: 0,
				totalVideos: 0,
				totalSize: 0,
				lastImageAddedAt: null,
				lastVideoAddedAt: null,
				parentId: null,
			},
			{
				id: '44444444-4444-4444-a444-444444444442',
				name: 'Archivo Personal',
				description: 'Colección personal privada',
				emoji: '🗃️',
				color: '#64748b',
				featuredImage: null,
				isPublic: false,
				isFavorite: false,
				totalImages: 0,
				totalVideos: 0,
				totalSize: 0,
				lastImageAddedAt: null,
				lastVideoAddedAt: null,
				parentId: null,
			},
			{
				id: '44444444-4444-4444-a444-444444444443',
				name: 'Referencias Artísticas',
				description: 'Material de referencia para proyectos',
				emoji: '🎨',
				color: '#f59e0b',
				featuredImage: null,
				isPublic: true,
				isFavorite: true,
				totalImages: 0,
				totalVideos: 0,
				totalSize: 0,
				lastImageAddedAt: null,
				lastVideoAddedAt: null,
				parentId: null,
			},
			{
				id: '44444444-4444-4444-a444-444444444444',
				name: 'Proyectos Activos',
				description: 'Trabajos en progreso',
				emoji: '🚀',
				color: '#10b981',
				featuredImage: null,
				isPublic: false,
				isFavorite: false,
				totalImages: 0,
				totalVideos: 0,
				totalSize: 0,
				lastImageAddedAt: null,
				lastVideoAddedAt: null,
				parentId: null,
			},
		];

		await db.insert(collections).values(sampleCollections);

		seedLogger.success(`✅ ${sampleCollections.length} colecciones creadas`);
	} catch (error) {
		seedLogger.error('❌ Error creando colecciones:', error);
		throw error;
	}
}

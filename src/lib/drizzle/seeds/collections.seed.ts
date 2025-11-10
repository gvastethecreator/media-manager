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
				id: 'collection-1',
				name: 'Héroes de Nexus',
				description: 'Personajes protagonistas del mundo Nexus Realms',
				emoji: '🦸',
				color: '#10b981',
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
				id: 'collection-2',
				name: 'Lugares Épicos',
				description: 'Locations y escenarios favoritos de Nexus Realms',
				emoji: '🏰',
				color: '#06b6d4',
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
				id: 'collection-3',
				name: 'Artefactos Legendarios',
				description: 'Items y objetos de poder en el mundo',
				emoji: '⚔️',
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
				id: 'collection-4',
				name: 'Archivo del Lore',
				description: 'Documentación, historia y worldbuilding de Nexus',
				emoji: '📜',
				color: '#8b5cf6',
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

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
        id: 'collection-2',
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
    ];

    await db.insert(collections).values(sampleCollections);

    seedLogger.success(`✅ ${sampleCollections.length} colecciones creadas`);
  } catch (error) {
    seedLogger.error('❌ Error creando colecciones:', error);
    throw error;
  }
}

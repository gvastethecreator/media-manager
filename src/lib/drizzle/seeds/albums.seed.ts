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
        name: 'Favoritos',
        description: 'Álbum de imágenes favoritas',
        emoji: '⭐',
        color: '#f59e0b',
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
        id: 'album-2',
        name: 'Colección Digital',
        description: 'Arte y diseño digital',
        emoji: '🎨',
        color: '#8b5cf6',
        featuredImage: null,
        isPublic: true,
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

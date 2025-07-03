import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { tags } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra etiquetas minimalistas para verificación del sistema
 */
export async function seedTags(db: LibSQLDatabase<Record<string, never>>) {
  seedLogger.info('🏷️ Creando etiquetas de prueba...');

  try {
    const sampleTags = [
      {
        id: 'tag-1',
        name: 'Arte Digital',
        description: 'Creaciones artísticas digitales',
        emoji: '🎨',
        color: '#8b5cf6',
        category: 'arte',
        isPublic: true,
        isFavorite: true,
        totalImages: 0,
        totalVideos: 0,
      },
      {
        id: 'tag-2',
        name: 'Naturaleza',
        description: 'Paisajes y elementos naturales',
        emoji: '🌿',
        color: '#10b981',
        category: 'temática',
        isPublic: true,
        isFavorite: false,
        totalImages: 0,
        totalVideos: 0,
      },
    ];

    await db.insert(tags).values(sampleTags);

    seedLogger.success(`✅ ${sampleTags.length} etiquetas creadas`);
  } catch (error) {
    seedLogger.error('❌ Error creando etiquetas:', error);
    throw error;
  }
}

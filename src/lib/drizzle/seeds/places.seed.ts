import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { places } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra lugares minimalistas para verificación del sistema
 */
export async function seedPlaces(db: LibSQLDatabase<Record<string, never>>) {
  seedLogger.info('📍 Creando lugares de prueba...');

  try {
    const samplePlaces = [
      {
        id: 'place-1',
        name: 'Ciudad Central',
        description: 'Centro neurálgico del mundo',
        emoji: '🏙️',
        color: '#3b82f6',
        category: 'ciudad',
        isPublic: true,
        isFavorite: true,
        totalImages: 0,
        totalVideos: 0,
        type: 'urbano',
        location: 'Lat:0,Long:0',
        climate: 'templado',
        population: '1M',
        government: 'República',
        economy: 'Tecnológica',
        culture: 'Cosmopolita',
        history: 'Fundada hace 200 años',
        geography: 'Llanura',
        landmarks: 'Torre Central',
        dangers: 'Baja',
        resources: 'Alta',
        notes: 'Lugar principal para pruebas',
        featuredImage: null,
        parentId: null,
      },
      {
        id: 'place-2',
        name: 'Bosque Antiguo',
        description: 'Bosque místico y extenso',
        emoji: '🌲',
        color: '#10b981',
        category: 'naturaleza',
        isPublic: false,
        isFavorite: false,
        totalImages: 0,
        totalVideos: 0,
        type: 'bosque',
        location: 'Lat:10,Long:10',
        climate: 'húmedo',
        population: 'Deshabitado',
        government: null,
        economy: null,
        culture: null,
        history: 'Antiguo como el mundo',
        geography: 'Boscoso',
        landmarks: 'Árbol Sagrado',
        dangers: 'Media',
        resources: 'Madera',
        notes: 'Ideal para pruebas de naturaleza',
        featuredImage: null,
        parentId: null,
      },
    ];

    await db.insert(places).values(samplePlaces);

    seedLogger.success(`✅ ${samplePlaces.length} lugares creados`);
  } catch (error) {
    seedLogger.error('❌ Error creando lugares:', error);
    throw error;
  }
}

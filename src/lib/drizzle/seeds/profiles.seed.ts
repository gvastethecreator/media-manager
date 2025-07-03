import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { profiles } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra perfiles minimalistas para verificación del sistema
 */
export async function seedProfiles(db: LibSQLDatabase<Record<string, never>>) {
  seedLogger.info('👤 Creando perfiles de prueba...');

  try {
    const sampleProfiles = [
      {
        id: 'profile-1',
        name: 'Usuario Principal',
        emoji: '🎨',
        color: '#3b82f6',
        description: 'Perfil principal del sistema',
        isActive: true,
        settingsId: null,
        imageId: null,
      },
      {
        id: 'profile-2',
        name: 'Usuario Secundario',
        emoji: '🎭',
        color: '#ef4444',
        description: 'Perfil secundario para pruebas',
        isActive: false,
        settingsId: null,
        imageId: null,
      },
    ];

    await db.insert(profiles).values(sampleProfiles);

    seedLogger.success(`✅ ${sampleProfiles.length} perfiles creados`);
  } catch (error) {
    seedLogger.error('❌ Error creando perfiles:', error);
    throw error;
  }
}

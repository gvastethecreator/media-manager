import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { workflows } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra workflows minimalistas para verificación del sistema
 */
export async function seedWorkflows(db: LibSQLDatabase<Record<string, never>>) {
  seedLogger.info('⚙️ Creando workflows de prueba...');

  try {
    const sampleWorkflows = [
      {
        id: 'workflow-1',
        name: 'Organización Básica',
        description: 'Flujo para organizar imágenes por carpeta',
        emoji: '🗂️',
        color: '#3b82f6',
        category: 'organización',
        isPublic: true,
        isFavorite: true,
        isActive: true,
        version: '1.0.0',
        config: '{"tipo":"básico"}',
        steps: '["mover","etiquetar"]',
        triggers: '["nuevo_archivo"]',
        conditions: '["si es imagen"]',
        actions: '["mover a carpeta"]',
        schedule: null,
        lastRun: null,
        nextRun: null,
        runCount: 0,
        successCount: 0,
        errorCount: 0,
      },
      {
        id: 'workflow-2',
        name: 'Clasificación Avanzada',
        description: 'Flujo para clasificar por tags y propiedades',
        emoji: '⚙️',
        color: '#8b5cf6',
        category: 'clasificación',
        isPublic: false,
        isFavorite: false,
        isActive: true,
        version: '1.1.0',
        config: '{"tipo":"avanzado"}',
        steps: '["analizar","clasificar"]',
        triggers: '["nuevo_tag"]',
        conditions: '["si tiene tag"]',
        actions: '["asignar propiedad"]',
        schedule: null,
        lastRun: null,
        nextRun: null,
        runCount: 0,
        successCount: 0,
        errorCount: 0,
      },
    ];

    await db.insert(workflows).values(sampleWorkflows);

    seedLogger.success(`✅ ${sampleWorkflows.length} workflows creados`);
  } catch (error) {
    seedLogger.error('❌ Error creando workflows:', error);
    throw error;
  }
}

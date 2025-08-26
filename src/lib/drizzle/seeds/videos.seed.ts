import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { seedLogger } from './index';

/**
 * Seed vacío para videos - base de datos limpia
 * Los videos se generarán dinámicamente al escanear carpetas
 */
export async function seedVideos(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🎥 Seeds de videos omitidas - base de datos limpia');

	// No insertar datos mockup - los videos reales se detectarán al escanear carpetas
	seedLogger.success('✅ Tabla videos lista para datos reales');
}

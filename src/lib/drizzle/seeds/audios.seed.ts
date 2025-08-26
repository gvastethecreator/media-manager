import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { seedLogger } from './index';

/**
 * Seed vacío para audios - base de datos limpia
 * Los audios se generarán dinámicamente al escanear carpetas
 */
export async function seedAudios(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🎵 Seeds de audios omitidas - base de datos limpia');

	// No insertar datos mockup - los audios reales se detectarán al escanear carpetas
	seedLogger.success('✅ Tabla audios lista para datos reales');
}

import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { seedLogger } from './index';

/**
 * Seed vacío para imágenes - base de datos limpia
 * Las imágenes se generarán dinámicamente al escanear carpetas
 */
export async function seedImages(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🖼️ Seeds de imágenes omitidas - base de datos limpia');

	// No insertar datos mockup - las imágenes reales se detectarán al escanear carpetas
	seedLogger.success('✅ Tabla imágenes lista para datos reales');
}

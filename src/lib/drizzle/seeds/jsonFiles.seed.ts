import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { seedLogger } from './index';

/**
 * Siembra archivos JSON - VACÍA
 * No se generan datos para mantener la base de datos limpia
 */
export async function seedJsonFiles(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📋 Seed jsonFiles: Sin datos (vacía por política de DB limpia)');
	// Sin inserción de datos - seed vacía
}

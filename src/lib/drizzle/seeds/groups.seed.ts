import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { seedLogger } from './index';

/**
 * Siembra grupos - VACÍA
 * No se generan datos para mantener la base de datos limpia
 */
export async function seedGroups(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('👥 Seed groups: Sin datos (vacía por política de DB limpia)');
	// Sin inserción de datos - seed vacía
}

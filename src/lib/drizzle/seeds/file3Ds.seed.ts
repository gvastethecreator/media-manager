import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { seedLogger } from './index';

/**
 * Siembra archivos 3D - VACÍA
 * No se generan datos para mantener la base de datos limpia
 */
export async function seedFile3Ds(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🎲 Seed file3Ds: Sin datos (vacía por política de DB limpia)');
	// Sin inserción de datos - seed vacía
}

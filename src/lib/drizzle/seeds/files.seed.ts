import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { files } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra archivos genéricos - VACÍA
 * No se generan datos para mantener la base de datos limpia
 */
export async function seedFiles(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📄 Seed files: Sin datos (vacía por política de DB limpia)');
	// Sin inserción de datos - seed vacía
}

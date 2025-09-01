import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { documents } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra documentos - VACÍA
 * No se generan datos para mantener la base de datos limpia
 */
export async function seedDocuments(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📄 Seed documents: Sin datos (vacía por política de DB limpia)');
	// Sin inserción de datos - seed vacía
}

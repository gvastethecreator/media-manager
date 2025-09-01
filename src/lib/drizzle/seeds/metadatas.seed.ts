import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { metadatas } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra metadatos - VACÍA
 * No se generan datos para mantener la base de datos limpia
 */
export async function seedMetadatas(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🏷️ Seed metadatas: Sin datos (vacía por política de DB limpia)');
	// Sin inserción de datos - seed vacía
}

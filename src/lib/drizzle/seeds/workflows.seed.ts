import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { workflows } from '../schema/index';
import { seedLogger } from './index';

/**
 * Siembra workflows - VACÍA
 * No se generan datos para mantener la base de datos limpia
 */
export async function seedWorkflows(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('⚙️ Seed workflows: Sin datos (vacía por política de DB limpia)');
	// Sin inserción de datos - seed vacía
}

import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { seedLogger } from './index';

/**
 * Siembra trabajos de cola - VACÍA
 * No se generan datos para mantener la base de datos limpia
 */
export async function seedQueueJobs(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('⚙️ Seed queueJobs: Sin datos (vacía por política de DB limpia)');
	// Sin inserción de datos - seed vacía
}

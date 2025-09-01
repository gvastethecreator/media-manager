import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { uploadedImages } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra imágenes subidas - VACÍA
 * No se generan datos para mantener la base de datos limpia
 */
export async function seedUploadedImages(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📤 Seed uploadedImages: Sin datos (vacía por política de DB limpia)');
	// Sin inserción de datos - seed vacía
}

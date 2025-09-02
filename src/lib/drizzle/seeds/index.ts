import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { seedFolders } from './folders.seed';

/**
 * =================================================================================
 * SISTEMA DE SEEDS PARA DRIZZLE ORM
 * =================================================================================
 * Modo limpio: SOLO carpetas. Todas las demás seeds están deshabilitadas.
 * =================================================================================
 */

// Logger simple para seeds
export const seedLogger = {
	info: (message: string, ...args: any[]) => console.log(`ℹ️ ${message}`, ...args),
	warn: (message: string, ...args: any[]) => console.warn(`⚠️ ${message}`, ...args),
	error: (message: string, ...args: any[]) => console.error(`❌ ${message}`, ...args),
	success: (message: string, ...args: any[]) => console.log(`✅ ${message}`, ...args),
};

/**
 * Función principal para ejecutar todas las seeds
 */
export async function runSeeds() {
	const client = createClient({
		url: process.env.DATABASE_URL || 'file:./db.sqlite',
	});

	const db = drizzle(client);

	try {
		seedLogger.info('🌱 Iniciando proceso de seeds para Drizzle...');

		// Ejecutar seeds en orden de dependencias
		// Carpetas (estructura de almacenamiento)
		await seedFolders(db);

		// Modo limpio: sin más entidades

		seedLogger.success('🎉 Seeds completadas exitosamente');
	} catch (error) {
		seedLogger.error('💥 Error ejecutando seeds:', error);
		throw error;
	} finally {
		(client as any).close();
	}
}

// Ejecutar seeds si este archivo se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
	runSeeds().catch(console.error);
}

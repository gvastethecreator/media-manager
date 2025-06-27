import type { PrismaClient } from '@prisma/client';

export const seedLogger = serverLogger.withContext('Seed');

/**
 * Comprueba si una tabla existe en la base de datos
 * @param prisma Cliente de Prisma
 * @param tableName Nombre de la tabla para comprobar
 * @returns true si la tabla existe, false en caso contrario
 */
export async function tableExists(prisma: PrismaClient, tableName: string): Promise<boolean> {
	try {
		// Consulta SQLite para verificar si la tabla existe
		const result = await prisma.$queryRawUnsafe<{ name: string }[]>(
			`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}';`
		);
		return result.length > 0;
	} catch (error) {
		seedLogger.error(`Error al comprobar si existe la tabla ${tableName}:`, error);
		return false;
	}
}

/**
 * Elimina registros de una tabla de forma segura
 * @param prisma Cliente de Prisma
 * @param model Nombre del modelo de Prisma
 * @param tableName Nombre de la tabla en SQLite
 */
export async function safeDeleteMany(prisma: PrismaClient, model: string, tableName: string): Promise<void> {
	try {
		// Comprobar si la tabla existe
		const exists = await tableExists(prisma, tableName);

		if (exists) {
			// La tabla existe, procedemos a eliminar
			// @ts-expect-error - Ignoramos el error de tipo ya que accedemos dinámicamente a la propiedad
			await prisma[model].deleteMany();
			seedLogger.info(`✅ Eliminados registros de ${tableName}`);
		} else {
			// La tabla no existe, lo registramos pero continuamos
			seedLogger.warn(`⚠️ La tabla ${tableName} no existe, saltando eliminación`);
		}
	} catch (error) {
		// Si hay un error, lo registramos pero continuamos con el proceso
		seedLogger.error(`Error al eliminar registros de ${tableName}:`, error);
	}
}

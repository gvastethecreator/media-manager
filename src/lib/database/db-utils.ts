/**
 * 🛠️ Utilidades para trabajar con la base de datos a través de Drizzle
 */
import { db } from '@/lib/drizzle';
import { eq } from 'drizzle-orm';
import * as schema from './schema';

type DrizzleTransactionClient = typeof db._;

/**
 * 🔄 Ejecuta una transacción de Drizzle con reintentos en caso de error
 * @param fn Función que contiene las operaciones de la transacción
 * @param maxRetries Número máximo de reintentos (por defecto: 3)
 * @param retryDelay Tiempo de espera entre reintentos en ms (por defecto: 300ms)
 */
export async function withTransaction<T>(
	fn: (tx: DrizzleTransactionClient) => Promise<T>,
	maxRetries = 3,
	retryDelay = 300
): Promise<T> {
	let retries = 0;

	while (true) {
		try {
			return await db.transaction(async (tx) => fn(tx as DrizzleTransactionClient));
		} catch (error) {
			if (retries >= maxRetries) {
				throw error;
			}

			// Esperar antes de reintentar
			await new Promise((resolve) => setTimeout(resolve, retryDelay));
			retries++;

			console.warn(`🔄 Reintentando transacción (${retries}/${maxRetries})...`);
		}
	}
}

/**
 * 🧪 Verifica la conexión a la base de datos
 * @returns True si la conexión es exitosa, false en caso contrario
 */
export async function testDatabaseConnection(): Promise<boolean> {
	try {
		// Ejecutar una consulta simple para verificar la conexión
		await db.select({ one: sql`1` }).from(schema.folders).limit(1);
		return true;
	} catch (error) {
		console.error('❌ Error al conectar con la base de datos:', error);
		return false;
	}
}

/**
 * 📊 Obtiene estadísticas básicas de la base de datos
 */
export async function getDatabaseStats() {
	const [imageCountResult, folderCountResult, tagCountResult, albumCountResult, collectionCountResult] = await Promise.all([
		db.select({ count: sql<number>`count(*)` }).from(schema.images),
		db.select({ count: sql<number>`count(*)` }).from(schema.folders),
		db.select({ count: sql<number>`count(*)` }).from(schema.tags),
		db.select({ count: sql<number>`count(*)` }).from(schema.albums),
		db.select({ count: sql<number>`count(*)` }).from(schema.collections),
	]);

	return {
		imageCount: imageCountResult[0].count,
		folderCount: folderCountResult[0].count,
		tagCount: tagCountResult[0].count,
		albumCount: albumCountResult[0].count,
		collectionCount: collectionCountResult[0].count,
		timestamp: new Date(),
	};
}

/**
 * 🧹 Limpia registros huérfanos en la base de datos
 */
export async function cleanupOrphanedRecords() {
	return withTransaction(async (tx) => {
		// Eliminar imágenes sin carpeta asociada
		const deletedImages = await tx.delete(schema.images).where(eq(schema.images.folderId, null)).execute();

		// Eliminar estadísticas de imágenes sin imagen asociada
		const deletedStats = await tx.delete(schema.imageStats).where(eq(schema.imageStats.imageId, null)).execute();

		return {
			deletedImages: deletedImages.rowsAffected,
			deletedStats: deletedStats.rowsAffected,
		};
	});
}

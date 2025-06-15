/**
 * 🛠️ Utilidades para trabajar con la base de datos a través de Prisma
 */
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

/**
 * 🔄 Ejecuta una transacción de Prisma con reintentos en caso de error
 * @param fn Función que contiene las operaciones de la transacción
 * @param maxRetries Número máximo de reintentos (por defecto: 3)
 * @param retryDelay Tiempo de espera entre reintentos en ms (por defecto: 300ms)
 */
export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  maxRetries = 3,
  retryDelay = 300
): Promise<T> {
  let retries = 0;

  while (true) {
    try {
      return await prisma.$transaction(fn);
    } catch (error) {
      if (retries >= maxRetries) {
        throw error;
      }

      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, retryDelay));
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
    await prisma.$queryRaw`SELECT 1`;
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
  const [
    imageCount,
    folderCount,
    tagCount,
    albumCount,
    collectionCount
  ] = await Promise.all([
    prisma.image.count(),
    prisma.folder.count(),
    prisma.tag.count(),
    prisma.album.count(),
    prisma.collection.count()
  ]);

  return {
    imageCount,
    folderCount,
    tagCount,
    albumCount,
    collectionCount,
    timestamp: new Date()
  };
}

/**
 * 🧹 Limpia registros huérfanos en la base de datos
 */
export async function cleanupOrphanedRecords() {
  return withTransaction(async (tx) => {
    // Eliminar imágenes sin carpeta asociada
    const deletedImages = await tx.image.deleteMany({
      where: {
        folder: null
      }
    });

    // Eliminar estadísticas de imágenes sin imagen asociada
    const deletedStats = await tx.imageStats.deleteMany({
      where: {
        image: null
      }
    });

    return {
      deletedImages: deletedImages.count,
      deletedStats: deletedStats.count
    };
  });
}
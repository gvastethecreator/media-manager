'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';

const diagnosticLogger = serverLogger.withContext('FolderDiagnostics');

/**
 * Verifica la conexión a la base de datos
 */
export async function checkDatabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    diagnosticLogger.info('🔍 Verificando conexión a la base de datos...');

    // Prueba la conexión con una consulta simple
    const result = await prisma.$queryRaw`SELECT 1 as test`;

    diagnosticLogger.info('✅ Conexión a la base de datos verificada correctamente', { result });
    return {
      success: true,
      message: 'Conexión a la base de datos establecida correctamente'
    };
  } catch (error) {
    diagnosticLogger.error('❌ Error al conectar a la base de datos', error);
    return {
      success: false,
      message: 'Error al conectar a la base de datos',
      details: error instanceof Error ? { message: error.message, name: error.name } : error
    };
  }
}

/**
 * Verifica la estructura de la tabla Folder
 */
export async function checkFolderTableStructure(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    diagnosticLogger.info('🔍 Verificando estructura de la tabla Folder...');

    // Intenta obtener el primer registro para verificar la estructura
    const folder = await prisma.folder.findFirst({
      select: {
        id: true,
        name: true,
        path: true,
        description: true,
        emoji: true,
        color: true,
        totalFiles: true,
        totalSize: true,
        lastIndexed: true,
        autoReindex: true,
        isFavorite: true,
        createdAt: true,
        updatedAt: true,
        parentId: true,
        _count: {
          select: {
            images: true,
            videos: true,
            children: true
          }
        }
      }
    });

    diagnosticLogger.info('✅ Estructura de la tabla Folder verificada correctamente',
      folder ? { id: folder.id, name: folder.name } : { noRecords: true });

    return {
      success: true,
      message: folder
        ? 'Estructura de la tabla Folder verificada correctamente'
        : 'La tabla Folder está vacía, pero la estructura parece correcta',
      details: folder ? { recordFound: true, id: folder.id } : { recordFound: false }
    };
  } catch (error) {
    diagnosticLogger.error('❌ Error al verificar la estructura de la tabla Folder', error);
    return {
      success: false,
      message: 'Error al verificar la estructura de la tabla Folder',
      details: error instanceof Error ? { message: error.message, name: error.name } : error
    };
  }
}

/**
 * Cuenta registros en tablas principales para diagnóstico
 */
export async function countRecordsInTables(): Promise<{
  success: boolean;
  message: string;
  counts?: Record<string, number>;
  details?: any;
}> {
  try {
    diagnosticLogger.info('🔍 Contando registros en tablas principales...');

    const [
      folderCount,
      imageCount,
      videoCount
    ] = await Promise.all([
      prisma.folder.count(),
      prisma.image.count(),
      prisma.video.count()
    ]);

    const counts = {
      folder: folderCount,
      image: imageCount,
      video: videoCount
    };

    diagnosticLogger.info('✅ Conteo de registros completado', counts);

    return {
      success: true,
      message: 'Conteo de registros completado',
      counts
    };
  } catch (error) {
    diagnosticLogger.error('❌ Error al contar registros en tablas', error);
    return {
      success: false,
      message: 'Error al contar registros en tablas',
      details: error instanceof Error ? { message: error.message, name: error.name } : error
    };
  }
}

/**
 * Ejecuta todas las verificaciones de diagnóstico
 */
export async function runAllDiagnostics(): Promise<{
  connection: Awaited<ReturnType<typeof checkDatabaseConnection>>;
  structure: Awaited<ReturnType<typeof checkFolderTableStructure>>;
  counts: Awaited<ReturnType<typeof countRecordsInTables>>;
  overallSuccess: boolean;
}> {
  diagnosticLogger.info('🔍 Iniciando diagnóstico completo...');

  const connection = await checkDatabaseConnection();

  // Si no hay conexión, no seguimos con las demás pruebas
  if (!connection.success) {
    return {
      connection,
      structure: {
        success: false,
        message: 'No se pudo verificar la estructura porque no hay conexión a la base de datos'
      },
      counts: {
        success: false,
        message: 'No se pudieron contar registros porque no hay conexión a la base de datos'
      },
      overallSuccess: false
    };
  }

  const structure = await checkFolderTableStructure();
  const counts = await countRecordsInTables();

  const overallSuccess = connection.success && structure.success && counts.success;

  diagnosticLogger.info('✅ Diagnóstico completo finalizado', {
    overallSuccess,
    connectionOk: connection.success,
    structureOk: structure.success,
    countsOk: counts.success
  });

  return {
    connection,
    structure,
    counts,
    overallSuccess
  };
}
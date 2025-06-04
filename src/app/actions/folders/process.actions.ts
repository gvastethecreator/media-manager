'use server';

/**
 * @file Process actions for folders
 * @module app/actions/folders/process.actions
 */

import { scanFolder } from '@/lib/folder-scanner';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { formatBytes } from '@/lib/utils/format.utils';
import { revalidatePath } from 'next/cache';
import PQueue from 'p-queue';
import {
    FOLDER_ERROR_CODES,
    FolderResponse,
    IndexOptions,
    ProcessStatus,
    ReindexOptions,
    createFolderError
} from './folder-types';

// Logger for process actions
const folderLogger = serverLogger.withContext('FolderProcessActions');

// Paths to revalidate when folder content changes
const REVALIDATE_PATHS = [
  '/folders',
  '/images',
  '/dashboard',
  '/api/folders',
  '/api/images',
];

// Configuración predeterminada para procesamiento por lotes
const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_MAX_CONCURRENT = 3;

/**
 * Revalidates all folder-related paths
 */
async function revalidateFolderPaths() {
  folderLogger.info('🔄 Revalidando rutas de carpetas');
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

/**
 * Crear un error de procesamiento de carpetas (enfoque funcional)
 */
function createProcessError(
  message: string,
  code: string = FOLDER_ERROR_CODES.UNEXPECTED_ERROR,
  cause?: unknown
) {
  return createFolderError(
    message,
    code as FOLDER_ERROR_CODES,
    cause instanceof Error ? cause.stack : undefined,
    undefined,
    cause
  );
}

/**
 * Procesa un lote de imágenes para una carpeta
 * @param folderId ID de la carpeta
 * @param imagePaths Rutas de imágenes a procesar
 * @returns Resultado del procesamiento
 */
async function processImageBatch(folderId: string, imagePaths: string[]): Promise<{processed: number, errors: number}> {
  let processed = 0;
  let errors = 0;

  // Crear transacción para operaciones CRUD masivas
  const operations = imagePaths.map(imagePath => {
    try {
      // Extraer nombre de archivo desde la ruta, compatible con Windows y Unix
      const name = imagePath.split(/[\/\\]/).pop() || '';

      folderLogger.debug(`Procesando imagen: ${imagePath}`);

      return prisma.image.upsert({
        where: { path: imagePath },
        create: {
          path: imagePath,
          name: name,
          folderId,
          status: 'PENDING',
        },
        update: {
          folderId,
          status: 'PENDING',
        },
      }).then(() => {
        processed++;
        return true;
      }).catch((error) => {
        folderLogger.error(`Error procesando imagen ${imagePath}:`, error);
        errors++;
        return false;
      });
    } catch (error) {
      folderLogger.error(`Error preparando operación para ${imagePath}:`, error);
      errors++;
      return Promise.resolve(false);
    }
  });

  // Ejecutar todas las operaciones concurrentemente
  await Promise.allSettled(operations);

  folderLogger.info(`Procesamiento de lote completado: ${processed} exitosas, ${errors} errores`);
  return { processed, errors };
}

/**
 * Divide un array en lotes del tamaño especificado
 * @param array Array a dividir
 * @param batchSize Tamaño de cada lote
 * @returns Array de lotes
 */
function chunkArray<T>(array: T[], batchSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    chunks.push(array.slice(i, i + batchSize));
  }
  return chunks;
}

/**
 * Indexes a folder and updates its content in the database
 * @param id ID de la carpeta
 * @param options Opciones de indexación
 */
export async function indexFolder(id: string, options?: IndexOptions): Promise<ProcessStatus> {
  // Configuración por defecto
  const batchSize = options?.batchSize || DEFAULT_BATCH_SIZE;
  const maxConcurrent = options?.maxConcurrent || DEFAULT_MAX_CONCURRENT;
  const onProgress = options?.onProgress;

  try {
    folderLogger.info('📂 Iniciando indexación de carpeta:', id);

    // Obtener carpeta
    const folder = await prisma.folder.findUnique({
      where: { id },
    });

    if (!folder) {
      throw createProcessError('Carpeta no encontrada', FOLDER_ERROR_CODES.NOT_FOUND);
    }

    // Escanear contenido de carpeta
    folderLogger.info('🔍 Escaneando carpeta:', folder.path);
    const scanStart = Date.now();
    const scanResult = await scanFolder(folder.path, {
      recursive: options?.recursive ?? true,
      includeHidden: options?.includeHidden ?? false
    });
    const scanDuration = Date.now() - scanStart;

    folderLogger.info(`✅ Carpeta escaneada en ${scanDuration}ms:`, {
      totalFiles: scanResult.totalFiles,
      totalImages: scanResult.images.length
    });

    // Notificar progreso después de escaneo
    if (onProgress) {
      onProgress({
        status: 'Carpeta escaneada, procesando imágenes...',
        progress: 10,
        phase: 'scan',
        filesProcessed: 0,
        totalFiles: scanResult.images.length,
        processingSpeed: scanResult.totalFiles / (scanDuration / 1000)
      });
    }

    // Actualizar carpeta con resultados del escaneo
    await prisma.folder.update({
      where: { id },
      data: {
        lastIndexed: new Date(),
        totalFiles: scanResult.totalFiles,
        totalSize: scanResult.totalSize,
        status: 'INDEXING',
      },
    });

    // Procesar imágenes encontradas - extraer paths de FileInfo objects
    const imagePaths = scanResult.images.map(fileInfo => {
      // Verificar si fileInfo es un objeto con propiedad path
      if (fileInfo && typeof fileInfo === 'object' && 'path' in fileInfo) {
        return fileInfo.path;
      } else if (typeof fileInfo === 'string') {
        return fileInfo;
      } else {
        folderLogger.warn('⚠️ Formato de imagen no válido en scanResult:', fileInfo);
        return null; // Será filtrado a continuación
      }
    }).filter(Boolean); // Filtrar valores nulos
    const batchSize = options?.batchSize || DEFAULT_BATCH_SIZE;
    const batches = chunkArray(imagePaths, batchSize);
    let totalProcessed = 0;
    let totalErrors = 0;

    // Procesar lotes de imágenes en paralelo con límite de concurrencia
    folderLogger.info(`🖼️ Procesando ${scanResult.images.length} imágenes en ${batches.length} lotes`);
    const startTime = Date.now();

    // Para control de concurrencia
    let activePromises = 0;
    let nextChunkIndex = 0;
    const results: {processed: number, errors: number}[] = [];

    // Función para lanzar el próximo lote
    const launchNextBatch = async () => {
      if (nextChunkIndex >= batches.length) return;

      const chunkIndex = nextChunkIndex++;
      const chunk = batches[chunkIndex];
      activePromises++;

      try {
        // Notificar progreso de procesamiento
        if (onProgress) {
          const elapsed = Date.now() - startTime;
          const processedSoFar = totalProcessed;
          const speed = elapsed > 0 ? (processedSoFar / (elapsed / 1000)) : 0;
          const remaining = scanResult.images.length - processedSoFar;
          const estimatedTimeRemaining = speed > 0 ? remaining / speed : 0;

          onProgress({
            status: `Procesando lote ${chunkIndex + 1}/${batches.length}...`,
            progress: Math.round((totalProcessed / scanResult.images.length) * 90) + 10, // 10-100%
            phase: 'index',
            filesProcessed: totalProcessed,
            totalFiles: scanResult.images.length,
            processingSpeed: speed,
            estimatedTimeRemaining: estimatedTimeRemaining
          });
        }

        // Procesar el lote actual
        folderLogger.debug(`Procesando lote ${chunkIndex + 1}/${batches.length} (${chunk.length} imágenes)`);
        const result = await processImageBatch(folder.id, chunk);

        // Actualizar contadores
        totalProcessed += result.processed;
        totalErrors += result.errors;
        results.push(result);

      } catch (error) {
        folderLogger.error(`Error procesando lote ${chunkIndex + 1}:`, error);
        totalErrors += chunk.length;
      } finally {
        activePromises--;
        // Verificar si podemos lanzar más lotes
        if (activePromises < maxConcurrent) {
          await launchNextBatch();
        }
      }
    };

    // Iniciar procesamiento paralelo con límite de concurrencia
    const initialBatches = Math.min(maxConcurrent, batches.length);
    const initialPromises = [];

    for (let i = 0; i < initialBatches; i++) {
      initialPromises.push(launchNextBatch());
    }

    // Esperar a que todos los lotes terminen
    await Promise.all(initialPromises);

    // Esperar a que se completen todos los lotes restantes
    while (activePromises > 0 || nextChunkIndex < batches.length) {
      if (activePromises < maxConcurrent && nextChunkIndex < batches.length) {
        await launchNextBatch();
      } else {
        // Pequeña pausa para evitar CPU spinning
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // Actualizar estado final de la carpeta
    await prisma.folder.update({
      where: { id },
      data: {
        status: 'INDEXED',
      },
    });

    // Calcular estadísticas finales
    const totalDuration = Date.now() - startTime;
    const processingSpeed = totalProcessed / (totalDuration / 1000);

    await revalidateFolderPaths();

    folderLogger.info('✅ Indexación de carpeta completada con éxito:', {
      id,
      totalFiles: scanResult.totalFiles,
      totalImages: scanResult.images.length,
      imagesProcessed: totalProcessed,
      errors: totalErrors,
      duration: `${(totalDuration / 1000).toFixed(2)}s`,
      speed: `${processingSpeed.toFixed(2)} img/s`
    });

    // Notificar finalización
    if (onProgress) {
      onProgress({
        status: 'Indexación completada',
        progress: 100,
        phase: 'complete',
        filesProcessed: totalProcessed,
        totalFiles: scanResult.images.length,
        processingSpeed
      });
    }

    return {
      success: true,
      message: `Carpeta indexada con éxito. Encontrados ${scanResult.totalFiles} archivos y procesadas ${totalProcessed} imágenes.`,
      filesProcessed: totalProcessed,
      totalFiles: scanResult.images.length,
      totalErrors: totalErrors,
      processingSpeed
    };
  } catch (error) {
    folderLogger.error('❌ Error indexando carpeta:', error);

    // Notificar error
    if (onProgress) {
      onProgress({
        status: 'Error en indexación',
        progress: 0,
        phase: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }

    throw createProcessError(
      'Error al indexar carpeta',
      error instanceof Error ? error.message : FOLDER_ERROR_CODES.INDEXING_FAILED,
      error
    );
  }
}

/**
 * Reindexes all folders marked for auto-reindexing
 */
export async function reindexAutoFolders(options?: IndexOptions): Promise<ProcessStatus> {
  try {
    folderLogger.info('🔄 Iniciando reindexación automática de carpetas');

    const folders = await prisma.folder.findMany({
      where: {
        autoReindex: true,
      },
    });

    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalErrors = 0;

    for (const folder of folders) {
      try {
        await indexFolder(folder.id, options);
        totalSuccess++;
      } catch (error) {
        totalErrors++;
        folderLogger.error('❌ Error reindexando carpeta:', {
          folderId: folder.id,
          error,
        });
      }
      totalProcessed++;

      // Notificar progreso si hay callback
      if (options?.onProgress) {
        options.onProgress({
          status: `Reindexando carpetas (${totalProcessed}/${folders.length})`,
          progress: Math.round((totalProcessed / folders.length) * 100),
          phase: 'index',
          filesProcessed: totalProcessed,
          totalFiles: folders.length
        });
      }
    }

    await revalidateFolderPaths();

    folderLogger.info('✅ Reindexación automática completada:', {
      totalProcessed,
      totalSuccess,
      totalErrors,
    });

    return {
      success: true,
      message: `Reindexación completada. Procesadas ${totalProcessed} carpetas: ${totalSuccess} exitosas, ${totalErrors} con errores.`,
    };
  } catch (error) {
    folderLogger.error('❌ Error durante la reindexación automática:', error);
    throw createProcessError('Error en reindexación automática', FOLDER_ERROR_CODES.INDEXING_FAILED, error);
  }
}

/**
 * 🆕 Reindexes ALL folders in the system (regardless of auto-reindex setting)
 * This is the function that should be used for global reindexing operations
 */
export async function reindexAllFoldersInSystem(options?: IndexOptions): Promise<ProcessStatus> {
  try {
    folderLogger.info('🔄 Iniciando reindexación de TODAS las carpetas del sistema');

    // Obtener TODAS las carpetas, no solo las marcadas para auto-reindex
    const folders = await prisma.folder.findMany({
      select: {
        id: true,
        name: true,
        path: true,
        autoReindex: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    if (folders.length === 0) {
      folderLogger.info('⚠️ No hay carpetas para reindexar');
      return {
        success: true,
        message: 'No hay carpetas para reindexar',
      };
    }

    folderLogger.info(`📁 Procesando ${folders.length} carpetas del sistema`);

    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalErrors = 0;
    const errors: Array<{ folderId: string; error: string }> = [];

    for (const folder of folders) {
      try {
        folderLogger.info(`🔄 Reindexando carpeta: ${folder.name} (${totalProcessed + 1}/${folders.length})`);

        await reindexFolder(folder.id, {
          ...options,
          deleteOrphans: true, // Limpiar huérfanos por defecto en reindexación global
          onProgress: (status) => {
            // Re-emitir progreso si hay callback externo
            if (options?.onProgress) {
              options.onProgress({
                ...status,
                status: `${folder.name}: ${status.status}`,
              });
            }
          },
        });

        totalSuccess++;
        folderLogger.info(`✅ Carpeta "${folder.name}" reindexada exitosamente`);
      } catch (error) {
        totalErrors++;
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        errors.push({ folderId: folder.id, error: errorMessage });

        folderLogger.error('❌ Error reindexando carpeta:', {
          folderId: folder.id,
          folderName: folder.name,
          error: errorMessage,
        });
      }

      totalProcessed++;

      // Notificar progreso global si hay callback
      if (options?.onProgress) {
        options.onProgress({
          status: `Reindexando todas las carpetas (${totalProcessed}/${folders.length})`,
          progress: Math.round((totalProcessed / folders.length) * 100),
          phase: 'index',
          filesProcessed: totalProcessed,
          totalFiles: folders.length,
          folderId: folder.id,
        });
      }
    }

    await revalidateFolderPaths();

    const summaryMessage = `Reindexación global completada. Procesadas ${totalProcessed} carpetas: ${totalSuccess} exitosas, ${totalErrors} con errores.`;

    folderLogger.info('✅ Reindexación global completada:', {
      totalProcessed,
      totalSuccess,
      totalErrors,
      folders: folders.map(f => ({ id: f.id, name: f.name })),
      errors,
    });

    return {
      success: totalErrors === 0,
      message: summaryMessage,
      processedFolders: totalProcessed,
      totalFolders: folders.length,
      errors: totalErrors > 0 ? errors : undefined,
    };
  } catch (error) {
    folderLogger.error('❌ Error durante la reindexación global:', error);
    throw createProcessError('Error en reindexación global de todas las carpetas', FOLDER_ERROR_CODES.INDEXING_FAILED, error);
  }
}

/**
 * Validates a folder path exists and is accessible
 */
export async function validateFolderPath(path: string): Promise<ProcessStatus> {
  try {
    folderLogger.info('🔍 Validando ruta de carpeta:', path);

    const scanResult = await scanFolder(path);

    folderLogger.info('✅ Ruta de carpeta validada:', {
      path,
      accessible: true,
      totalFiles: scanResult.totalFiles,
    });

    return {
      success: true,
      message: `La carpeta es accesible y contiene ${scanResult.totalFiles} archivos.`,
    };
  } catch (error) {
    folderLogger.error('❌ Error validando ruta de carpeta:', error);
    throw createProcessError('Error al validar ruta de carpeta', FOLDER_ERROR_CODES.PATH_INVALID, error);
  }
}

/**
 * Repairs folder statistics and relationships
 */
export async function repairFolder(id: string): Promise<ProcessStatus> {
  try {
    folderLogger.info('🔧 Iniciando reparación de carpeta:', id);

    // Obtener carpeta
    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        images: true,
      },
    });

    if (!folder) {
      throw createProcessError('Carpeta no encontrada', FOLDER_ERROR_CODES.NOT_FOUND);
    }

    // Escanear contenido de carpeta
    const scanResult = await scanFolder(folder.path);

    // Actualizar estadísticas de carpeta
    await prisma.folder.update({
      where: { id },
      data: {
        totalFiles: scanResult.totalFiles,
        totalSize: scanResult.totalSize,
        status: 'ACTIVE',
      },
    });

    // Eliminar imágenes que ya no existen
    const existingPaths = new Set(scanResult.images);
    const removedImages = folder.images.filter(img => !existingPaths.has(img.path));

    if (removedImages.length > 0) {
      // Dividir en lotes para mejor rendimiento en grandes colecciones
      const deleteChunks = chunkArray(removedImages.map(img => img.id), DEFAULT_BATCH_SIZE);

      for (const chunk of deleteChunks) {
        await prisma.image.deleteMany({
          where: {
            id: {
              in: chunk,
            },
          },
        });
      }
    }

    await revalidateFolderPaths();

    folderLogger.info('✅ Reparación de carpeta completada:', {
      id,
      removedImages: removedImages.length,
      updatedStats: {
        totalFiles: scanResult.totalFiles,
        totalSize: scanResult.totalSize,
      },
    });

    return {
      success: true,
      message: `Reparación completada. Eliminadas ${removedImages.length} imágenes inválidas y actualizadas estadísticas.`,
    };
  } catch (error) {
    folderLogger.error('❌ Error reparando carpeta:', error);
    throw createProcessError('Error al reparar carpeta', FOLDER_ERROR_CODES.UNEXPECTED_ERROR, error);
  }
}

/**
 * Reindexes a folder, with additional options for thorough reindexing
 * @param id ID of the folder to reindex
 * @param options Additional options for reindexing
 */
export async function reindexFolder(id: string, options?: ReindexOptions): Promise<FolderResponse> {
  try {
    folderLogger.info('🔄 Iniciando reindexación de carpeta:', id);

    // Obtener carpeta
    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        images: options?.deleteOrphans,
      },
    });

    if (!folder) {
      throw createProcessError('Carpeta no encontrada', FOLDER_ERROR_CODES.NOT_FOUND);
    }

    folderLogger.info('📂 Reindexando carpeta:', {
      id,
      path: folder.path,
      options: {
        deleteOrphans: options?.deleteOrphans || false,
        forceScan: options?.forceScan || false,
        processMetadata: options?.processMetadata || false,
      },
    });

    // Notificar inicio del proceso
    if (options?.onProgress) {
      options.onProgress({
        status: 'Iniciando reindexación',
        progress: 0,
        folderId: id,
        phase: 'prepare',
      });
    }

    // Escanear carpeta
    const scanResult = await scanFolder(folder.path, {
      includeHidden: options?.includeHidden,
      recursive: options?.recursive,
    });

    // Notificar que terminó el escaneo
    if (options?.onProgress) {
      options.onProgress({
        status: 'Escaneo completado',
        progress: 10,
        folderId: id,
        phase: 'scan',
        totalFiles: scanResult.totalFiles,
      });
    }

    // Si se solicita eliminación de huérfanos
    if (options?.deleteOrphans && folder.images) {
      // Crear un Set con los paths de las imágenes encontradas en el sistema de archivos
      const existingPaths = new Set(scanResult.images.map(fileInfo => {
        // Verificar si fileInfo es un objeto con propiedad path
        if (fileInfo && typeof fileInfo === 'object' && 'path' in fileInfo) {
          return fileInfo.path;
        } else if (typeof fileInfo === 'string') {
          return fileInfo;
        }
        return null; // Será filtrado a continuación
      }).filter(Boolean));

      const orphanedImages = folder.images.filter(img => !existingPaths.has(img.path));

      if (orphanedImages.length > 0) {
        folderLogger.info('🗑️ Eliminando imágenes huérfanas:', {
          count: orphanedImages.length,
          folderId: id,
        });

        // Notificar limpieza
        if (options.onProgress) {
          options.onProgress({
            status: `Eliminando ${orphanedImages.length} imágenes huérfanas`,
            progress: 20,
            folderId: id,
            phase: 'cleanup',
          });
        }

        // Eliminar en lotes para mejor rendimiento
        const deleteChunks = chunkArray(orphanedImages.map(img => img.id), options.batchSize || DEFAULT_BATCH_SIZE);

        for (const [index, chunk] of deleteChunks.entries()) {
          await prisma.image.deleteMany({
            where: {
              id: {
                in: chunk,
              },
            },
          });

          // Actualizar progreso de limpieza
          if (options.onProgress) {
            const cleanupProgress = 20 + Math.floor((index / deleteChunks.length) * 10);
            options.onProgress({
              status: `Limpieza en progreso (${index + 1}/${deleteChunks.length})`,
              progress: cleanupProgress,
              folderId: id,
              phase: 'cleanup',
            });
          }
        }
      }
    }

    // Procesar imágenes encontradas - extraer paths de FileInfo objects
    const imagePaths = scanResult.images.map(fileInfo => {
      // Verificar si fileInfo es un objeto con propiedad path
      if (fileInfo && typeof fileInfo === 'object' && 'path' in fileInfo) {
        return fileInfo.path;
      } else if (typeof fileInfo === 'string') {
        return fileInfo;
      } else {
        folderLogger.warn('⚠️ Formato de imagen no válido en scanResult:', fileInfo);
        return null; // Será filtrado a continuación
      }
    }).filter(Boolean); // Filtrar valores nulos
    const batchSize = options?.batchSize || DEFAULT_BATCH_SIZE;
    const batches = chunkArray(imagePaths, batchSize);

    // Configurar procesamiento concurrente
    const maxConcurrent = options?.maxConcurrent || 3;
    let completedBatches = 0;
    let totalProcessed = 0;
    let totalErrors = 0;

    folderLogger.info('🔄 Iniciando procesamiento de imágenes:', {
      totalImages: imagePaths.length,
      batches: batches.length,
      batchSize,
      maxConcurrent,
    });

    // Procesar lotes en paralelo con límite de concurrencia
    const processBatch = async (batch: string[]): Promise<void> => {
      const result = await processImageBatch(id, batch);
      totalProcessed += result.processed;
      totalErrors += result.errors;
      completedBatches++;

      // Calcular progreso y notificar
      if (options?.onProgress) {
        const indexProgress = 30 + Math.floor((completedBatches / batches.length) * 70);
        options.onProgress({
          status: `Procesando imágenes (${completedBatches}/${batches.length} lotes)`,
          progress: indexProgress,
          folderId: id,
          phase: 'index',
          filesProcessed: totalProcessed,
          totalFiles: imagePaths.length,
          errors: result.errors > 0 ? [{
            file: 'batch',
            error: `${result.errors} errores en este lote`,
            timestamp: Date.now()
          }] : undefined,
        });
      }
    };

    // Procesar lotes con control de concurrencia
    const queue = new PQueue({ concurrency: maxConcurrent });
    await Promise.all(batches.map(batch => queue.add(() => processBatch(batch))));

    // Actualizar estadísticas de la carpeta
    await prisma.folder.update({
      where: { id },
      data: {
        totalFiles: scanResult.totalFiles,
        totalSize: scanResult.totalSize,
        lastIndexed: new Date(),
      },
    });

    await revalidateFolderPaths();

    // Notificar finalización
    const result: FolderResponse = {
      id: id,
      name: folder.name,
      path: folder.path,
      totalFiles: scanResult.totalFiles,
      totalSize: scanResult.totalSize,
      lastIndexed: new Date().toISOString(),
      createdAt: folder.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
      success: true,
      stats: {
        processed: totalProcessed,
        total: scanResult.totalFiles,
        totalSize: scanResult.totalSize
      }
    };

    folderLogger.info('✅ Reindexación completada:', {
      id,
      path: folder.path,
      processed: totalProcessed,
      errors: totalErrors,
      totalFiles: scanResult.totalFiles,
      totalSize: formatBytes(scanResult.totalSize),
    });

    return result;
  } catch (error) {
    folderLogger.error('❌ Error en reindexación de carpeta:', {
      id,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });

    throw createProcessError(
      'Error al reindexar carpeta',
      error instanceof Error ? error.message : FOLDER_ERROR_CODES.INDEXING_FAILED,
      error
    );
  }
}
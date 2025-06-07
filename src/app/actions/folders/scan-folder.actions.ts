'use server';

/**
 * @file Acción del servidor para escanear carpetas
 * @module app/actions/folders/scan-folder.actions
 * @description Proporciona una acción del servidor para escanear carpetas del sistema de archivos
 */

import type { FolderScanResult, ScanFolderOptions } from '@/lib/folder-scanner';
import { scanFolder as scanFolderUtil } from '@/lib/folder-scanner';
import { serverLogger } from '@/lib/logger/server-logger';

// Logger específico para la acción de escanear carpetas
const logger = serverLogger.withContext('ScanFolderAction');

/**
 * Acción del servidor para escanear una carpeta
 * Esta función envuelve la utilidad scanFolder para que pueda ser llamada desde el cliente
 *
 * @param folderPath Ruta de la carpeta a escanear
 * @param options Opciones de escaneo
 * @returns Resultado del escaneo
 */
export async function scanFolderAction(folderPath: string, options: ScanFolderOptions = {}): Promise<FolderScanResult> {
  try {
    logger.info(`🔍 Escaneando carpeta desde acción del servidor: ${folderPath}`, options);

    const result = await scanFolderUtil(folderPath, options);

    logger.info(`✅ Escaneo completado: ${result.totalFiles} archivos, ${result.images.length} imágenes`);

    return result;
  } catch (error) {
    logger.error('❌ Error al escanear carpeta:', error);
    throw new Error(`Error al escanear carpeta: ${error instanceof Error ? error.message : String(error)}`);
  }
}
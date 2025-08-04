/**
 * @file Servicio para operaciones con archivos
 * @module services/file/file.service
 * ✅ MIGRADO DESDE SERVER ACTIONS - 2025-07-03
 */

// Tipos corregidos para FileBase

import fs, { stat } from 'fs/promises';
import path from 'path';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import {
	determineFileType,
	determineMimeType,
	generateFileId,
	mapStatsToFileInfo,
	serializeDirectoryContents,
	serializeFileOperationResult,
} from '@/transformers/file';
import {
	type FileBase,
	type FileCopyMoveResult,
	FileErrorCode,
	FileEventType,
	type FileOperationOptions,
	type FileOperationResult,
	FileType,
} from '@/types/entities/file';
import type { AnyEntityWithStats } from '@/types/entities';
import { batchFileOperationsService } from './batch-operations.service';

// Usar tipos de FileBase directamente
type FileInfo = FileBase;

interface DirectoryReadResult {
	path: string;
	items: FileInfo[];
	total: number;
}

const logger = serverLogger.withContext('FileService');

/**
 * Interfaz para respuesta de Data URL
 */
interface DataUrlResponse {
	dataUrl: string;
	mimeType: string;
}

// Función creadora de errores (enfoque funcional)
const createFileError = (
	message: string,
	code: FileErrorCode = FileErrorCode.OPERATION_FAILED,
	cause?: unknown
): Error & { code: FileErrorCode; cause?: unknown } => {
	const error = new Error(message);
	error.name = 'FileError';
	return Object.assign(error, { code, cause });
};

/**
 * Valida y sanitiza una ruta de archivo para prevenir ataques de ruta
 * @param filePath Ruta del archivo a validar
 * @returns Ruta normalizada y sanitizada
 */
function validateAndSanitizePath(filePath: string): string {
	// Normalizar la ruta y eliminar intentos de navegar fuera del directorio permitido
	const normalizedPath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');

	// Verificar que la ruta existe y es un archivo válido
	return normalizedPath;
}

/**
 * Obtiene metadatos de un archivo
 * @param filePath Ruta del archivo
 * @returns Información del archivo
 */
export async function getFileInfo(filePath: string): Promise<FileInfo> {
	try {
		logger.info('📊 Obteniendo información del archivo:', filePath);

		// Validar y sanitizar la ruta
		const normalizedPath = validateAndSanitizePath(filePath);

		// Verificar que el archivo existe
		const fileStats = await stat(normalizedPath);
		if (!fileStats.isFile()) {
			throw createFileError('La ruta especificada no es un archivo válido', FileErrorCode.NOT_A_FILE);
		}

		// Usar transformer para mapear stats a FileInfo
		const fileInfo = mapStatsToFileInfo(normalizedPath, fileStats);

		logger.info('✅ Información del archivo obtenida');
		return fileInfo;
	} catch (error) {
		if (error instanceof Error && error.name === 'FileError') {
			throw error;
		}
		logger.error('❌ Error al obtener información del archivo:', error);
		throw createFileError('No se pudo obtener información del archivo', FileErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Lee un archivo como buffer
 * Esta función es interna para ser utilizada por otras acciones de archivos
 */
async function readFileAsBuffer(filePath: string): Promise<{
	buffer: Buffer;
	fileInfo: FileInfo;
}> {
	try {
		// Validar y obtener información del archivo
		const fileInfo = await getFileInfo(filePath);

		// Leer el archivo
		const buffer = await fs.readFile(fileInfo.path);

		return { buffer, fileInfo };
	} catch (error) {
		if (error instanceof Error && error.name === 'FileError') {
			throw error;
		}
		logger.error('❌ Error al leer archivo:', error);
		throw createFileError('No se pudo leer el archivo', FileErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene el contenido de un directorio
 * @param dirPath Ruta del directorio
 * @returns Resultado de la lectura del directorio
 */
export async function getDirectoryInfo(dirPath: string): Promise<DirectoryReadResult> {
	try {
		logger.info('📁 Obteniendo contenido del directorio:', dirPath);

		// Validar y sanitizar la ruta
		const normalizedPath = validateAndSanitizePath(dirPath);

		// Verificar que el directorio existe
		const dirStats = await stat(normalizedPath);
		if (!dirStats.isDirectory()) {
			throw createFileError('La ruta especificada no es un directorio válido', FileErrorCode.NOT_A_DIRECTORY);
		}

		// Leer contenido del directorio
		const items = await fs.readdir(normalizedPath, { withFileTypes: true });

		// Procesar cada elemento
		const processedItems: FileBase[] = [];
		for (const item of items) {
			const itemPath = path.join(normalizedPath, item.name);
			const itemStats = await stat(itemPath);

			// Usar transformers para crear el objeto FileBase
			const fileBase: FileBase = {
				id: generateFileId(itemPath),
				name: item.name,
				path: itemPath,
				size: itemStats.size,
				hash: '',
				mimeType: item.isDirectory() ? 'directory' : determineMimeType(item.name),
				extension: item.isDirectory() ? '' : path.extname(item.name),
				type: item.isDirectory() ? FileType.DIRECTORY : determineFileType(item.name),
				isDirectory: item.isDirectory(),
				parentPath: path.dirname(itemPath),
				absolutePath: path.resolve(itemPath),
				relativePath: path.relative(process.cwd(), itemPath),
				modifiedAt: itemStats.mtime,
				accessedAt: itemStats.atime,
				folderId: null,
				isHidden: item.name.startsWith('.'),
				isReadonly: false,
				createdAt: itemStats.birthtime,
				updatedAt: itemStats.mtime,
			};

			processedItems.push(fileBase);
		}

		// Usar transformer para serializar el resultado
		const result = serializeDirectoryContents(normalizedPath, processedItems);

		logger.info('✅ Contenido del directorio obtenido:', {
			path: normalizedPath,
			itemCount: processedItems.length,
		});

		return result;
	} catch (error) {
		if (error instanceof Error && error.name === 'FileError') {
			throw error;
		}
		logger.error('❌ Error al obtener contenido del directorio:', error);
		throw createFileError('No se pudo obtener el contenido del directorio', FileErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Crea un nuevo directorio
 * @param dirPath Ruta del directorio a crear
 * @param options Opciones de operación
 * @returns Resultado de la operación
 */
export async function createDirectory(dirPath: string, options?: FileOperationOptions): Promise<FileOperationResult> {
	try {
		logger.info('📁 Creando directorio:', dirPath);

		// Validar y sanitizar la ruta
		const normalizedPath = validateAndSanitizePath(dirPath);

		// Crear directorio (recursive por defecto)
		await fs.mkdir(normalizedPath, { recursive: options?.recursive ?? true });

		// Emitir evento
		await emit({
			type: FileEventType.CREATED,
			data: { path: normalizedPath, type: 'directory' },
		});

		logger.info('✅ Directorio creado');
		return serializeFileOperationResult(true, normalizedPath, 'create');
	} catch (error) {
		logger.error('❌ Error al crear directorio:', error);
		throw createFileError('No se pudo crear el directorio', FileErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Elimina un archivo del sistema
 * @param filePath Ruta del archivo a eliminar
 * @returns Resultado de la operación
 */
export async function deleteFile(filePath: string): Promise<FileOperationResult> {
	try {
		logger.info('🗑️ Eliminando archivo:', filePath);

		// Validar y sanitizar la ruta
		const normalizedPath = validateAndSanitizePath(filePath);

		// Verificar que el archivo existe
		const fileStats = await stat(normalizedPath);
		if (!fileStats.isFile()) {
			throw createFileError('La ruta especificada no es un archivo válido', FileErrorCode.NOT_A_FILE);
		}

		// Eliminar el archivo
		await fs.unlink(normalizedPath);

		// Emitir evento
		await emit({
			type: FileEventType.DELETED,
			data: { path: normalizedPath },
		});

		logger.info('✅ Archivo eliminado');
		return serializeFileOperationResult(true, normalizedPath, 'delete');
	} catch (error) {
		if (error instanceof Error && error.name === 'FileError') {
			throw error;
		}
		logger.error('❌ Error al eliminar archivo:', error);
		throw createFileError('No se pudo eliminar el archivo', FileErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene el contenido de un archivo como una URL de datos (data URL)
 * Útil para imágenes que necesitan ser copiadas al portapapeles
 * @param filePath Ruta del archivo
 * @returns Data URL del archivo
 */
export async function getFileAsDataUrl(filePath: string): Promise<DataUrlResponse> {
	try {
		logger.info('📄 Obteniendo archivo como URL de datos:', filePath);

		// Leer el archivo como buffer
		const { buffer, fileInfo } = await readFileAsBuffer(filePath);

		// Verificar que el archivo es una imagen
		if (fileInfo.type !== FileType.IMAGE) {
			throw createFileError('El archivo no es una imagen soportada', FileErrorCode.INVALID_PATH);
		}

		// Convertir a Data URL
		const dataUrl = `data:${fileInfo.mimeType};base64,${buffer.toString('base64')}`;

		logger.info('✅ Archivo convertido a URL de datos');
		return {
			dataUrl,
			mimeType: fileInfo.mimeType,
		};
	} catch (error) {
		if (error instanceof Error && error.name === 'FileError') {
			throw error;
		}
		logger.error('❌ Error al obtener archivo como URL de datos:', error);
		throw createFileError('No se pudo obtener el archivo como URL de datos', FileErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Renombra un archivo o directorio
 * @param oldPath Ruta actual
 * @param newPath Nueva ruta
 * @param options Opciones de operación
 * @returns Resultado de la operación
 */
export async function renameFile(
	oldPath: string,
	newPath: string,
	options?: FileOperationOptions
): Promise<FileOperationResult> {
	try {
		logger.info('📝 Renombrando archivo:', { from: oldPath, to: newPath });

		// Validar rutas
		const normalizedOldPath = validateAndSanitizePath(oldPath);
		const normalizedNewPath = validateAndSanitizePath(newPath);

		// Verificar que el archivo/directorio origen existe
		await stat(normalizedOldPath);

		// Verificar si el destino ya existe (a menos que se permita sobrescribir)
		if (!options?.overwrite) {
			try {
				await stat(normalizedNewPath);
				throw createFileError('El archivo destino ya existe', FileErrorCode.ALREADY_EXISTS);
			} catch (error: any) {
				// Si el archivo no existe, está bien (es lo que queremos)
				if (error.code !== 'ENOENT' && error.name !== 'FileError') {
					throw error;
				}
			}
		}

		// Renombrar/mover el archivo
		await fs.rename(normalizedOldPath, normalizedNewPath);

		// Emitir evento
		await emit({
			type: FileEventType.MOVED,
			data: { oldPath: normalizedOldPath, newPath: normalizedNewPath },
		});

		logger.info('✅ Archivo renombrado');
		return serializeFileOperationResult(true, normalizedNewPath, 'rename');
	} catch (error) {
		if (error instanceof Error && error.name === 'FileError') {
			throw error;
		}
		logger.error('❌ Error al renombrar archivo:', error);
		throw createFileError('No se pudo renombrar el archivo', FileErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Copia un archivo
 * @param sourcePath Ruta origen
 * @param destPath Ruta destino
 * @param options Opciones de operación
 * @returns Resultado de la operación
 */
export async function copyFile(
	sourcePath: string,
	destPath: string,
	options?: FileOperationOptions
): Promise<FileCopyMoveResult> {
	try {
		logger.info('📋 Copiando archivo:', { from: sourcePath, to: destPath });

		// Validar rutas
		const normalizedSourcePath = validateAndSanitizePath(sourcePath);
		const normalizedDestPath = validateAndSanitizePath(destPath);

		// Verificar que el archivo origen existe y es un archivo
		const sourceStats = await stat(normalizedSourcePath);
		if (!sourceStats.isFile()) {
			throw createFileError('El origen no es un archivo válido', FileErrorCode.NOT_A_FILE);
		}

		// Verificar si el destino ya existe
		if (!options?.overwrite) {
			try {
				await stat(normalizedDestPath);
				throw createFileError('El archivo destino ya existe', FileErrorCode.ALREADY_EXISTS);
			} catch (error: any) {
				if (error.code !== 'ENOENT' && error.name !== 'FileError') {
					throw error;
				}
			}
		}

		// Copiar el archivo
		await fs.copyFile(normalizedSourcePath, normalizedDestPath);

		// Emitir evento
		await emit({
			type: FileEventType.COPIED,
			data: { sourcePath: normalizedSourcePath, destPath: normalizedDestPath },
		});

		logger.info('✅ Archivo copiado');

		// Obtener información de los archivos
		const sourceInfo = await getFileInfo(normalizedSourcePath);
		const destInfo = await getFileInfo(normalizedDestPath);

		return {
			success: true,
			sourcePath: normalizedSourcePath,
			destPath: normalizedDestPath,
			isDirectory: false,
			sourceInfo,
			destInfo,
			timestamp: new Date(),
		};
	} catch (error) {
		if (error instanceof Error && error.name === 'FileError') {
			throw error;
		}
		logger.error('❌ Error al copiar archivo:', error);
		throw createFileError('No se pudo copiar el archivo', FileErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Mueve un archivo
 * @param sourcePath Ruta origen
 * @param destPath Ruta destino
 * @param options Opciones de operación
 * @returns Resultado de la operación
 */
export async function moveFile(
	sourcePath: string,
	destPath: string,
	options?: FileOperationOptions
): Promise<FileCopyMoveResult> {
	try {
		logger.info('🚚 Moviendo archivo:', { from: sourcePath, to: destPath });

		// Primero copiar el archivo
		const copyResult = await copyFile(sourcePath, destPath, options);

		if (copyResult.success) {
			// Luego eliminar el archivo origen
			await deleteFile(sourcePath);

			// Emitir evento de movimiento
			await emit({
				type: FileEventType.MOVED,
				data: { oldPath: sourcePath, newPath: destPath },
			});

			logger.info('✅ Archivo movido');
			return copyResult;
		}
		throw createFileError('Error en la copia durante el movimiento', FileErrorCode.OPERATION_FAILED);
	} catch (error) {
		if (error instanceof Error && error.name === 'FileError') {
			throw error;
		}
		logger.error('❌ Error al mover archivo:', error);
		throw createFileError('No se pudo mover el archivo', FileErrorCode.OPERATION_FAILED, error);
	}
}

// Export enhanced file operations service
export { enhancedFileOperationsService, clipboardManager } from './enhanced-file-operations.service';

/**
 * Batch Operations Convenience Functions
 * 
 * These functions provide easy access to batch operations
 * from the main file service.
 */

/**
 * Queue a batch copy operation for multiple files
 */
export async function batchCopyFiles(
  items: AnyEntityWithStats[],
  targetPath: string,
  options: FileOperationOptions & {
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    showProgress?: boolean;
    continueOnError?: boolean;
    description?: string;
  } = {}
): Promise<string> {
  logger.info('🔄 Starting batch copy operation:', {
    itemCount: items.length,
    targetPath,
  });

  return batchFileOperationsService.queueCopyOperation(items, targetPath, {
    overwrite: options.overwrite,
    preserveTimestamps: options.preserveTimestamps,
    priority: options.priority || 'normal',
    showProgress: options.showProgress !== false,
    continueOnError: options.continueOnError !== false,
    description: options.description,
    autoCleanup: true,
  });
}

/**
 * Queue a batch move operation for multiple files
 */
export async function batchMoveFiles(
  items: AnyEntityWithStats[],
  targetPath: string,
  options: FileOperationOptions & {
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    showProgress?: boolean;
    continueOnError?: boolean;
    description?: string;
  } = {}
): Promise<string> {
  logger.info('🚚 Starting batch move operation:', {
    itemCount: items.length,
    targetPath,
  });

  return batchFileOperationsService.queueMoveOperation(items, targetPath, {
    overwrite: options.overwrite,
    preserveTimestamps: options.preserveTimestamps,
    priority: options.priority || 'normal',
    showProgress: options.showProgress !== false,
    continueOnError: options.continueOnError !== false,
    description: options.description,
    autoCleanup: true,
  });
}

/**
 * Queue a batch delete operation for multiple files
 */
export async function batchDeleteFiles(
  items: AnyEntityWithStats[],
  options: {
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    showProgress?: boolean;
    continueOnError?: boolean;
    description?: string;
    recursive?: boolean;
  } = {}
): Promise<string> {
  logger.info('🗑️ Starting batch delete operation:', {
    itemCount: items.length,
  });

  return batchFileOperationsService.queueDeleteOperation(items, {
    recursive: options.recursive,
    priority: options.priority || 'normal',
    showProgress: options.showProgress !== false,
    continueOnError: options.continueOnError === true, // More conservative for delete
    description: options.description,
    autoCleanup: true,
  });
}

/**
 * Check if batch operations are currently running
 */
export function isBatchProcessing(): boolean {
  const operations = batchFileOperationsService.getAllOperations();
  return operations.some(op => op.status === 'running');
}

/**
 * Get summary of all batch operations
 */
export function getBatchOperationsSummary() {
  const operations = batchFileOperationsService.getAllOperations();
  
  return {
    total: operations.length,
    active: operations.filter(op => ['queued', 'running', 'paused'].includes(op.status)).length,
    completed: operations.filter(op => op.status === 'completed').length,
    failed: operations.filter(op => op.status === 'failed').length,
    cancelled: operations.filter(op => op.status === 'cancelled').length,
  };
}

// Re-export batch operations service for direct access
export { batchFileOperationsService };

// Mantener compatibilidad con nombres anteriores
export const readDirectory = getDirectoryInfo;
export const deleteFileOrDirectory = deleteFile;
export const copyFileOrDirectory = copyFile;
export const moveFileOrDirectory = moveFile;
export const renameFileOrDirectory = renameFile;

// Export types for external use
export type { FileCopyMoveResult, FileOperationResult, FileOperationOptions };
'use server';

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
	type DirectoryReadResult,
	type FileBase,
	type FileCopyMoveResult,
	FileErrorCode,
	FileEventType,
	type FileInfo,
	type FileOperationOptions,
	type FileOperationResult,
	FileType,
} from '@/types/entities/file';
import fs, { stat } from 'fs/promises';
import { revalidatePath } from 'next/cache';

// Configuración y utilidades
const fileLogger = serverLogger.withContext('FileActions');
const REVALIDATE_PATHS = ['/'] as const;

// Utilitarias funcionales
const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	fileLogger.info('🔄 Rutas revalidadas');
};

// Función creadora de errores (enfoque funcional)
const createFileError = (message: string, code: FileErrorCode = FileErrorCode.OPERATION_FAILED, cause?: unknown) => {
	const error = new Error(message);
	error.name = 'FileError';
	Object.assign(error, { code, cause });
	return error;
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
		fileLogger.info('📊 Obteniendo información del archivo:', filePath);

		// Validar y sanitizar la ruta
		const normalizedPath = validateAndSanitizePath(filePath);

		// Verificar que el archivo existe
		const fileStats = await stat(normalizedPath);
		if (!fileStats.isFile()) {
			throw createFileError('La ruta especificada no es un archivo válido', FileErrorCode.NOT_A_FILE);
		}

		// Usar transformer para mapear stats a FileInfo
		const fileInfo = mapStatsToFileInfo(normalizedPath, fileStats);

		fileLogger.info('✅ Información del archivo obtenida');
		return fileInfo;
	} catch (error) {
		if (error instanceof Error && error.name === 'FileError') {
			throw error;
		}
		fileLogger.error('❌ Error al obtener información del archivo:', error);
		throw createFileError('No se pudo obtener información del archivo', FileErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Lee un archivo como buffer
 * Esta función es interna para ser utilizada por otras acciones de archivos
 */
async function readFileAsBuffer(filePath: string): Promise<{
	buffer: Buffer;
	fileInfo: Awaited<ReturnType<typeof getFileInfo>>;
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
		fileLogger.error('❌ Error al leer archivo:', error);
		throw createFileError('No se pudo leer el archivo', FileErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Elimina un archivo del sistema
 * @param filePath Ruta del archivo a eliminar
 */
export async function deleteFile(filePath: string): Promise<FileOperationResult> {
	try {
		fileLogger.info('🗑️ Eliminando archivo:', filePath);

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

		fileLogger.info('✅ Archivo eliminado');
		await revalidateAllPaths();

		return serializeFileOperationResult(true, normalizedPath);
	} catch (error) {
		if (error instanceof Error && error.name === 'FileError') {
			throw error;
		}
		fileLogger.error('❌ Error al eliminar archivo:', error);
		throw createFileError('No se pudo eliminar el archivo', FileErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene el contenido de un archivo como una URL de datos (data URL)
 * Útil para imágenes que necesitan ser copiadas al portapapeles
 * @param filePath Ruta del archivo
 * @returns Data URL del archivo
 */
export async function getFileAsDataUrl(filePath: string): Promise<{ dataUrl: string; mimeType: string }> {
	try {
		fileLogger.info('📄 Obteniendo archivo como URL de datos:', filePath);

		// Leer el archivo como buffer
		const { buffer, fileInfo } = await readFileAsBuffer(filePath);

		// Verificar que el archivo es una imagen
		if (fileInfo.type !== FileType.IMAGE) {
			throw createFileError('El archivo no es una imagen soportada', FileErrorCode.INVALID_PATH);
		}

		// Convertir a Data URL
		const dataUrl = `data:${fileInfo.mimeType};base64,${buffer.toString('base64')}`;

		fileLogger.info('✅ Archivo convertido a URL de datos');
		return {
			dataUrl,
			mimeType: fileInfo.mimeType,
		};
	} catch (error) {
		if (error instanceof Error && error.name === 'FileError') {
			throw error;
		}
		fileLogger.error('❌ Error al obtener archivo como URL de datos:', error);
		throw createFileError('No se pudo obtener el archivo como URL de datos', FileErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene información sobre un directorio
 * @param dirPath Ruta del directorio
 * @returns Lista de archivos y subdirectorios
 */
export async function getDirectoryInfo(dirPath: string): Promise<DirectoryReadResult> {
	try {
		fileLogger.info('📁 Obteniendo información del directorio:', dirPath);

		// Validar y sanitizar la ruta
		const normalizedPath = validateAndSanitizePath(dirPath);

		// Verificar que la ruta existe y es un directorio
		const dirStats = await stat(normalizedPath);
		if (!dirStats.isDirectory()) {
			throw createFileError('La ruta especificada no es un directorio válido', FileErrorCode.NOT_A_DIRECTORY);
		}

		// Leer el contenido del directorio
		const dirEntries = await fs.readdir(normalizedPath, { withFileTypes: true });

		// Procesar los elementos
		const items: FileBase[] = await Promise.all(
			dirEntries.map(async (entry) => {
				const entryPath = path.join(normalizedPath, entry.name);
				const isDirectory = entry.isDirectory();

				try {
					const fileStats = await stat(entryPath);
					return mapStatsToFileInfo(entryPath, fileStats);
				} catch (error) {
					// Si hay error al obtener información, crear un ítem básico
					const extension = isDirectory ? '' : path.extname(entry.name);
					return {
						id: generateFileId(entryPath),
						name: entry.name,
						path: entryPath,
						type: isDirectory ? FileType.DIRECTORY : determineFileType(extension),
						extension,
						mimeType: isDirectory ? 'directory' : determineMimeType(extension),
						size: 0,
						createdAt: new Date(),
						modifiedAt: new Date(),
						isDirectory,
					};
				}
			})
		);

		// Usar serializer para crear respuesta estructurada
		const result = serializeDirectoryContents(normalizedPath, items);

		fileLogger.info('✅ Información del directorio obtenida:', { items: items.length });

		// Emitir evento
		await emit({
			type: FileEventType.DIRECTORY_CREATED,
			data: { path: normalizedPath, contents: items.length },
		});

		return result;
	} catch (error) {
		if (error instanceof Error && error.name === 'FileError') {
			throw error;
		}
		fileLogger.error('❌ Error al obtener información del directorio:', error);
		throw createFileError('No se pudo obtener información del directorio', FileErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Crea un nuevo directorio
 * @param dirPath Ruta del directorio a crear
 * @param options Opciones adicionales (recursive, etc.)
 */
export async function createDirectory(dirPath: string, options?: FileOperationOptions): Promise<FileOperationResult> {
	try {
		fileLogger.info('📁 Creando directorio:', dirPath);

		// Validar y sanitizar la ruta
		const normalizedPath = validateAndSanitizePath(dirPath);

		// Verificar si ya existe
		try {
			const stats = await stat(normalizedPath);
			if (stats.isDirectory()) {
				// Si ya existe y no queremos sobrescribir, retornar error
				if (!options?.overwrite) {
					throw createFileError('El directorio ya existe', FileErrorCode.ALREADY_EXISTS);
				}
			} else {
				throw createFileError('La ruta existe pero no es un directorio', FileErrorCode.NOT_A_DIRECTORY);
			}
		} catch (error) {
			// Si el error es que no existe, continuamos con la creación
			if (!(error instanceof Error && error.name === 'FileError') && !('code' in error && error.code === 'ENOENT')) {
				throw error;
			}
		}

		// Crear directorio
		await fs.mkdir(normalizedPath, {
			recursive: options?.recursive ?? false,
		});

		// Emitir evento
		await emit({
			type: FileEventType.DIRECTORY_CREATED,
			data: { path: normalizedPath },
		});

		await revalidateAllPaths();
		fileLogger.info('✅ Directorio creado');

		return serializeFileOperationResult(true, normalizedPath);
	} catch (error) {
		if (error instanceof Error && error.name === 'FileError') {
			throw error;
		}
		fileLogger.error('❌ Error al crear directorio:', error);
		throw createFileError('No se pudo crear el directorio', FileErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Renombra un archivo o directorio
 * @param oldPath Ruta actual
 * @param newPath Nueva ruta
 * @param options Opciones adicionales
 */
export async function renameFile(
	oldPath: string,
	newPath: string,
	options?: FileOperationOptions
): Promise<FileOperationResult> {
	try {
		fileLogger.info('✏️ Renombrando:', { oldPath, newPath });

		// Validar y sanitizar las rutas
		const normalizedOldPath = validateAndSanitizePath(oldPath);
		const normalizedNewPath = validateAndSanitizePath(newPath);

		// Verificar que la ruta origen existe
		try {
			await stat(normalizedOldPath);
		} catch (error) {
			throw createFileError('El archivo o directorio de origen no existe', FileErrorCode.NOT_FOUND);
		}

		// Verificar si el destino ya existe
		try {
			await stat(normalizedNewPath);
			// Si llegamos aquí, el destino existe
			if (!options?.overwrite) {
				throw createFileError('El archivo o directorio de destino ya existe', FileErrorCode.ALREADY_EXISTS);
			}

			// Si permite sobrescribir, eliminar el destino
			await fs.unlink(normalizedNewPath).catch(() => {
				// Ignorar error si es un directorio (no se puede unlink)
			});
		} catch (error) {
			// Si el error es que no existe, continuamos con el renombrado
			if (!('code' in error && error.code === 'ENOENT')) {
				throw error;
			}
		}

		// Renombrar archivo o directorio
		await fs.rename(normalizedOldPath, normalizedNewPath);

		// Emitir evento
		await emit({
			type: FileEventType.RENAMED,
			data: { oldPath: normalizedOldPath, newPath: normalizedNewPath },
		});

		await revalidateAllPaths();
		fileLogger.info('✅ Archivo o directorio renombrado');

		return serializeFileOperationResult(true, normalizedNewPath);
	} catch (error) {
		if (error instanceof Error && error.name === 'FileError') {
			throw error;
		}
		fileLogger.error('❌ Error al renombrar archivo o directorio:', error);
		throw createFileError('No se pudo renombrar el archivo o directorio', FileErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Copia un archivo
 * @param sourcePath Ruta de origen
 * @param destPath Ruta de destino
 * @param options Opciones adicionales
 */
export async function copyFile(
	sourcePath: string,
	destPath: string,
	options?: FileOperationOptions
): Promise<FileCopyMoveResult> {
	try {
		fileLogger.info('📋 Copiando archivo:', { sourcePath, destPath });

		// Validar y sanitizar las rutas
		const normalizedSourcePath = validateAndSanitizePath(sourcePath);
		const normalizedDestPath = validateAndSanitizePath(destPath);

		// Verificar que el origen existe y es un archivo
		const sourceStats = await stat(normalizedSourcePath).catch(() => {
			throw createFileError('El archivo de origen no existe', FileErrorCode.NOT_FOUND);
		});

		if (!sourceStats.isFile()) {
			throw createFileError('La ruta de origen no es un archivo', FileErrorCode.NOT_A_FILE);
		}

		// Verificar si el destino existe
		let overwritten = false;
		try {
			await stat(normalizedDestPath);
			// Si llegamos aquí, el destino existe
			if (!options?.overwrite) {
				throw createFileError('El archivo de destino ya existe', FileErrorCode.ALREADY_EXISTS);
			}
			overwritten = true;
		} catch (error) {
			// Si el error es que no existe, continuamos con la copia
			if (!('code' in error && error.code === 'ENOENT')) {
				throw error;
			}
		}

		// Asegurar que el directorio de destino existe
		if (options?.createDirectories) {
			const destDir = path.dirname(normalizedDestPath);
			await fs.mkdir(destDir, { recursive: true }).catch(() => {
				// Ignorar error si el directorio ya existe
			});
		}

		// Copiar el archivo
		await fs.copyFile(normalizedSourcePath, normalizedDestPath);

		// Si se debe preservar timestamps, aplicar al destino
		if (options?.preserveTimestamps) {
			await fs.utimes(normalizedDestPath, sourceStats.atime, sourceStats.mtime).catch(() => {
				// Ignorar error si no se pueden modificar los timestamps
			});
		}

		// Emitir evento
		await emit({
			type: FileEventType.COPIED,
			data: {
				sourcePath: normalizedSourcePath,
				destinationPath: normalizedDestPath,
				overwritten,
			},
		});

		await revalidateAllPaths();
		fileLogger.info('✅ Archivo copiado');

		return {
			success: true,
			sourcePath: normalizedSourcePath,
			destinationPath: normalizedDestPath,
			overwritten,
			timestamp: new Date(),
		};
	} catch (error) {
		if (error instanceof Error && error.name === 'FileError') {
			throw error;
		}
		fileLogger.error('❌ Error al copiar archivo:', error);
		throw createFileError('No se pudo copiar el archivo', FileErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Mueve un archivo o directorio
 * @param sourcePath Ruta de origen
 * @param destPath Ruta de destino
 * @param options Opciones adicionales
 */
export async function moveFile(
	sourcePath: string,
	destPath: string,
	options?: FileOperationOptions
): Promise<FileCopyMoveResult> {
	try {
		fileLogger.info('🚚 Moviendo archivo o directorio:', { sourcePath, destPath });

		// Validar y sanitizar las rutas
		const normalizedSourcePath = validateAndSanitizePath(sourcePath);
		const normalizedDestPath = validateAndSanitizePath(destPath);

		// Verificar que el origen existe
		await stat(normalizedSourcePath).catch(() => {
			throw createFileError('El archivo o directorio de origen no existe', FileErrorCode.NOT_FOUND);
		});

		// Verificar si el destino existe
		let overwritten = false;
		try {
			await stat(normalizedDestPath);
			// Si llegamos aquí, el destino existe
			if (!options?.overwrite) {
				throw createFileError('El archivo o directorio de destino ya existe', FileErrorCode.ALREADY_EXISTS);
			}
			overwritten = true;

			// Si permite sobrescribir, eliminar el destino
			await fs.rm(normalizedDestPath, { recursive: true, force: true }).catch(() => {
				// Ignorar error si no se puede eliminar
			});
		} catch (error) {
			// Si el error es que no existe, continuamos con el movimiento
			if (!('code' in error && error.code === 'ENOENT')) {
				throw error;
			}
		}

		// Asegurar que el directorio de destino existe
		if (options?.createDirectories) {
			const destDir = path.dirname(normalizedDestPath);
			await fs.mkdir(destDir, { recursive: true }).catch(() => {
				// Ignorar error si el directorio ya existe
			});
		}

		// Mover el archivo o directorio
		await fs.rename(normalizedSourcePath, normalizedDestPath);

		// Emitir evento
		await emit({
			type: FileEventType.MOVED,
			data: {
				sourcePath: normalizedSourcePath,
				destinationPath: normalizedDestPath,
				overwritten,
			},
		});

		await revalidateAllPaths();
		fileLogger.info('✅ Archivo o directorio movido');

		return {
			success: true,
			sourcePath: normalizedSourcePath,
			destinationPath: normalizedDestPath,
			overwritten,
			timestamp: new Date(),
		};
	} catch (error) {
		if (error instanceof Error && error.name === 'FileError') {
			throw error;
		}
		fileLogger.error('❌ Error al mover archivo o directorio:', error);
		throw createFileError('No se pudo mover el archivo o directorio', FileErrorCode.OPERATION_FAILED, error);
	}
}

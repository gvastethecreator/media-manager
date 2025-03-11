'use server';

import fs from 'node:fs/promises';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { logger } from '@/lib/logger/logger';
import { emit } from '@/lib/server/events.server';
import { revalidatePath } from 'next/cache';

const fileLogger = logger.withContext('FileActions');

// Rutas a revalidar cuando se realizan operaciones de archivos
const REVALIDATE_PATHS = ['/'] as const;

const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	fileLogger.info('🔄 Rutas revalidadas');
};

// Clase personalizada de error para operaciones de archivos
class FileError extends Error {
	constructor(
		message: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'FileError';
	}
}

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
export async function getFileInfo(filePath: string): Promise<{
	path: string;
	name: string;
	size: number;
	extension: string;
	modifiedTime: Date;
	mimeType: string;
}> {
	try {
		fileLogger.info('📊 Obteniendo información del archivo:', filePath);

		// Validar y sanitizar la ruta
		const normalizedPath = validateAndSanitizePath(filePath);

		// Verificar que el archivo existe
		const fileStats = await stat(normalizedPath);
		if (!fileStats.isFile()) {
			throw new FileError('La ruta especificada no es un archivo válido');
		}

		// Obtener metadatos del archivo
		const extension = path.extname(normalizedPath).toLowerCase();
		const fileName = path.basename(normalizedPath);

		// Determinar el tipo MIME basado en la extensión
		const mimeTypes: Record<string, string> = {
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.png': 'image/png',
			'.gif': 'image/gif',
			'.webp': 'image/webp',
			'.svg': 'image/svg+xml',
			'.pdf': 'application/pdf',
			'.txt': 'text/plain',
			'.json': 'application/json',
		};

		const mimeType = extension in mimeTypes ? mimeTypes[extension] : 'application/octet-stream';

		const fileInfo = {
			path: normalizedPath,
			name: fileName,
			size: fileStats.size,
			extension,
			modifiedTime: fileStats.mtime,
			mimeType,
		};

		fileLogger.info('✅ Información del archivo obtenida');
		return fileInfo;
	} catch (error) {
		if (error instanceof FileError) {
			throw error;
		}
		fileLogger.error('❌ Error al obtener información del archivo:', error);
		throw new FileError('No se pudo obtener información del archivo', error);
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
		if (error instanceof FileError) {
			throw error;
		}
		fileLogger.error('❌ Error al leer archivo:', error);
		throw new FileError('No se pudo leer el archivo', error);
	}
}

/**
 * Elimina un archivo del sistema
 * @param filePath Ruta del archivo a eliminar
 */
export async function deleteFile(filePath: string): Promise<{ success: true }> {
	try {
		fileLogger.info('🗑️ Eliminando archivo:', filePath);

		// Validar y sanitizar la ruta
		const normalizedPath = validateAndSanitizePath(filePath);

		// Verificar que el archivo existe
		const fileStats = await stat(normalizedPath);
		if (!fileStats.isFile()) {
			throw new FileError('La ruta especificada no es un archivo válido');
		}

		// Eliminar el archivo
		await fs.unlink(normalizedPath);

		// Emitir evento
		await emit({
			type: 'file:deleted',
			data: { path: normalizedPath },
		});

		fileLogger.info('✅ Archivo eliminado');
		await revalidateAllPaths();

		return { success: true };
	} catch (error) {
		if (error instanceof FileError) {
			throw error;
		}
		fileLogger.error('❌ Error al eliminar archivo:', error);
		throw new FileError('No se pudo eliminar el archivo', error);
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
		if (!fileInfo.mimeType.startsWith('image/')) {
			throw new FileError('El archivo no es una imagen soportada');
		}

		// Convertir a Data URL
		const dataUrl = `data:${fileInfo.mimeType};base64,${buffer.toString('base64')}`;

		fileLogger.info('✅ Archivo convertido a URL de datos');
		return {
			dataUrl,
			mimeType: fileInfo.mimeType,
		};
	} catch (error) {
		if (error instanceof FileError) {
			throw error;
		}
		fileLogger.error('❌ Error al obtener archivo como URL de datos:', error);
		throw new FileError('No se pudo obtener el archivo como URL de datos', error);
	}
}

/**
 * Obtiene información sobre un directorio
 * @param dirPath Ruta del directorio
 * @returns Lista de archivos y subdirectorios
 */
export async function getDirectoryInfo(dirPath: string): Promise<{
	path: string;
	items: Array<{
		name: string;
		isDirectory: boolean;
		size?: number;
		modifiedTime?: Date;
	}>;
}> {
	try {
		fileLogger.info('📁 Obteniendo información del directorio:', dirPath);

		// Validar y sanitizar la ruta
		const normalizedPath = validateAndSanitizePath(dirPath);

		// Verificar que la ruta existe y es un directorio
		const dirStats = await stat(normalizedPath);
		if (!dirStats.isDirectory()) {
			throw new FileError('La ruta especificada no es un directorio válido');
		}

		// Leer el contenido del directorio
		const dirEntries = await fs.readdir(normalizedPath, { withFileTypes: true });

		// Procesar los elementos
		const items = await Promise.all(
			dirEntries.map(async (entry) => {
				const entryPath = path.join(normalizedPath, entry.name);
				const isDirectory = entry.isDirectory();

				if (isDirectory) {
					return {
						name: entry.name,
						isDirectory: true,
					};
				}

				// Es un archivo
				try {
					const fileStats = await stat(entryPath);
					return {
						name: entry.name,
						isDirectory: false,
						size: fileStats.size,
						modifiedTime: fileStats.mtime,
					};
				} catch (_error) {
					// Si hay error al obtener stats, devolver solo la información básica
					return {
						name: entry.name,
						isDirectory: false,
					};
				}
			})
		);

		fileLogger.info('✅ Información del directorio obtenida');
		return {
			path: normalizedPath,
			items,
		};
	} catch (error) {
		if (error instanceof FileError) {
			throw error;
		}
		fileLogger.error('❌ Error al obtener información del directorio:', error);
		throw new FileError('No se pudo obtener información del directorio', error);
	}
}

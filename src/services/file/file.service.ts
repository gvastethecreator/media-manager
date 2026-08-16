/**
 * @file Lectura de directorios autorizados.
 * @module services/file/file.service
 *
 * Las mutaciones de filesystem viven en rutas de dominio que parten de una
 * referencia autorizada de asset. Este módulo no acepta rutas del cliente para
 * crear, copiar, mover, renombrar o borrar.
 */

import { Effect, Schedule } from 'effect';
import { type Dirent } from 'fs';
import fs, { stat } from 'fs/promises';
import path from 'path';
import { serverLogger } from '@/lib/logger/server-logger';
import { determineFileType, determineMimeType, generateFileId, serializeDirectoryContents } from '@/transformers/file';
import { type FileBase, FileErrorCode, FileType } from '@/types/entities/file';

type FileInfo = FileBase;

interface DirectoryReadResult {
	items: FileInfo[];
	path: string;
	total: number;
}

const logger = serverLogger.withContext('FileService');
const PATH_SANITIZE_REGEX = /^(\.\.(\/|\\|$))+/;

const createFileError = (
	message: string,
	code: FileErrorCode = FileErrorCode.OPERATION_FAILED,
	cause?: unknown
): Error & { code: FileErrorCode; cause?: unknown } => {
	const error = new Error(message);
	error.name = 'FileError';
	return Object.assign(error, { code, cause });
};

function normalizeAuthorizedDirectoryPath(filePath: string): string {
	return path.normalize(filePath).replace(PATH_SANITIZE_REGEX, '');
}

/**
 * Lee un directorio ya autorizado con concurrencia limitada y reintentos de
 * `stat`. La autorización se hace antes de llamar a esta función.
 */
export async function getDirectoryInfoConcurrent(dirPath: string): Promise<DirectoryReadResult> {
	logger.info('Obteniendo contenido de directorio autorizado con concurrencia');

	const normalizedPath = normalizeAuthorizedDirectoryPath(dirPath);
	const dirStats = await stat(normalizedPath);
	if (!dirStats.isDirectory()) {
		throw createFileError('La ruta especificada no es un directorio válido', FileErrorCode.NOT_A_DIRECTORY);
	}

	const dirents = await fs.readdir(normalizedPath, { withFileTypes: true });
	const processItem = (item: Dirent) => {
		const itemPath = path.join(normalizedPath, item.name);
		return Effect.tryPromise({
			try: () => stat(itemPath),
			catch: (error) => createFileError('stat falló para un item autorizado', FileErrorCode.OPERATION_FAILED, error),
		}).pipe(
			Effect.map((itemStats) => {
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
				return fileBase;
			}),
			Effect.timeout('10 seconds'),
			Effect.retry(Schedule.addDelay(Schedule.recurs(2), () => '150 millis')),
			Effect.catchAll(() => {
				logger.warn('Omitiendo un item por error de stat');
				return Effect.succeed(null);
			})
		);
	};

	try {
		const results = await Effect.runPromise(Effect.all(dirents.map(processItem), { concurrency: 8 }));
		const processedItems = results.filter((item): item is FileBase => item !== null);
		const result = serializeDirectoryContents(normalizedPath, processedItems);
		logger.info('Contenido del directorio obtenido', { itemCount: processedItems.length });
		return result;
	} catch (error) {
		logger.error('Error al obtener contenido del directorio', {
			code: (error as NodeJS.ErrnoException).code ?? 'DIRECTORY_READ_FAILED',
		});
		if (error instanceof Error && error.name === 'FileError') throw error;
		throw createFileError('No se pudo obtener el contenido del directorio', FileErrorCode.OPERATION_FAILED, error);
	}
}

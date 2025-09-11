/**
 * @file Transformador principal para la entidad JsonFile
 * @module transformers/json-file/transformer

 */

import { TransformerError } from '@/lib/errors/transformer-error';
import { serverLogger } from '@/lib/logger/server-logger';
import { createDefaultEntityStats } from '@/lib/utils';
import type { JsonFileBase, JsonFileWithStats } from '@/types/entities/json-file/base';

/**
 * 📊 Calcula la profundidad de anidamiento de un objeto JSON
 */
function calculateNestingDepth(obj: unknown): number {
	if (obj === null || typeof obj !== 'object') {
		return 0;
	}

	let maxDepth = 0;

	if (Array.isArray(obj)) {
		for (const item of obj) {
			const depth = calculateNestingDepth(item);
			maxDepth = Math.max(maxDepth, depth);
		}
	} else {
		for (const value of Object.values(obj as Record<string, unknown>)) {
			const depth = calculateNestingDepth(value);
			maxDepth = Math.max(maxDepth, depth);
		}
	}

	return maxDepth + 1;
}

/**
 * 🔢 Cuenta el número total de claves en un objeto (recursivamente)
 */
function calculateKeyCount(obj: unknown): number {
	if (obj === null || typeof obj !== 'object') {
		return 0;
	}

	let count = 0;

	if (Array.isArray(obj)) {
		for (const item of obj) {
			count += calculateKeyCount(item);
		}
	} else {
		const objRecord = obj as Record<string, unknown>;
		count += Object.keys(objRecord).length;

		for (const value of Object.values(objRecord)) {
			count += calculateKeyCount(value);
		}
	}

	return count;
}

const logger = serverLogger.withContext('JsonFileTransformer');

/**
 * 🔄 Transforma un objeto JsonFile de Prisma a nuestro tipo canónico JsonFileWithStats.
 *
 * @param prismaJsonFile - El objeto JsonFileBase obtenido de Prisma.
 * @returns Un objeto JsonFileWithStats compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromDrizzleJsonFile(drizzleJsonFile: JsonFileBase): JsonFileWithStats {
	if (!drizzleJsonFile) {
		throw new TransformerError('El objeto de archivo JSON de Drizzle no puede ser nulo.');
	}

	try {
		// Lógica para calcular las estadísticas del contenido JSON
		const stats = {
			...createDefaultEntityStats(),
			size: 0,
			nestingDepth: 0,
			isValid: false,
			keyCount: 0,
			isDirectory: false,
			isFile: true,
		};

		if (drizzleJsonFile.content) {
			try {
				const content = JSON.parse(drizzleJsonFile.content);
				stats.size = drizzleJsonFile.content.length;
				stats.isValid = true;
				stats.keyCount = calculateKeyCount(content);
				stats.nestingDepth = calculateNestingDepth(content);
			} catch (e) {
				// El JSON no es válido, se mantienen los stats por defecto
				logger.warn('JSON content is invalid', {
					jsonFileId: drizzleJsonFile.id,
					contentLength: drizzleJsonFile.content?.length || 0,
				});
			}
		}

		const jsonFileWithStats: JsonFileWithStats = {
			...drizzleJsonFile,
			entityType: 'json-file',
			stats,
		};

		return jsonFileWithStats;
	} catch (error) {
		logger.error('Error transformando archivo JSON desde Drizzle', {
			error,
			jsonFileId: drizzleJsonFile?.id,
		});
		throw new TransformerError(`Error al transformar el archivo JSON: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de archivos JSON de Prisma a una lista de JsonFileWithStats.
 *
 * @param drizzleJsonFiles - Un array de objetos JsonFile de Drizzle.
 * @returns Un array de objetos JsonFileWithStats.
 */
export function fromDrizzleJsonFiles(drizzleJsonFiles: JsonFileBase[]): JsonFileWithStats[] {
	return drizzleJsonFiles.map(fromDrizzleJsonFile);
}

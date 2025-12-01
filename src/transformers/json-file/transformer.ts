/**
 * @file Transformador principal para la entidad JsonFile
 * @module transformers/json-file/transformer
 */

import { TransformerError } from '@/lib/errors/transformer-error';
import { serverLogger } from '@/lib/logger/server-logger';
import { createDefaultEntityStats } from '@/lib/utils';
import type { JsonFileBase, JsonFileWithStats } from '@/types/entities/json-file/base';

const logger = serverLogger.withContext('JsonFileTransformer');

/**
 * Calcula la profundidad máxima de anidamiento de un objeto/array JSON
 * @param value - Valor JSON a analizar
 * @param currentDepth - Profundidad actual (para recursión)
 * @returns Profundidad máxima de anidamiento
 */
function calculateNestingDepth(value: unknown, currentDepth = 0): number {
	if (value === null || typeof value !== 'object') {
		return currentDepth;
	}

	const values = Array.isArray(value) ? value : Object.values(value);
	if (values.length === 0) {
		return currentDepth + 1;
	}

	return Math.max(...values.map((v) => calculateNestingDepth(v, currentDepth + 1)));
}

/**
 * Cuenta recursivamente todas las keys en un objeto JSON (incluyendo anidadas)
 * @param value - Valor JSON a analizar
 * @returns Número total de keys
 */
function countAllKeys(value: unknown): number {
	if (value === null || typeof value !== 'object') {
		return 0;
	}

	if (Array.isArray(value)) {
		return value.reduce((sum, item) => sum + countAllKeys(item), 0);
	}

	const keys = Object.keys(value);
	return keys.length + keys.reduce((sum, key) => sum + countAllKeys((value as Record<string, unknown>)[key]), 0);
}

/**
 * 🔄 Transforma un objeto JsonFile de Drizzle a nuestro tipo canónico JsonFileWithStats.
 *
 * @param drizzleJsonFile - El objeto JsonFileBase obtenido de Drizzle.
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
				stats.keyCount = countAllKeys(content);
				stats.nestingDepth = calculateNestingDepth(content);
			} catch {
				// El JSON no es válido, se mantienen los stats por defecto
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

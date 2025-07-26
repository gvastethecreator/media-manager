/**
 * @file Transformador principal para la entidad JsonFile
 * @module transformers/json-file/transformer
 
 */

import { TransformerError } from '@/lib/errors/transformer-error';
import { serverLogger } from '@/lib/logger/server-logger';
import type { JsonFileBase, JsonFileWithStats } from '@/types/entities/json-file';

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
			size: 0,
			nestingDepth: 0,
			isValid: false,
			keyCount: 0,
		};

		try {
			const content = JSON.parse(drizzleJsonFile.content);
			stats.size = drizzleJsonFile.content.length;
			stats.isValid = true;
			// TODO: Implementar lógica real para nestingDepth y keyCount
			stats.keyCount = Object.keys(content).length;
			stats.nestingDepth = 1; // Placeholder
		} catch (e) {
			// El JSON no es válido, se mantienen los stats por defecto
		}

		const jsonFileWithStats: JsonFileWithStats = {
			...drizzleJsonFile,
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

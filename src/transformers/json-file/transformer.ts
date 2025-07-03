/**
 * @file Transformador principal para la entidad JsonFile
 * @module transformers/json-file/transformer
 * @description Contiene la lógica para convertir un objeto JsonFile de Prisma a nuestro tipo canónico.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { TransformerError } from '@/lib/utils/transformers/errors';
import type { JsonFileBase, JsonFileWithStats } from '@/types/entities/json-file';

const logger = serverLogger.withContext('JsonFileTransformer');

/**
 * 🔄 Transforma un objeto JsonFile de Prisma a nuestro tipo canónico JsonFileWithStats.
 *
 * @param prismaJsonFile - El objeto JsonFileBase obtenido de Prisma.
 * @returns Un objeto JsonFileWithStats compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaJsonFile(prismaJsonFile: JsonFileBase): JsonFileWithStats {
	if (!prismaJsonFile) {
		throw new TransformerError('El objeto de archivo JSON de Prisma no puede ser nulo.');
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
			const content = JSON.parse(prismaJsonFile.content);
			stats.size = prismaJsonFile.content.length;
			stats.isValid = true;
			// TODO: Implementar lógica real para nestingDepth y keyCount
			stats.keyCount = Object.keys(content).length;
			stats.nestingDepth = 1; // Placeholder
		} catch (e) {
			// El JSON no es válido, se mantienen los stats por defecto
		}

		const jsonFileWithStats: JsonFileWithStats = {
			...prismaJsonFile,
			stats,
		};

		return jsonFileWithStats;
	} catch (error) {
		logger.error('Error transformando archivo JSON desde Prisma', {
			error,
			jsonFileId: prismaJsonFile?.id,
		});
		throw new TransformerError(`Error al transformar el archivo JSON: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de archivos JSON de Prisma a una lista de JsonFileWithStats.
 *
 * @param prismaJsonFiles - Un array de objetos JsonFile de Prisma.
 * @returns Un array de objetos JsonFileWithStats.
 */
export function fromPrismaJsonFiles(prismaJsonFiles: JsonFileBase[]): JsonFileWithStats[] {
	return prismaJsonFiles.map(fromPrismaJsonFile);
}

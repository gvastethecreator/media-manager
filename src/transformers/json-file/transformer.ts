/**
 * @file Transformador principal para la entidad JsonFile
 * @module transformers/json-file/transformer
 * @description Contiene la lógica para convertir un objeto JsonFile de Prisma a nuestro tipo canónico.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { JsonFileComplete } from '@/types/entities/json-file/types';
import { TransformerError } from '@/utils/transformers/errors';

const logger = serverLogger.withContext('JsonFileTransformer');

/**
 * 🔄 Transforma un objeto JsonFile de Prisma a nuestro tipo canónico JsonFileComplete.
 *
 * @param prismaJsonFile - El objeto JsonFile obtenido de Prisma.
 * @returns Un objeto JsonFileComplete compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaJsonFile(prismaJsonFile: any): JsonFileComplete {
	if (!prismaJsonFile) {
		throw new TransformerError('El objeto de archivo JSON de Prisma no puede ser nulo.');
	}

	try {
		const { _count, ...jsonFileData } = prismaJsonFile;

		const jsonFileComplete: JsonFileComplete = {
			...jsonFileData,
			// Conteos
			_count: {
				images: _count?.images ?? 0,
				videos: _count?.videos ?? 0,
				audio: _count?.audio ?? 0,
				file3d: _count?.file3d ?? 0,
				documents: _count?.documents ?? 0,
				albums: _count?.albums ?? 0,
				collections: _count?.collections ?? 0,
				tags: _count?.tags ?? 0,
				characters: _count?.characters ?? 0,
				places: _count?.places ?? 0,
				worldItems: _count?.worldItems ?? 0,
				concepts: _count?.concepts ?? 0,
				prompts: _count?.prompts ?? 0,
				notes: _count?.notes ?? 0,
				wildcards: _count?.wildcards ?? 0,
				properties: _count?.properties ?? 0,
				groups: _count?.groups ?? 0,
			},
		};

		return jsonFileComplete;
	} catch (error) {
		logger.error('Error transformando archivo JSON desde Prisma', {
			error,
			jsonFileId: prismaJsonFile?.id,
		});
		throw new TransformerError(`Error al transformar el archivo JSON: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de archivos JSON de Prisma a una lista de JsonFileComplete.
 *
 * @param prismaJsonFiles - Un array de objetos JsonFile de Prisma.
 * @returns Un array de objetos JsonFileComplete.
 */
export function fromPrismaJsonFiles(prismaJsonFiles: any[]): JsonFileComplete[] {
	return prismaJsonFiles.map(fromPrismaJsonFile);
}

/**
 * @file Transformador principal para la entidad File3D
 * @module transformers/file3d/transformer
 * @description Contiene la lógica para convertir un objeto File3D de Prisma a nuestro tipo canónico.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { File3DComplete } from '@/types/entities/file-3d/types';
import { TransformerError } from '@/utils/transformers/errors';

const logger = serverLogger.withContext('File3DTransformer');

/**
 * 🔄 Transforma un objeto File3D de Prisma a nuestro tipo canónico File3DComplete.
 *
 * @param prismaFile3D - El objeto File3D obtenido de Prisma.
 * @returns Un objeto File3DComplete compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaFile3D(prismaFile3D: any): File3DComplete {
	if (!prismaFile3D) {
		throw new TransformerError('El objeto de archivo 3D de Prisma no puede ser nulo.');
	}

	try {
		const { _count, ...file3DData } = prismaFile3D;

		const file3DComplete: File3DComplete = {
			...file3DData,
			// Conteos
			_count: {
				images: _count?.images ?? 0,
				videos: _count?.videos ?? 0,
				audio: _count?.audio ?? 0,
				documents: _count?.documents ?? 0,
				jsonFiles: _count?.jsonFiles ?? 0,
				workflows: _count?.workflows ?? 0,
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

		return file3DComplete;
	} catch (error) {
		logger.error('Error transformando archivo 3D desde Prisma', {
			error,
			file3DId: prismaFile3D?.id,
		});
		throw new TransformerError(`Error al transformar el archivo 3D: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de archivos 3D de Prisma a una lista de File3DComplete.
 *
 * @param prismaFile3Ds - Un array de objetos File3D de Prisma.
 * @returns Un array de objetos File3DComplete.
 */
export function fromPrismaFile3Ds(prismaFile3Ds: any[]): File3DComplete[] {
	return prismaFile3Ds.map(fromPrismaFile3D);
}

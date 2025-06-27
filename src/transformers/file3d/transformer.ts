/**
 * @file Transformador principal para la entidad File3D
 * @module transformers/file3d/transformer
 * @description Contiene la lógica para convertir un objeto File3D de Prisma a nuestro tipo canónico.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { File3DBase, File3DWithStats } from '@/types/entities/file3d';
import { TransformerError } from '@/lib/utils/transformers/errors';

const logger = serverLogger.withContext('File3DTransformer');

/**
 * 🔄 Transforma un objeto File3D de Prisma a nuestro tipo canónico File3DWithStats.
 *
 * @param prismaFile3D - El objeto File3DBase obtenido de Prisma.
 * @returns Un objeto File3DWithStats compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaFile3D(prismaFile3D: File3DBase): File3DWithStats {
	if (!prismaFile3D) {
		throw new TransformerError('El objeto de archivo 3D de Prisma no puede ser nulo.');
	}

	try {
		// TODO: Implementar la lógica real para calcular estas estadísticas
		const stats = {
			polygonCount: 0,
			textureSize: 0,
			format: prismaFile3D.format,
			vertexCount: 0,
			materialCount: 0,
		};

		const file3DWithStats: File3DWithStats = {
			...prismaFile3D,
			stats,
		};

		return file3DWithStats;
	} catch (error) {
		logger.error('Error transformando archivo 3D desde Prisma', {
			error,
			file3DId: prismaFile3D?.id,
		});
		throw new TransformerError(`Error al transformar el archivo 3D: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de archivos 3D de Prisma a una lista de File3DWithStats.
 *
 * @param prismaFile3Ds - Un array de objetos File3D de Prisma.
 * @returns Un array de objetos File3DWithStats.
 */
export function fromPrismaFile3Ds(prismaFile3Ds: File3DBase[]): File3DWithStats[] {
	return prismaFile3Ds.map(fromPrismaFile3D);
}

/**
 * @file Transformador principal para la entidad File3D
 * @module transformers/file3d/transformer
 * @description Contiene la lógica para convertir un objeto File3D de Drizzle a nuestro tipo canónico.
 
 */

import { TransformerError } from '@/lib/errors/transformer-error';
import { serverLogger } from '@/lib/logger/server-logger';
import type { File3DBase, File3DStatistics, File3DWithStats } from '@/types/entities/file3d';

const logger = serverLogger.withContext('File3DTransformer');

/**
 * 🔄 Transforma un objeto File3D de Drizzle a nuestro tipo canónico File3DWithStats.
 *
 * @param drizzleFile3D - El objeto File3DBase obtenido de Drizzle.
 * @returns Un objeto File3DWithStats compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromDrizzleFile3D(drizzleFile3D: File3DBase): File3DWithStats {
	if (!drizzleFile3D) {
		throw new TransformerError('El objeto de archivo 3D de Drizzle no puede ser nulo.');
	}

	try {
		// Calcular estadísticas basadas en los datos disponibles
		const stats: File3DStatistics = {
			polygonCount: drizzleFile3D.faces || 0,
			textureSize: 0, // TODO: Calcular basado en texturas
			format: drizzleFile3D.format || 'unknown',
			vertexCount: drizzleFile3D.vertices || 0,
			materialCount: drizzleFile3D.materials || 0,
		};

		const file3DWithStats: File3DWithStats = {
			...drizzleFile3D,
			stats,
		};

		return file3DWithStats;
	} catch (error) {
		logger.error('Error transformando archivo 3D desde Drizzle', {
			error,
			file3DId: drizzleFile3D?.id,
		});
		throw new TransformerError(`Error al transformar el archivo 3D: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de archivos 3D de Drizzle a una lista de File3DWithStats.
 *
 * @param drizzleFile3Ds - Un array de objetos File3D de Drizzle.
 * @returns Un array de objetos File3DWithStats.
 */
export function fromDrizzleFile3Ds(drizzleFile3Ds: File3DBase[]): File3DWithStats[] {
	return drizzleFile3Ds.map(fromDrizzleFile3D);
}

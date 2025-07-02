'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/database/prisma';
import { revalidatePath } from '@/lib/server/revalidate';

const imageLogger = serverLogger.withContext('ImageStats');

/**
 * Actualiza las estadísticas de visualización de una imagen
 * Nota: El campo 'downloads' no existe en el esquema actual de ImageStats
 */
export async function updateImageStats(imageId: string, _type: 'view'): Promise<void> {
	try {
		const stats = await prisma.imageStats.findUnique({
			where: { imageId },
		});

		if (stats) {
			await prisma.imageStats.update({
				where: { imageId },
				data: {
					views: stats.views + 1,
					lastViewed: new Date(),
				},
			});
		} else {
			await prisma.imageStats.create({
				data: {
					imageId,
					views: 1,
				},
			});
		}

		revalidatePath('/');
	} catch (error) {
		imageLogger.error('Error updating image stats:', error);
		throw new Error('No se pudo actualizar las estadísticas de la imagen');
	}
}

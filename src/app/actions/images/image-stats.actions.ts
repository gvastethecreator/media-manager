'use server';

import { revalidatePath } from 'next/cache';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';

const imageLogger = serverLogger.withContext('ImageStats');

/**
 * Actualiza las estadísticas de visualización o descarga de una imagen
 */
export async function updateImageStats(imageId: string, type: 'view' | 'download'): Promise<void> {
	try {
		const stats = await prisma.imageStats.findUnique({
			where: { imageId },
		});

		if (stats) {
			await prisma.imageStats.update({
				where: { imageId },
				data: {
					views: type === 'view' ? stats.views + 1 : stats.views,
					downloads: type === 'download' ? stats.downloads + 1 : stats.downloads,
					lastViewed: new Date(),
				},
			});
		} else {
			await prisma.imageStats.create({
				data: {
					imageId,
					views: type === 'view' ? 1 : 0,
					downloads: type === 'download' ? 1 : 0,
				},
			});
		}

		revalidatePath('/');
	} catch (error) {
		imageLogger.error('Error updating image stats:', error);
		throw new Error('No se pudo actualizar las estadísticas de la imagen');
	}
}

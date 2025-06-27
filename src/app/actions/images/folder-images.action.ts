'use server';

import { getPrismaClient } from '@/lib/database/db';
import { serverLogger } from '@/lib/logger/server-logger';
import type { FileItem } from '@/types/files';
import { toServiceError } from '@/lib/utils/errors/service-errors';

const SERVER_ACTION_NAME = 'FolderImages';
const folderImagesLogger = serverLogger.withContext(SERVER_ACTION_NAME);

/**
 * Obtiene las últimas imágenes de una carpeta específica
 * @param folderId ID de la carpeta
 * @param limit Número máximo de imágenes a obtener (default: 6)
 */
export async function getLatestFolderImages(
	folderId: string,
	limit = 6
): Promise<{ success: boolean; data?: FileItem[]; message?: string }> {
	try {
		const prisma = await getPrismaClient();
		// Obtener las últimas imágenes de la carpeta
		const images = await prisma.image.findMany({
			where: {
				folderId: folderId,
			},
			select: {
				id: true,
				path: true,
				name: true,
				size: true,
				width: true,
				height: true,
				metadata: true,
				createdAt: true,
				updatedAt: true,
			},
			orderBy: {
				updatedAt: 'desc',
			},
			take: limit,
		});

		// Transformar a FileItem
		const fileItems: FileItem[] = images.map((image: any) => ({
			id: image.id,
			name: image.name || 'Untitled',
			path: image.path,
			type: 'image' as const,
			size: image.size || 0,
			width: image.width || 0,
			height: image.height || 0,
			metadata: image.metadata ? JSON.parse(image.metadata) : undefined,
			src: `/api/images/${image.id}/content`,
			tags: [], // Las tags se cargarían por separado si es necesario
			collections: [], // Las collections se cargarían por separado si es necesario
			isPublic: false, // Por defecto false
			isFavorite: false, // Por defecto false, se cargaría por separado si es necesario
			createdAt: image.createdAt,
			updatedAt: image.updatedAt,
		}));

		folderImagesLogger.info(`Se encontraron ${fileItems.length} imágenes para la carpeta ${folderId}`);

		return {
			success: true,
			data: fileItems,
			message: `Se encontraron ${fileItems.length} imágenes para la carpeta ${folderId}`,
		};
	} catch (error) {
		// Usar el sistema de manejo de errores estandarizado
		const serviceError = toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: `Error al obtener imágenes de la carpeta ${folderId}`,
		});

		folderImagesLogger.error(`Error al obtener imágenes de la carpeta ${folderId}:`, serviceError);

		return {
			success: false,
			message: serviceError.message,
		};
	}
}

'use server';

import { prisma } from '@/lib/prisma';
import type { FileItem } from '@/types/file-item';

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
		const fileItems: FileItem[] = images.map((image) => ({
			id: image.id,
			name: image.name || 'Untitled',
			path: image.path,
			type: 'image',
			size: image.size || 0,
			metadata: image.metadata as string,
			dimensions: {
				width: image.width || 0,
				height: image.height || 0,
			},
			createdAt: image.createdAt,
			updatedAt: image.updatedAt,
		}));

		return {
			success: true,
			data: fileItems,
			message: `Se encontraron ${fileItems.length} imágenes para la carpeta ${folderId}`,
		};
	} catch (error) {
		console.error(`Error al obtener imágenes de la carpeta ${folderId}:`, error);
		return {
			success: false,
			message: `Error al obtener imágenes de la carpeta ${folderId}`,
		};
	}
}
'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';

// Logger específico para acciones de FolderCard
const folderCardLogger = serverLogger.withContext('FolderCardActions');

// Interfaz para las imágenes thumbnail
interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
}

/**
 * Obtiene las imágenes recientes de una carpeta para mostrar en la tarjeta
 * @param folderId ID de la carpeta
 * @param limit Número máximo de imágenes a obtener (por defecto 6)
 * @returns Array de imágenes con sus thumbnails
 */
export async function getRecentFolderImages(folderId: string, limit = 6): Promise<ThumbnailImage[]> {
	try {
		folderCardLogger.info('🖼️ Obteniendo imágenes recientes para FolderCard:', folderId);

		// Verificar que el ID es válido
		if (!folderId) {
			throw new Error('ID de carpeta no proporcionado');
		}

		// Obtener imágenes recientes de la carpeta
		const images = await prisma.image.findMany({
			where: {
				folderId: folderId,
				thumbnail: { not: null }, // Solo imágenes con thumbnail
			},
			select: {
				id: true,
				name: true,
				thumbnail: true,
				thumbnailWidth: true,
				thumbnailHeight: true,
				thumbnailSize: true,
			},
			orderBy: [
				{ isFavorite: 'desc' },
				{ createdAt: 'desc' },
			],
			take: limit,
		});

		// Convertir los thumbnails a URLs de datos
		const thumbnails: ThumbnailImage[] = images.map(image => {
			let thumbnailUrl = '';

			// Verificar si tenemos un thumbnail válido
			if (image.thumbnail && image.thumbnailSize && image.thumbnailSize < 100000) {
				thumbnailUrl = `data:image/jpeg;base64,${Buffer.from(image.thumbnail).toString('base64')}`;
			}

			return {
				id: image.id,
				name: image.name,
				thumbnailUrl,
				url: `/dashboard/images/${image.id}`,
			};
		});

		folderCardLogger.info('✅ Imágenes obtenidas para FolderCard:', thumbnails.length);
		return thumbnails;
	} catch (error) {
		folderCardLogger.error('❌ Error obteniendo imágenes para FolderCard:', error);
		throw new Error(`No se pudieron obtener las imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * Obtiene las estadísticas de una carpeta
 * @param folderId ID de la carpeta
 * @returns Estadísticas de la carpeta
 */
export async function getFolderStats(folderId: string): Promise<{ totalFiles: number; totalSize: number; subfolders: number }> {
	try {
		folderCardLogger.info('📊 Obteniendo estadísticas para FolderCard:', folderId);

		// Verificar que el ID es válido
		if (!folderId) {
			throw new Error('ID de carpeta no proporcionado');
		}

		// Obtener la carpeta con sus estadísticas
		const folder = await prisma.folder.findUnique({
			where: {
				id: folderId,
			},
			select: {
				totalFiles: true,
				totalSize: true,
			},
		});

		if (!folder) {
			throw new Error(`Carpeta no encontrada: ${folderId}`);
		}

		// Contar subcarpetas
		const subfolders = await prisma.folder.count({
			where: {
				parentId: folderId,
			},
		});

		folderCardLogger.info('✅ Estadísticas obtenidas para FolderCard');
		return {
			totalFiles: folder.totalFiles,
			totalSize: folder.totalSize,
			subfolders,
		};
	} catch (error) {
		folderCardLogger.error('❌ Error obteniendo estadísticas para FolderCard:', error);
		throw new Error(`No se pudieron obtener las estadísticas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}
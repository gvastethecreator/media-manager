'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { getPrismaClient } from '@/lib/prisma';
import { folderWithCountsPayload, fromPrismaFolderWithCounts } from '@/transformers/folder';
import type { FolderWithStats } from '@/types/entities/folder';

// Logger específico para acciones de FolderCard
const folderCardLogger = serverLogger.withContext('FolderCard');

// Interfaz para las imágenes thumbnail
interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
}

/**
 * Obtiene imágenes recientes de una carpeta para mostrar en la tarjeta
 * @param folderId ID de la carpeta
 * @param limit Número máximo de imágenes a obtener (default: 4)
 * @returns Array de URLs de imágenes
 */
export async function getRecentFolderImages(folderId: string, limit = 4): Promise<string[]> {
	try {
		folderCardLogger.info(`🖼️ Obteniendo ${limit} imágenes recientes para carpeta: ${folderId}`);
		const prisma = await getPrismaClient();

		const images = await prisma.image.findMany({
			where: {
				folderId: folderId,
			},
			select: {
				thumbnailUrl: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
			take: limit,
		});

		const imageUrls = images
			.map(img => img.thumbnailUrl)
			.filter((url): url is string => url !== null);

		folderCardLogger.info(`✅ Obtenidas ${imageUrls.length} URLs de imágenes para FolderCard`);
		return imageUrls;
	} catch (error) {
		folderCardLogger.error('❌ Error obteniendo imágenes recientes para FolderCard:', error);
		return [];
	}
}

/**
 * Obtiene estadísticas básicas de una carpeta para la tarjeta
 * @param folderId ID de la carpeta
 * @returns Estadísticas de la carpeta
 */
export async function getFolderStats(folderId: string): Promise<{
	totalImages: number;
	totalVideos: number;
	totalSize: number;
	lastActivity: Date | null;
} | null> {
	try {
		folderCardLogger.info(`📊 Obteniendo estadísticas para carpeta: ${folderId}`);
		const prisma = await getPrismaClient();

		const folder = await prisma.folder.findUnique({
			where: { id: folderId },
			select: {
				totalSize: true,
				lastIndexed: true,
				_count: {
					select: {
						images: true,
						videos: true,
					},
				},
			},
		});

		if (!folder) {
			folderCardLogger.warn(`⚠️ Carpeta no encontrada para stats: ${folderId}`);
			return null;
		}

		const stats = {
			totalImages: folder._count.images,
			totalVideos: folder._count.videos,
			totalSize: folder.totalSize,
			lastActivity: folder.lastIndexed,
		};

		folderCardLogger.info('✅ Estadísticas obtenidas para FolderCard');
		return stats;
	} catch (error) {
		folderCardLogger.error('❌ Error obteniendo estadísticas para FolderCard:', error);
		return null;
	}
}

/**
 * Obtiene una carpeta completa con todas sus relaciones para la tarjeta
 * @param folderId ID de la carpeta
 * @returns Objeto completo de carpeta con estadísticas
 */
export async function getFolderForCard(folderId?: string): Promise<FolderWithStats | null> {
	try {
		// Verificar que el ID es válido (manejo explícito de undefined)
		if (!folderId || folderId.trim() === '') {
			folderCardLogger.debug('ℹ️ Solicitud de carpeta sin ID válido');
			return null;
		}

		folderCardLogger.info(`📁 Obteniendo carpeta completa para FolderCard: ${folderId}`);
		const prisma = await getPrismaClient();

		// Obtener la carpeta con todas sus relaciones relevantes usando el payload optimizado
		const folder = await prisma.folder.findUnique({
			where: {
				id: folderId,
			},
			...folderWithCountsPayload,
		});

		if (!folder) {
			folderCardLogger.warn(`⚠️ Carpeta no encontrada: ${folderId}`);
			return null;
		}

		folderCardLogger.info('✅ Carpeta obtenida para FolderCard');

		// Transformar usando el transformer optimizado
		return fromPrismaFolderWithCounts(folder);
	} catch (error) {
		folderCardLogger.error('❌ Error obteniendo carpeta completa para FolderCard:', error);
		return null;
	}
}

/**
 * Obtiene múltiples carpetas optimizadas para tarjetas
 * @param folderIds Array de IDs de carpetas
 * @returns Array de carpetas con estadísticas
 */
export async function getFoldersForCards(folderIds: string[]): Promise<FolderWithStats[]> {
	try {
		folderCardLogger.info(`📁 Obteniendo ${folderIds.length} carpetas para FolderCards`);
		const prisma = await getPrismaClient();

		const folders = await prisma.folder.findMany({
			where: {
				id: { in: folderIds },
			},
			...folderWithCountsPayload,
		});

		folderCardLogger.info(`✅ Obtenidas ${folders.length} carpetas para FolderCards`);

		// Transformar todas las carpetas usando el transformer optimizado
		const transformedFolders = folders
			.map(folder => fromPrismaFolderWithCounts(folder))
			.filter((folder): folder is FolderWithStats => folder !== null);

		return transformedFolders;
	} catch (error) {
		folderCardLogger.error('❌ Error obteniendo carpetas para FolderCards:', error);
		return [];
	}
}

/**
 * Actualiza la imagen destacada de una carpeta
 * @param folderId ID de la carpeta
 * @param imageUrl URL de la nueva imagen destacada
 * @returns Carpeta actualizada
 */
export async function updateFolderFeaturedImage(
	folderId: string,
	imageUrl: string | null
): Promise<FolderWithStats | null> {
	try {
		folderCardLogger.info(`🖼️ Actualizando imagen destacada para carpeta: ${folderId}`);
		const prisma = await getPrismaClient();

		const updatedFolder = await prisma.folder.update({
			where: { id: folderId },
			data: { featuredImage: imageUrl },
			...folderWithCountsPayload,
		});

		folderCardLogger.info('✅ Imagen destacada actualizada para FolderCard');
		return fromPrismaFolderWithCounts(updatedFolder);
	} catch (error) {
		folderCardLogger.error('❌ Error actualizando imagen destacada para FolderCard:', error);
		return null;
	}
}

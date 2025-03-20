'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FileItem } from '@/types/files';
import { revalidatePath } from 'next/cache';

const favoriteLogger = serverLogger.withContext('FavoriteActions');

// Definir interfaces para los tipos relacionados
interface ImageWithRelations {
	id: string;
	name: string;
	path: string;
	size: number;
	width: number | null;
	height: number | null;
	metadata: string | Record<string, unknown> | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	thumbnailHeight: number | null;
	isPublic: boolean;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
	collections?: Array<{ id: string; name: string; emoji?: string; color?: string }>;
	tags?: Array<{ id: string; name: string; color?: string }>;
}

// Interfaces internas
interface FavoriteWithImage {
	id: string;
	entityId: string;
	entityType: string;
	createdAt: Date;
	image: FileItem;
}

const REVALIDATE_PATHS = ['/settings', '/favorites', '/images/[id]'] as const;

const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	favoriteLogger.info('🔄 Rutas revalidadas');
};

class FavoriteError extends Error {
	constructor(
		message: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'FavoriteError';
	}
}

async function transformImageToFileItem(image: ImageWithRelations): Promise<FileItem> {
	// Crear un objeto de metadata compatible con FileItem
	const metadataObj: FileItem['metadata'] = {
		dimensions: {
			width: image.width || 0,
			height: image.height || 0,
		},
	};

	// Si la metadata existe, intentamos procesar información adicional
	if (image.metadata) {
		// Si es string, intentamos parsearlo
		let parsedData: Record<string, unknown> | null = null;

		if (typeof image.metadata === 'string') {
			try {
				parsedData = JSON.parse(image.metadata);
			} catch (error) {
				console.error('Error parsing metadata JSON:', error);
			}
		} else {
			parsedData = image.metadata as Record<string, unknown>;
		}

		// Si tenemos datos parseados, procesamos campos específicos
		if (parsedData) {
			// Procesar exif data
			if (parsedData.exif && typeof parsedData.exif === 'object') {
				const exifData = parsedData.exif as Record<string, unknown>;
				metadataObj.exif = {
					make: exifData.make as string,
					model: exifData.model as string,
					dateTime: exifData.dateTime as string,
					// Convertir exposureTime a número si es string
					exposureTime:
						typeof exifData.exposureTime === 'string'
							? Number.parseFloat(exifData.exposureTime)
							: (exifData.exposureTime as number),
					fNumber: exifData.fNumber as number,
					iso: exifData.iso as number,
					focalLength: exifData.focalLength as number,
				};

				// Añadir GPS si existe
				if (exifData.gps && typeof exifData.gps === 'object') {
					const gpsData = exifData.gps as Record<string, unknown>;
					metadataObj.exif.gps = {
						latitude: gpsData.latitude as number,
						longitude: gpsData.longitude as number,
						altitude: gpsData.altitude as number,
					};
				}
			}
		}
	}

	return {
		id: image.id,
		name: image.name,
		path: image.path,
		type: 'image',
		size: image.size,
		width: image.width || 0,
		height: image.height || 0,
		metadata: metadataObj,
		thumbnail: '',
		thumbnailSize: image.thumbnailSize || 0,
		thumbnailWidth: image.thumbnailWidth || 0,
		thumbnailHeight: image.thumbnailHeight || 0,
		src: `api/images/${image.id}`,
		isPublic: image.isPublic,
		isFavorite: image.isFavorite,
		createdAt: image.createdAt,
		updatedAt: image.updatedAt,
		collections:
			image.collections?.map((c: { id: string; name: string; emoji?: string; color?: string }) => ({
				id: c.id,
				name: c.name,
				emoji: c.emoji || '📁',
				color: c.color || '#6366f1',
			})) ?? [],
		tags:
			image.tags?.map((t: { id: string; name: string; color?: string }) => ({
				id: t.id,
				name: t.name,
				color: t.color || '#cccccc',
			})) ?? [],
		stats: {
			views: 0,
			downloads: 0,
			lastViewed: image.updatedAt,
		},
	};
}

export async function addToFavorites(imageId: string): Promise<FavoriteWithImage> {
	try {
		favoriteLogger.info('⭐ Agregando imagen a favoritos:', imageId);

		// Obtener la imagen
		const image = await prisma.image.findUnique({
			where: { id: imageId },
			include: {
				tags: true,
				collections: true,
			},
		});

		if (!image) {
			throw new FavoriteError('No se encontró la imagen');
		}

		// Actualizar el campo isFavorite de la imagen
		const updatedImage = await prisma.image.update({
			where: { id: imageId },
			data: { isFavorite: true },
			include: {
				tags: true,
				collections: true,
			},
		});

		// Emitir eventos usando el sistema del servidor
		await emit({
			type: 'favorites:modified',
			imageId,
			data: { action: 'add' },
		});
		statsEventEmitter.emit(STATS_EVENTS.FAVORITE_CHANGE);
		await revalidateAllPaths();

		return {
			id: updatedImage.id,
			entityId: updatedImage.id,
			entityType: 'image',
			createdAt: updatedImage.createdAt,
			image: await transformImageToFileItem(updatedImage as ImageWithRelations),
		};
	} catch (error) {
		favoriteLogger.error('❌ Error al agregar a favoritos:', error);
		throw new FavoriteError('No se pudo agregar a favoritos', error);
	}
}

export async function removeFromFavorites(imageId: string): Promise<void> {
	try {
		favoriteLogger.info('🗑️ Eliminando imagen de favoritos:', imageId);

		// Actualizar el campo isFavorite de la imagen
		await prisma.image.update({
			where: { id: imageId },
			data: { isFavorite: false },
		});

		// Emitir eventos usando el sistema del servidor
		await emit({
			type: 'favorites:modified',
			imageId,
			data: { action: 'remove' },
		});
		statsEventEmitter.emit(STATS_EVENTS.FAVORITE_CHANGE);
		await revalidateAllPaths();
	} catch (error) {
		favoriteLogger.error('❌ Error al eliminar de favoritos:', error);
		throw new FavoriteError('No se pudo eliminar de favoritos', error);
	}
}

export async function getFavorites(): Promise<FavoriteWithImage[]> {
	try {
		favoriteLogger.info('📥 Obteniendo lista de favoritos');

		// Obtener todas las imágenes marcadas como favoritas
		const favoriteImages = await prisma.image.findMany({
			where: { isFavorite: true },
			include: {
				tags: true,
				collections: true,
			},
			orderBy: {
				updatedAt: 'desc',
			},
		});

		const transformedFavorites = await Promise.all(
			favoriteImages.map(async (image: any) => {
				return {
					id: image.id,
					entityId: image.id,
					entityType: 'image',
					createdAt: image.createdAt,
					image: await transformImageToFileItem(image as unknown as ImageWithRelations),
				};
			})
		);

		favoriteLogger.info('✅ Favoritos obtenidos:', { count: transformedFavorites.length });
		return transformedFavorites;
	} catch (error) {
		favoriteLogger.error('❌ Error al obtener favoritos:', error);
		throw new FavoriteError('No se pudieron obtener los favoritos', error);
	}
}

export async function isFavorited(imageId: string): Promise<boolean> {
	try {
		const image = await prisma.image.findUnique({
			where: { id: imageId },
			select: { isFavorite: true },
		});

		return image?.isFavorite || false;
	} catch (error) {
		favoriteLogger.error('❌ Error al verificar favorito:', { imageId, error });
		throw new FavoriteError('No se pudo verificar si la imagen está en favoritos', error);
	}
}

export async function toggleFavorite(imageId: string): Promise<boolean> {
	try {
		favoriteLogger.info('🔄 Alternando estado de favorito:', imageId);
		const isFavorite = await isFavorited(imageId);

		if (isFavorite) {
			await removeFromFavorites(imageId);
			return false;
		}

		await addToFavorites(imageId);
		return true;
	} catch (error) {
		favoriteLogger.error('❌ Error al alternar favorito:', error);
		throw new FavoriteError('No se pudo alternar el estado de favorito', error);
	}
}

export async function getRecentFavorites(limit = 10): Promise<FavoriteWithImage[]> {
	try {
		favoriteLogger.info('📥 Obteniendo favoritos recientes');

		// Obtener imágenes favoritas ordenadas por fecha de actualización
		const favoriteImages = await prisma.image.findMany({
			take: limit,
			where: { isFavorite: true },
			include: {
				tags: true,
				collections: true,
			},
			orderBy: {
				updatedAt: 'desc',
			},
		});

		const transformedFavorites = await Promise.all(
			favoriteImages.map(async (image: any) => {
				return {
					id: image.id,
					entityId: image.id,
					entityType: 'image',
					createdAt: image.createdAt,
					image: await transformImageToFileItem(image as unknown as ImageWithRelations),
				};
			})
		);

		favoriteLogger.info('✅ Favoritos recientes obtenidos:', { count: transformedFavorites.length });
		return transformedFavorites;
	} catch (error) {
		favoriteLogger.error('❌ Error al obtener favoritos recientes:', error);
		throw new FavoriteError('No se pudieron obtener los favoritos recientes', error);
	}
}

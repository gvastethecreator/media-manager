'use server';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import type { ImageMetadata } from '@/lib/types';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FileItem } from '@/types/files';
import type { Favorite, Image } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const favoriteLogger = logger.withContext('FavoriteActions');

// Definir interfaces para los tipos relacionados
interface ImageWithRelations extends Image {
	collections?: Array<{ id: string; name: string; emoji?: string; color?: string }>;
	tags?: Array<{ id: string; name: string; color?: string }>;
	updatedAt: Date;
}

const REVALIDATE_PATHS = ['/settings', '/favorites', '/images/[id]'] as const;

const revalidateAllPaths = () => {
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

function transformImageToFileItem(image: ImageWithRelations): FileItem {
	return {
		id: image.id,
		name: image.name,
		path: image.path,
		type: 'image',
		size: image.size,
		width: image.width || 0,
		height: image.height || 0,
		metadata: image.metadata as unknown as ImageMetadata,
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

export interface FavoriteWithImage extends Favorite {
	image: FileItem;
}

export async function addToFavorites(imageId: string): Promise<FavoriteWithImage> {
	try {
		favoriteLogger.info('⭐ Agregando imagen a favoritos:', imageId);
		const favorite = await prisma.favorite.create({
			data: {
				imageId,
				createdAt: new Date(),
			},
			include: {
				image: {
					include: {
						tags: true,
						collections: true,
					},
				},
			},
		});

		// Actualizar el campo isFavorite de la imagen
		await prisma.image.update({
			where: { id: imageId },
			data: { isFavorite: true },
		});

		// Emitir eventos usando el nuevo sistema del servidor
		await emit({
			type: 'favorites:modified',
			imageId,
			data: { action: 'add' },
		});
		statsEventEmitter.emit(STATS_EVENTS.FAVORITE_CHANGE);
		revalidateAllPaths();

		return {
			...favorite,
			image: transformImageToFileItem(favorite.image as ImageWithRelations),
		};
	} catch (error) {
		favoriteLogger.error('❌ Error al agregar a favoritos:', error);
		throw new FavoriteError('No se pudo agregar a favoritos', error);
	}
}

export async function removeFromFavorites(imageId: string): Promise<void> {
	try {
		favoriteLogger.info('🗑️ Eliminando imagen de favoritos:', imageId);
		await prisma.favorite.deleteMany({
			where: { imageId },
		});

		// Actualizar el campo isFavorite de la imagen
		await prisma.image.update({
			where: { id: imageId },
			data: { isFavorite: false },
		});

		// Emitir eventos usando el nuevo sistema del servidor
		await emit({
			type: 'favorites:modified',
			imageId,
			data: { action: 'remove' },
		});
		statsEventEmitter.emit(STATS_EVENTS.FAVORITE_CHANGE);
		revalidateAllPaths();
	} catch (error) {
		favoriteLogger.error('❌ Error al eliminar de favoritos:', error);
		throw new FavoriteError('No se pudo eliminar de favoritos', error);
	}
}

export async function getFavorites(): Promise<FavoriteWithImage[]> {
	try {
		favoriteLogger.info('📥 Obteniendo lista de favoritos');
		const favorites = await prisma.favorite.findMany({
			include: {
				image: {
					include: {
						tags: true,
						collections: true,
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		const transformedFavorites = favorites.map((favorite) => ({
			...favorite,
			image: transformImageToFileItem(favorite.image),
		}));

		favoriteLogger.info('✅ Favoritos obtenidos:', { count: favorites.length });
		return transformedFavorites;
	} catch (error) {
		favoriteLogger.error('❌ Error al obtener favoritos:', error);
		throw new FavoriteError('No se pudieron obtener los favoritos', error);
	}
}

export async function isFavorited(imageId: string): Promise<boolean> {
	try {
		const favorite = await prisma.favorite.findFirst({
			where: { imageId },
		});
		return !!favorite;
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
		const favorites = await prisma.favorite.findMany({
			take: limit,
			include: {
				image: {
					include: {
						tags: true,
						collections: true,
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		const transformedFavorites = favorites.map((favorite) => ({
			...favorite,
			image: transformImageToFileItem(favorite.image),
		}));

		favoriteLogger.info('✅ Favoritos recientes obtenidos:', { count: favorites.length });
		return transformedFavorites;
	} catch (error) {
		favoriteLogger.error('❌ Error al obtener favoritos recientes:', error);
		throw new FavoriteError('No se pudieron obtener los favoritos recientes', error);
	}
}

/**
 * @file Serializadores para la entidad Favorite
 * @module transformers/favorite/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { FavoriteWithImage } from '@/types/entities/favorite';
import type { FileItem } from '@/types/files';
import type { Favorite as PrismaFavorite, Image as PrismaImage } from '@prisma/client';

const serializersLogger = serverLogger.withContext('Favorite:Serializers');

type PrismaFavoriteWithImage = PrismaFavorite & { image: PrismaImage };

interface MetadataContent {
	dimensions: {
		width: number;
		height: number;
	};
	exif?: {
		make?: string;
		model?: string;
		dateTime?: string;
		exposureTime?: number;
		fNumber?: number;
		iso?: number;
		focalLength?: number;
		gps?: {
			latitude: number;
			longitude: number;
			altitude?: number;
		};
	};
}

/**
 * 🔄 Transforma una imagen en un FileItem para uso en componentes de UI
 */
export function transformImageToFileItem(image: PrismaImage): FileItem {
	return {
		id: image.id,
		name: image.name || 'Untitled',
		type: 'image' as const,
		path: image.path,
		size: image.size || 0,
		width: image.width || 0,
		height: image.height || 0,
		metadata: image.metadata || '',
		thumbnail: image.thumbnail || null,
		thumbnailSize: image.thumbnailSize || undefined,
		thumbnailWidth: image.thumbnailWidth || undefined,
		thumbnailHeight: image.thumbnailHeight || undefined,
		thumbnailError: image.thumbnailError || null,
		thumbnailErrorAt: image.thumbnailErrorAt || null,
		thumbnailOptimizedAt: image.thumbnailOptimizedAt || null,
		isPublic: false, // TODO: Implementar si es necesario
		isFavorite: image.isFavorite || false,
		folderId: image.folderId,
		createdAt: image.addedAt || new Date(), // ImageBase usa addedAt
		updatedAt: image.addedAt || new Date(), // TODO: Implementar updatedAt
		modifiedAt: image.addedAt || new Date(),
		accessedAt: image.addedAt || new Date(),
		hash: image.hash || '',
		src: image.path,
		// Las relaciones se mapean como arrays vacíos por ahora
		collections: [],
		tags: [],
		places: [],
		worldItems: [],
		concepts: [],
		prompts: [],
		notes: [],
		groups: [],
		properties: [],
		wildcards: [],
		stats: undefined,
	};
}

/**
 * Convierte un favorito con imagen en un formato FavoriteWithImage
 * @param favorite Favorito base con imagen incluida
 * @returns Favorito con imagen transformada
 */
export function toFavoriteWithImage(favorite: PrismaFavoriteWithImage): FavoriteWithImage {
	try {
		return {
			id: favorite.id,
			entityId: favorite.entityId,
			entityType: favorite.entityType,
			userId: favorite.userId,
			createdAt: favorite.createdAt,
			updatedAt: favorite.updatedAt,
			image: transformImageToFileItem(favorite.image),
		};
	} catch (error) {
		serializersLogger.error('Error convirtiendo a favorito con imagen:', error);
		return {
			...favorite,
			image: transformImageToFileItem(favorite.image || {} as PrismaImage),
		} as FavoriteWithImage;
	}
}

/**
 * Convierte una lista de favoritos con imágenes
 * @param favorites Lista de favoritos con imágenes
 * @returns Lista de favoritos transformados
 */
export function toFavoritesWithImages(favorites: PrismaFavoriteWithImage[]): FavoriteWithImage[] {
	return favorites.map(toFavoriteWithImage);
}

/**
 * @file Serializadores para la entidad Favorite
 * @module transformers/favorite/serializers
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { FavoriteWithImage } from '@/types/entities/favorite';
import type { EntityWithStats } from '@/types/entities/entity.types';

// Tipos locales equivalentes a Prisma (migración a Drizzle)
type DrizzleFavorite = {
	id: string;
	entityId: string;
	entityType: string;
	userId: string;
	createdAt: Date;
	updatedAt: Date;
};

type DrizzleImage = {
	id: string;
	name: string | null;
	path: string;
	size: number | null;
	width: number | null;
	height: number | null;
	metadata: string | null;
	thumbnail: Buffer | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	thumbnailHeight: number | null;
	thumbnailError: string | null;
	thumbnailErrorAt: Date | null;
	thumbnailOptimizedAt: Date | null;
	isFavorite: boolean | null;
	folderId: string | null;
	addedAt: Date | null;
	hash: string | null;
};

type DrizzleFavoriteWithImage = DrizzleFavorite & { image: DrizzleImage };

const serializersLogger = serverLogger.withContext('Favorite:Serializers');

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
 * 🔄 Transforma una imagen en un EntityWithStats para uso en componentes de UI
 * ✅ MIGRADO A DRIZZLE
 */
export function transformImageToEntityWithStats(image: DrizzleImage): EntityWithStats {
	return {
		id: image.id,
		name: image.name || 'Untitled',
		entityType: 'image' as const,
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
		stats: {
			totalViews: 0,
			totalLikes: 0,
			totalComments: 0,
			lastAccessedAt: image.addedAt || new Date(),
		},
	};
}

/**
 * Convierte un favorito con imagen en un formato FavoriteWithImage
 * ✅ MIGRADO A DRIZZLE - Actualizado para usar EntityWithStats
 * @param favorite Favorito base con imagen incluida
 * @returns Favorito con imagen transformada
 */
export function toFavoriteWithImage(favorite: DrizzleFavoriteWithImage): FavoriteWithImage {
	try {
		return {
			id: favorite.id,
			entityId: favorite.entityId,
			entityType: favorite.entityType,
			userId: favorite.userId,
			createdAt: favorite.createdAt,
			updatedAt: favorite.updatedAt,
			image: transformImageToEntityWithStats(favorite.image),
		};
	} catch (error) {
		serializersLogger.error('Error convirtiendo a favorito con imagen:', error);
		return {
			...favorite,
			image: transformImageToEntityWithStats(favorite.image || ({} as DrizzleImage)),
		} as FavoriteWithImage;
	}
}

/**
 * Convierte una lista de favoritos con imágenes
 * ✅ MIGRADO A DRIZZLE - Actualizado para usar EntityWithStats
 * @param favorites Lista de favoritos con imágenes
 * @returns Lista de favoritos transformados
 */
export function toFavoritesWithImages(favorites: DrizzleFavoriteWithImage[]): FavoriteWithImage[] {
	return favorites.map(toFavoriteWithImage);
}

// Alias para compatibilidad con código legacy
export const transformImageToFileItem = transformImageToEntityWithStats;

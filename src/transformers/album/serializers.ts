/**
 * @file Funciones para serializar y deserializar datos de álbumes
 * @module transformers/album/serializers
 * ✅ MIGRADO A DRIZZLE - Julio 2025
 
 */

import type { Album, AlbumStatistics, AlbumWithStats } from '@/types/entities/album';

/**
 * Convierte un álbum básico en un álbum extendido con información adicional
 * @param album Álbum básico
 * @returns Álbum con información adicional
 */
export function extendAlbum(album: Album): AlbumWithStats {
	return {
		...album,
		// Asegurar que todas las propiedades estén definidas
		description: album.description || '',
		emoji: album.emoji || '📸',
		color: album.color || '#3b82f6',
		isFavorite: album.isFavorite || false,
	};
}

/**
 * Convierte múltiples álbumes básicos en álbumes extendidos
 * @param albums Lista de álbumes básicos
 * @returns Lista de álbumes extendidos
 */
export function extendAlbums(albums: Album[]): AlbumWithStats[] {
	return albums.map(extendAlbum);
}

/**
 * Serializa un álbum para API o almacenamiento
 * @param album Álbum a serializar
 * @returns Objeto serializado
 */
export function serializeAlbum(album: AlbumWithStats): Record<string, unknown> {
	try {
		// Formatear fechas
		const createdAt = album.createdAt instanceof Date ? album.createdAt.toISOString() : album.createdAt;
		const updatedAt = album.updatedAt instanceof Date ? album.updatedAt.toISOString() : album.updatedAt;
		const lastImageAddedAt =
			album.lastImageAddedAt instanceof Date ? album.lastImageAddedAt.toISOString() : album.lastImageAddedAt;
		const lastVideoAddedAt =
			album.lastVideoAddedAt instanceof Date ? album.lastVideoAddedAt.toISOString() : album.lastVideoAddedAt;

		// Crear objeto base
		const serialized: Record<string, unknown> = {
			id: album.id,
			name: album.name,
			description: album.description,
			emoji: album.emoji,
			color: album.color,
			featuredImage: album.featuredImage,

			isFavorite: album.isFavorite,
			totalImages: album.totalImages,
			totalVideos: album.totalVideos,
			totalSize: album.totalSize,
			filters: album.filters,
			shortcut: album.shortcut,
			category: album.category,
			metadata: album.metadata,
			lastImageAddedAt,
			lastVideoAddedAt,
			createdAt,
			updatedAt,
			entityType: album.entityType,
			stats: album.stats,
		};

		return serialized;
	} catch (error) {
		// Usar un logger apropiado en lugar de console.error
		return {
			id: album.id || 'unknown',
			name: album.name || 'Error de serialización',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			_error: true,
		};
	}
}

/**
 * Serializa una lista de álbumes para API
 * @param albums Lista de álbumes a serializar
 * @returns Lista de objetos serializados
 */
export function serializeAlbums(albums: AlbumWithStats[]): Record<string, unknown>[] {
	return albums.map(serializeAlbum);
}

/**
 * Desserializa datos de álbum para uso en la aplicación
 * @param data Datos serializados
 * @returns Álbum deserializado o null si hay error
 */
export function deserializeAlbum(data: Record<string, unknown>): AlbumWithStats | null {
	try {
		// Convertir fechas si es necesario
		const createdAt = typeof data.createdAt === 'string' ? new Date(data.createdAt) : (data.createdAt as Date);
		const updatedAt = typeof data.updatedAt === 'string' ? new Date(data.updatedAt) : (data.updatedAt as Date);
		const lastImageAddedAt = data.lastImageAddedAt
			? typeof data.lastImageAddedAt === 'string'
				? new Date(data.lastImageAddedAt)
				: (data.lastImageAddedAt as Date)
			: null;
		const lastVideoAddedAt = data.lastVideoAddedAt
			? typeof data.lastVideoAddedAt === 'string'
				? new Date(data.lastVideoAddedAt)
				: (data.lastVideoAddedAt as Date)
			: null;

		// Construir objeto final
		const album: AlbumWithStats = {
			id: data.id as string,
			name: data.name as string,
			description: data.description as string | null,
			emoji: data.emoji as string | null,
			color: data.color as string | null,
			featuredImage: data.featuredImage as string | null,

			isFavorite: Boolean(data.isFavorite),
			totalImages: Number(data.totalImages) || 0,
			totalVideos: Number(data.totalVideos) || 0,
			totalSize: Number(data.totalSize) || 0,
			filters: data.filters as string | null,
			shortcut: data.shortcut as string | null,
			category: data.category as string | null,
			metadata: data.metadata as Record<string, any> | null,
			lastImageAddedAt,
			lastVideoAddedAt,
			createdAt,
			updatedAt,
			entityType: 'album' as const,
			stats: (data.stats as AlbumStatistics) || {
				imageCount: 0,
				videoCount: 0,
				totalSize: 0,
				lastModified: null,
				lastImageAddedAt: null,
				lastVideoAddedAt: null,
				totalMedia: 0,
				totalEntities: 0,
			},
		};

		return album;
	} catch {
		// Error silencioso, devolver null
		return null;
	}
}

/**
 * Desserializa una lista de datos de álbumes
 * @param data Lista de datos serializados
 * @returns Lista de álbumes deserializados
 */
export function deserializeAlbums(data: Record<string, unknown>[]): AlbumWithStats[] {
	return data.map(deserializeAlbum).filter((album): album is AlbumWithStats => album !== null);
}

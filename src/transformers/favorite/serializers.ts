/**
 * @file Serializadores para la entidad Favorite
 * @module transformers/favorite/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
    FavoriteWithImage
} from '@/types/entities/favorite';
import type { FileItem } from '@/types/file-item';

const serializersLogger = serverLogger.withContext('Favorite:Serializers');

/**
 * Transforma una imagen para ser utilizada en un favorito
 * @param image Imagen con datos básicos
 * @returns Objeto FileItem formateado
 */
export function transformImageToFileItem(image: any): FileItem {
    try {
        // Extraer dimensiones de metadata si existe
        let metadataObj: FileItem['metadata'] = {
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
                    serializersLogger.error('Error parsing metadata JSON:', error);
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
    } catch (error) {
        serializersLogger.error('Error transformando imagen para favorito:', error);
        return {
            id: image.id || 'unknown',
            name: image.name || 'Unknown Image',
            path: image.path || '',
            type: 'image',
            size: image.size || 0,
            width: image.width || 0,
            height: image.height || 0,
            src: image.id ? `api/images/${image.id}` : '',
            createdAt: image.createdAt || new Date(),
            updatedAt: image.updatedAt || new Date(),
        } as FileItem;
    }
}

/**
 * Convierte un favorito con imagen en un formato FavoriteWithImage
 * @param favorite Favorito base con imagen incluida
 * @returns Favorito con imagen transformada
 */
export function toFavoriteWithImage(favorite: any): FavoriteWithImage {
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
            image: transformImageToFileItem(favorite.image || {}),
        } as FavoriteWithImage;
    }
}

/**
 * Convierte una lista de favoritos con imágenes
 * @param favorites Lista de favoritos con imágenes
 * @returns Lista de favoritos transformados
 */
export function toFavoritesWithImages(favorites: any[]): FavoriteWithImage[] {
    return favorites.map(toFavoriteWithImage);
}
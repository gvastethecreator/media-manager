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
 * Transforma una imagen para ser utilizada en un favorito
 * @param image Imagen con datos básicos
 * @returns Objeto FileItem formateado
 */
export function transformImageToFileItem(image: any): FileItem {
    try {
        // Preparar el objeto de metadatos como string JSON
        let metadataContent: MetadataContent = {
            dimensions: {
                width: image.width || 0,
                height: image.height || 0,
            }
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
                    metadataContent.exif = {
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
                        metadataContent.exif.gps = {
                            latitude: gpsData.latitude as number,
                            longitude: gpsData.longitude as number,
                            altitude: gpsData.altitude as number,
                        };
                    }
                }
            }
        }

        // Convertir el metadataContent a string JSON para FileItem
        const metadataString = JSON.stringify(metadataContent);

        const stats = image.stats ? image.stats : {
            id: `stats-${image.id || Date.now()}`,
            imageId: image.id,
            views: 0,
            downloads: 0,
            lastViewed: image.updatedAt || new Date(),
            createdAt: image.createdAt || new Date(),
            updatedAt: image.updatedAt || new Date()
        };

        return {
            id: image.id,
            hash: image.hash || '',
            name: image.name,
            path: image.path,
            type: 'image',
            size: image.size,
            width: image.width || 0,
            height: image.height || 0,
            metadata: metadataString,
            thumbnail: image.thumbnail || null,
            thumbnailSize: image.thumbnailSize || null,
            thumbnailWidth: image.thumbnailWidth || null,
            thumbnailHeight: image.thumbnailHeight || null,
            thumbnailError: null,
            thumbnailErrorAt: null,
            thumbnailOptimizedAt: null,
            isPublic: image.isPublic || false,
            isFavorite: image.isFavorite || false,
            folderId: image.folderId || '',
            createdAt: image.createdAt || new Date(),
            updatedAt: image.updatedAt || new Date(),
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
            albums: image.albums || [],
            characters: image.characters || [],
            places: image.places || [],
            worldItems: image.worldItems || [],
            concepts: image.concepts || [],
            prompts: image.prompts || [],
            notes: image.notes || [],
            stats
        };
    } catch (error) {
        serializersLogger.error('Error transformando imagen para favorito:', error);
        // Retornar una versión mínima como fallback
        return {
            id: image.id || 'unknown',
            hash: '',
            name: image.name || 'Unknown Image',
            path: image.path || '',
            type: 'image',
            size: image.size || 0,
            width: image.width || 0,
            height: image.height || 0,
            metadata: null,
            thumbnail: null,
            thumbnailSize: null,
            thumbnailWidth: null,
            thumbnailHeight: null,
            thumbnailError: null,
            thumbnailErrorAt: null,
            thumbnailOptimizedAt: null,
            isPublic: false,
            isFavorite: false,
            folderId: '',
            createdAt: image.createdAt || new Date(),
            updatedAt: image.updatedAt || new Date(),
            collections: [],
            tags: [],
            albums: [],
            characters: [],
            places: [],
            worldItems: [],
            concepts: [],
            prompts: [],
            notes: [],
            stats: {
                id: `stats-fallback-${Date.now()}`,
                imageId: image.id || 'unknown',
                views: 0,
                downloads: 0,
                lastViewed: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            }
        };
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
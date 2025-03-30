/**
 * @file Serializadores para la entidad Album
 * @module entities/album/serializers
 */

import { logger } from '@/lib/logger';
import { AlbumSchema, AlbumSettingsSchema } from '@/types/entities/album/schema';
import { AlbumBase, AlbumComplete } from '@/types/entities/album/types';

/**
 * Extiende un álbum con campos deserializados y relaciones
 */
export function extendAlbum(album: AlbumBase): AlbumComplete {
  try {
    // Inicializar objeto de conteo
    const extendedAlbum: AlbumComplete = {
      ...album,
      _count: {
        images: 0,
        videos: 0,
        collections: 0,
        tags: 0,
        characters: 0,
        places: 0,
        worldItems: 0,
        concepts: 0,
        prompts: 0,
        notes: 0,
        wildcards: 0,
        properties: 0,
        groups: 0
      }
    };

    return extendedAlbum;
  } catch (error) {
    logger.error('Error extendiendo el álbum:', error);
    // Devolver el álbum original si hay error
    return {
      ...album,
      _count: {}
    } as AlbumComplete;
  }
}

/**
 * Deserializa los ajustes JSON de un álbum
 */
export function deserializeAlbumSettings(settingsJson: string): Record<string, any> {
  try {
    if (!settingsJson) return {};

    const settings = JSON.parse(settingsJson);

    // Validar con Zod (opcional)
    try {
      AlbumSettingsSchema.parse(settings);
    } catch (validationError) {
      logger.warn('Ajustes de álbum no válidos:', validationError);
    }

    return settings;
  } catch (error) {
    logger.error('Error deserializando ajustes del álbum:', error);
    return {};
  }
}

/**
 * Serializa los ajustes de un álbum a JSON
 */
export function serializeAlbumSettings(settings: Record<string, any>): string {
  try {
    return JSON.stringify(settings || {});
  } catch (error) {
    logger.error('Error serializando ajustes del álbum:', error);
    return '{}';
  }
}

/**
 * Deserializa los filtros JSON de un álbum
 */
export function deserializeAlbumFilters(filtersJson: string): Record<string, any> {
  try {
    if (!filtersJson) return {};
    return JSON.parse(filtersJson);
  } catch (error) {
    logger.error('Error deserializando filtros del álbum:', error);
    return {};
  }
}

/**
 * Serializa los filtros de un álbum a JSON
 */
export function serializeAlbumFilters(filters: Record<string, any>): string {
  try {
    return JSON.stringify(filters || {});
  } catch (error) {
    logger.error('Error serializando filtros del álbum:', error);
    return '{}';
  }
}

/**
 * Deserializa los metadatos JSON de un álbum
 */
export function deserializeAlbumMetadata(metadataJson: string | null): Record<string, any> {
  try {
    if (!metadataJson) return {};
    return JSON.parse(metadataJson);
  } catch (error) {
    logger.error('Error deserializando metadatos del álbum:', error);
    return {};
  }
}

/**
 * Serializa los metadatos de un álbum a JSON
 */
export function serializeAlbumMetadata(metadata: Record<string, any> | null): string | null {
  try {
    if (!metadata) return null;
    return JSON.stringify(metadata);
  } catch (error) {
    logger.error('Error serializando metadatos del álbum:', error);
    return null;
  }
}

/**
 * Valida un álbum usando el esquema definido
 */
export function validateAlbum(album: AlbumBase): boolean {
  try {
    AlbumSchema.parse(album);
    return true;
  } catch (error) {
    logger.error('Error validando álbum:', error);
    return false;
  }
}

/**
 * Calcula estadísticas para un álbum
 */
export function calculateAlbumStats(album: AlbumComplete): {
  usageCount: number;
  relatedEntitiesCount: number;
  imageCount: number;
  videoCount: number;
} {
  try {
    const counts = album._count || {};

    // Contar imágenes y videos
    const imageCount = counts.images || 0;
    const videoCount = counts.videos || 0;

    // Sumar todas las entidades relacionadas excepto imágenes y videos
    const relatedEntitiesCount =
      (counts.collections || 0) +
      (counts.tags || 0) +
      (counts.characters || 0) +
      (counts.places || 0) +
      (counts.worldItems || 0) +
      (counts.concepts || 0) +
      (counts.prompts || 0) +
      (counts.notes || 0) +
      (counts.wildcards || 0) +
      (counts.properties || 0) +
      (counts.groups || 0);

    // El conteo de uso incluye todo
    const usageCount = imageCount + videoCount + relatedEntitiesCount;

    return {
      usageCount,
      relatedEntitiesCount,
      imageCount,
      videoCount
    };
  } catch (error) {
    logger.error('Error calculando estadísticas del álbum:', error);
    return {
      usageCount: 0,
      relatedEntitiesCount: 0,
      imageCount: 0,
      videoCount: 0
    };
  }
}
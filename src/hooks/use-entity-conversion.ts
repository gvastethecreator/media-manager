/**
 * @file Hook para conversión de tipos legacy a tipos optimizados
 * @module hooks/use-entity-conversion
 * @description Facilita la migración gradual de FileItem a EntityWithStats
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type { FileItem } from '@/types/files';
import type { EntityWithStats } from '@/types/migration';
import { useCallback } from 'react';

const logger = clientLogger.withContext('useEntityConversion');

/**
 * 🔄 Hook para convertir FileItem legacy a EntityWithStats
 *
 * @example
 * ```tsx
 * const { convertFileItems, convertSingleItem } = useEntityConversion();
 * const entities = convertFileItems(fileItems);
 * ```
 */
export function useEntityConversion() {
  /**
   * Convierte un FileItem a EntityWithStats
   * NOTA: Esta es una conversión temporal hasta que se actualicen los server actions
   */
  const convertSingleItem = useCallback((fileItem: FileItem): EntityWithStats | null => {
    try {
      // Detectar tipo basándose en propiedades específicas
      if ('width' in fileItem && 'height' in fileItem && 'hash' in fileItem) {
        // Es una imagen
        return {
          ...fileItem,
          statistics: {
            totalAlbums: fileItem.albums?.length || 0,
            totalCollections: fileItem.collections?.length || 0,
            totalTags: fileItem.tags?.length || 0,
            totalCharacters: fileItem.characters?.length || 0,
            totalPlaces: fileItem.places?.length || 0,
            totalWorldItems: fileItem.worldItems?.length || 0,
            totalConcepts: fileItem.concepts?.length || 0,
            totalPrompts: fileItem.prompts?.length || 0,
            totalNotes: fileItem.notes?.length || 0,
            totalWildcards: fileItem.wildcards?.length || 0,
            totalProperties: fileItem.properties?.length || 0,
            totalGroups: fileItem.groups?.length || 0,
            totalAssociations: 0, // Se calculará
            megapixels: (fileItem.width * fileItem.height) / 1_000_000,
            aspectRatio: fileItem.width / fileItem.height,
            fileSize: fileItem.size / (1024 * 1024),
            dimensions: `${fileItem.width}x${fileItem.height}`,
            views: 0,
            likes: 0,
            downloads: 0,
            shares: 0,
            qualityScore: 75,
            technicalGrade: 'B' as const,
            colorTemperature: 'neutral' as const,
            aiConfidence: 0,
            autoTags: [],
            duplicateStatus: 'unique' as const,
            lastUpdated: new Date(),
          },
          thumbnailUrl: fileItem.thumbnail || `/api/images/${fileItem.id}/thumbnail`,
          fullUrl: `/api/images/${fileItem.id}/full`,
          displayName: fileItem.name || `Image ${fileItem.id.slice(-8)}`,
          formattedSize: formatFileSize(fileItem.size),
          formattedDimensions: `${fileItem.width} × ${fileItem.height}`,
          aspectRatioLabel: getAspectRatioLabel(fileItem.width / fileItem.height),
          parsedMetadata: null,
        } as any; // Temporal hasta completar migración
      }

      if ('duration' in fileItem && 'fps' in fileItem) {
        // Es un video
        return {
          ...fileItem,
          statistics: {
            // Similar a imagen pero con campos específicos de video
            duration: fileItem.duration,
            fps: fileItem.fps,
            codec: fileItem.codec || 'unknown',
            resolution: `${fileItem.width}x${fileItem.height}`,
            // ... otros campos
          },
        } as any;
      }

      // Para otros tipos, intentar mapear lo mejor posible
      logger.warn('Tipo de FileItem no reconocido, usando conversión genérica', fileItem);
      return fileItem as any;

    } catch (error) {
      logger.error('Error convirtiendo FileItem:', error);
      return null;
    }
  }, []);

  /**
   * Convierte un array de FileItems a EntityWithStats[]
   */
  const convertFileItems = useCallback((fileItems: FileItem[]): EntityWithStats[] => {
    return fileItems
      .map(convertSingleItem)
      .filter((entity): entity is EntityWithStats => entity !== null);
  }, [convertSingleItem]);

  /**
   * Convierte y agrupa por tipo
   */
  const convertAndGroupByType = useCallback((fileItems: FileItem[]) => {
    const entities = convertFileItems(fileItems);
    const grouped: Record<string, EntityWithStats[]> = {};

    for (const entity of entities) {
      // Detectar tipo usando type guards (temporalmente usando propiedades)
      let type = 'unknown';
      if ('width' in entity && 'height' in entity) type = 'image';
      else if ('duration' in entity && 'fps' in entity) type = 'video';
      else if ('autoReindex' in entity) type = 'folder';
      // ... más detecciones

      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(entity);
    }

    return grouped;
  }, [convertFileItems]);

  return {
    convertSingleItem,
    convertFileItems,
    convertAndGroupByType,
  };
}

// Funciones auxiliares (deberían moverse a utils)
function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} bytes`;
}

function getAspectRatioLabel(aspectRatio: number): string {
  if (aspectRatio >= 0.9 && aspectRatio <= 1.1) return '1:1';
  if (aspectRatio >= 1.3 && aspectRatio <= 1.4) return '4:3';
  if (aspectRatio >= 1.7 && aspectRatio <= 1.8) return '16:9';
  if (aspectRatio >= 2.3 && aspectRatio <= 2.4) return '21:9';
  return `${aspectRatio.toFixed(2)}:1`;
}
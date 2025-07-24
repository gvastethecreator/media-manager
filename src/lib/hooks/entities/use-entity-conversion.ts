/**
 * @file Hook para conversión de tipos legacy a tipos optimizados
 * @module hooks/use-entity-conversion
 * @description Facilita la migración gradual de FileItem a EntityWithStats
 */

import { useCallback } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';
import { formatFileSize } from '@/lib/utils/format.utils';

import type { EntityWithStats } from '@/types/migration';

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
	const convertSingleItem = useCallback((fileItem: EntityWithStats): EntityWithStats | null => {
		try {
			// Detectar tipo basándose en propiedades específicas
			if ('width' in fileItem && 'height' in fileItem && 'hash' in fileItem) {
				// Es una imagen
				return {
					...fileItem,
					entityType: 'image' as const,
					stats: {
						viewCount: 0,
						downloadCount: 0,
						likeCount: 0,
						commentCount: 0,
						tagCount: fileItem.tags?.length || 0,
						albumCount: fileItem.albums?.length || 0,
						collectionCount: fileItem.collections?.length || 0,
						characterCount: fileItem.characters?.length || 0,
						placeCount: fileItem.places?.length || 0,
						worldItemCount: fileItem.worldItems?.length || 0,
						conceptCount: fileItem.concepts?.length || 0,
						promptCount: fileItem.prompts?.length || 0,
						noteCount: fileItem.notes?.length || 0,
						wildcardCount: fileItem.wildcards?.length || 0,
						propertyCount: fileItem.properties?.length || 0,
						groupCount: fileItem.groups?.length || 0,
					},
					thumbnailUrl: fileItem.thumbnail || `/api/images/${fileItem.id}/thumbnail`,
					fullUrl: `/api/images/${fileItem.id}/full`,
				} as any; // Temporal hasta completar migración
			}

			if ('duration' in fileItem && 'fps' in fileItem) {
				// Es un video
				return {
					...fileItem,
					entityType: 'video' as const,
					stats: {
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
	const convertFileItems = useCallback(
		(fileItems: EntityWithStats[]): EntityWithStats[] => {
			return fileItems.map(convertSingleItem).filter((entity): entity is EntityWithStats => entity !== null);
		},
		[convertSingleItem]
	);

	/**
	 * Convierte y agrupa por tipo
	 */
	const convertAndGroupByType = useCallback(
		(fileItems: EntityWithStats[]) => {
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
		},
		[convertFileItems]
	);

	return {
		convertSingleItem,
		convertFileItems,
		convertAndGroupByType,
	};
}

// formatFileSize se ha movido a @/lib/utils/format.utils.ts para evitar duplicación

function getAspectRatioLabel(aspectRatio: number): string {
	if (aspectRatio >= 0.9 && aspectRatio <= 1.1) return '1:1';
	if (aspectRatio >= 1.3 && aspectRatio <= 1.4) return '4:3';
	if (aspectRatio >= 1.7 && aspectRatio <= 1.8) return '16:9';
	if (aspectRatio >= 2.3 && aspectRatio <= 2.4) return '21:9';
	return `${aspectRatio.toFixed(2)}:1`;
}

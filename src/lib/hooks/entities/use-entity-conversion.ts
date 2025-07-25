/**
 * @file Hook para conversión de tipos legacy a tipos optimizados
 * @module hooks/use-entity-conversion
 * @description Facilita la migración gradual de FileItem a EntityWithStats
 */

import { useCallback } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';
import { formatFileSize } from '@/lib/utils/format.utils';

import type { AnyEntityWithStats } from '@/types/migration';
import { isAlbumWithStats, isAudioWithStats, isCharacterWithStats, isCollectionWithStats, isConceptWithStats, isDocumentWithStats, isFolderWithStats, isGroupWithStats, isImageWithStats, isNoteWithStats, isPlaceWithStats, isPromptWithStats, isPropertyWithStats, isTagWithStats, isVideoWithStats, isWildcardWithStats, isWorldItemWithStats } from '@/types/migration';
import type { ImageWithStats } from '@/types/entities/image';
import type { VideoWithStats } from '@/types/entities/video';
import type { FolderWithStats } from '@/types/entities/folder';
import type { TagWithStats } from '@/types/entities/tag';
import type { PlaceWithStats } from '@/types/entities/place';
import type { WorldItemWithStats } from '@/types/entities/world-item';
import type { NoteWithStats } from '@/types/entities/note';
import type { PropertyWithStats } from '@/types/entities/property';
import type { WildcardWithStats } from '@/types/entities/wildcard';
import type { AudioWithStats } from '@/types/entities/audio';
import type { DocumentWithStats } from '@/types/entities/document';
import type { CollectionWithStats } from '@/types/entities/collection';
import type { AlbumWithStats } from '@/types/entities/album';
import type { CharacterWithStats } from '@/types/entities/character';
import type { ConceptWithStats } from '@/types/entities/concept';
import type { PromptWithStats } from '@/types/entities/prompt';
import type { GroupWithStats } from '@/types/entities/group';

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
	const convertSingleItem = useCallback((fileItem: any): AnyEntityWithStats | null => {
		try {
			// Usar type guards para determinar el tipo específico y acceder a sus propiedades
			if (isImageWithStats(fileItem)) {
				return {
					...fileItem,
					entityType: 'image',
					stats: fileItem.stats || {
						viewCount: 0,
						downloadCount: 0,
						likeCount: 0,
						commentCount: 0,
						tagCount: fileItem._count?.tags || 0,
						albumCount: fileItem._count?.albums || 0,
						collectionCount: fileItem._count?.collections || 0,
						characterCount: fileItem._count?.characters || 0,
						placeCount: fileItem._count?.places || 0,
						worldItemCount: fileItem._count?.worldItems || 0,
						conceptCount: fileItem._count?.concepts || 0,
						promptCount: fileItem._count?.prompts || 0,
						noteCount: fileItem._count?.notes || 0,
						wildcardCount: fileItem._count?.wildcards || 0,
						propertyCount: fileItem._count?.properties || 0,
						groupCount: fileItem._count?.groups || 0,
						totalAssociations: fileItem._count ? Object.values(fileItem._count).reduce((sum, count) => sum + count, 0) : 0,
					},
					thumbnailUrl: fileItem.thumbnailUrl || `/api/images/${fileItem.id}/thumbnail`,
					fullUrl: `/api/images/${fileItem.id}/full`,
				} as ImageWithStats;
			} else if (isVideoWithStats(fileItem)) {
				return {
					...fileItem,
					entityType: 'video',
					stats: fileItem.stats || {
						duration: fileItem.duration,
						fps: fileItem.fps,
						codec: fileItem.codec || 'unknown',
						resolution: `${fileItem.width}x${fileItem.height}`,
						// ... otros campos de video
					},
				} as VideoWithStats;
			} else if (isFolderWithStats(fileItem)) {
				return { ...fileItem, entityType: 'folder' } as FolderWithStats;
			} else if (isTagWithStats(fileItem)) {
				return { ...fileItem, entityType: 'tag' } as TagWithStats;
			} else if (isPlaceWithStats(fileItem)) {
				return { ...fileItem, entityType: 'place' } as PlaceWithStats;
			} else if (isWorldItemWithStats(fileItem)) {
				return { ...fileItem, entityType: 'world-item' } as WorldItemWithStats;
			} else if (isNoteWithStats(fileItem)) {
				return { ...fileItem, entityType: 'note' } as NoteWithStats;
			} else if (isPropertyWithStats(fileItem)) {
				return { ...fileItem, entityType: 'property' } as PropertyWithStats;
			} else if (isWildcardWithStats(fileItem)) {
				return { ...fileItem, entityType: 'wildcard' } as WildcardWithStats;
			} else if (isAudioWithStats(fileItem)) {
				return { ...fileItem, entityType: 'audio' } as AudioWithStats;
			} else if (isDocumentWithStats(fileItem)) {
				return { ...fileItem, entityType: 'document' } as DocumentWithStats;
			} else if (isCollectionWithStats(fileItem)) {
				return { ...fileItem, entityType: 'collection' } as CollectionWithStats;
			} else if (isAlbumWithStats(fileItem)) {
				return { ...fileItem, entityType: 'album' } as AlbumWithStats;
			} else if (isCharacterWithStats(fileItem)) {
				return { ...fileItem, entityType: 'character' } as CharacterWithStats;
			} else if (isConceptWithStats(fileItem)) {
				return { ...fileItem, entityType: 'concept' } as ConceptWithStats;
			} else if (isPromptWithStats(fileItem)) {
				return { ...fileItem, entityType: 'prompt' } as PromptWithStats;
			} else if (isGroupWithStats(fileItem)) {
				return { ...fileItem, entityType: 'group' } as GroupWithStats;
			}

			logger.warn('Tipo de FileItem no reconocido, usando conversión genérica', fileItem);
			return fileItem as AnyEntityWithStats;
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
		(fileItems: AnyEntityWithStats[]) => {
			const entities = convertFileItems(fileItems);
			const grouped: Record<string, AnyEntityWithStats[]> = {};

			for (const entity of entities) {
				// Detectar tipo usando type guards (temporalmente usando propiedades)
				let type = entity.entityType || 'unknown';

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

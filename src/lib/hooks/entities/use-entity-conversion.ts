/**
 * @file Hook para conversión de tipos legacy a tipos optimizados
 * @module hooks/use-entity-conversion
 * @description Facilita la migración gradual de FileItem a EntityWithStats
 */

import { useCallback } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';
import type { AnyEntityWithStats } from '@/types/entities';
import type { AlbumWithStats } from '@/types/entities/album';
import type { AudioWithStats } from '@/types/entities/audio';
import type { CharacterWithStats } from '@/types/entities/character';
import type { CollectionWithStats } from '@/types/entities/collection';
import type { ConceptWithStats } from '@/types/entities/concept';
import type { DocumentWithStats } from '@/types/entities/document';
import type { FolderWithStats } from '@/types/entities/folder';
import type { GroupWithStats } from '@/types/entities/group';
import type { ImageWithStats } from '@/types/entities/image';
import type { NoteWithStats } from '@/types/entities/note';
import type { PlaceWithStats } from '@/types/entities/place';
import type { PromptWithStats } from '@/types/entities/prompt';
import type { PropertyWithStats } from '@/types/entities/property';
import type { TagWithStats } from '@/types/entities/tag';
import type { VideoWithStats } from '@/types/entities/video';
import type { WildcardWithStats } from '@/types/entities/wildcard';
import type { WorldItemWithStats } from '@/types/entities/world-item';
import {
	isAlbumWithStats,
	isAudioWithStats,
	isCharacterWithStats,
	isCollectionWithStats,
	isConceptWithStats,
	isDocumentWithStats,
	isFolderWithStats,
	isGroupWithStats,
	isImageWithStats,
	isNoteWithStats,
	isPlaceWithStats,
	isPromptWithStats,
	isPropertyWithStats,
	isTagWithStats,
	isVideoWithStats,
	isWildcardWithStats,
	isWorldItemWithStats,
} from '@/types/migration';

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
						totalAssociations: fileItem._count
							? Object.values(fileItem._count).reduce((sum, count) => sum + count, 0)
							: 0,
					},
					thumbnailUrl: fileItem.thumbnailUrl || `/api/images/${fileItem.id}/thumbnail`,
					fullUrl: `/api/images/${fileItem.id}/full`,
				} as ImageWithStats;
			}
			if (isVideoWithStats(fileItem)) {
				return {
					...fileItem,
					entityType: 'video',
					stats: fileItem.stats || {
						duration: (fileItem as any).duration || 0,
						fps: (fileItem as any).fps || 30,
						codec: (fileItem as any).codec || 'unknown',
						resolution: `${fileItem.width || 0}x${fileItem.height || 0}`,
						// ... otros campos de video
					},
				} as VideoWithStats;
			}
			if (isFolderWithStats(fileItem)) {
				return { ...fileItem, entityType: 'folder' } as FolderWithStats;
			}
			if (isTagWithStats(fileItem)) {
				return { ...fileItem, entityType: 'tag' } as TagWithStats;
			}
			if (isPlaceWithStats(fileItem)) {
				return { ...fileItem, entityType: 'place' } as PlaceWithStats;
			}
			if (isWorldItemWithStats(fileItem)) {
				return { ...fileItem, entityType: 'world-item' } as WorldItemWithStats;
			}
			if (isNoteWithStats(fileItem)) {
				return { ...fileItem, entityType: 'note' } as NoteWithStats;
			}
			if (isPropertyWithStats(fileItem)) {
				return { ...fileItem, entityType: 'property' } as PropertyWithStats;
			}
			if (isWildcardWithStats(fileItem)) {
				return { ...fileItem, entityType: 'wildcard' } as WildcardWithStats;
			}
			if (isAudioWithStats(fileItem)) {
				return { ...fileItem, entityType: 'audio' } as AudioWithStats;
			}
			if (isDocumentWithStats(fileItem)) {
				return { ...fileItem, entityType: 'document' } as DocumentWithStats;
			}
			if (isCollectionWithStats(fileItem)) {
				return { ...fileItem, entityType: 'collection' } as CollectionWithStats;
			}
			if (isAlbumWithStats(fileItem)) {
				return { ...fileItem, entityType: 'album' } as AlbumWithStats;
			}
			if (isCharacterWithStats(fileItem)) {
				return { ...fileItem, entityType: 'character' } as CharacterWithStats;
			}
			if (isConceptWithStats(fileItem)) {
				return { ...fileItem, entityType: 'concept' } as ConceptWithStats;
			}
			if (isPromptWithStats(fileItem)) {
				return { ...fileItem, entityType: 'prompt' } as PromptWithStats;
			}
			if (isGroupWithStats(fileItem)) {
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
		(fileItems: AnyEntityWithStats[]): AnyEntityWithStats[] => {
			return fileItems.map(convertSingleItem).filter((entity): entity is AnyEntityWithStats => entity !== null);
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
				const type = entity.entityType || 'unknown';

				if (!grouped[type]) {
					grouped[type] = [];
				}
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
	if (aspectRatio >= 0.9 && aspectRatio <= 1.1) {
		return '1:1';
	}
	if (aspectRatio >= 1.3 && aspectRatio <= 1.4) {
		return '4:3';
	}
	if (aspectRatio >= 1.7 && aspectRatio <= 1.8) {
		return '16:9';
	}
	if (aspectRatio >= 2.3 && aspectRatio <= 2.4) {
		return '21:9';
	}
	return `${aspectRatio.toFixed(2)}:1`;
}

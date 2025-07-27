/**
 * @file Tipos base de entidades con estadísticas
 * @module types/entities/entity.types
 */

import type { EntityType } from './entities/index';

// Tipo específico para entityType en entidades con estadísticas
export type EntityStatsTypeValue =
	| 'image'
	| 'video'
	| 'folder'
	| 'tag'
	| 'place'
	| 'world-item'
	| 'note'
	| 'property'
	| 'wildcard'
	| 'audio'
	| 'document'
	| 'collection'
	| 'album'
	| 'character'
	| 'concept'
	| 'prompt'
	| 'group'
	| 'uploaded-image';

export interface EntityBase {
	id: string;
	name: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface EntityStats {
	imageCount?: number;
	videoCount?: number;
	albumCount?: number;
	collectionCount?: number;
	tagCount?: number;
	characterCount?: number;
	placeCount?: number;
	worldItemCount?: number;
	conceptCount?: number;
	promptCount?: number;
	noteCount?: number;
	wildcardCount?: number;
	propertyCount?: number;
	groupCount?: number;
	totalItems?: number;
	totalAssociations?: number;
	lastUpdated?: Date;
}

export interface EntityWithStats<TStats = EntityStats> extends EntityBase {
	entityType: EntityStatsTypeValue;
	stats: TStats;
}

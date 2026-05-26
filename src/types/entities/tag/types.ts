/**
 * @file Tipos para Tag
 * @module types/entities/tag/types
 */

import type { EntityBase } from '@/types/entities/entity.types';
import type { TagWithStats } from './base';

// Re-export TagWithStats for external use
export type { TagWithStats } from './base';

export interface TagBase extends EntityBase {
	category: string | null;
	color: string | null;
	description: string | null;
	emoji: string | null;
	isFavorite: boolean;
	name: string;
	totalImages: number;
	totalVideos: number;
}

export interface TagCreateInput {
	category?: string | null;
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	name: string;
	shortcut?: string | null;
}

export interface TagUpdateInput extends Partial<TagCreateInput> {}

export interface TagFilters {
	category?: string;
	hasAlbum?: boolean;
	hasCharacter?: boolean;
	hasCollection?: boolean;
	hasConcept?: boolean;
	hasGroup?: boolean;
	hasImage?: boolean;
	hasNote?: boolean;
	hasPlace?: boolean;
	hasPrompt?: boolean;
	hasProperty?: boolean;
	hasVideo?: boolean;
	hasWildcard?: boolean;
	hasWorldItem?: boolean;
	isFavorite?: boolean;
	search?: string;
}

export enum TagSortCriteria {
	NAME_ASC = 'name:asc',
	NAME_DESC = 'name:desc',
	CREATED_ASC = 'createdAt:asc',
	CREATED_DESC = 'createdAt:desc',
	UPDATED_ASC = 'updatedAt:asc',
	UPDATED_DESC = 'updatedAt:desc',
	USAGE_ASC = 'usage:asc',
	USAGE_DESC = 'usage:desc',
	POPULARITY_ASC = 'popularity:asc',
	POPULARITY_DESC = 'popularity:desc',
}

// TagStatistics y TagWithStats están definidos en base.ts
// para evitar duplicación y conflictos de tipos

export interface TagPaginationOptions {
	limit?: number;
	page?: number;
	sortBy?: TagSortCriteria;
	sortDirection?: 'asc' | 'desc';
}

export interface TagsResponse {
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
	tags: TagWithStats[];
}

export type TagComplete = TagWithStats;
export type TagWithCounts = TagWithStats; // Alias para compatibilidad

export interface TagPreview extends Pick<TagBase, 'id' | 'name' | 'color' | 'emoji'> {
	stats?: {
		imageCount?: number;
	};
}

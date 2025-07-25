/**
 * @file Tipos para Tag
 * @module types/entities/tag/types
 */

import type { EntityBase, EntityWithStats } from '@/types/entities/entity.types';

export interface TagBase extends EntityBase {
	name: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	category: string | null;
	isFavorite: boolean;
	totalImages: number;
	totalVideos: number;
}

export interface TagCreateInput extends Omit<TagBase, 'id' | 'createdAt' | 'updatedAt'> {}
export interface TagUpdateInput extends Partial<TagCreateInput> {}

export interface TagFilters {
	search?: string;
	isFavorite?: boolean;
	category?: string;
	hasImage?: boolean;
	hasVideo?: boolean;
	hasAlbum?: boolean;
	hasCollection?: boolean;
	hasCharacter?: boolean;
	hasPlace?: boolean;
	hasWorldItem?: boolean;
	hasConcept?: boolean;
	hasPrompt?: boolean;
	hasNote?: boolean;
	hasWildcard?: boolean;
	hasProperty?: boolean;
	hasGroup?: boolean;
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
	page?: number;
	limit?: number;
	sortBy?: TagSortCriteria;
	sortDirection?: 'asc' | 'desc';
}

export interface TagsResponse {
	tags: TagWithStats[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
}

export type TagComplete = TagWithStats;

export interface TagPreview extends Pick<TagBase, 'id' | 'name' | 'color' | 'emoji'> {
	stats?: {
		imageCount?: number;
	};
}

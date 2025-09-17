/**
 * @file Tipos para Tag
 * @module types/entities/tag/types
 */

import type { TagBase, TagWithStats } from './base';
import { TagSortCriteria } from './enums';

// Re-export TagWithStats for external use
export type { TagWithStats } from './base';

// Reutilizar TagBase canónico: crear inputs específicos sin duplicar campos
export type TagCreateInput = Omit<TagBase, 'id' | 'createdAt' | 'updatedAt' | 'featuredImage' | 'shortcut'> & {
	featuredImage?: string | null;
	shortcut?: string | null;
};
export type TagUpdateInput = Partial<TagCreateInput>;

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
export type TagWithCounts = TagWithStats; // Alias para compatibilidad

export interface TagPreview extends Pick<TagBase, 'id' | 'name' | 'color' | 'emoji'> {
	stats?: {
		imageCount?: number;
	};
}

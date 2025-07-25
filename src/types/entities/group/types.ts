/**
 * @file Tipos para entidades de Group
 * @module types/entities/group/types
 */

import type { ImageBase } from '../image/base';
import type { GroupBase } from './base';

// Re-export GroupBase and GroupWithStats from base file
export type { GroupBase, GroupStatistics, GroupWithStats } from './base';

export interface CreateGroupInput {
	name: string;
	description?: string;
	emoji?: string;
	color?: string;
	category?: string;
	isFavorite?: boolean;
	shortcut?: string;
	sortBy?: string;
	featuredImage?: string;
	filters?: any;
}

export interface UpdateGroupInput {
	name?: string;
	description?: string;
	emoji?: string;
	color?: string;
	category?: string;
	isFavorite?: boolean;
	shortcut?: string;
	sortBy?: string;
	featuredImage?: string;
	filters?: any;
}

export type GroupSortKey = 'name' | 'category' | 'createdAt';

export interface GroupFilters {
	search?: string;
	hasImages?: boolean;
	sortBy?:
		| 'name'
		| 'createdAt'
		| 'updatedAt'
		| 'imageCount'
		| 'emoji'
		| 'color'
		| 'isFavorite'
		| 'shortcut'
		| 'category'
		| 'filters'
		| 'featuredImage';
	sortOrder?: 'asc' | 'desc';
}

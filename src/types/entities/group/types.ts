/**
 * @file Tipos para entidades de Group
 * @module types/entities/group/types
 */

import type { ImageBase } from '../image/base';

export interface GroupBase {
	id: string;
	name: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateGroupInput {
	name: string;
	description?: string;
}

export interface UpdateGroupInput {
	name?: string;
	description?: string;
}

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

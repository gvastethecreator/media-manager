/**
 * @file Tipos para entidades de Group
 * @module types/entities/group/types
 */

import type { ImageBase } from '../image/base';
import type { GroupBase } from './base';

// Re-export GroupBase and GroupWithStats from base file
export type { GroupBase, GroupStatistics, GroupWithStats } from './base';

// Nombre canónico con prefijo Group para evitar ambigüedades en re-exportaciones
export interface GroupCreateInput {
	category?: string;
	color?: string;
	description?: string;
	emoji?: string;
	featuredImage?: string;
	filters?: any;
	isFavorite?: boolean;
	name: string;
	shortcut?: string;
	sortBy?: string;
}

export interface GroupUpdateInput {
	category?: string;
	color?: string;
	description?: string;
	emoji?: string;
	featuredImage?: string;
	filters?: any;
	isFavorite?: boolean;
	name?: string;
	shortcut?: string;
	sortBy?: string;
}

// Alias retro‑compatibles (si algún código antiguo usa los nombres sin prefijo)
export type CreateGroupInput = GroupCreateInput; // TODO: eliminar tras migración completa
export type UpdateGroupInput = GroupUpdateInput; // TODO: eliminar tras migración completa

export type GroupSortKey = 'name' | 'category' | 'createdAt';

export interface GroupFilters {
	hasImages?: boolean;
	search?: string;
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

export interface GroupRelations {
	albums?: any[];
	characters?: any[];
	collections?: any[];
	concepts?: any[];
	images?: ImageBase[];
	notes?: any[];
	places?: any[];
	prompts?: any[];
	properties?: any[];
	tags?: any[];
	wildcards?: any[];
	worldItems?: any[];
}

export interface GroupSearchResult {
	groups: GroupBase[];
	hasMore: boolean;
	limit: number;
	page: number;
	total: number;
}

export interface GroupCoreSlice {
	error: string | null;
	groups: GroupBase[];
	loading: boolean;
	selectedGroupId: string | null;
}

export interface GroupDisplayState {
	filters: GroupFilters;
	selectedItems: string[];
	showFavorites: boolean;
	sortBy: string;
	sortOrder: 'asc' | 'desc';
	viewMode: 'grid' | 'list' | 'detail';
}

export interface GroupViewConfig {
	cardSize: 'small' | 'medium' | 'large';
	compactView: boolean;
	enableAnimations: boolean;
	gridColumns: number;
	groupBy: string | null;
	imageCount: number;
	showImages: boolean;
	showStats: boolean;
	sortBy: string;
	sortDirection: 'asc' | 'desc';
	viewType: 'grid' | 'list' | 'table';
}

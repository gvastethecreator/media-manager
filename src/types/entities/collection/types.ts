/**
 * @file Tipos para entidades de Collection
 * @module types/entities/collection/types
 */

import type { ImageBase } from '../image/base';

export interface CollectionEdition {
	name: string;
	year: number;
}

export interface CollectionBase {
	id: string;
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	isPublic: boolean; // Cambiado de isPrivate a isPublic
	createdAt: Date;
	updatedAt: Date;
}

export interface CollectionWithImages extends CollectionBase {
	images: ImageBase[];
}

export interface CollectionWithStats extends CollectionBase {
	stats: {
		totalImages: number;
		recentlyAdded: number;
		averageRating: number;
		totalSize: number;
	};
}

export interface CollectionWithRelations extends CollectionBase {
	images: ImageBase[];
	_count: {
		images: number;
	};
}

export interface CreateCollectionInput {
	name: string;
	description?: string;
	emoji?: string;
	color?: string;
	isPublic?: boolean; // Cambiado de isPrivate a isPublic
}

export interface UpdateCollectionInput {
	name?: string;
	description?: string;
	emoji?: string;
	color?: string;
	isPublic?: boolean; // Cambiado de isPrivate a isPublic
}

export interface CollectionFilter {
	field: string;
	value: any;
	operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'between';
}

export interface CollectionFilters {
	search?: string;
	isPublic?: boolean;
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
		| 'featuredImage'
		| 'url'
		| 'alternativeUrl'
		| 'sourceImage'
		| 'platform'
		| 'price'
			| 'network'
		| 'tokenId'
		| 'tokenAddress'
		| 'contractAddress'
		| 'contractType'
		| 'editions';
	sortOrder?: 'asc' | 'desc';
}

export interface CollectionViewConfig {
	gridColumns: number;
	cardSize: 'small' | 'medium' | 'large';
}

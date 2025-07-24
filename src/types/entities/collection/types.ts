/**
 * @file Tipos para entidades de Collection
 * @module types/entities/collection/types
 */

import { CollectionSortOption } from './enums';
import type { ImageBase } from '../image/base';

export interface CollectionBase {
	id: string;
	name: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	featuredImage: string | null;
	isPublic: boolean;
	isFavorite: boolean;
	totalImages: number;
	totalVideos: number;
	totalSize: number;
	lastImageAddedAt: Date | null;
	lastVideoAddedAt: Date | null;
	parentId: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface CollectionWithStats extends CollectionBase {
	entityType: 'collection';
	stats?: {
		totalItems: number;
		imageCount: number;
		videoCount: number;
		totalValue: number;
		lastActivity: Date | null;
	};
	_count?: {
		images: number;
		videos: number;
		albums: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
}

export interface CreateCollectionInput {
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	featuredImage?: string | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	parentId?: string | null;
}

export interface UpdateCollectionInput {
	name?: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	featuredImage?: string | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	parentId?: string | null;
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
	sortBy?: CollectionSortOption;
	sortOrder?: 'asc' | 'desc';
}

export interface CollectionViewConfig {
	gridColumns: number;
	cardSize: 'small' | 'medium' | 'large';
}

/**
 * 📊 Configuración de ordenamiento para colecciones.
 */
export interface CollectionSortBy {
	field: string;
	order: 'asc' | 'desc';
}

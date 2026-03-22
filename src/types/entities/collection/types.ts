/**
 * @file Tipos para entidades de Collection
 * @module types/entities/collection/types
 */

import { CollectionSortOption } from './enums';

export interface CollectionBase {
	color: string | null;
	createdAt: Date;
	description: string | null;
	emoji: string | null;
	featuredImage: string | null;
	id: string;

	isFavorite: boolean;
	lastImageAddedAt: Date | null;
	lastVideoAddedAt: Date | null;
	name: string;
	parentId: string | null;
	totalImages: number;
	totalSize: number;
	totalVideos: number;
	updatedAt: Date;
}

export interface CollectionWithStats extends CollectionBase {
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
	entityType: 'collection';
	stats?: {
		totalItems: number;
		imageCount: number;
		videoCount: number;
		totalValue: number;
		lastActivity: Date | null;
	};
}

export interface CreateCollectionInput {
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;

	isFavorite?: boolean;
	name: string;
	parentId?: string | null;
}

export interface UpdateCollectionInput {
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;

	isFavorite?: boolean;
	name?: string;
	parentId?: string | null;
}

export interface CollectionFilter {
	field: string;
	operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'between';
	value: any;
}

export interface CollectionFilters {
	hasImages?: boolean;
	search?: string;
	sortBy?: CollectionSortOption;
	sortOrder?: 'asc' | 'desc';
}

export interface CollectionViewConfig {
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

/**
 * 📊 Configuración de ordenamiento para colecciones.
 */
export interface CollectionSortBy {
	field: string;
	order: 'asc' | 'desc';
}

// Tipos adicionales para compatibilidad
export type CollectionCreateInput = CreateCollectionInput;
export type CollectionUpdateInput = UpdateCollectionInput;
export type CollectionComplete = CollectionWithStats;
export type CollectionExtended = CollectionWithStats;
export type CollectionStatistics = CollectionWithStats['stats'];

export interface CollectionSearchOptions {
	filters?: CollectionFilters;
	include?: Record<string, boolean>;
	orderBy?: Record<string, 'asc' | 'desc'>;
	skip?: number;
	take?: number;
}

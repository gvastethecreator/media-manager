/**
 * @file Tipos para entidades de Collection
 * @module types/entities/collection/types
 */

import type { ImageBase } from '../image/base';
import { CollectionSortOption } from './enums';

export interface CollectionBase {
	id: string;
	name: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	featuredImage: string | null;

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

	isFavorite?: boolean;
	parentId?: string | null;
}

export interface UpdateCollectionInput {
	name?: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	featuredImage?: string | null;

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

	hasImages?: boolean;
	sortBy?: CollectionSortOption;
	sortOrder?: 'asc' | 'desc';
}

export interface CollectionViewConfig {
	viewType: 'grid' | 'list' | 'table';
	gridColumns: number;
	cardSize: 'small' | 'medium' | 'large';
	sortBy: string;
	sortDirection: 'asc' | 'desc';
	showImages: boolean;
	imageCount: number;
	enableAnimations: boolean;
	groupBy: string | null;
	showStats: boolean;
	compactView: boolean;
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
	skip?: number;
	take?: number;
	orderBy?: Record<string, 'asc' | 'desc'>;
	filters?: CollectionFilters;
	include?: Record<string, boolean>;
}

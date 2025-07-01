/**
 * @file Tipos para entidades de Collection
 * @module types/entities/collection/types
 */

import type { Collection, Image } from '@prisma/client';

export interface CollectionBase extends Collection {
	id: string;
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	isPrivate: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface CollectionWithImages extends CollectionBase {
	images: Image[];
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
	images: Image[];
	_count: {
		images: number;
	};
}

export interface CreateCollectionInput {
	name: string;
	description?: string;
	emoji?: string;
	color?: string;
	isPrivate?: boolean;
}

export interface UpdateCollectionInput {
	name?: string;
	description?: string;
	emoji?: string;
	color?: string;
	isPrivate?: boolean;
}

export interface CollectionFilters {
	search?: string;
	isPrivate?: boolean;
	hasImages?: boolean;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'imageCount';
	sortOrder?: 'asc' | 'desc';
}

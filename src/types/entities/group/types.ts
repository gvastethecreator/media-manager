/**
 * @file Tipos para entidades de Group
 * @module types/entities/group/types
 */

import type { ImageBase } from '../image/base';

export interface GroupBase {
	id: string;
	name: string;
	description?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface GroupWithImages extends GroupBase {
	images: ImageBase[];
}

export interface GroupWithStats extends GroupBase {
	stats: {
		totalImages: number;
		recentlyAdded: number;
		averageRating: number;
		totalSize: number;
	};
}

export interface GroupWithRelations extends GroupBase {
	images: ImageBase[];
	_count: {
		images: number;
	};
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
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'imageCount';
	sortOrder?: 'asc' | 'desc';
}

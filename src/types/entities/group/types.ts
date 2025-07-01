/**
 * @file Tipos para entidades de Group
 * @module types/entities/group/types
 */

import type { Group, Image } from '@prisma/client';

export interface GroupBase extends Group {
	id: string;
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	type?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface GroupWithImages extends GroupBase {
	images: Image[];
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
	images: Image[];
	_count: {
		images: number;
	};
}

export interface CreateGroupInput {
	name: string;
	description?: string;
	emoji?: string;
	color?: string;
	type?: string;
}

export interface UpdateGroupInput {
	name?: string;
	description?: string;
	emoji?: string;
	color?: string;
	type?: string;
}

export interface GroupFilters {
	search?: string;
	type?: string;
	hasImages?: boolean;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'imageCount';
	sortOrder?: 'asc' | 'desc';
}

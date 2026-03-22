import { EntityBase, EntityWithStats } from '@/types/entities/entity.types';

export interface AlbumBase extends EntityBase {
	category: string | null;
	color: string | null;
	createdAt: Date;
	description: string | null;
	emoji: string | null;
	featuredImage: string | null;
	filters: string | null; // JSON string of filters

	isFavorite: boolean;
	lastImageAddedAt: Date | null;
	lastVideoAddedAt: Date | null;
	metadata: string | null;
	name: string;
	shortcut: string | null;
	size: number;
	thumbnailUrl?: string;
	totalImages: number;
	totalSize: number;
	totalVideos: number;
	updatedAt: Date;
}

import { EntityStats } from '../entity.types';

export interface AlbumStatistics extends EntityStats {
	lastImageAddedAt: Date | null;
	lastModified: Date | null;
	lastVideoAddedAt: Date | null;
	totalEntities: number;
	totalMedia: number;
}

export interface AlbumWithStats extends AlbumBase, EntityWithStats {
	entityType: 'album';
	// Alias para compatibilidad legacy
	statistics?: AlbumStatistics;
	stats: AlbumStatistics;
}

export type AlbumCreateInput = Omit<AlbumBase, 'id' | 'createdAt' | 'updatedAt'>;
export type AlbumUpdateInput = Partial<AlbumCreateInput>;

export interface AlbumFilters {
	category?: string;
	isFavorite?: boolean;
	search?: string;
	sortBy?: string;
	sortDirection?: 'asc' | 'desc';
}

export interface AlbumViewConfig {
	itemSize: 'sm' | 'md' | 'lg';
	showEmptyAlbums: boolean;
	viewMode: 'grid' | 'list' | 'masonry';
}

export interface AlbumsResponse {
	albums: AlbumWithStats[];
	limit: number;
	page: number;
	total: number;
	totalPages: number;
}

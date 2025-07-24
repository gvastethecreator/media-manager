import { EntityBase, EntityWithStats } from '@/types/entities/entity.types';

export interface AlbumBase extends EntityBase {
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
	filters: string | null; // JSON string of filters
	shortcut: string | null;
	category: string | null;
	metadata: string | null;
	lastImageAddedAt: Date | null;
	lastVideoAddedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface AlbumStatistics {
	imageCount: number;
	videoCount: number;
	totalSize: number;
	lastModified: Date | null;
	lastImageAddedAt: Date | null;
	lastVideoAddedAt: Date | null;
	totalMedia: number;
	totalEntities: number;
}

export interface AlbumWithStats extends AlbumBase, EntityWithStats {
	entityType: 'album';
	stats: AlbumStatistics;
	// Alias para compatibilidad legacy
	statistics?: AlbumStatistics;
}

export type AlbumCreateInput = Omit<AlbumBase, 'id' | 'createdAt' | 'updatedAt'>;
export type AlbumUpdateInput = Partial<AlbumCreateInput>;

export interface AlbumFilters {
	search?: string;
	isFavorite?: boolean;
	category?: string;
	sortBy?: string;
	sortDirection?: 'asc' | 'desc';
}

export interface AlbumViewConfig {
	viewMode: 'grid' | 'list' | 'masonry';
	itemSize: 'sm' | 'md' | 'lg';
	showEmptyAlbums: boolean;
}

export interface AlbumsResponse {
	albums: AlbumWithStats[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

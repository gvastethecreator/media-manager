import { apiClient } from '../client';

export interface AlbumCardData {
	category?: string | null;
	color?: string | null;
	createdAt: Date;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	filters?: unknown[] | string;
	id: string;
	metadata?: {
		itemCount?: number;
		imageCount?: number;
		videoCount?: number;
		coverImageUrl?: string | null;
		thumbnailUrls?: string[];
		lastModified?: Date | string;
		entitiesCount?: number;
	};
	name: string;
	recentImages?: string[];
	recentVideos?: string[];
	stats: {
		imageCount: number;
		videoCount: number;
		collectionCount: number;
		tagCount: number;
		characterCount: number;
		placeCount: number;
		worldItemCount: number;
		conceptCount: number;
		promptCount: number;
		noteCount: number;
		wildcardCount: number;
		propertyCount: number;
		groupCount: number;
	};
	totalSize?: number;
	updatedAt: Date;
	viewConfig?: {
		theme?: string;
		layout?: string;
		thumbnailSize?: 'small' | 'medium' | 'large';
	};
}

export interface GetAlbumsOptions {
	category?: string;
	includeStats?: boolean;
	isFavorite?: boolean;
	limit?: number;
	orderBy?: 'name' | 'updatedAt' | 'createdAt';
	orderDir?: 'asc' | 'desc';
	searchTerm?: string;
}

export interface ThumbnailImage {
	id: string;
	isVideo?: boolean;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
}

export interface SearchAlbumsOptions {
	category?: string;
	includeHidden?: boolean;
	includeStats?: boolean;
	limit?: number;
	offset?: number;
	orderBy?: 'name' | 'updatedAt' | 'createdAt';
	orderDir?: 'asc' | 'desc';
	searchTerm: string;
}

export interface AlbumStats {
	entitiesCount: number;
	imageCount: number;
	totalSize: number;
	videoCount: number;
}

/**
 * Obtiene los datos de un álbum para mostrar en una tarjeta
 */
export function getAlbumCardData(albumId: string): Promise<AlbumCardData> {
	return apiClient.get<AlbumCardData>(`/albums/${albumId}/card-data`);
}

/**
 * Obtiene una lista de álbumes para mostrar en una galería de tarjetas
 */
export function getAlbumsForCards(options: GetAlbumsOptions = {}): Promise<AlbumCardData[]> {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(options)) {
		if (value !== undefined) {
			params.append(key, String(value));
		}
	}

	return apiClient.get<AlbumCardData[]>(`/albums/cards?${params.toString()}`);
}

/**
 * Obtiene medios recientes de un álbum
 */
export function getRecentAlbumMedia(albumId: string, limit = 6): Promise<ThumbnailImage[]> {
	return apiClient.get<ThumbnailImage[]>(`/albums/${albumId}/recent-media?limit=${limit}`);
}

/**
 * Obtiene estadísticas de un álbum
 */
export function getAlbumStats(albumId: string): Promise<AlbumStats> {
	return apiClient.get<AlbumStats>(`/albums/${albumId}/stats`);
}

/**
 * Busca álbumes con filtros avanzados
 */
export function searchAlbums(options: SearchAlbumsOptions): Promise<AlbumCardData[]> {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(options)) {
		if (value !== undefined) {
			params.append(key, String(value));
		}
	}

	return apiClient.get<AlbumCardData[]>(`/albums/search?${params.toString()}`);
}

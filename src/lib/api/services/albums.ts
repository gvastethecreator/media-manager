import { apiClient } from '../client';

export interface AlbumCardData {
	id: string;
	name: string;
	description?: string | null;
	category?: string | null;
	color?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	createdAt: Date;
	updatedAt: Date;
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
	recentImages?: string[];
	recentVideos?: string[];
	totalSize?: number;
	filters?: unknown[] | string;
	metadata?: {
		itemCount?: number;
		imageCount?: number;
		videoCount?: number;
		coverImageUrl?: string | null;
		thumbnailUrls?: string[];
		lastModified?: Date | string;
		entitiesCount?: number;
	};
	viewConfig?: {
		theme?: string;
		layout?: string;
		thumbnailSize?: 'small' | 'medium' | 'large';
	};
}

export interface GetAlbumsOptions {
	limit?: number;
	category?: string;
	searchTerm?: string;
	orderBy?: 'name' | 'updatedAt' | 'createdAt';
	orderDir?: 'asc' | 'desc';
	isFavorite?: boolean;
	includeStats?: boolean;
}

export interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
	isVideo?: boolean;
}

export interface SearchAlbumsOptions {
	searchTerm: string;
	limit?: number;
	offset?: number;
	category?: string;
	orderBy?: 'name' | 'updatedAt' | 'createdAt';
	orderDir?: 'asc' | 'desc';
	includeHidden?: boolean;
	includeStats?: boolean;
}

export interface AlbumStats {
	imageCount: number;
	videoCount: number;
	totalSize: number;
	entitiesCount: number;
}

/**
 * Obtiene los datos de un álbum para mostrar en una tarjeta
 */
export async function getAlbumCardData(albumId: string): Promise<AlbumCardData> {
	return apiClient.get<AlbumCardData>(`/albums/${albumId}/card-data`);
}

/**
 * Obtiene una lista de álbumes para mostrar en una galería de tarjetas
 */
export async function getAlbumsForCards(options: GetAlbumsOptions = {}): Promise<AlbumCardData[]> {
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
export async function getRecentAlbumMedia(albumId: string, limit = 6): Promise<ThumbnailImage[]> {
	return apiClient.get<ThumbnailImage[]>(`/albums/${albumId}/recent-media?limit=${limit}`);
}

/**
 * Obtiene estadísticas de un álbum
 */
export async function getAlbumStats(albumId: string): Promise<AlbumStats> {
	return apiClient.get<AlbumStats>(`/albums/${albumId}/stats`);
}

/**
 * Busca álbumes con filtros avanzados
 */
export async function searchAlbums(options: SearchAlbumsOptions): Promise<AlbumCardData[]> {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(options)) {
		if (value !== undefined) {
			params.append(key, String(value));
		}
	}

	return apiClient.get<AlbumCardData[]>(`/albums/search?${params.toString()}`);
}
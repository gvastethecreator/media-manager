import type { TagWithStats } from '@/types/entities/tag/base';
import { apiClient } from '../client';

export interface ImageCardData {
	createdAt: Date;
	folderId?: string;
	format?: string;
	height?: number;
	id: string;
	isFavorite?: boolean;
	metadata?: {
		camera?: { make?: string; model?: string };
		lens?: string;
		settings?: string;
		location?: string;
		tags?: string[];
		description?: string;
		size?: number;
	};
	name: string;
	path: string;
	size?: number;
	stats?: {
		viewCount?: number;
		favoriteCount?: number;
		collectionCount?: number;
		tagCount?: number;
		albumCount?: number;
		characterCount?: number;
		placeCount?: number;
		worldItemCount?: number;
		noteCount?: number;
	};
	tags?: TagWithStats[];
	thumbnail?: string;
	thumbnailHeight?: number;
	thumbnailWidth?: number;
	updatedAt: Date;
	width?: number;
}

export interface GetImagesOptions {
	albumId?: string;
	collectionId?: string;
	format?: string;
	limit?: number;
	maxHeight?: number;
	maxWidth?: number;
	minHeight?: number;
	minWidth?: number;
	offset?: number;
	orderBy?: 'name' | 'size' | 'createdAt' | 'updatedAt';
	orderDir?: 'asc' | 'desc';
	searchTerm?: string;
	tagIds?: string[];
}

export interface ImageStats {
	averageSize: number;
	dimensionStats: {
		minWidth: number;
		maxWidth: number;
		minHeight: number;
		maxHeight: number;
		averageWidth: number;
		averageHeight: number;
	};
	formatDistribution: Record<string, number>;
	totalImages: number;
	totalSize: number;
}

/**
 * Obtiene los datos de una imagen para mostrar en una tarjeta
 */
export function getImageCardData(imageId: string): Promise<ImageCardData> {
	return apiClient.get<ImageCardData>(`/images/${imageId}/card-data`);
}

/**
 * Obtiene una lista de imágenes para mostrar en una galería de tarjetas
 */
export function getImagesForCards(options: GetImagesOptions = {}): Promise<ImageCardData[]> {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(options)) {
		if (value !== undefined) {
			if (Array.isArray(value)) {
				for (const item of value) {
					params.append(key, String(item));
				}
			} else {
				params.append(key, String(value));
			}
		}
	}

	return apiClient.get<ImageCardData[]>(`/images/cards?${params.toString()}`);
}

/**
 * Obtiene estadísticas de imágenes
 */
export function getImageStats(options: { albumId?: string; collectionId?: string } = {}): Promise<ImageStats> {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(options)) {
		if (value !== undefined) {
			params.append(key, String(value));
		}
	}

	return apiClient.get<ImageStats>(`/images/stats?${params.toString()}`);
}

/**
 * Busca imágenes con filtros avanzados
 */
export function searchImages(options: GetImagesOptions & { searchTerm: string }): Promise<ImageCardData[]> {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(options)) {
		if (value !== undefined) {
			if (Array.isArray(value)) {
				for (const item of value) {
					params.append(key, String(item));
				}
			} else {
				params.append(key, String(value));
			}
		}
	}

	return apiClient.get<ImageCardData[]>(`/images/search?${params.toString()}`);
}

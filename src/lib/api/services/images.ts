import { apiClient } from '../client';

export interface ImageCardData {
	id: string;
	name: string;
	path: string;
	size?: number;
	width?: number;
	height?: number;
	thumbnailWidth?: number;
	thumbnailHeight?: number;
	format?: string;
	createdAt: Date;
	updatedAt: Date;
	metadata?: {
		camera?: string;
		lens?: string;
		settings?: string;
		location?: string;
		tags?: string[];
		description?: string;
	};
	stats?: {
		viewCount?: number;
		favoriteCount?: number;
		collectionCount?: number;
	};
}

export interface GetImagesOptions {
	limit?: number;
	offset?: number;
	searchTerm?: string;
	format?: string;
	orderBy?: 'name' | 'size' | 'createdAt' | 'updatedAt';
	orderDir?: 'asc' | 'desc';
	albumId?: string;
	collectionId?: string;
	tagIds?: string[];
	minWidth?: number;
	maxWidth?: number;
	minHeight?: number;
	maxHeight?: number;
}

export interface ImageStats {
	totalImages: number;
	totalSize: number;
	averageSize: number;
	formatDistribution: Record<string, number>;
	dimensionStats: {
		minWidth: number;
		maxWidth: number;
		minHeight: number;
		maxHeight: number;
		averageWidth: number;
		averageHeight: number;
	};
}

/**
 * Obtiene los datos de una imagen para mostrar en una tarjeta
 */
export async function getImageCardData(imageId: string): Promise<ImageCardData> {
	return apiClient.get<ImageCardData>(`/images/${imageId}/card-data`);
}

/**
 * Obtiene una lista de imágenes para mostrar en una galería de tarjetas
 */
export async function getImagesForCards(options: GetImagesOptions = {}): Promise<ImageCardData[]> {
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
export async function getImageStats(options: { albumId?: string; collectionId?: string } = {}): Promise<ImageStats> {
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
export async function searchImages(options: GetImagesOptions & { searchTerm: string }): Promise<ImageCardData[]> {
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

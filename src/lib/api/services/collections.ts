/**
 * @file Servicio API para colecciones
 * @module lib/api/services/collections
 * ✅ Reemplaza server actions de collections con API calls
 */

import type { CollectionCreateInput, CollectionUpdateInput, CollectionWithStats } from '@/types/entities/collection';
import { apiClient } from '../client';

export const collectionsApi = {
	/**
	 * Obtiene todas las colecciones
	 */
	getAll: (): Promise<CollectionWithStats[]> => {
		return apiClient.get<CollectionWithStats[]>('/api/collections');
	},

	/**
	 * Obtiene una colección por ID
	 */
	getById: (id: string): Promise<CollectionWithStats> => {
		return apiClient.get<CollectionWithStats>(`/api/collections/${id}`);
	},

	/**
	 * Crea una nueva colección
	 */
	create: (data: CollectionCreateInput): Promise<CollectionWithStats> => {
		return apiClient.post<CollectionWithStats>('/api/collections', data);
	},

	/**
	 * Actualiza una colección existente
	 */
	update: (id: string, data: CollectionUpdateInput): Promise<CollectionWithStats> => {
		return apiClient.put<CollectionWithStats>(`/api/collections/${id}`, data);
	},

	/**
	 * Elimina una colección
	 */
	delete: (id: string): Promise<void> => {
		return apiClient.delete<void>(`/api/collections/${id}`);
	},

	/**
	 * Agrega imágenes a una colección
	 */
	addImages: (id: string, imageIds: string[]): Promise<CollectionWithStats> => {
		return apiClient.post<CollectionWithStats>(`/api/collections/${id}/images`, { imageIds });
	},

	/**
	 * Remueve imágenes de una colección
	 */
	removeImages: (id: string, _imageIds: string[]): Promise<CollectionWithStats> => {
		return apiClient.delete<CollectionWithStats>(`/api/collections/${id}/images`);
	},
};

export interface CollectionCardData {
	id: string;
	name: string;
	description?: string | null;
	category?: string | null;
	color?: string | null;
	emoji?: string | null;
	isPrivate?: boolean;
	createdAt: Date;
	updatedAt: Date;
	stats: {
		imageCount: number;
		videoCount: number;
		albumCount: number;
		tagCount: number;
		characterCount: number;
		placeCount: number;
		conceptCount: number;
		noteCount: number;
		totalItems: number;
	};
	recentItems?: Array<{
		id: string;
		type: 'image' | 'video' | 'album';
		thumbnailUrl?: string;
		name?: string;
	}>;
	metadata?: {
		coverImageUrl?: string | null;
		lastModified?: Date | string;
		itemTypes?: string[];
	};
}

export interface GetCollectionsOptions {
	limit?: number;
	offset?: number;
	searchTerm?: string;
	category?: string;
	orderBy?: 'name' | 'createdAt' | 'updatedAt' | 'itemCount';
	orderDir?: 'asc' | 'desc';
	includePrivate?: boolean;
	includeStats?: boolean;
	userId?: string;
}

export interface CollectionStats {
	totalCollections: number;
	totalItems: number;
	categoryDistribution: Record<string, number>;
	itemTypeDistribution: Record<string, number>;
	averageItemsPerCollection: number;
}

/**
 * Obtiene los datos de una colección para mostrar en una tarjeta
 */
export function getCollectionCardData(collectionId: string): Promise<CollectionCardData> {
	return apiClient.get<CollectionCardData>(`/collections/${collectionId}/card-data`);
}

/**
 * Obtiene una lista de colecciones para mostrar en una galería de tarjetas
 */
export function getCollectionsForCards(options: GetCollectionsOptions = {}): Promise<CollectionCardData[]> {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(options)) {
		if (value !== undefined) {
			params.append(key, String(value));
		}
	}

	return apiClient.get<CollectionCardData[]>(`/collections/cards?${params.toString()}`);
}

/**
 * Obtiene estadísticas de colecciones
 */
export function getCollectionStats(options: { userId?: string } = {}): Promise<CollectionStats> {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(options)) {
		if (value !== undefined) {
			params.append(key, String(value));
		}
	}

	return apiClient.get<CollectionStats>(`/collections/stats?${params.toString()}`);
}

/**
 * Busca colecciones con filtros avanzados
 */
export function searchCollections(
	options: GetCollectionsOptions & { searchTerm: string }
): Promise<CollectionCardData[]> {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(options)) {
		if (value !== undefined) {
			params.append(key, String(value));
		}
	}

	return apiClient.get<CollectionCardData[]>(`/collections/search?${params.toString()}`);
}

/**
 * Obtiene elementos recientes de una colección
 */
export function getCollectionRecentItems(
	collectionId: string,
	limit = 6
): Promise<
	Array<{
		id: string;
		type: 'image' | 'video' | 'album';
		thumbnailUrl?: string;
		name?: string;
	}>
> {
	return apiClient.get<
		Array<{
			id: string;
			type: 'image' | 'video' | 'album';
			thumbnailUrl?: string;
			name?: string;
		}>
	>(`/collections/${collectionId}/recent-items?limit=${limit}`);
}

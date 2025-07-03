/**
 * @file Servicio API para wildcards
 * @module lib/api/services/wildcards
 * ✅ Reemplaza server actions de wildcards con API calls
 */

import { apiClient } from '../client';

export interface WildcardCardData {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	category: string | null;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
	shortcut: string | null;
	parentId: string | null;
	children?: any[];
	_count: {
		images: number;
		videos: number;
		childWildcards: number;
	};
	recentImages?: string[];
}

export interface GetWildcardsOptions {
	limit?: number;
	category?: string;
	parentId?: string | null;
	searchTerm?: string;
	orderBy?: 'name' | 'updatedAt' | 'createdAt';
	orderDir?: 'asc' | 'desc';
}

export const wildcardsApi = {
	/**
	 * Obtiene los datos de un wildcard para mostrar en una tarjeta
	 */
	getCardData: (wildcardId: string): Promise<WildcardCardData> => {
		return apiClient.get<WildcardCardData>(`/api/wildcards/${wildcardId}/card-data`);
	},

	/**
	 * Obtiene una lista de wildcards para mostrar en una galería de tarjetas
	 */
	getForCards: (options: GetWildcardsOptions = {}): Promise<WildcardCardData[]> => {
		const params = new URLSearchParams();

		if (options.limit) params.append('limit', options.limit.toString());
		if (options.category) params.append('category', options.category);
		if (options.parentId !== undefined) params.append('parentId', options.parentId || '');
		if (options.searchTerm) params.append('searchTerm', options.searchTerm);
		if (options.orderBy) params.append('orderBy', options.orderBy);
		if (options.orderDir) params.append('orderDir', options.orderDir);

		const queryString = params.toString();
		const endpoint = `/api/wildcards/cards${queryString ? `?${queryString}` : ''}`;

		return apiClient.get<WildcardCardData[]>(endpoint);
	},

	/**
	 * Obtiene todos los wildcards
	 */
	getAll: (): Promise<WildcardCardData[]> => {
		return apiClient.get<WildcardCardData[]>('/api/wildcards');
	},

	/**
	 * Obtiene un wildcard por ID
	 */
	getById: (id: string): Promise<WildcardCardData> => {
		return apiClient.get<WildcardCardData>(`/api/wildcards/${id}`);
	},
};
/**
 * @file Servicio API para la entidad Concept
 * @module lib/api/services/concepts
 * @description Centraliza todas las operaciones API relacionadas con conceptos
 */

import { api } from '@/lib/api/client';
import type {
	ConceptCreateInput,
	ConceptUpdateInput,
	ConceptWithStats,
} from '@/types/entities/concept';

export interface ConceptFilters {
	search?: string;
	category?: string;
	tags?: string[];
	onlyFavorites?: boolean;
	limit?: number;
	offset?: number;
}

/**
 * Servicio API para gestión de conceptos
 */
export const conceptsApi = {
	/**
	 * Obtener todos los conceptos con filtros opcionales
	 */
	getAll: async (filters?: ConceptFilters): Promise<ConceptWithStats[]> => {
		const queryParams = new URLSearchParams();

		if (filters?.search) queryParams.append('search', filters.search);
		if (filters?.category) queryParams.append('category', filters.category);
		if (filters?.tags?.length) queryParams.append('tags', filters.tags.join(','));
		if (filters?.onlyFavorites) queryParams.append('onlyFavorites', 'true');
		if (filters?.limit) queryParams.append('limit', filters.limit.toString());
		if (filters?.offset) queryParams.append('offset', filters.offset.toString());

		const query = queryParams.toString();
		const endpoint = `/concepts${query ? `?${query}` : ''}`;

		return api.get<ConceptWithStats[]>(endpoint);
	},

	/**
	 * Obtener un concepto por ID
	 */
	getById: async (id: string): Promise<ConceptWithStats> => {
		return api.get<ConceptWithStats>(`/concepts/${id}`);
	},

	/**
	 * Crear un nuevo concepto
	 */
	create: async (data: ConceptCreateInput): Promise<ConceptWithStats> => {
		return api.post<ConceptWithStats>('/concepts', data);
	},

	/**
	 * Actualizar un concepto existente
	 */
	update: async (id: string, data: ConceptUpdateInput): Promise<ConceptWithStats> => {
		return api.put<ConceptWithStats>(`/concepts/${id}`, data);
	},

	/**
	 * Eliminar un concepto
	 */
	delete: async (id: string): Promise<void> => {
		return api.delete<void>(`/concepts/${id}`);
	},

	/**
	 * Buscar conceptos por texto
	 */
	search: async (query: string, limit = 20): Promise<ConceptWithStats[]> => {
		return api.get<ConceptWithStats[]>(`/concepts/search?q=${encodeURIComponent(query)}&limit=${limit}`);
	},

	/**
	 * Obtener conceptos favoritos
	 */
	getFavorites: async (): Promise<ConceptWithStats[]> => {
		return api.get<ConceptWithStats[]>('/concepts?onlyFavorites=true');
	},

	/**
	 * Marcar/desmarcar concepto como favorito
	 */
	toggleFavorite: async (id: string, isFavorite: boolean): Promise<ConceptWithStats> => {
		return api.patch<ConceptWithStats>(`/concepts/${id}`, { isFavorite });
	},

	/**
	 * Obtener estadísticas de conceptos
	 */
	getStats: async () => {
		return api.get<{
			total: number;
			favorites: number;
			byCategory: Record<string, number>;
			recentCount: number;
		}>('/concepts/stats');
	},
};

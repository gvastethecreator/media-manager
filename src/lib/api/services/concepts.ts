/**
 * @file Servicio API para conceptos
 * @module lib/api/services/concepts
 * ✅ Reemplaza server actions de concepts con API calls
 */

import { apiClient } from '../client';
import type { ConceptWithStats, ConceptCreateInput, ConceptUpdateInput } from '@/types/entities/concept';

export const conceptsApi = {
	/**
	 * Obtiene todos los conceptos
	 */
	getAll: (): Promise<ConceptWithStats[]> => {
		return apiClient.get<ConceptWithStats[]>('/api/concepts');
	},

	/**
	 * Obtiene un concepto por ID
	 */
	getById: (id: string): Promise<ConceptWithStats> => {
		return apiClient.get<ConceptWithStats>(`/api/concepts/${id}`);
	},

	/**
	 * Crea un nuevo concepto
	 */
	create: (data: ConceptCreateInput): Promise<ConceptWithStats> => {
		return apiClient.post<ConceptWithStats>('/api/concepts', data);
	},

	/**
	 * Actualiza un concepto existente
	 */
	update: (id: string, data: ConceptUpdateInput): Promise<ConceptWithStats> => {
		return apiClient.put<ConceptWithStats>(`/api/concepts/${id}`, data);
	},

	/**
	 * Elimina un concepto
	 */
	delete: (id: string): Promise<void> => {
		return apiClient.delete<void>(`/api/concepts/${id}`);
	},
};

export interface ConceptCardData {
	id: string;
	name: string;
	description?: string | null;
	category?: string | null;
	color?: string | null;
	emoji?: string | null;
	createdAt: Date;
	updatedAt: Date;
	stats: {
		imageCount: number;
		videoCount: number;
		albumCount: number;
		collectionCount: number;
		noteCount: number;
		characterCount: number;
		totalRelations: number;
	};
	metadata?: {
		coverImageUrl?: string | null;
		lastModified?: Date | string;
		relationTypes?: string[];
	};
}

export interface GetConceptsOptions {
	limit?: number;
	offset?: number;
	searchTerm?: string;
	category?: string;
	orderBy?: 'name' | 'createdAt' | 'updatedAt' | 'relationCount';
	orderDir?: 'asc' | 'desc';
	includeStats?: boolean;
}

/**
 * Obtiene los datos de un concepto para mostrar en una tarjeta
 */
export async function getConceptCardData(conceptId: string): Promise<ConceptCardData> {
	return apiClient.get<ConceptCardData>(`/concepts/${conceptId}/card-data`);
}

/**
 * Obtiene una lista de conceptos para mostrar en una galería de tarjetas
 */
export async function getConceptsForCards(options: GetConceptsOptions = {}): Promise<ConceptCardData[]> {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(options)) {
		if (value !== undefined) {
			params.append(key, String(value));
		}
	}

	return apiClient.get<ConceptCardData[]>(`/concepts/cards?${params.toString()}`);
}

/**
 * Busca conceptos con filtros avanzados
 */
export async function searchConcepts(options: GetConceptsOptions & { searchTerm: string }): Promise<ConceptCardData[]> {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(options)) {
		if (value !== undefined) {
			params.append(key, String(value));
		}
	}

	return apiClient.get<ConceptCardData[]>(`/concepts/search?${params.toString()}`);
}

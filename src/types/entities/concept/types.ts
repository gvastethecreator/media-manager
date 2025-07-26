/**
 * @file Tipos para la entidad Concept
 * @module types/entities/concept/types
 * @description Tipos y interfaces para la entidad Concept
 */

import { z } from 'zod';
import type { ConceptBase } from './base';

// Re-export tipos base desde base.ts para evitar duplicación
export type { ConceptBase, ConceptStatistics, ConceptStats, ConceptWithStats } from './base';

// Re-export enums desde enums.ts para evitar duplicación
export { ConceptSortOption, ConceptViewMode } from './enums';

/**
 * Tipo extendido de Concept con campos adicionales
 */
export interface ConceptExtended extends ConceptBase {
	// Campos adicionales para compatibilidad
	totalAssociations?: number;
	lastUsed?: Date;
	usageCount?: number;
}

/**
 * Input para creación
 */
export interface ConceptCreateInput {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	category?: string | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	totalImages?: number;
	totalVideos?: number;
	type?: string | null;
	complexity?: string | null;
	applications?: string | null;
	examples?: string | null;
	relatedConcepts?: string | null;
	notes?: string | null;
	featuredImage?: string | null;
	parentId?: string | null;
	// Relaciones por ID (para compatibilidad)
	imageIds?: string[];
	videoIds?: string[];
	albumIds?: string[];
	collectionIds?: string[];
	tagIds?: string[];
	characterIds?: string[];
	placeIds?: string[];
	worldItemIds?: string[];
	promptIds?: string[];
	noteIds?: string[];
	wildcardIds?: string[];
	propertyIds?: string[];
	groupIds?: string[];
}

/**
 * Input para actualización
 */
export type ConceptUpdateInput = Partial<ConceptCreateInput>;

/**
 * Filtros para búsqueda de conceptos
 */
export interface ConceptFilters {
	category?: string | string[];
	search?: string;
	sortBy?: 'name' | 'category' | 'createdAt' | 'updatedAt';
	sortOrder?: 'asc' | 'desc';
	page?: number;
	pageSize?: number;
	tags?: string[];
	onlyFavorites?: boolean;
}

/**
 * Resultado de búsqueda de conceptos
 */
export interface ConceptResults {
	items: ConceptBase[];
	total: number;
	page: number;
	pageSize: number;
	stats?: {
		totalConcepts: number;
		categoriesStats: Record<string, number>;
	};
}


/**
 * Esquema Zod para validación de Concept
 */
export const ConceptSchema = z.object({
	id: z.string(),
	name: z.string(),
	emoji: z.string(),
	color: z.string(),
	description: z.string().nullable(),
	content: z.string(),
	category: z.string(),
	featuredImage: z.string().nullable(),
	isFavorite: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// 🟢 Documentación:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - Validar siempre con ConceptSchema antes de persistir.

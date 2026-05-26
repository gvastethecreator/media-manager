/**
 * @file Tipos para la entidad Concept
 * @module types/entities/concept/types
 * @description Tipos y interfaces para la entidad Concept
 */

import { z } from 'zod';
import type { ConceptBase } from './base';

// Re-export tipos base desde base.ts para evitar duplicación
export type { ConceptBase, ConceptComplete, ConceptStatistics, ConceptStats, ConceptWithStats } from './base';

// Re-export enums desde enums.ts para evitar duplicación
export { ConceptSortOption, ConceptViewMode } from './enums';

/**
 * Tipo extendido de Concept con campos adicionales
 */
export interface ConceptExtended extends ConceptBase {
	lastUsed?: Date;
	// Campos adicionales para compatibilidad
	totalAssociations?: number;
	usageCount?: number;
}

/**
 * Input para creación
 */
export interface ConceptCreateInput {
	albumIds?: string[];
	applications?: string | null;
	category?: string | null;
	characterIds?: string[];
	collectionIds?: string[];
	color?: string;
	complexity?: string | null;
	content?: string;
	description?: string | null;
	emoji?: string;
	examples?: string | null;
	featuredImage?: string | null;
	groupIds?: string[];
	// Relaciones por ID (para compatibilidad)
	imageIds?: string[];
	name: string;
	noteIds?: string[];
	notes?: string | null;
	parentId?: string | null;
	placeIds?: string[];
	promptIds?: string[];
	propertyIds?: string[];
	relatedConcepts?: string | null;
	tagIds?: string[];
	totalImages?: number;
	totalVideos?: number;
	type?: string | null;
	videoIds?: string[];
	wildcardIds?: string[];
	worldItemIds?: string[];
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
	onlyFavorites?: boolean;
	page?: number;
	pageSize?: number;
	search?: string;
	sortBy?: 'name' | 'category' | 'createdAt' | 'updatedAt';
	sortOrder?: 'asc' | 'desc';
	tags?: string[];
}

/**
 * Resultado de búsqueda de conceptos
 */
export interface ConceptResults {
	items: ConceptBase[];
	page: number;
	pageSize: number;
	stats?: {
		totalConcepts: number;
		categoriesStats: Record<string, number>;
	};
	total: number;
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

/**
 * @file Tipos para la entidad Concept
 * @module types/entities/concept/types
 * @description Tipos y interfaces para la entidad Concept
 */

import { z } from 'zod';

// Re-export tipos base desde base.ts para evitar duplicación
export type { ConceptBase, ConceptStatistics, ConceptStats, ConceptWithStats } from './base';

/**
 * Input para creación
 */
export interface ConceptCreateInput {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content: string;
	category?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	// Relaciones por ID
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
 * Opciones de búsqueda para conceptos
 */
export interface ConceptSearchOptions {
	filters?: {
		search?: string;
		category?: string | string[];
		tags?: string[];
		onlyFavorites?: boolean;
	};
	skip?: number;
	take?: number;
	orderBy?: {
		[key: string]: 'asc' | 'desc';
	};
	includeCount?: boolean;
	includeRelations?: boolean;
}

/**
 * Resultado de búsqueda de conceptos
 */
export interface ConceptSearchResult {
	items: ConceptWithStats[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

/**
 * Filtros para búsqueda de conceptos
 */
export interface ConceptFilters {
	search?: string;
	category?: string | string[];
	tags?: string[];
	onlyFavorites?: boolean;
}

/**
 * Concepto extendido con propiedades adicionales para UI
 */
export interface ConceptExtended extends ConceptWithStats {
	isSelected?: boolean;
	isHighlighted?: boolean;
	previewContent?: string;
	lastUpdated?: Date;
	importance?: number;
}

// Los tipos ConceptStats, ConceptStatistics y ConceptWithStats se importan desde base.ts

/**
 * Opciones de ordenación para conceptos
 */
export enum ConceptSortOption {
	NAME_ASC = 'name_asc',
	NAME_DESC = 'name_desc',
	CREATED_AT_ASC = 'created_at_asc',
	CREATED_AT_DESC = 'created_at_desc',
	UPDATED_AT_ASC = 'updated_at_asc',
	UPDATED_AT_DESC = 'updated_at_desc',
}

/**
 * Modos de vista para conceptos
 */
export enum ConceptViewMode {
	GRID = 'grid',
	LIST = 'list',
	CARDS = 'cards',
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

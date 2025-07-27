/**
 * @file Exportaciones principales de tipos para la entidad Concept.
 * @module types/entities/concept
 * @description
 *   Centraliza la exportación del tipo canónico **`ConceptWithStats`**.
 *
 *   - `ConceptBase`: Tipo base de Drizzle.
 *   - `ConceptStatistics`: Interfaz para las estadísticas de conteo.
 *   - `ConceptWithStats`: El tipo enriquecido que se debe usar en la app.
 *
 * @see /src/types/entities/concept/base.ts
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

// --- Tipos Canónicos ---
// Tipos base desde base.ts
export type {
	ConceptBase,
	ConceptComplete,
	ConceptExtended,
	ConceptStatistics,
	ConceptStats,
	ConceptWithStats,
} from './base';
// --- Enumeraciones ---
export {
	ConceptCategory,
	ConceptSortOption,
	ConceptStatus,
	ConceptViewMode,
} from './enums';

// Tipos adicionales desde types.ts
export type {
	ConceptCreateInput,
	ConceptUpdateInput,
} from './types';

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
	items: import('./base').ConceptBase[];
	total: number;
	page: number;
	pageSize: number;
	stats?: {
		totalConcepts: number;
		categoriesStats: Record<string, number>;
	};
}

// Alias para compatibilidad
export type ConceptSearchResult = ConceptResults;
export type ConceptSearchOptions = ConceptFilters;

// 📝 Documentación: Solo tipos y enums canónicos. Legacy removido.

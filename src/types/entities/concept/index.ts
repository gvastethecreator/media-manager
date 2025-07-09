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

// --- Enumeraciones ---
export {
	ConceptCategory,
	ConceptSortOption,
	ConceptStatus,
	ConceptViewMode,
} from './enums';
// --- Tipos Canónicos ---
export type {
	ConceptBase,
	ConceptComplete,
	ConceptCreateInput,
	ConceptExtended,
	ConceptFilters,
	ConceptListItem,
	ConceptSearchOptions,
	ConceptSearchResult,
	ConceptSortOption,
	ConceptUpdateInput,
	ConceptViewMode,
	ConceptWithStats,
} from './types';

// --- Tipos de compatibilidad e interfaces ---
import type { ConceptBase, ConceptWithStats } from './base';

export type ConceptComplete = ConceptWithStats;
export type ConceptCreateInput = Partial<ConceptBase>;
export type ConceptUpdateInput = Partial<Omit<ConceptBase, 'id' | 'createdAt' | 'updatedAt'>>;
export type ConceptSearchOptions = {
	skip?: number;
	take?: number;
	orderBy?: Record<string, 'asc' | 'desc'>;
	where?: Record<string, unknown>;
};

// 📝 Documentación: Solo tipos y enums canónicos. Legacy removido.

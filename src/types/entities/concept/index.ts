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
	ConceptCreateInput,
	ConceptExtended,
	ConceptFilters,
	ConceptSearchOptions,
	ConceptSearchResult,
	ConceptStatistics,
	ConceptStats,
	ConceptUpdateInput,
	ConceptWithStats,
} from './types';

// 📝 Documentación: Solo tipos y enums canónicos. Legacy removido.

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
	ConceptExtended,
	ConceptFilters,
	ConceptSearchOptions,
	ConceptSearchResult,
	ConceptUpdateInput,
} from './types';

// 📝 Documentación: Solo tipos y enums canónicos. Legacy removido.

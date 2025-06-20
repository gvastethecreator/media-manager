/**
 * @file Exportaciones principales de tipos para la entidad Wildcard
 * @module types/entities/wildcard
 */

// Exportar esquemas adicionales de validación
export {
	CreateWildcardSchema,
	UpdateWildcardSchema,
	WildcardChildSchema,
	WildcardFiltersSchema,
	WildcardRelationsSchema,
	WildcardStatsSchema,
} from './schema';
// Exportar los tipos principales
// Exportar tipos de compatibilidad (legados)
export type {
	CreateWildcardData,
	UpdateWildcardData,
	// Alias para retrocompatibilidad
	WildcardComplete as Wildcard,
	WildcardBase,
	WildcardChild,
	WildcardComplete,
	WildcardCounts,
	WildcardCreateInput,
	WildcardDeserialized,
	WildcardExtended,
	WildcardFilters,
	WildcardRelations,
	WildcardSearchOptions,
	WildcardSearchResult,
	WildcardUI,
	WildcardUpdateInput,
	WildcardWithRelations,
	WildcardWithStats,
} from './types';
// Exportar los enums y constantes
// Exportar el esquema de validación
export {
	WILDCARD_SORT_PROPERTY_MAP,
	WildcardSchema,
	WildcardSortCriteria,
	WildcardViewMode,
} from './types';

/**
 * @file Exportaciones principales de tipos para la entidad Wildcard
 * @module types/entities/wildcard
 */

// Exportar los tipos principales
export type {
	WildcardBase,
	WildcardCreateInput,
	WildcardUpdateInput,
	WildcardChild,
	WildcardRelations,
	WildcardCounts,
	WildcardFilters,
	WildcardUI,
	WildcardComplete,
	WildcardSearchOptions,
	WildcardSearchResult
} from './types';

// Exportar los enums y constantes
export {
	WildcardSortCriteria,
	WildcardViewMode,
	WILDCARD_SORT_PROPERTY_MAP
} from './types';

// Exportar el esquema de validación
export { WildcardSchema } from './types';

// Exportar esquemas adicionales de validación
export {
	WildcardFiltersSchema,
	WildcardStatsSchema,
	WildcardRelationsSchema,
	WildcardChildSchema,
	CreateWildcardSchema,
	UpdateWildcardSchema
} from './schema';

// Exportar tipos de compatibilidad (legados)
export type {
	CreateWildcardData,
	UpdateWildcardData,
	WildcardExtended,
	WildcardWithRelations,
	WildcardWithStats,
	WildcardDeserialized
} from './types';

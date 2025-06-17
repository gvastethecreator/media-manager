/**
 * @file Exportación de tipos para la entidad Wildcard
 * @module types/entities/wildcard
 */

export {
	CreateWildcardSchema,
	UpdateWildcardSchema,
	WildcardChildSchema,
	WildcardFiltersSchema,
	WildcardRelationsSchema,
	WildcardSchema,
	WildcardStatsSchema,
} from './schema';
// Alias común para el tipo principal
export type {
	CreateWildcardData,
	UpdateWildcardData,
	WildcardBase,
	WildcardChild,
	WildcardComplete,
	WildcardComplete as Wildcard,
	WildcardCounts,
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
export {
	WILDCARD_SORT_PROPERTY_MAP,
	WildcardSortCriteria,
	WildcardViewMode,
} from './types';

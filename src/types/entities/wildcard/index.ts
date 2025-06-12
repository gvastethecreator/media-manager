/**
 * @file Exportación de tipos para la entidad Wildcard
 * @module types/entities/wildcard
 */

export type {
	WildcardBase,
	WildcardChild,
	WildcardRelations,
	WildcardCounts,
	WildcardUI,
	WildcardDeserialized,
	WildcardWithRelations,
	WildcardComplete,
	WildcardExtended,
	WildcardWithStats,
	CreateWildcardData,
	UpdateWildcardData,
	WildcardUpdateInput,
	WildcardFilters,
	WildcardSearchOptions,
	WildcardSearchResult,
} from './types';

export {
	WildcardSortCriteria,
	WildcardViewMode,
	WILDCARD_SORT_PROPERTY_MAP,
} from './types';

export {
	WildcardSchema,
	WildcardFiltersSchema,
	WildcardStatsSchema,
	WildcardChildSchema,
	CreateWildcardSchema,
	UpdateWildcardSchema,
	WildcardRelationsSchema,
} from './schema';

// Alias común para el tipo principal
export type { WildcardComplete as Wildcard } from './types';

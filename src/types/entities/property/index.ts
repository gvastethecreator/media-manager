/**
 * @file Exportaciones principales de tipos para la entidad Property
 * @module types/entities/property
 */

// Exportar tipos específicos con aliases
export type {
	PROPERTY_SORT_PROPERTY_MAP,
	// Alias para retrocompatibilidad
	PropertyComplete as Property,
	PropertyBase,
	PropertyComplete,
	PropertyCreateInput,
	PropertyFilters,
	PropertyRelations,
	PropertySearchOptions,
	PropertySearchResult,
	PropertyUpdateInput,
	PropertyWithCounts,
	PropertyWithRelations,
} from './types';

export {
	PropertySchema,
	PropertySortCriteria,
	PropertyViewMode,
} from './types';

// No exportamos './schema.ts' directamente ya que sus esquemas también se exportan desde tipos

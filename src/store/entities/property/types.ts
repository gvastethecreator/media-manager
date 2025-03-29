/**
 * @file Tipos para el store de Property
 * @module store/entities/property/types
 */

import type {
    Property,
    PropertyDisplayState,
    PropertySortCriteria,
    PropertyViewMode
} from '../../../types/entities/property';

/**
 * Estado del core para el store de propiedades
 */
export interface PropertyCoreState {
  /** Mapa de propiedades indexadas por ID */
  properties: Record<string, Property>;
  /** Items asociados a cada propiedad */
  propertyItems: Record<string, Array<{ id: string; type: 'image' | 'video' | 'note' | 'tag' }>>;
  /** Estado de carga */
  isLoading: boolean;
  /** Error si existe */
  error: string | null;
  /** Fecha de última actualización */
  lastUpdated: Date | null;
}

/**
 * Estado de UI para el store de propiedades
 */
export interface PropertyUIState {
  /** IDs de propiedades seleccionadas */
  selectedIds: string[];
  /** Modo de visualización actual */
  viewMode: PropertyViewMode;
  /** Si el visor está abierto */
  isViewerOpen: boolean;
  /** ID de la propiedad actual en el visor */
  currentPropertyId: string | null;
  /** Estado de visualización por ID de propiedad */
  displayState: Record<string, PropertyDisplayState>;
  /** ID de la propiedad siendo arrastrada */
  draggedPropertyId: string | null;
  /** ID de la propiedad objetivo de soltar */
  dropTargetPropertyId: string | null;
  /** ID de la propiedad resaltada */
  highlightedId: string | null;
  /** IDs de propiedades expandidas */
  expandedIds: string[];
}

/**
 * Estado de filtros para el store de propiedades
 */
export interface PropertyFiltersState {
  /** Criterio de ordenación */
  sortBy: PropertySortCriteria;
  /** Término de búsqueda */
  searchQuery: string;
  /** Filtro por categoría */
  filterByCategory: string | null;
  /** Filtro de favoritos */
  filterFavorites: boolean;
  /** Rango de fechas */
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
}

/**
 * Estado combinado del store de propiedades
 */
export interface PropertyState {
  core: PropertyCoreState;
  ui: PropertyUIState;
  filters: PropertyFiltersState;
}
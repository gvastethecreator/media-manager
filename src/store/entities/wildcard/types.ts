/**
 * @file Tipos para el store de Wildcard
 * @module store/entities/wildcard/types
 */

import type {
    WildcardComplete,
    WildcardDisplayState,
    WildcardSortCriteria,
    WildcardViewMode,
} from '../../../types/entities/wildcard';

/**
 * Estado del core para el store de comodines
 */
export interface WildcardCoreState {
	/** Mapa de comodines indexados por ID */
	wildcards: Record<string, WildcardComplete>;
	/** Items asociados a cada comodín */
	wildcardItems: Record<string, Array<{ id: string; type: 'image' | 'video' | 'note' | 'tag' }>>;
	/** Estado de carga */
	isLoading: boolean;
	/** Error si existe */
	error: string | null;
	/** Fecha de última actualización */
	lastUpdated: Date | null;
}

/**
 * Estado de UI para el store de comodines
 */
export interface WildcardUIState {
	/** IDs de comodines seleccionados */
	selectedIds: string[];
	/** Modo de visualización actual */
	viewMode: WildcardViewMode;
	/** Si el visor está abierto */
	isViewerOpen: boolean;
	/** ID del comodín actual en el visor */
	currentWildcardId: string | null;
	/** Estado de visualización por ID de comodín */
	displayState: Record<string, WildcardDisplayState>;
	/** ID del comodín siendo arrastrado */
	draggedWildcardId: string | null;
	/** ID del comodín objetivo de soltar */
	dropTargetWildcardId: string | null;
	/** ID del comodín resaltado */
	highlightedId: string | null;
	/** IDs de comodines expandidos */
	expandedIds: string[];
}

/**
 * Estado de filtros para el store de comodines
 */
export interface WildcardFiltersState {
	/** Criterio de ordenación */
	sortBy: WildcardSortCriteria;
	/** Término de búsqueda */
	searchQuery: string;
	/** Filtro por categoría */
	filterByCategory: string | null;
	/** Filtro de favoritos */
	filterFavorites: boolean;
	/** Filtro por ID de padre (para jerarquía) */
	parentId: string | null;
	/** Mostrar solo comodines con hijos */
	onlyWithChildren: boolean;
	/** Rango de fechas */
	dateRange: {
		from: Date | null;
		to: Date | null;
	};
}

/**
 * Estado combinado del store de comodines
 */
export interface WildcardState {
	core: WildcardCoreState;
	ui: WildcardUIState;
	filters: WildcardFiltersState;
}

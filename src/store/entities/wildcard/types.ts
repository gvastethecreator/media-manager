/**
 * @file Tipos para el store de Wildcard
 * @module store/entities/wildcard/types
 */

import type { WildcardSortCriteria, WildcardViewMode, WildcardWithStats } from '@/types/entities/wildcard';

/**
 * Estado de visualización para un wildcard individual
 */
export interface WildcardDisplayState {
	/** Si está en modo de edición */
	isEditing?: boolean;
	/** Si está expandido */
	isExpanded?: boolean;
	/** Si está resaltado */
	isHighlighted?: boolean;
	/** Si está siendo mostrado */
	isVisible?: boolean;
	/** Opacidad */
	opacity?: number;
	/** Posición en la vista */
	position?: { x: number; y: number };
	/** Tamaño en la vista */
	size?: { width: number; height: number };
	/** Z-index */
	zIndex?: number;
}

/**
 * Estado del core para el store de comodines
 */
export interface WildcardCoreState {
	/** Error si existe */
	error: string | null;
	/** Estado de carga */
	isLoading: boolean;
	/** Fecha de última actualización */
	lastUpdated: Date | null;
	/** Items asociados a cada comodín */
	wildcardItems: Record<string, Array<{ id: string; type: 'image' | 'video' | 'note' | 'tag' }>>;
	/** Mapa de comodines indexados por ID */
	wildcards: Record<string, WildcardWithStats>;
}

/**
 * Estado de UI para el store de comodines
 */
export interface WildcardUIState {
	/** ID del comodín actual en el visor */
	currentWildcardId: string | null;
	/** Estado de visualización por ID de comodín */
	displayState: Record<string, WildcardDisplayState>;
	/** ID del comodín siendo arrastrado */
	draggedWildcardId: string | null;
	/** ID del comodín objetivo de soltar */
	dropTargetWildcardId: string | null;
	/** IDs de comodines expandidos */
	expandedIds: string[];
	/** ID del comodín resaltado */
	highlightedId: string | null;
	/** Si el visor está abierto */
	isViewerOpen: boolean;
	/** IDs de comodines seleccionados */
	selectedIds: string[];
	/** Modo de visualización actual */
	viewMode: WildcardViewMode;
}

/**
 * Estado de filtros para el store de comodines
 */
export interface WildcardFiltersState {
	/** Rango de fechas */
	dateRange: {
		from: Date | null;
		to: Date | null;
	};
	/** Filtro por categoría */
	filterByCategory: string | null;
	/** Filtro de favoritos */
	filterFavorites: boolean;
	/** Mostrar solo comodines con hijos */
	onlyWithChildren: boolean;
	/** Filtro por ID de padre (para jerarquía) */
	parentId: string | null;
	/** Término de búsqueda */
	searchQuery: string;
	/** Criterio de ordenación */
	sortBy: WildcardSortCriteria;
}

/**
 * Estado combinado del store de comodines
 */
export interface WildcardState {
	core: WildcardCoreState;
	filters: WildcardFiltersState;
	ui: WildcardUIState;
}

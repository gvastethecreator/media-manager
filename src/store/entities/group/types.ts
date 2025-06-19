/**
 * @file Tipos para el store de Group
 * @module store/entities/group/types
 */

import type { Group, GroupDisplayState } from '@/types/entities/group';
import { GroupSortCriteria, GroupType, GroupViewMode } from '@/types/entities/group';

/**
 * Estado del core para el store de grupos
 */
export interface GroupCoreState {
	/** Mapa de grupos indexados por ID */
	groups: Record<string, Group>;
	/** Items asociados a cada grupo */
	groupItems: Record<string, Array<{ id: string; type: 'image' | 'video' | 'note' | 'tag' }>>;
	/** Estado de carga */
	isLoading: boolean;
	/** Error si existe */
	error: string | null;
	/** Fecha de última actualización */
	lastUpdated: Date | null;
}

/**
 * Estado de UI para el store de grupos
 */
export interface GroupUIState {
	/** IDs de grupos seleccionados */
	selectedIds: string[];
	/** Modo de visualización actual */
	viewMode: GroupViewMode;
	/** Si el visor está abierto */
	isViewerOpen: boolean;
	/** ID del grupo actual en el visor */
	currentGroupId: string | null;
	/** Estado de visualización por ID de grupo */
	displayState: Record<string, GroupDisplayState>;
	/** ID del grupo siendo arrastrado */
	draggedGroupId: string | null;
	/** ID del grupo objetivo de soltar */
	dropTargetGroupId: string | null;
	/** ID del grupo resaltado */
	highlightedId: string | null;
	/** IDs de grupos expandidos */
	expandedIds: string[];
}

/**
 * Estado de filtros para el store de grupos
 */
export interface GroupFiltersState {
	/** Criterio de ordenación */
	sortBy: GroupSortCriteria;
	/** Término de búsqueda */
	searchQuery: string;
	/** Filtro por tipo */
	filterByType: GroupType | null;
	/** Filtro por categoría */
	filterByCategory: string | null;
	/** Filtro de favoritos */
	filterFavorites: boolean;
	/** Filtro de compartidos */
	filterShared: boolean;
	/** Rango de fechas */
	dateRange: {
		from: Date | null;
		to: Date | null;
	};
}

/**
 * Estado combinado del store de grupos
 */
export interface GroupState {
	core: GroupCoreState;
	ui: GroupUIState;
	filters: GroupFiltersState;
}

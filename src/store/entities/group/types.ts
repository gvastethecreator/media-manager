/**
 * @file Tipos para el store de la entidad Group.
 * @module store/entities/group/types
 * @description Define la forma del estado y las acciones para el store de Group.
 * @updated 2025-01-27 - MIGRADO A DRIZZLE ORM
 */

import type { GroupCreateInput, GroupUpdateInput, GroupWithStats } from '@/types/entities/group';
import { GroupSortCriteria, GroupType, GroupViewMode } from '@/types/entities/group';

/**
 * Estado del core para el store de grupos
 */
export interface GroupCoreState {
	/** Mapa de grupos indexados por ID */
	groups: Record<string, GroupWithStats>;
	/** Estado de carga */
	isLoading: boolean;
	/** Error si existe */
	error: string | null;
	/** Fecha de última actualización */
	lastUpdated: number | null;
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
export interface GroupFilterState {
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
	/** Rango de fechas */
	dateRange: {
		from: Date | null;
		to: Date | null;
	};
}

/**
 * Acciones del core para el store de grupos
 */
export interface GroupCoreActions {
	loadGroups: () => Promise<void>;
	createGroup: (data: GroupCreateInput) => Promise<void>;
	updateGroup: (id: string, data: GroupUpdateInput) => Promise<void>;
	deleteGroup: (id: string) => Promise<void>;
}

/**
 * Acciones de UI para el store de grupos
 */
export interface GroupUIActions {
	setSelectedIds: (ids: string[]) => void;
}

/**
 * Acciones de filtros para el store de grupos
 */
export interface GroupFilterActions {
	setSearchQuery: (query: string) => void;
}

/**
 * Estado combinado del store de grupos
 */
export interface GroupState {
	core: GroupCoreState;
	ui: GroupUIState;
	filters: GroupFilterState;
}

/**
 * Store completo del store de grupos
 */
export type GroupStore = GroupCoreState &
	GroupCoreActions &
	GroupUIState &
	GroupUIActions &
	GroupFilterState &
	GroupFilterActions;

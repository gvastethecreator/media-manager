/**
 * @file Tipos para el store de la entidad Group.
 * @module store/entities/group/types
 * @description Define la forma del estado y las acciones para el store de Group.
 * @updated 2025-01-27 - MIGRADO A DRIZZLE ORM
 */

import type {
	GroupCreateInput,
	GroupUpdateInput,
	GroupViewConfig,
	GroupViewMode,
	GroupWithStats,
} from '@/types/entities/group';
import { GroupSortCriteria, GroupType } from '@/types/entities/group/enums';

/**
 * Estado del core para el store de grupos
 */
export interface GroupCoreState {
	/** Error si existe */
	error: string | null;
	/** Array de grupos */
	groups: GroupWithStats[];
	/** Estado de carga */
	isLoading: boolean;
	/** Fecha de última actualización */
	lastUpdated: number | null;
}

/**
 * Estado de UI para el store de grupos
 */
export interface GroupDisplayState {
	// Propiedades de estado de visualización para un grupo individual
	isExpanded?: boolean;
	isVisible?: boolean;
}

export interface GroupUIState {
	/** ID del grupo actual en el visor */
	currentGroupId: string | null;
	/** Estado de visualización por ID de grupo */
	displayState: Record<string, GroupDisplayState>;
	/** ID del grupo siendo arrastrado */
	draggedGroupId: string | null;
	/** ID del grupo objetivo de soltar */
	dropTargetGroupId: string | null;
	/** IDs de grupos expandidos */
	expandedIds: string[];
	/** ID del grupo resaltado */
	highlightedId: string | null;
	/** Si el visor está abierto */
	isViewerOpen: boolean;
	/** IDs de grupos seleccionados */
	selectedIds: string[];
	/** Configuración de vista */
	viewConfig: GroupViewConfig;
	/** Modo de visualización actual */
	viewMode: GroupViewMode;
}

/**
 * Estado de filtros para el store de grupos
 */
export interface GroupFilterState {
	/** Rango de fechas */
	dateRange: {
		from: Date | null;
		to: Date | null;
	};
	/** Filtro por categoría */
	filterByCategory: string | null;
	/** Filtro por tipo */
	filterByType: GroupType | null;
	/** Filtro de favoritos */
	filterFavorites: boolean;
	/** Término de búsqueda */
	searchQuery: string;
	/** Criterio de ordenación */
	sortBy: GroupSortCriteria;
}

/**
 * Acciones del core para el store de grupos
 */
export interface GroupCoreActions {
	createGroup: (data: GroupCreateInput) => Promise<void>;
	deleteGroup: (id: string) => Promise<void>;
	loadGroups: () => Promise<void>;
	updateGroup: (id: string, data: GroupUpdateInput) => Promise<void>;
}

/**
 * Acciones de UI para el store de grupos
 */
export interface GroupUIActions {
	clearSelection: () => void;
	closeViewer: () => void;
	collapseAllGroups: () => void;
	collapseGroup: (id: string) => void;
	deselectGroup: (id: string) => void;
	expandAllGroups: () => void;
	// Expansión de grupos
	expandGroup: (id: string) => void;
	getCurrentGroup: () => GroupWithStats | null;
	getDraggedGroup: () => string | null;
	getDropTargetGroup: () => string | null;
	getGroupDisplayState: (id: string) => GroupDisplayState;
	getHighlightedGroup: () => string | null;
	getSelectedGroups: () => string[];
	getViewMode: () => GroupViewMode;
	// Resaltado
	highlightGroup: (id: string | null) => void;
	isGroupExpanded: (id: string) => boolean;
	isGroupSelected: (id: string) => boolean;
	// Visor de grupos
	openViewer: (groupId: string) => void;
	// Selección de grupos
	selectGroup: (id: string | null) => void;
	selectMultipleGroups: (ids: string[]) => void;
	// Drag & Drop
	setDraggedGroup: (id: string | null) => void;
	setDropTargetGroup: (id: string | null) => void;
	// Estado de visualización
	setGroupDisplayState: (id: string, state: GroupDisplayState) => void;
	setSelectedIds: (ids: string[]) => void;
	// Modo de visualización
	setViewMode: (viewMode: GroupViewMode) => void;
	toggleGroupExpansion: (id: string) => void;
	toggleGroupSelection: (id: string) => void;
}

/**
 * Acciones de filtros para el store de grupos
 */
export interface GroupFilterActions {
	applyFilters: (groups: GroupWithStats[]) => GroupWithStats[];
	applySort: (groups: GroupWithStats[]) => GroupWithStats[];
	getFilteredGroups: () => GroupWithStats[];
	resetFilters: () => void;
	setDateRange: (from: Date | null, to: Date | null) => void;
	setFilterByCategory: (category: string | null) => void;
	setFilterByType: (type: GroupType | null) => void;
	setFilterFavorites: (onlyFavorites: boolean) => void;
	setSearchQuery: (query: string) => void;
	setSortBy: (sortBy: GroupSortCriteria) => void;
}

/**
 * Estado combinado del store de grupos
 */
export interface GroupState {
	core: GroupCoreState;
	filters: GroupFilterState;
	ui: GroupUIState;
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

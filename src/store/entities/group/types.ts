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
	/** Array de grupos */
	groups: GroupWithStats[];
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
export interface GroupDisplayState {
	// Propiedades de estado de visualización para un grupo individual
	isExpanded?: boolean;
	isVisible?: boolean;
}

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
	/** Configuración de vista */
	viewConfig: GroupViewConfig;
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
	// Selección de grupos
	selectGroup: (id: string | null) => void;
	deselectGroup: (id: string) => void;
	toggleGroupSelection: (id: string) => void;
	selectMultipleGroups: (ids: string[]) => void;
	clearSelection: () => void;
	getSelectedGroups: () => string[];
	isGroupSelected: (id: string) => boolean;
	// Visor de grupos
	openViewer: (groupId: string) => void;
	closeViewer: () => void;
	getCurrentGroup: () => GroupWithStats | null;
	// Modo de visualización
	setViewMode: (viewMode: GroupViewMode) => void;
	getViewMode: () => GroupViewMode;
	// Estado de visualización
	setGroupDisplayState: (id: string, state: GroupDisplayState) => void;
	getGroupDisplayState: (id: string) => GroupDisplayState;
	// Expansión de grupos
	expandGroup: (id: string) => void;
	collapseGroup: (id: string) => void;
	toggleGroupExpansion: (id: string) => void;
	isGroupExpanded: (id: string) => boolean;
	expandAllGroups: () => void;
	collapseAllGroups: () => void;
	// Drag & Drop
	setDraggedGroup: (id: string | null) => void;
	setDropTargetGroup: (id: string | null) => void;
	getDraggedGroup: () => string | null;
	getDropTargetGroup: () => string | null;
	// Resaltado
	highlightGroup: (id: string | null) => void;
	getHighlightedGroup: () => string | null;
}

/**
 * Acciones de filtros para el store de grupos
 */
export interface GroupFilterActions {
	setSearchQuery: (query: string) => void;
	setSortBy: (sortBy: GroupSortCriteria) => void;
	setFilterByType: (type: GroupType | null) => void;
	setFilterByCategory: (category: string | null) => void;
	setFilterFavorites: (onlyFavorites: boolean) => void;
	setDateRange: (from: Date | null, to: Date | null) => void;
	resetFilters: () => void;
	getFilteredGroups: () => GroupWithStats[];
	applySort: (groups: GroupWithStats[]) => GroupWithStats[];
	applyFilters: (groups: GroupWithStats[]) => GroupWithStats[];
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

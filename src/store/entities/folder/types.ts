/**
 * @file Tipos para el store de carpetas
 * @module store/entities/folder/types
 */

import type { CreateFolderData, FolderWithRelations, UpdateFolderData } from '@/types/entities/folder/types';
import type { StateCreator } from 'zustand';

/**
 * Estado base del store
 */
export interface FolderStore {
	coreState: FolderCoreState;
	coreActions: FolderCoreActions;
	uiState: FolderUIState;
	uiActions: FolderUIActions;
	filtersState: FolderFiltersState;
	filtersActions: FolderFiltersActions;
}

/**
 * Estado principal para el manejo de carpetas
 */
export interface FolderCoreState {
	/** Listado de carpetas disponibles */
	folders: FolderWithRelations[];
	/** ID de la carpeta actual seleccionada */
	currentFolderId: string | null;
	/** Objeto de la carpeta actual seleccionada */
	currentFolder: FolderWithRelations | null;
	/** Indicador de carga general */
	loading: boolean;
	/** Error actual si existe */
	error: string | null;
	/** Indicador de creación en proceso */
	isCreating: boolean;
	/** Indicador de actualización en proceso */
	isUpdating: boolean;
	/** Indicador de eliminación en proceso */
	isDeleting: boolean;
}

/**
 * Acciones para el manejo del estado principal
 */
export interface FolderCoreActions {
	/** Obtiene todas las carpetas */
	fetchFolders: () => Promise<void>;
	/** Obtiene una carpeta por su ID */
	fetchFolderById: (id: string) => Promise<FolderWithRelations | null>;
	/** Crea una nueva carpeta */
	createFolder: (data: CreateFolderData) => Promise<FolderWithRelations | null>;
	/** Actualiza una carpeta existente */
	updateFolder: (id: string, data: UpdateFolderData) => Promise<FolderWithRelations | null>;
	/** Elimina una carpeta */
	deleteFolder: (id: string) => Promise<boolean>;
	/** Establece la carpeta actual por ID */
	setCurrentFolderId: (id: string | null) => void;
	/** Establece la carpeta actual directamente */
	setCurrentFolder: (folder: FolderWithRelations | null) => void;
	/** Reinicia el estado de error */
	resetError: () => void;
}

/**
 * Estado de UI para carpetas
 */
export interface FolderUIState {
	/** Modo de visualización (grid, list, etc) */
	viewMode: 'grid' | 'list' | 'tree';
	/** Tamaño de los elementos en la vista */
	itemSize: 'small' | 'medium' | 'large';
	/** Estado del sidebar */
	sidebarExpanded: boolean;
	/** Carpetas expandidas en vista de árbol */
	expandedFolders: string[];
	/** Modal de creación abierto */
	showCreateModal: boolean;
	/** Modal de edición abierto */
	showEditModal: boolean;
	/** Modal de confirmación de eliminación abierto */
	showDeleteModal: boolean;
	/** Modal de visualización de estadísticas abierto */
	showStatsModal: boolean;
	/** ID de la carpeta seleccionada para estadísticas */
	statsSelectedFolderId: string | null;
}

/**
 * Acciones para el manejo del estado de UI
 */
export interface FolderUIActions {
	/** Cambia el modo de visualización */
	setViewMode: (mode: FolderUIState['viewMode']) => void;
	/** Cambia el tamaño de los elementos */
	setItemSize: (size: FolderUIState['itemSize']) => void;
	/** Alterna el estado del sidebar */
	toggleSidebar: () => void;
	/** Expande o colapsa una carpeta en vista de árbol */
	toggleFolderExpanded: (id: string) => void;
	/** Abre el modal de creación */
	openCreateModal: () => void;
	/** Cierra el modal de creación */
	closeCreateModal: () => void;
	/** Abre el modal de edición */
	openEditModal: () => void;
	/** Cierra el modal de edición */
	closeEditModal: () => void;
	/** Abre el modal de confirmación de eliminación */
	openDeleteModal: () => void;
	/** Cierra el modal de confirmación de eliminación */
	closeDeleteModal: () => void;
	/** Abre el modal de estadísticas */
	openStatsModal: (folderId: string) => void;
	/** Cierra el modal de estadísticas */
	closeStatsModal: () => void;
}

/**
 * Estado de filtros para carpetas
 */
export interface FolderFiltersState {
	/** Término de búsqueda */
	searchTerm: string;
	/** Criterio de ordenación */
	sortBy: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'fileCount' | 'lastIndexed';
	/** Dirección de ordenación */
	sortDirection: 'asc' | 'desc';
	/** Filtro por favoritos */
	showFavorites: boolean;
	/** Filtro por carpetas activas/inactivas */
	activeOnly: boolean;
	/** Filtro por categoría */
	categoryFilter: string | null;
	/** Filtro por tamaño mínimo (en bytes) */
	minSize: number | null;
	/** Filtro por tamaño máximo (en bytes) */
	maxSize: number | null;
	/** Filtro por número mínimo de archivos */
	minFiles: number | null;
	/** Filtro por número máximo de archivos */
	maxFiles: number | null;
	/** Filtrar sólo carpetas sin indexar */
	notIndexed: boolean;
	/** Filtrar sólo carpetas con indexación automática */
	autoReindexOnly: boolean;
	/** Filtrar por fecha de última indexación (desde) */
	indexedAfter: Date | null;
	/** Filtrar por fecha de última indexación (hasta) */
	indexedBefore: Date | null;
}

/**
 * Acciones para el manejo de filtros
 */
export interface FolderFiltersActions {
	/** Establece el término de búsqueda */
	setSearchTerm: (term: string) => void;
	/** Establece el criterio de ordenación */
	setSortBy: (sortBy: FolderFiltersState['sortBy']) => void;
	/** Establece la dirección de ordenación */
	setSortDirection: (direction: FolderFiltersState['sortDirection']) => void;
	/** Alterna el filtro de favoritos */
	toggleFavorites: () => void;
	/** Alterna el filtro de activos/inactivos */
	toggleActiveOnly: () => void;
	/** Establece el filtro de categoría */
	setCategoryFilter: (category: string | null) => void;
	/** Establece el filtro de tamaño mínimo */
	setMinSize: (size: number | null) => void;
	/** Establece el filtro de tamaño máximo */
	setMaxSize: (size: number | null) => void;
	/** Establece el filtro de número mínimo de archivos */
	setMinFiles: (count: number | null) => void;
	/** Establece el filtro de número máximo de archivos */
	setMaxFiles: (count: number | null) => void;
	/** Alterna el filtro de carpetas sin indexar */
	toggleNotIndexed: () => void;
	/** Alterna el filtro de carpetas con indexación automática */
	toggleAutoReindexOnly: () => void;
	/** Establece el filtro de fecha de última indexación (desde) */
	setIndexedAfter: (date: Date | null) => void;
	/** Establece el filtro de fecha de última indexación (hasta) */
	setIndexedBefore: (date: Date | null) => void;
	/** Reinicia todos los filtros */
	resetFilters: () => void;
}

/**
 * Tipo para slice de core
 */
export type FolderCoreSlice = StateCreator<
	FolderStore,
	[],
	[],
	{ coreState: FolderCoreState; coreActions: FolderCoreActions }
>;

/**
 * Tipo para slice de UI
 */
export type FolderUISlice = StateCreator<FolderStore, [], [], { uiState: FolderUIState; uiActions: FolderUIActions }>;

/**
 * Tipo para slice de filtros
 */
export type FolderFiltersSlice = StateCreator<
	FolderStore,
	[],
	[],
	{ filtersState: FolderFiltersState; filtersActions: FolderFiltersActions }
>;

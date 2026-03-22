/**
 * @file Tipos para el store de Folder optimizado
 * @module store/entities/folder/types
 */

import type { FolderViewConfig, FolderWithStats } from '@/types/entities/folder';
import type { FolderSortCriteria, FolderViewMode } from '@/types/entities/folder/enums';

/**
 * 📁 Store optimizado para Folder con Record pattern
 */
export interface FolderStore {
	addFolder: (folder: FolderWithStats) => void;

	// Funciones de utilidad
	clear: () => void;
	currentPath: string[];
	error: string | null;
	expandedFolders: Set<string>;
	expandPath: (path: string[]) => void;
	fetchFolders: () => Promise<void>; // Alias para refresh
	// Datos principales (Record optimizado)
	folders: Record<string, FolderWithStats>;

	// Índices auxiliares para acceso O(1)
	foldersByParent: Record<string, string[]>; // parentId -> [childId1, childId2]
	folderTree: Record<string, string[]>; // Árbol completo
	getAncestors: (folderId: string) => FolderWithStats[];
	getDescendants: (folderId: string) => FolderWithStats[];

	// Funciones de acceso O(1)
	getFolder: (id: string) => FolderWithStats | undefined;
	getFolderPath: (id: string) => FolderWithStats[];
	getFoldersByParent: (parentId: string | null) => FolderWithStats[];
	getRootFolders: () => FolderWithStats[];

	// Estado de carga
	isLoading: boolean;
	lastUpdated: Date | null;

	// Funciones de jerarquía
	moveFolder: (folderId: string, newParentId: string | null) => void;
	refresh: () => Promise<void>;
	removeFolder: (id: string) => void;
	rootFolders: string[]; // IDs de carpetas raíz

	// Estado de UI
	selectedFolderId: string | null;

	// Funciones de UI
	selectFolder: (id: string | null) => void;

	// Funciones de manipulación
	setFolders: (folders: FolderWithStats[]) => void;
	toggleExpanded: (id: string) => void;
	updateFolder: (id: string, updates: Partial<FolderWithStats>) => void;
	viewConfig: FolderViewConfig;
}

/**
 * 📁 Funciones auxiliares para el store
 */
export interface FolderStoreHelpers {
	// Navegación
	buildBreadcrumbs: (folders: Record<string, FolderWithStats>, folderId: string) => FolderWithStats[];
	buildParentIndex: (folders: Record<string, FolderWithStats>) => Record<string, string[]>;
	buildTreeIndex: (folders: Record<string, FolderWithStats>) => Record<string, string[]>;
	filterByOrganization: (folders: Record<string, FolderWithStats>, minScore: number) => FolderWithStats[];
	findPath: (folders: Record<string, FolderWithStats>, fromId: string, toId: string) => string[];
	// Conversión
	foldersArrayToRecord: (folders: FolderWithStats[]) => Record<string, FolderWithStats>;

	// Búsqueda y filtrado
	searchFolders: (folders: Record<string, FolderWithStats>, query: string) => FolderWithStats[];
}

/**
 * 📁 Estado de filtros para carpetas
 */
export interface FolderFiltersState {
	itemSize: 'small' | 'medium' | 'large';
	maxDepth: number | null;
	minOrganizationScore: number;
	searchQuery: string;
	showEmptyFolders: boolean;
	showOnlyFavorites: boolean;
	sortBy: FolderSortCriteria;
	sortDirection: 'asc' | 'desc';
	viewMode: FolderViewMode;
}

/**
 * 📁 Slice de filtros para carpetas
 */
export interface FolderFiltersSlice extends FolderFiltersState {
	applyFilters: (folders: FolderWithStats[]) => FolderWithStats[];
	applySort: (folders: FolderWithStats[]) => FolderWithStats[];

	// Obtener carpetas filtradas
	getFilteredFolders: () => FolderWithStats[];
	resetFilters: () => void;
	setItemSize: (size: 'small' | 'medium' | 'large') => void;
	setMaxDepth: (depth: number | null) => void;
	setMinOrganizationScore: (score: number) => void;
	setSearchQuery: (query: string) => void;
	setShowEmptyFolders: (show: boolean) => void;
	setShowOnlyFavorites: (show: boolean) => void;
	// Establecer filtros
	setSortBy: (sortBy: FolderSortCriteria) => void;
	setSortDirection: (direction: 'asc' | 'desc') => void;
	setViewMode: (viewMode: FolderViewMode) => void;
	toggleFavorites: () => void;
}

/**
 * 📁 Estado de navegación para carpetas
 */
export interface FolderNavigationState {
	breadcrumbs: Array<{ id: string; name: string; path: string }>;
	currentFolderId: string | null;
	history: string[];
	historyIndex: number;
}

/**
 * 📁 Slice de navegación para carpetas
 */
export interface FolderNavigationSlice extends FolderNavigationState {
	// Historial
	canGoBack: () => boolean;
	canGoForward: () => boolean;
	clearHistory: () => void;
	navigateBack: () => void;
	navigateForward: () => void;
	// Navegación
	navigateToFolder: (id: string) => void;
	navigateUp: () => void;

	// Breadcrumbs
	updateBreadcrumbs: (folderId: string) => void;
}

/**
 * 📁 Store completo de Folder
 */
export interface CompleteFolderStore extends FolderStore, FolderFiltersSlice, FolderNavigationSlice {}

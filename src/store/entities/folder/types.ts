/**
 * @file Tipos para el store de Folder optimizado
 * @module store/entities/folder/types
 */

import type { FolderWithStats } from '@/types/entities/folder';
import type { FolderSortCriteria, FolderViewMode } from '@/types/entities/folder/enums';

/**
 * 📁 Store optimizado para Folder con Record pattern
 */
export interface FolderStore {
	// Datos principales (Record optimizado)
	folders: Record<string, FolderWithStats>;

	// Índices auxiliares para acceso O(1)
	foldersByParent: Record<string, string[]>; // parentId -> [childId1, childId2]
	rootFolders: string[]; // IDs de carpetas raíz
	folderTree: Record<string, string[]>; // Árbol completo

	// Estado de carga
	isLoading: boolean;
	error: string | null;
	lastUpdated: Date | null;

	// Funciones de acceso O(1)
	getFolder: (id: string) => FolderWithStats | undefined;
	getFoldersByParent: (parentId: string | null) => FolderWithStats[];
	getRootFolders: () => FolderWithStats[];
	getFolderPath: (id: string) => FolderWithStats[];

	// Funciones de manipulación
	setFolders: (folders: FolderWithStats[]) => void;
	addFolder: (folder: FolderWithStats) => void;
	updateFolder: (id: string, updates: Partial<FolderWithStats>) => void;
	removeFolder: (id: string) => void;

	// Funciones de jerarquía
	moveFolder: (folderId: string, newParentId: string | null) => void;
	getDescendants: (folderId: string) => FolderWithStats[];
	getAncestors: (folderId: string) => FolderWithStats[];

	// Estado de UI
	selectedFolderId: string | null;
	expandedFolders: Set<string>;
	currentPath: string[];

	// Funciones de UI
	selectFolder: (id: string | null) => void;
	toggleExpanded: (id: string) => void;
	expandPath: (path: string[]) => void;

	// Funciones de utilidad
	clear: () => void;
	refresh: () => Promise<void>;
}

/**
 * 📁 Funciones auxiliares para el store
 */
export interface FolderStoreHelpers {
	// Conversión
	foldersArrayToRecord: (folders: FolderWithStats[]) => Record<string, FolderWithStats>;
	buildParentIndex: (folders: Record<string, FolderWithStats>) => Record<string, string[]>;
	buildTreeIndex: (folders: Record<string, FolderWithStats>) => Record<string, string[]>;

	// Búsqueda y filtrado
	searchFolders: (folders: Record<string, FolderWithStats>, query: string) => FolderWithStats[];
	filterByOrganization: (folders: Record<string, FolderWithStats>, minScore: number) => FolderWithStats[];

	// Navegación
	buildBreadcrumbs: (folders: Record<string, FolderWithStats>, folderId: string) => FolderWithStats[];
	findPath: (folders: Record<string, FolderWithStats>, fromId: string, toId: string) => string[];
}

/**
 * 📁 Estado de filtros para carpetas
 */
export interface FolderFiltersState {
	sortBy: FolderSortCriteria;
	sortDirection: 'asc' | 'desc';
	viewMode: FolderViewMode;
	itemSize: 'small' | 'medium' | 'large';
	searchQuery: string;
	showOnlyFavorites: boolean;
	minOrganizationScore: number;
	showEmptyFolders: boolean;
	maxDepth: number | null;
}

/**
 * 📁 Slice de filtros para carpetas
 */
export interface FolderFiltersSlice extends FolderFiltersState {
	// Establecer filtros
	setSortBy: (sortBy: FolderSortCriteria) => void;
	setSortDirection: (direction: 'asc' | 'desc') => void;
	setViewMode: (viewMode: FolderViewMode) => void;
	setItemSize: (size: 'small' | 'medium' | 'large') => void;
	setSearchQuery: (query: string) => void;
	setShowOnlyFavorites: (show: boolean) => void;
	setMinOrganizationScore: (score: number) => void;
	setShowEmptyFolders: (show: boolean) => void;
	setMaxDepth: (depth: number | null) => void;
	toggleFavorites: () => void;
	resetFilters: () => void;

	// Obtener carpetas filtradas
	getFilteredFolders: () => FolderWithStats[];
	applySort: (folders: FolderWithStats[]) => FolderWithStats[];
	applyFilters: (folders: FolderWithStats[]) => FolderWithStats[];
}

/**
 * 📁 Estado de navegación para carpetas
 */
export interface FolderNavigationState {
	currentFolderId: string | null;
	breadcrumbs: Array<{ id: string; name: string; path: string }>;
	history: string[];
	historyIndex: number;
}

/**
 * 📁 Slice de navegación para carpetas
 */
export interface FolderNavigationSlice extends FolderNavigationState {
	// Navegación
	navigateToFolder: (id: string) => void;
	navigateUp: () => void;
	navigateBack: () => void;
	navigateForward: () => void;

	// Historial
	canGoBack: () => boolean;
	canGoForward: () => boolean;
	clearHistory: () => void;

	// Breadcrumbs
	updateBreadcrumbs: (folderId: string) => void;
}

/**
 * 📁 Store completo de Folder
 */
export interface CompleteFolderStore extends FolderStore, FolderFiltersSlice, FolderNavigationSlice {}

/**
 * @file Tipos para el store de álbumes
 * @module store/entities/album/types
 * @description Define los tipos para el store Zustand de álbumes
 * @updated 2025-06-21
 */

import type {
    AlbumCreateInput,
    AlbumUpdateInput,
    AlbumWithStats,
} from '@/types/entities/album';
import type {
    AlbumDisplayState,
    AlbumSortCriteria,
    AlbumType,
    AlbumViewMode,
} from '@/types/entities/album/enums';

/**
 * 📊 Estado principal del store de álbumes
 */
export interface AlbumState {
	// 📋 Datos principales
	albums: Record<string, AlbumWithStats>;
	isLoading: boolean;
	error: string | null;
	lastUpdated: number | null;

	// 🎮 UI y configuración
	ui: AlbumUIState;
	filters: AlbumFiltersState;

	// 🔍 Selectores y getters
	getAlbumById: (id: string) => AlbumWithStats | undefined;
	getFilteredAlbums: () => AlbumWithStats[];
	getSortedAlbums: () => AlbumWithStats[];
}

/**
 * 🎮 Estado de UI del store
 */
export interface AlbumUIState {
	selectedIds: string[];
	viewMode: AlbumViewMode;
	isViewerOpen: boolean;
	currentAlbumId: string | null;
	displayState: Record<string, AlbumDisplayState>;
	draggedAlbumId: string | null;
	dropTargetAlbumId: string | null;
	highlightedId: string | null;
	expandedIds: string[];
}

/**
 * 🔍 Estado de filtros del store
 * Nota: No extiende AlbumFilters para evitar conflictos de propiedades
 */
export interface AlbumFiltersState {
	// Filtros básicos
	query: string;
	searchQuery: string; // Alias para compatibilidad

	// Filtros específicos
	sortBy: AlbumSortCriteria;
	filterByType: AlbumType | null;
	filterByParentId: string | null;
	filterFavorites: boolean;
	filterShared: boolean;
	filterArchived: boolean;

	// Filtros de contenido
	hasImages?: boolean;
	hasVideos?: boolean;
	categories?: string[];
	types?: string[];

	// Rango de fechas
	dateRange: {
		from: Date | null;
		to: Date | null;
	};
}

/**
 * 🔄 Acciones disponibles en el store
 */
export interface AlbumActions {
	// 📥 Carga de datos
	loadAlbums: () => Promise<void>;
	loadAlbumById: (id: string) => Promise<AlbumWithStats | undefined>;

	// 📝 Gestión de álbumes
	createAlbum: (album: AlbumCreateInput) => Promise<void>;
	updateAlbum: (id: string, album: AlbumUpdateInput) => Promise<void>;
	deleteAlbum: (id: string) => Promise<void>;

	// 🎮 Acciones UI
	selectAlbum: (id: string | null) => void;
	selectMultipleAlbums: (ids: string[]) => void;
	toggleSelection: (id: string) => void;
	clearSelection: () => void;

	// 🔍 Filtros
	updateFilters: (filters: Partial<AlbumFiltersState>) => void;
	clearFilters: () => void;
	setSearchQuery: (query: string) => void;
}

/**
 * 🏗️ Tipo completo del store
 */
export type AlbumStore = AlbumState & AlbumActions;

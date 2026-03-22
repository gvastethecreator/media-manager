/**
 * @file Tipos para el store de la entidad Place
 * @module store/entities/place/types
 */

import type { StateCreator } from 'zustand';
import type {
	PlaceCategory,
	PlaceSearchOptions,
	PlaceType,
	PlaceViewMode,
	PlaceWithStats,
} from '@/types/entities/place';

import type { PlaceFilters } from '@/types/entities/place/types';

/**
 * Estado base del store de Place
 */
export interface PlaceState {
	error: string | null;
	isLoading: boolean;
	// Datos principales
	places: PlaceWithStats[];

	// Selección actual
	selectedPlaceId: string | null;

	// Configuración de visualización
	viewConfig: {
		sortBy: string;
		sortOrder: 'asc' | 'desc';
		groupBy: null | string;
		filterBy: null | PlaceFilters;
	};
}

/**
 * Slice de estado para el nucleo de la funcionalidad
 */
export interface PlaceCoreSlice extends PlaceState {
	addImageToPlace: (placeId: string, imageId: string) => Promise<void>;
	addPlace: (place: PlaceWithStats) => void;

	// Getters
	getPlaceById: (id: string) => PlaceWithStats | null;
	getPlacesByIds: (ids: string[]) => PlaceWithStats[];

	// Acciones de carga y gestión de relaciones
	loadPlaces: (options?: PlaceSearchOptions) => Promise<void>;
	removeImageFromPlace: (placeId: string, imageId: string) => Promise<void>;
	removePlace: (id: string) => void;
	resetStore: () => void;
	setError: (error: string | null) => void;

	// Estado de operación
	setLoading: (isLoading: boolean) => void;
	// Acciones CRUD
	setPlaces: (places: PlaceWithStats[]) => void;
	updatePlace: (id: string, data: Partial<PlaceWithStats>) => void;
}

/**
 * Slice de estado para la UI
 */
export interface PlaceUISlice {
	clearSelection: () => void;
	currentPlaceId: string | null;
	expandedIds: string[];
	getSelectedPlace: () => PlaceWithStats | null;
	isCreatingPlace: boolean;
	isEditingPlace: boolean;
	isProcessingAction: boolean;

	// IDs seleccionados y expandidos
	selectedIds: string[];

	// Acciones de selección
	selectPlace: (placeId: string | null) => void;
	selectPlaceId: (placeId: string | null) => void;
	selectPlaces: (ids: string[]) => void;
	setCurrentPlaceId: (id: string | null) => void;
	setIsCreatingPlace: (value: boolean) => void;
	setIsEditingPlace: (value: boolean) => void;
	setIsProcessingAction: (value: boolean) => void;

	// Configuración de visualización
	setViewConfig: (config: {
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
		groupBy?: string | null;
		filterBy?: PlaceFilters | null;
	}) => void;

	// Acciones UI
	setViewMode: (mode: PlaceViewMode) => void;

	// Acciones de expansión
	toggleExpanded: (id: string) => void;

	// Acciones de selección
	toggleSelected: (id: string) => void;
	// Modos de visualización
	viewMode: PlaceViewMode;
}

/**
 * Slice de estado para el filtrado y ordenación
 */
export interface PlaceFiltersSlice {
	// Estado de filtros
	filters: PlaceFilters;

	// Getters filtrados
	getFilteredPlaces: () => PlaceWithStats[];
	getSortedPlaces: () => PlaceWithStats[];
	resetFilters: () => void;
	searchQuery: string;
	setCategoryFilter: (category: PlaceCategory | null) => void;
	setFavoritesFilter: (onlyFavorites: boolean) => void;

	// Acciones de filtrado
	setFilters: (filters: PlaceFilters) => void;
	setPopulationFilter: (min?: number, max?: number) => void;
	setRegionFilter: (region: string | null) => void;
	setRelationsFilter: (
		relations: Partial<{
			hasImages: boolean;
			hasNotes: boolean;
			hasConcepts: boolean;
			hasPrompts: boolean;
		}>
	) => void;
	setSearchQuery: (query: string) => void;
	setSortBy: (sortBy: string) => void;

	// Filtros específicos
	setTypeFilter: (type: PlaceType | null) => void;
	sortBy: string;
}

/**
 * Tipo completo del store con todos los slices
 */
export type PlaceStore = PlaceCoreSlice & PlaceUISlice & PlaceFiltersSlice;

/**
 * Tipo para el factory de creación del slice del core
 */
export type PlaceCoreSliceCreator = StateCreator<PlaceStore, [], [], PlaceCoreSlice>;

/**
 * Tipo para el factory de creación del slice de UI
 */
export type PlaceUISliceCreator = StateCreator<PlaceStore, [], [], PlaceUISlice>;

/**
 * Tipo para el factory de creación del slice de filtros
 */
export type PlaceFiltersSliceCreator = StateCreator<PlaceStore, [], [], PlaceFiltersSlice>;

/**
 * Opciones para la creación de un servicio API de lugares
 */
export interface PlaceServiceOptions {
	apiUrl?: string;
	cacheExpiration?: number;
	enableCache?: boolean;
}

/**
 * Respuesta API para consultas de lugares
 */
export interface PlaceApiResponse {
	data: PlaceWithStats[];
	meta: {
		total: number;
		page: number;
		limit: number;
	};
}

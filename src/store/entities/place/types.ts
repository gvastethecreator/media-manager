/**
 * @file Tipos para el store de la entidad Place
 * @module store/entities/place/types
 */

import type { StateCreator } from 'zustand';
import type { Place, PlaceCategory, PlaceFilters, PlaceType, PlaceViewMode } from '../../../types/entities/place/types';

/**
 * Estado base del store de Place
 */
export interface PlaceState {
	// Datos principales
	places: Place[];
	isLoading: boolean;
	error: string | null;

	// Configuración de visualización
	viewConfig: {
		sortBy: string;
		sortOrder: string;
		groupBy: null | string;
		filterBy: null | PlaceFilters;
	};

	// Selección actual
	selectedPlaceId: string | null;
}

/**
 * Slice de estado para el nucleo de la funcionalidad
 */
export interface PlaceCoreSlice extends PlaceState {
	// Acciones CRUD
	setPlaces: (places: Place[]) => void;
	addPlace: (place: Place) => void;
	updatePlace: (id: string, data: Partial<Place>) => void;
	removePlace: (id: string) => void;
	resetStore: () => void;

	// Estado de operación
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;

	// Getters
	getPlaceById: (id: string) => Place | null;
	getPlacesByIds: (ids: string[]) => Place[];
}

/**
 * Slice de estado para la UI
 */
export interface PlaceUISlice {
	// Modos de visualización
	viewMode: PlaceViewMode;
	isCreatingPlace: boolean;
	isEditingPlace: boolean;
	isProcessingAction: boolean;

	// IDs seleccionados y expandidos
	selectedIds: string[];
	expandedIds: string[];
	currentPlaceId: string | null;

	// Acciones UI
	setViewMode: (mode: PlaceViewMode) => void;
	setIsCreatingPlace: (value: boolean) => void;
	setIsEditingPlace: (value: boolean) => void;
	setIsProcessingAction: (value: boolean) => void;

	// Acciones de selección
	toggleSelected: (id: string) => void;
	selectPlaces: (ids: string[]) => void;
	clearSelection: () => void;

	// Acciones de expansión
	toggleExpanded: (id: string) => void;
	setCurrentPlaceId: (id: string | null) => void;

	// Configuración de visualización
	setViewConfig: (config: {
		sortBy?: string;
		sortOrder?: string;
		groupBy?: string | null;
		filterBy?: PlaceFilters | null;
	}) => void;

	// Acciones de selección
	selectPlaceId: (placeId: string | null) => void;
}

/**
 * Slice de estado para el filtrado y ordenación
 */
export interface PlaceFiltersSlice {
	// Estado de filtros
	filters: PlaceFilters;
	searchQuery: string;
	sortBy: string;

	// Acciones de filtrado
	setFilters: (filters: PlaceFilters) => void;
	resetFilters: () => void;
	setSortBy: (sortBy: string) => void;
	setSearchQuery: (query: string) => void;

	// Filtros específicos
	setTypeFilter: (type: PlaceType | null) => void;
	setCategoryFilter: (category: PlaceCategory | null) => void;
	setRegionFilter: (region: string | null) => void;
	setFavoritesFilter: (onlyFavorites: boolean) => void;
	setPopulationFilter: (min?: number, max?: number) => void;
	setRelationsFilter: (
		relations: Partial<{
			hasImages: boolean;
			hasNotes: boolean;
			hasConcepts: boolean;
			hasPrompts: boolean;
		}>
	) => void;

	// Getters filtrados
	getFilteredPlaces: () => Place[];
	getSortedPlaces: () => Place[];
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
	enableCache?: boolean;
	cacheExpiration?: number;
}

/**
 * Respuesta API para consultas de lugares
 */
export interface PlaceApiResponse {
	data: Place[];
	meta: {
		total: number;
		page: number;
		limit: number;
	};
}

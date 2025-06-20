/**
 * @file Store para la entidad Place
 * @module store/places
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { extendPlace, extendPlaces } from '../../transformers/place';
import type { Place, PlaceFilters } from '../../types/entities/place';
import { PlaceSortCriteria, PlaceViewMode } from '../../types/entities/place';
import { filterPlaces, findPlaceById, findPlacesByIds, sortPlaces } from '../../utils/place';

/**
 * Estado del store de lugares
 */
interface PlacesState {
	// Datos
	places: Place[];
	selectedPlaceIds: string[];
	expandedPlaceIds: string[];
	lastViewedPlaceId: string | null;

	// UI
	isLoading: boolean;
	view: string;
	sortBy: string;
	filters: PlaceFilters;

	// Config
	configId: string | null;

	// Acciones: carga de datos
	setPlaces: (places: any[]) => void;
	addPlace: (place: any) => void;
	updatePlace: (id: string, data: any) => void;
	deletePlace: (id: string) => void;

	// Acciones: selección
	selectPlace: (id: string) => void;
	deselectPlace: (id: string) => void;
	setSelectedPlaceIds: (ids: string[]) => void;
	clearSelection: () => void;
	togglePlaceSelection: (id: string) => void;

	// Acciones: expansión
	expandPlace: (id: string) => void;
	collapsePlace: (id: string) => void;
	setExpandedPlaceIds: (ids: string[]) => void;

	// Acciones: navegación
	setLastViewedPlace: (id: string | null) => void;

	// Acciones: vista y ordenación
	setView: (view: string) => void;
	setSortBy: (sortBy: string) => void;
	setFilters: (filters: PlaceFilters) => void;
	resetFilters: () => void;

	// Acciones: configuración
	setConfigId: (id: string) => void;

	// Acciones: carga y estado
	setIsLoading: (isLoading: boolean) => void;

	// Selectores
	getPlaceById: (id: string) => Place | undefined;
	getSelectedPlaces: () => Place[];
	getFilteredPlaces: () => Place[];
	getSortedAndFilteredPlaces: () => Place[];
	isPlaceSelected: (id: string) => boolean;
	isPlaceExpanded: (id: string) => boolean;
}

/**
 * Store para la entidad Place
 */
export const usePlacesStore = create<PlacesState>()(
	persist(
		(set, get) => ({
			// Estado inicial
			places: [],
			selectedPlaceIds: [],
			expandedPlaceIds: [],
			lastViewedPlaceId: null,
			isLoading: false,
			view: PlaceViewMode.LIST,
			sortBy: PlaceSortCriteria.NAME_ASC,
			filters: {},
			configId: null,

			// Acciones: carga de datos
			setPlaces: (places) =>
				set({
					places: extendPlaces(places),
				}),

			addPlace: (place) =>
				set((state) => ({
					places: [...state.places, extendPlace(place)],
				})),

			updatePlace: (id, data) =>
				set((state) => ({
					places: state.places.map((place) => {
						if (place.id === id) {
							return {
								...place,
								...data,
								// Actualizar campos adicionales si hay datos JSON
								...(data.dangers ? { dangersArray: JSON.parse(data.dangers) } : {}),
								...(data.resources ? { resourcesArray: JSON.parse(data.resources) } : {}),
								...(data.stats ? { statsObject: JSON.parse(data.stats) } : {}),
								...(data.filters ? { filtersObject: JSON.parse(data.filters) } : {}),
							};
						}
						return place;
					}),
				})),

			deletePlace: (id) =>
				set((state) => ({
					places: state.places.filter((place) => place.id !== id),
					selectedPlaceIds: state.selectedPlaceIds.filter((placeId) => placeId !== id),
					expandedPlaceIds: state.expandedPlaceIds.filter((placeId) => placeId !== id),
					lastViewedPlaceId: state.lastViewedPlaceId === id ? null : state.lastViewedPlaceId,
				})),

			// Acciones: selección
			selectPlace: (id) =>
				set((state) => ({
					selectedPlaceIds: [...state.selectedPlaceIds, id],
				})),

			deselectPlace: (id) =>
				set((state) => ({
					selectedPlaceIds: state.selectedPlaceIds.filter((placeId) => placeId !== id),
				})),

			setSelectedPlaceIds: (ids) =>
				set({
					selectedPlaceIds: ids,
				}),

			clearSelection: () =>
				set({
					selectedPlaceIds: [],
				}),

			togglePlaceSelection: (id) =>
				set((state) => ({
					selectedPlaceIds: state.selectedPlaceIds.includes(id)
						? state.selectedPlaceIds.filter((placeId) => placeId !== id)
						: [...state.selectedPlaceIds, id],
				})),

			// Acciones: expansión
			expandPlace: (id) =>
				set((state) => ({
					expandedPlaceIds: state.expandedPlaceIds.includes(id)
						? state.expandedPlaceIds
						: [...state.expandedPlaceIds, id],
				})),

			collapsePlace: (id) =>
				set((state) => ({
					expandedPlaceIds: state.expandedPlaceIds.filter((placeId) => placeId !== id),
				})),

			setExpandedPlaceIds: (ids) =>
				set({
					expandedPlaceIds: ids,
				}),

			// Acciones: navegación
			setLastViewedPlace: (id) =>
				set({
					lastViewedPlaceId: id,
				}),

			// Acciones: vista y ordenación
			setView: (view) =>
				set({
					view,
				}),

			setSortBy: (sortBy) =>
				set({
					sortBy,
				}),

			setFilters: (filters) =>
				set((state) => ({
					filters: { ...state.filters, ...filters },
				})),

			resetFilters: () =>
				set({
					filters: {},
				}),

			// Acciones: configuración
			setConfigId: (id) =>
				set({
					configId: id,
				}),

			// Acciones: carga y estado
			setIsLoading: (isLoading) =>
				set({
					isLoading,
				}),

			// Selectores
			getPlaceById: (id) => {
				return findPlaceById(get().places, id);
			},

			getSelectedPlaces: () => {
				return findPlacesByIds(get().places, get().selectedPlaceIds);
			},

			getFilteredPlaces: () => {
				return filterPlaces(get().places, get().filters);
			},

			getSortedAndFilteredPlaces: () => {
				const filteredPlaces = filterPlaces(get().places, get().filters);
				return sortPlaces(filteredPlaces, get().sortBy);
			},

			isPlaceSelected: (id) => {
				return get().selectedPlaceIds.includes(id);
			},

			isPlaceExpanded: (id) => {
				return get().expandedPlaceIds.includes(id);
			},
		}),
		{
			name: 'places-store',
			partialize: (state) => ({
				selectedPlaceIds: state.selectedPlaceIds,
				expandedPlaceIds: state.expandedPlaceIds,
				lastViewedPlaceId: state.lastViewedPlaceId,
				view: state.view,
				sortBy: state.sortBy,
				filters: state.filters,
				configId: state.configId,
			}),
		}
	)
);

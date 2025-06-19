import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { addImageToPlace, getPlace, getPlaces, removeImageFromPlace } from '@/app/actions/places';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast.service';

import { PLACE_STORE_NAME } from './constants';
import type { PlaceStore } from './types';

// Crear logger
const placeLogger = clientLogger.withContext('PlaceStore');

// 🏗️ Crear el store con persistencia
export const usePlaceStore = create<PlaceStore>()(
	persist(
		(set, get) => ({
			// 📊 Estado inicial
			places: [],
			viewConfig: {
				sortBy: 'name',
				sortOrder: 'asc',
				groupBy: null,
				filterBy: null,
			},
			selectedPlaceId: null,
			isLoading: false,
			error: null,

			// Implementación del CoreSlice
			setPlaces: (places) => set({ places }),
			addPlace: (place) => set((state) => ({ places: [...state.places, place] })),
			updatePlace: (id, data) =>
				set((state) => ({
					places: state.places.map((p) => (p.id === id ? { ...p, ...data } : p)),
				})),
			removePlace: (id) =>
				set((state) => ({
					places: state.places.filter((p) => p.id !== id),
				})),
			resetStore: () => set({ places: [], error: null }),
			setLoading: (isLoading) => set({ isLoading }),
			setError: (error) => set({ error }),
			getPlaceById: (id) => get().places.find((place) => place.id === id) || null,
			getPlacesByIds: (ids) => {
				const idSet = new Set(ids);
				return get().places.filter((p) => idSet.has(p.id));
			},

			// Implementación del UISlice
			viewMode: 'GRID',
			isCreatingPlace: false,
			isEditingPlace: false,
			isProcessingAction: false,
			selectedIds: [],
			expandedIds: [],
			currentPlaceId: null,
			setViewMode: (mode) => set({ viewMode: mode }),
			setIsCreatingPlace: (value) => set({ isCreatingPlace: value }),
			setIsEditingPlace: (value) => set({ isEditingPlace: value }),
			setIsProcessingAction: (value) => set({ isProcessingAction: value }),
			toggleSelected: (id) =>
				set((state) => {
					const isSelected = state.selectedIds.includes(id);
					return {
						selectedIds: isSelected ? state.selectedIds.filter((i) => i !== id) : [...state.selectedIds, id],
					};
				}),
			selectPlaces: (ids) => set({ selectedIds: ids }),
			clearSelection: () => set({ selectedIds: [] }),
			toggleExpanded: (id) =>
				set((state) => {
					const isExpanded = state.expandedIds.includes(id);
					return {
						expandedIds: isExpanded ? state.expandedIds.filter((i) => i !== id) : [...state.expandedIds, id],
					};
				}),
			setCurrentPlaceId: (id) => set({ currentPlaceId: id }),
			setViewConfig: (config) =>
				set((state) => ({
					viewConfig: { ...state.viewConfig, ...config },
				})),
			selectPlaceId: (placeId) => set({ selectedPlaceId: placeId }),

			// Implementación del FiltersSlice
			filters: {},
			searchQuery: '',
			sortBy: 'name_asc',
			setFilters: (filters) => set({ filters }),
			resetFilters: () => set({ filters: {} }),
			setSortBy: (sortBy) => set({ sortBy }),
			setSearchQuery: (query) => set({ searchQuery: query }),
			setTypeFilter: (type) =>
				set((state) => ({
					filters: { ...state.filters, type: type || undefined },
				})),
			setCategoryFilter: (category) =>
				set((state) => ({
					filters: { ...state.filters, category: category || undefined },
				})),
			setRegionFilter: (region) =>
				set((state) => ({
					filters: { ...state.filters, region: region || undefined },
				})),
			setFavoritesFilter: (onlyFavorites) =>
				set((state) => ({
					filters: { ...state.filters, isFavorite: onlyFavorites },
				})),
			setPopulationFilter: (min, max) =>
				set((state) => ({
					filters: {
						...state.filters,
						minPopulation: min,
						maxPopulation: max,
					},
				})),
			setRelationsFilter: (relations) =>
				set((state) => ({
					filters: { ...state.filters, ...relations },
				})),
			getFilteredPlaces: () => {
				// Por implementar lógica de filtrado completa
				const { places, filters, searchQuery } = get();
				if (!filters && !searchQuery) return places;

				return places.filter((place) => {
					// Filtro por búsqueda básica
					if (searchQuery && !place.name.toLowerCase().includes(searchQuery.toLowerCase())) {
						return false;
					}

					// Otros filtros
					return true;
				});
			},
			getSortedPlaces: () => {
				const { places, sortBy } = get();
				const [field, order] = sortBy.split('_');

				// Por implementar lógica de ordenación completa
				return [...places].sort((a, b) => {
					if (order === 'asc') {
						// @ts-ignore - Ignoramos el error de tipo temporalmente
						return a[field] > b[field] ? 1 : -1;
					}
					// @ts-ignore - Ignoramos el error de tipo temporalmente
					return a[field] < b[field] ? 1 : -1;
				});
			},

			// 🔄 Acciones de carga
			loadPlaces: async () => {
				try {
					set({ isLoading: true, error: null });
					placeLogger.info('🔄 Cargando lugares...');

					const places = await getPlaces();
					set({ places, isLoading: false });
					placeLogger.info('✅ Lugares cargados correctamente');
				} catch (error) {
					placeLogger.error('❌ Error al cargar lugares:', error);
					set({ error: 'Error al cargar lugares', isLoading: false });
					toastService.system.error('Error al cargar lugares');
				}
			},

			addImageToPlace: async (placeId: string, imageId: string) => {
				try {
					placeLogger.info('➕ Añadiendo imagen al lugar:', { placeId, imageId });
					await addImageToPlace(placeId, imageId);
					const updatedPlace = await getPlace(placeId);
					set((state) => ({
						places: state.places.map((place) => (place.id === placeId ? updatedPlace : place)),
					}));

					placeLogger.info('✅ Imagen añadida correctamente al lugar');
					toastService.system.success('Imagen añadida al lugar');
				} catch (error) {
					placeLogger.error('❌ Error al añadir imagen al lugar:', error);
					toastService.system.error('Error al añadir imagen al lugar');
				}
			},
			removeImageFromPlace: async (placeId: string, imageId: string) => {
				try {
					placeLogger.info('➖ Eliminando imagen del lugar:', { placeId, imageId });
					await removeImageFromPlace(placeId, imageId);
					const updatedPlace = await getPlace(placeId);
					set((state) => ({
						places: state.places.map((place) => (place.id === placeId ? updatedPlace : place)),
					}));

					placeLogger.info('✅ Imagen eliminada correctamente del lugar');
					toastService.system.success('Imagen eliminada del lugar');
				} catch (error) {
					placeLogger.error('❌ Error al eliminar imagen del lugar:', error);
					toastService.system.error('Error al eliminar imagen del lugar');
				}
			},
		}),
		{
			name: PLACE_STORE_NAME,
			storage: createJSONStorage(() => localStorage),
		}
	)
);

// Re-exportar tipos y constantes
export * from './constants';
export * from './types';

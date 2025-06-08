import { clientLogger } from '@/lib/logger/client-logger';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { toastService } from '@/services/toast.service';
import {
    addImageToPlace,
    getPlace,
    getPlaces,
    removeImageFromPlace,
} from '@/app/actions/places';

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

			// 🎯 Selectores
			getPlaceById: (id) => get().places.find((place) => place.id === id),
			getSortedPlaces: () => {
				const { places, viewConfig } = get();
				const { sortBy, sortOrder } = viewConfig;

				return [...places].sort((a, b) => {
					const aValue = a[sortBy];
					const bValue = b[sortBy];
					return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
				});
			},

			// 📝 Acciones de selección
			selectPlace: (placeId) => {
				set({ selectedPlaceId: placeId });
				placeLogger.info('🎯 Lugar seleccionado:', placeId);
			},

			// 🔄 Acciones de actualización
			updateViewConfig: (config) => {
				set((state) => ({
					viewConfig: { ...state.viewConfig, ...config },
				}));
				placeLogger.info('🔄 Configuración de vista actualizada:', config);
			},

			addImageToPlace: async (placeId, imageId) => {
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
			removeImageFromPlace: async (placeId, imageId) => {
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

// Re-exportar tipos y transformadores
export * from './constants';
export * from './transformers';
export * from './types';

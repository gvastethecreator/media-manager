import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { serverLogger } from '@/lib/logger/server-logger';
import { toastService } from '@/services/toast.service';

import { DEFAULT_VIEW_CONFIG, FAVORITE_STORE_NAME } from './constants';
import { transformImagesForView } from './transformers';
import type { FavoriteStore } from './types';

const favoriteLogger = serverLogger.withContext('FavoriteStore');

// 🏗️ Crear el store con persistencia
export const useFavoriteStore = create<FavoriteStore>()(
	persist(
		(set, get) => ({
			// 📊 Estado inicial
			favorites: [],
			viewConfig: DEFAULT_VIEW_CONFIG,
			isLoading: false,
			error: null,

			// 🔄 Acciones de carga
			loadFavorites: async () => {
				try {
					set({ isLoading: true, error: null });
					favoriteLogger.info('🔄 Cargando favoritos...');

					const response = await fetch('/api/images/favorites');
					if (!response.ok) throw new Error('Error al cargar favoritos');

					const favorites = await response.json();
					set({ favorites, isLoading: false });
					favoriteLogger.info('✅ Favoritos cargados correctamente');
				} catch (error) {
					favoriteLogger.error('❌ Error al cargar favoritos:', error);
					set({ error: 'Error al cargar favoritos', isLoading: false });
					toastService.system.error('Error al cargar favoritos');
				}
			},

			// 🎯 Gestión de favoritos
			toggleFavorite: async (imageId) => {
				try {
					favoriteLogger.info('🔄 Alternando favorito:', imageId);
					const isFavorited = get().isFavorited(imageId);
					const method = isFavorited ? 'DELETE' : 'POST';

					const response = await fetch(`/api/images/${imageId}/favorite`, {
						method,
					});

					if (!response.ok) throw new Error(`Error al ${isFavorited ? 'eliminar de' : 'añadir a'} favoritos`);

					const updatedImage = await response.json();

					set((state) => ({
						favorites: isFavorited
							? state.favorites.filter((img) => img.id !== imageId)
							: [...state.favorites, updatedImage],
					}));

					favoriteLogger.info('✅ Estado de favorito actualizado correctamente');
					toastService.system.success(
						isFavorited ? 'Eliminado de favoritos' : 'Añadido a favoritos'
					);
				} catch (error) {
					favoriteLogger.error('❌ Error al actualizar favorito:', error);
					toastService.system.error('Error al actualizar favoritos');
				}
			},

			isFavorited: (imageId) => {
				return get().favorites.some((img) => img.id === imageId);
			},

			// 🔄 Acciones de actualización
			updateViewConfig: (config) => {
				set((state) => ({
					viewConfig: { ...state.viewConfig, ...config },
				}));
				favoriteLogger.info('🔄 Configuración de vista actualizada:', config);
			},

			// 🎯 Selectores
			getSortedFavorites: () => {
				const { favorites, viewConfig } = get();
				return transformImagesForView(favorites, viewConfig);
			},
		}),
		{
			name: FAVORITE_STORE_NAME,
			storage: createJSONStorage(() => localStorage),
		}
	)
);

// Re-exportar tipos y transformadores
export * from './constants';
export * from './transformers';
export * from './types';

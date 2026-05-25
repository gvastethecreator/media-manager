/**
 * @file API slice para el store de Favorite
 * @module store/entities/favorite/slices/api
 */

import { StateCreator } from 'zustand';
import { apiClient } from '@/lib/api/client';
import { normalizeFavoriteEntityType } from '@/lib/api/favorites';
import { clientLogger } from '@/lib/logger/client-logger';
import type { FavoriteExtended } from '@/types/entities/favorite';
import { FavoriteStore } from '..';

// Logger específico para este slice
const logger = clientLogger.withContext('FavoriteStore.ApiSlice');

// Estado para operaciones API
export interface ApiState {
	apiError: string | null;
	isApiLoading: boolean;
	lastFetch: Date | null;
}

// Acciones para operaciones API
export interface ApiActions {
	clearApiError: () => void;
	createFavorite: (entityId: string, entityType: string) => Promise<void>;
	deleteFavorite: (id: string) => Promise<void>;
	// Operaciones CRUD
	fetchFavorites: () => Promise<void>;
	setApiError: (error: string | null) => void;

	// Estados de API
	setApiLoading: (loading: boolean) => void;
	toggleFavorite: (entityId: string, entityType: string) => Promise<boolean>;
}

// Slice del store para API
export const createApiSlice: StateCreator<FavoriteStore, [], [], ApiState & ApiActions> = (set, get) => ({
	// Estado inicial
	isApiLoading: false,
	apiError: null,
	lastFetch: null,

	// Operaciones CRUD
	fetchFavorites: async () => {
		set({ isApiLoading: true, apiError: null });

		try {
			logger.info('🔄 Cargando favoritos...');

			const response = await apiClient.get<{ data: FavoriteExtended[] }>('/favorites');

			// Actualizar el estado con los favoritos obtenidos
			if (response?.data) {
				get().setFavorites(response.data);
			} else {
				get().setFavorites([]);
			}

			set({
				isApiLoading: false,
				lastFetch: new Date(),
			});

			logger.info('✅ Favoritos cargados exitosamente');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			set({
				isApiLoading: false,
				apiError: errorMessage,
			});
			logger.error('❌ Error cargando favoritos:', error);
		}
	},

	createFavorite: async (entityId: string, entityType: string) => {
		set({ isApiLoading: true, apiError: null });

		try {
			logger.info('➕ Creando favorito:', { entityId, entityType });

			const normalizedEntityType = normalizeFavoriteEntityType(entityType);
			if (!normalizedEntityType) {
				throw new Error(`Tipo de favorito no soportado: ${entityType}`);
			}

			const result = await apiClient.post<{ isFavorite: boolean; id?: string }>('/favorites/toggle', {
				entityId,
				entityType: normalizedEntityType,
			});

			if (result.isFavorite) {
				await get().fetchFavorites();
			}

			set({ isApiLoading: false });
			logger.info('✅ Favorito creado exitosamente');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			set({
				isApiLoading: false,
				apiError: errorMessage,
			});
			logger.error('❌ Error creando favorito:', error);
		}
	},

	deleteFavorite: async (id: string) => {
		set({ isApiLoading: true, apiError: null });

		try {
			logger.info('🗑️ Eliminando favorito:', id);

			await apiClient.delete(`/favorites/${id}`);

			// Eliminar del estado local
			get().removeFavorite(id);

			set({ isApiLoading: false });
			logger.info('✅ Favorito eliminado exitosamente');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			set({
				isApiLoading: false,
				apiError: errorMessage,
			});
			logger.error('❌ Error eliminando favorito:', error);
		}
	},

	toggleFavorite: async (entityId: string, entityType: string): Promise<boolean> => {
		set({ isApiLoading: true, apiError: null });

		try {
			logger.info('🔄 Alternando favorito:', { entityId, entityType });

			const normalizedEntityType = normalizeFavoriteEntityType(entityType);
			if (!normalizedEntityType) {
				throw new Error(`Tipo de favorito no soportado: ${entityType}`);
			}

			const result = await apiClient.post<{ isFavorite: boolean; id?: string }>('/favorites/toggle', {
				entityId,
				entityType: normalizedEntityType,
			});

			await get().fetchFavorites();

			set({ isApiLoading: false });
			logger.info('✅ Favorito alternado exitosamente:', { isFavorite: result.isFavorite });
			return result.isFavorite;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			set({
				isApiLoading: false,
				apiError: errorMessage,
			});
			logger.error('❌ Error alternando favorito:', error);
			return false;
		}
	},

	// Estados de API
	setApiLoading: (loading) => {
		set({ isApiLoading: loading });
	},

	setApiError: (error) => {
		set({ apiError: error });
		if (error) {
			logger.error('❌ Error de API:', error);
		}
	},

	clearApiError: () => {
		set({ apiError: null });
	},
});

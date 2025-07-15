/**
 * @file API slice para el store de Favorite
 * @module store/entities/favorite/slices/api
 */

import { StateCreator } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import { FavoriteStore } from '..';

// Logger específico para este slice
const logger = clientLogger.withContext('FavoriteStore.ApiSlice');

// Estado para operaciones API
export interface ApiState {
	isApiLoading: boolean;
	apiError: string | null;
	lastFetch: Date | null;
}

// Acciones para operaciones API
export interface ApiActions {
	// Operaciones CRUD
	fetchFavorites: () => Promise<void>;
	createFavorite: (entityId: string, entityType: string) => Promise<void>;
	deleteFavorite: (id: string) => Promise<void>;

	// Estados de API
	setApiLoading: (loading: boolean) => void;
	setApiError: (error: string | null) => void;
	clearApiError: () => void;
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
			// TODO: Implementar llamada real a la API
			logger.info('🔄 Cargando favoritos...');

			// Simulación temporal
			await new Promise((resolve) => setTimeout(resolve, 1000));

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
			// TODO: Implementar llamada real a la API
			logger.info('➕ Creando favorito:', { entityId, entityType });

			// Simulación temporal
			await new Promise((resolve) => setTimeout(resolve, 500));

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
			// TODO: Implementar llamada real a la API
			logger.info('🗑️ Eliminando favorito:', id);

			// Simulación temporal
			await new Promise((resolve) => setTimeout(resolve, 500));

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

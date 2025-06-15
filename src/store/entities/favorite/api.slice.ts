/**
 * @file API slice para el store de Favorite
 * @module store/entities/favorite/slices/api
 */

import { toggleFavorite as toggleFavoriteAction } from '@/app/actions/favorites/favorite.actions';
import { clientLogger } from '@/lib/logger/client-logger';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { StateCreator } from 'zustand';
import { FavoriteStore } from '..';

// Logger específico para este slice
const logger = clientLogger.withContext('FavoriteStore.ApiSlice');

// Estado
export interface ApiState {}

// Acciones
export interface ApiActions {
	// Gestión de favoritos
	toggleFavorite: (imageId: string) => Promise<void>;
}

// Slice del store para API
export const createApiSlice: StateCreator<FavoriteStore, [], [], ApiState & ApiActions> = (set, get) => ({
	// Gestión de favoritos
	toggleFavorite: async (imageId: string) => {
		try {
			logger.info('🔄 Alternando favorito para imagen:', imageId);

			// Verificar si ya es favorito
			const isFavorited = get().isFavorited(imageId);

			// Llamar a la acción del servidor
			const result = await toggleFavoriteAction(imageId, FavoriteEntityType.IMAGE);

			logger.info(`✅ Favorito ${result ? 'añadido' : 'eliminado'} para imagen:`, imageId);

			// Si el resultado es diferente del estado actual, actualizar el store
			if (result !== isFavorited) {
				if (result) {
					// Añadir a favoritos
					get().addFavorite({
						id: crypto.randomUUID(),
						entityId: imageId,
						entityType: FavoriteEntityType.IMAGE,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
						image: {
							id: imageId,
							name: 'Imagen favorita', // Nombre genérico
							type: 'image',
						},
					});
				} else {
					// Eliminar de favoritos
					get().removeFavorite(imageId);
				}
			}
		} catch (error) {
			logger.error('❌ Error al alternar favorito:', error);
			throw error;
		}
	},
});
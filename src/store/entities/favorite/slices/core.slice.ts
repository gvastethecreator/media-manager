/**
 * @file Core slice para el store de Favorite
 * @module store/entities/favorite/slices/core
 */

import { StateCreator } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import { FavoriteExtended } from '@/types/entities/favorite';
import { FavoriteStore } from '..';

// Logger específico para este slice
const logger = clientLogger.withContext('FavoriteStore.CoreSlice');

// Estado
export interface CoreState {
	error: string | null;
	favorites: FavoriteExtended[];
	isLoading: boolean;
}

// Acciones
export interface CoreActions {
	// Gestión de favoritos
	addFavorite: (isFavorite: FavoriteExtended) => void;
	clearFavorites: () => void;
	isFavorited: (id: string) => boolean;
	removeFavorite: (id: string) => void;
	setError: (error: string | null) => void;
	// Carga de datos
	setFavorites: (favorites: FavoriteExtended[]) => void;
	setLoading: (isLoading: boolean) => void;
	updateFavorite: (id: string, data: Partial<FavoriteExtended>) => void;
}

// Slice del store para core
export const createCoreSlice: StateCreator<FavoriteStore, [], [], CoreState & CoreActions> = (set, get) => ({
	// Estado inicial
	favorites: [],
	isLoading: false,
	error: null,

	// Carga de datos
	setFavorites: (favorites) => {
		set({ favorites });
		logger.info('📦 Favoritos cargados:', favorites.length);
	},

	setLoading: (isLoading) => {
		set({ isLoading });
	},

	setError: (error) => {
		set({ error });
		if (error) {
			logger.error('❌ Error en favoritos:', error);
		}
	},

	// Gestión de favoritos
	addFavorite: (favorite) => {
		set((state) => ({
			favorites: [...state.favorites, favorite],
		}));
		logger.info('➕ Favorito añadido:', favorite.id);
	},

	removeFavorite: (id) => {
		set((state) => ({
			favorites: state.favorites.filter((favorite) => favorite.id !== id),
		}));
		logger.info('➖ Favorito eliminado:', id);
	},

	updateFavorite: (id, data) => {
		set((state) => ({
			favorites: state.favorites.map((favorite) => (favorite.id === id ? { ...favorite, ...data } : favorite)),
		}));
		logger.info('📝 Favorito actualizado:', id);
	},

	clearFavorites: () => {
		set({ favorites: [] });
		logger.info('🧹 Favoritos eliminados');
	},

	// Verificación de favoritos
	isFavorited: (id: string) => {
		const { favorites } = get();
		const result = favorites.some((favorite) => favorite.entityId === id);
		logger.debug(`Verificando favorito para ID ${id}: ${result}`);
		return result;
	},
});

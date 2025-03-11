import { getFavorites, toggleFavorite } from '@/app/actions/favorites/favorite.actions';
import { logger } from '@/lib/logger/logger';
import { create } from 'zustand';

const favoritesLogger = logger.withContext('FavoritesStore');

interface FavoritesState {
	favorites: string[];
	toggleFavorite: (id: string) => Promise<void>;
	isFavorited: (id: string) => boolean;
	loadFavorites: () => Promise<void>;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
	favorites: [],
	toggleFavorite: async (id: string) => {
		try {
			const newIsFavorited = await toggleFavorite(id);

			// Actualizar el estado local basado en el resultado
			set((state) => ({
				favorites: newIsFavorited ? [...state.favorites, id] : state.favorites.filter((fav) => fav !== id),
			}));

			favoritesLogger.info('✨ Estado de favorito cambiado:', { id, isFavorited: newIsFavorited });
		} catch (error) {
			favoritesLogger.error('❌ Error al cambiar estado de favorito:', {
				error,
				id,
			});
			throw error;
		}
	},
	isFavorited: (id: string) => get().favorites.includes(id),
	loadFavorites: async () => {
		try {
			const favorites = await getFavorites();
			set({ favorites: favorites.map((f) => f.entityId) });
			favoritesLogger.info('✅ Favoritos cargados:', { count: favorites.length });
		} catch (error) {
			favoritesLogger.error('❌ Error al cargar favoritos:', error);
			throw error;
		}
	},
}));

export const useFavorites = () => {
	const store = useFavoritesStore();
	return {
		toggleFavorite: store.toggleFavorite,
		isFavorited: store.isFavorited,
	};
};

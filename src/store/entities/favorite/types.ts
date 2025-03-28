import type { Image } from '@prisma/client';

// 📊 Configuración de vista
export interface FavoriteViewConfig {
	sortBy: 'name' | 'createdAt' | 'updatedAt';
	sortOrder: 'asc' | 'desc';
	groupBy: string | null;
	filterBy: string | null;
}

// 🎯 Estado del store
export interface FavoriteState {
	favorites: Image[];
	viewConfig: FavoriteViewConfig;
	isLoading: boolean;
	error: string | null;
}

// 🔄 Acciones del store
export interface FavoriteActions {
	// Carga de favoritos
	loadFavorites: () => Promise<void>;

	// Gestión de favoritos
	toggleFavorite: (imageId: string) => Promise<void>;
	isFavorited: (imageId: string) => boolean;

	// Configuración de vista
	updateViewConfig: (config: Partial<FavoriteViewConfig>) => void;

	// Selectores
	getSortedFavorites: () => Image[];
}

// 🏗️ Store completo
export type FavoriteStore = FavoriteState & FavoriteActions;

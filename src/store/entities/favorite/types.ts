/**
 * @file Tipos para el store de Favorite
 * @module store/entities/favorite/types
 */

import { FavoriteExtended } from '@/types/entities/favorite';

// 📊 Configuración de vista
export interface FavoriteViewConfig {
	sortBy: 'name' | 'createdAt' | 'updatedAt';
	sortOrder: 'asc' | 'desc';
	groupBy: string | null;
	filterBy: string | null;
}

/**
 * Modo de visualización para favoritos
 */
export enum FavoriteViewMode {
	LIST = 'list',
	GRID = 'grid',
	CARDS = 'cards',
}

/**
 * Criterios de ordenación para favoritos
 */
export enum FavoriteSortCriteria {
	CREATED_AT = 'createdAt',
	UPDATED_AT = 'updatedAt',
	ENTITY_NAME = 'entityName',
	ENTITY_TYPE = 'entityType',
}

/**
 * Dirección de ordenación
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Filtros para favoritos
 */
export interface FavoriteFilters {
	entityType?: string[];
	createdAfter?: Date | null;
	createdBefore?: Date | null;
	search?: string;
}

/**
 * Estado para selección de favoritos
 */
export interface SelectionState {
	selectedIds: string[];
	lastSelectedId: string | null;
}

// 🎯 Estado del store
export interface FavoriteState {
	favorites: FavoriteExtended[];
	viewConfig: FavoriteViewConfig;
	isLoading: boolean;
	error: string | null;
}

// �� Acciones del store
export interface FavoriteActions {
	// Carga de favoritos
	loadFavorites: () => Promise<void>;

	// Gestión de favoritos
	toggleFavorite: (imageId: string) => Promise<void>;
	isFavorited: (imageId: string) => boolean;

	// Configuración de vista
	updateViewConfig: (config: Partial<FavoriteViewConfig>) => void;

	// Selectores
	getSortedFavorites: () => FavoriteExtended[];
}

// 🏗️ Store completo
export type FavoriteStoreType = FavoriteState & FavoriteActions;

/**
 * @file Tipos para el store de Favorite
 * @module store/entities/favorite/types
 */

import { FavoriteExtended } from '@/types/entities/favorite';

// 📊 Configuración de vista
export interface FavoriteViewConfig {
	filterBy: string | null;
	groupBy: string | null;
	sortBy: 'name' | 'createdAt' | 'updatedAt';
	sortOrder: 'asc' | 'desc';
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
	createdAfter?: Date | null;
	createdBefore?: Date | null;
	entityType?: string[];
	search?: string;
}

/**
 * Estado para selección de favoritos
 */
export interface SelectionState {
	lastSelectedId: string | null;
	selectedIds: string[];
}

// 🎯 Estado del store
export interface FavoriteState {
	error: string | null;
	favorites: FavoriteExtended[];
	isLoading: boolean;
	viewConfig: FavoriteViewConfig;
}

// �� Acciones del store
export interface FavoriteActions {
	// Selectores
	getSortedFavorites: () => FavoriteExtended[];
	isFavorited: (imageId: string) => boolean;
	// Carga de favoritos
	loadFavorites: () => Promise<void>;

	// Gestión de favoritos
	toggleFavorite: (imageId: string) => Promise<void>;

	// Configuración de vista
	updateViewConfig: (config: Partial<FavoriteViewConfig>) => void;
}

// 🏗️ Store completo
export type FavoriteStoreType = FavoriteState & FavoriteActions;

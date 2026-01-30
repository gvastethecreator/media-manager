/**
 * @file Constantes para el store de Favorite
 * @module store/entities/favorite/constants
 */

import { FavoriteSortCriteria, FavoriteViewMode } from './types';

/**
 * Valores por defecto para el modo de visualización
 */
export const DEFAULT_VIEW_MODE = FavoriteViewMode.GRID;

/**
 * Valores por defecto para la ordenación
 */
export const DEFAULT_SORT_CRITERIA = FavoriteSortCriteria.UPDATED_AT;
export const DEFAULT_SORT_DIRECTION = 'desc' as const;

/**
 * Valores por defecto para filtros
 */
export const DEFAULT_FILTERS = {
	entityType: [],
	createdAfter: null,
	createdBefore: null,
	search: '',
};

// 🏷️ Nombre del store para persistencia
export const FAVORITE_STORE_NAME = 'favorite-store';

// 📊 Configuración de vista por defecto
export const DEFAULT_VIEW_CONFIG = {
	sortBy: 'createdAt',
	sortOrder: 'desc',
	groupBy: null,
	filterBy: null,
} as const;

// 🔄 Estados de carga
export const LOADING_STATES = {
	IDLE: 'idle',
	LOADING: 'loading',
	ERROR: 'error',
	SUCCESS: 'success',
} as const;

/**
 * @file Tipos auxiliares para la entidad Favorite
 * @module types/entities/favorite/types
 */

import type { FavoriteBase, FavoriteEntityType, FavoriteWithStats } from './base';

/**
 * Input mínimo soportado por el contrato canónico de escritura.
 */
export type FavoriteCreateInput = Pick<FavoriteBase, 'entityId' | 'entityType'>;

/**
 * Tipo persistido completo.
 */
export type FavoriteComplete = FavoriteBase;

/**
 * Tipo extendido para compatibilidad de UI.
 */
export interface FavoriteExtended extends FavoriteWithStats {
	entityColor?: string;
	entityIcon?: string;
	entityPreview?: string;
	isHovered?: boolean;
	isSelected?: boolean;
}

/**
 * Favorito asociado a una imagen cargada externamente.
 */
export interface FavoriteWithImage extends FavoriteComplete {
	image: unknown;
}

/**
 * Resumen agregado de favoritos.
 */
export interface FavoriteStats {
	byType: Partial<Record<FavoriteEntityType, number>>;
	recentlyAdded: FavoriteComplete[];
	totalCount: number;
}

/**
 * Resultado de búsqueda/paginación para favoritos.
 */
export interface FavoriteSearchResult {
	favorites: FavoriteWithStats[];
	hasMore: boolean;
	limit: number;
	page: number;
	total: number;
}

/**
 * Agrupación visual por tipo de favorito.
 */
export interface FavoritesByType {
	color: string;
	count: number;
	displayName: string;
	icon: string;
	items: FavoriteComplete[];
	type: FavoriteEntityType;
}

/**
 * Filtros de búsqueda de favoritos.
 */
export interface FavoriteFilters {
	entityType?: FavoriteEntityType[];
	limit?: number;
	offset?: number;
	order?: 'asc' | 'desc';
	search?: string;
}

/**
 * Input de actualización reservado para extensiones futuras.
 */
export type FavoriteUpdateInput = Partial<FavoriteCreateInput>;

/**
 * Opciones de búsqueda/paginación para clientes complejos.
 */
export interface FavoriteSearchOptions {
	filters?: FavoriteFilters;
	pagination?: {
		page?: number;
		pageSize?: number;
	};
	sort?: {
		field?: 'addedAt' | 'entityType';
		direction?: 'asc' | 'desc';
	};
}

export type CreateFavoriteData = FavoriteCreateInput;

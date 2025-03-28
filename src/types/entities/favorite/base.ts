/**
 * @file Tipos base para la entidad Favorite derivados del modelo Prisma
 * @module types/entities/favorite/base
 */

/**
 * Tipo base para Favorite derivado directamente de Prisma
 */
export type FavoriteBase = {
	id: string;
	entityId: string;
	entityType: string;
	userId?: string;
	createdAt: Date;
	updatedAt: Date;
};

/**
 * Enum para los tipos de entidades que pueden ser favoritas
 */
export enum FavoriteEntityType {
	IMAGE = 'image',
	ALBUM = 'album',
	COLLECTION = 'collection',
	FOLDER = 'folder',
	CHARACTER = 'character',
	PLACE = 'place',
	WORLD_ITEM = 'worldItem',
	CONCEPT = 'concept',
	PROMPT = 'prompt',
	NOTE = 'note',
}

/**
 * Entrada para crear un nuevo favorito
 */
export interface FavoriteCreateInput {
	entityId: string;
	entityType: FavoriteEntityType | string;
	userId?: string;
}

/**
 * Entrada para actualizar un favorito existente
 */
export interface FavoriteUpdateInput {
	id: string;
	entityId?: string;
	entityType?: FavoriteEntityType | string;
	userId?: string;
}

/**
 * Filtros para búsqueda de favoritos
 */
export interface FavoriteFilters {
	entityType?: FavoriteEntityType | string;
	userId?: string;
	limit?: number;
	offset?: number;
	sort?: 'createdAt' | 'updatedAt';
	order?: 'asc' | 'desc';
}

/**
 * Respuesta para listado de favoritos
 */
export interface FavoriteListResponse {
	items: FavoriteBase[];
	total: number;
	hasMore: boolean;
}

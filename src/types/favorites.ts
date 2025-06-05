/**
 * @file Tipos para el sistema de favoritos
 * @module types/favorites
 */

import type { EntityId } from '@/utils/types/utility-types';
import { z } from 'zod';

/**
 * Tipo de entidad favorita
 */
export enum FavoriteEntityType {
	IMAGE = 'image',
	VIDEO = 'video',
	ALBUM = 'album',
	COLLECTION = 'collection',
	CHARACTER = 'character',
	PLACE = 'place',
	WORLD_ITEM = 'world-item',
	CONCEPT = 'concept',
	PROMPT = 'prompt',
	NOTE = 'note',
	TAG = 'tag',
	GROUP = 'group',
	PROPERTY = 'property',
	WILDCARD = 'wildcard',
}

/**
 * Interfaz para elemento favorito
 */
export interface Favorite {
	id: EntityId;
	entityId: EntityId;
	entityType: FavoriteEntityType;
	userId: EntityId;
	addedAt: Date;
}

/**
 * Estado de favoritos
 */
export interface FavoritesState {
	items: Map<EntityId, Favorite>;
	loading: boolean;
	error: Error | null;
}

/**
 * Filtros de búsqueda de favoritos
 */
export interface FavoriteFilters {
	entityTypes?: FavoriteEntityType[];
	fromDate?: Date;
	toDate?: Date;
	sortBy?: 'addedAt' | 'entityType';
	sortOrder?: 'asc' | 'desc';
}

/**
 * Resultado de toggle favorito
 */
export interface ToggleFavoriteResult {
	success: boolean;
	added: boolean;
	favorite?: Favorite;
	error?: Error;
}

// Validaciones Zod
export const favoriteEntityTypeSchema = z.nativeEnum(FavoriteEntityType);

export const favoriteSchema = z.object({
	id: z.string(),
	entityId: z.string(),
	entityType: favoriteEntityTypeSchema,
	userId: z.string(),
	addedAt: z.date(),
});

export const favoriteFiltersSchema = z.object({
	entityTypes: z.array(favoriteEntityTypeSchema).optional(),
	fromDate: z.date().optional(),
	toDate: z.date().optional(),
	sortBy: z.enum(['addedAt', 'entityType']).optional(),
	sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const toggleFavoriteResultSchema = z.object({
	success: z.boolean(),
	added: z.boolean(),
	favorite: favoriteSchema.optional(),
	error: z.instanceof(Error).optional(),
});

// Tipos inferidos
export type FavoriteValidated = z.infer<typeof favoriteSchema>;
export type FavoriteFiltersValidated = z.infer<typeof favoriteFiltersSchema>;
export type ToggleFavoriteResultValidated = z.infer<typeof toggleFavoriteResultSchema>;

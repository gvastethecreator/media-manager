import type { EntityType } from '@/types/entities/entities';

export interface FavoriteEntity {
	id: string;
	entityId: string;
	entityType: EntityType;
	createdAt: Date;
}

export interface FavoriteStats {
	total: number;
	byType: Record<EntityType, number>;
}

export interface FavoriteFilters {
	entityType?: EntityType;
	sortBy?: 'createdAt' | 'entityType';
	sortOrder?: 'asc' | 'desc';
	page?: number;
	pageSize?: number;
}

export interface FavoriteResult<T = unknown> {
	id: string;
	entityId: string;
	entityType: EntityType;
	createdAt: Date;
	entity: T | null;
}

export interface FavoriteResults<T = unknown> {
	items: FavoriteResult<T>[];
	total: number;
	page: number;
	pageSize: number;
	stats: FavoriteStats;
}

export interface AddFavoriteParams {
	entityId: string;
	entityType: EntityType;
}

export interface RemoveFavoriteParams {
	entityId: string;
	entityType: EntityType;
}

export interface GetFavoritesParams {
	filters?: FavoriteFilters;
	includeEntity?: boolean;
}

export interface FavoriteEvents {
	FAVORITE_ADDED: string;
	FAVORITE_REMOVED: string;
	FAVORITES_CHANGED: string;
}

export const FAVORITE_EVENTS: FavoriteEvents = {
	FAVORITE_ADDED: 'favorite:added',
	FAVORITE_REMOVED: 'favorite:removed',
	FAVORITES_CHANGED: 'favorites:changed',
};

/**
 * @file Tipos base para el store
 * @module types/store
 */

import type { JSONString } from '@/lib/utils/types/utility-types';
import type { EntityId } from './utils/types/utility-types';

/**
 * Interfaz base para todas las entidades
 */
export interface BaseEntity {
	createdAt: Date;
	id: EntityId;
	updatedAt: Date;
}

/**
 * Estado base para stores
 */
export interface BaseState<T extends BaseEntity = BaseEntity> {
	activeId: string | null;
	error: Error | null;
	filters: JSONString<Record<string, unknown>>;
	isLoading: boolean;
	items: Record<string, T>;
	pagination: {
		page: number;
		limit: number;
		total: number;
	};
	selectedIds: Set<string>;
	sortBy: string;
	viewMode: string;
}

/**
 * Acciones base para stores
 */
export interface BaseActions<T extends BaseEntity = BaseEntity> {
	addItem: (item: T) => void;
	clearSelection: () => void;
	deselectItem: (id: string) => void;
	removeItem: (id: string) => void;
	selectItem: (id: string) => void;
	setActiveItem: (id: string | null) => void;
	setError: (error: Error | null) => void;
	setFilters: (filters: unknown) => void;
	setItems: (items: T[]) => void;
	setLoading: (isLoading: boolean) => void;
	setPagination: (page: number, limit?: number) => void;
	setSortBy: (sortBy: string) => void;
	setViewMode: (mode: string) => void;
	updateItem: (id: string, data: Partial<T>) => void;
}

/**
 * Store completo con estado y acciones
 */
export interface Store<T extends BaseEntity = BaseEntity> {
	actions: BaseActions<T>;
	state: BaseState<T>;
}

/**
 * Opciones de configuración para stores
 */
export interface StoreOptions<T extends BaseEntity = BaseEntity> {
	initialState?: Partial<BaseState<T>>;
	name: string;
	validators?: {
		create?: (data: unknown) => boolean;
		update?: (data: unknown) => boolean;
		filters?: (filters: unknown) => boolean;
	};
}

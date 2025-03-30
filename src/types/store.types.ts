/**
 * @file Tipos base para el store
 * @module types/store
 */

import type { EntityId, JSONString } from './utils/types/utility-types';

/**
 * Interfaz base para todas las entidades
 */
export interface BaseEntity {
    id: EntityId;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Estado base para stores
 */
export interface BaseState<T extends BaseEntity = BaseEntity> {
    items: Record<string, T>;
    selectedIds: Set<string>;
    activeId: string | null;
    isLoading: boolean;
    error: Error | null;
    filters: JSONString<Record<string, unknown>>;
    sortBy: string;
    viewMode: string;
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
}

/**
 * Acciones base para stores
 */
export interface BaseActions<T extends BaseEntity = BaseEntity> {
    setItems: (items: T[]) => void;
    addItem: (item: T) => void;
    updateItem: (id: string, data: Partial<T>) => void;
    removeItem: (id: string) => void;
    selectItem: (id: string) => void;
    deselectItem: (id: string) => void;
    clearSelection: () => void;
    setActiveItem: (id: string | null) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: Error | null) => void;
    setFilters: (filters: unknown) => void;
    setSortBy: (sortBy: string) => void;
    setViewMode: (mode: string) => void;
    setPagination: (page: number, limit?: number) => void;
}

/**
 * Store completo con estado y acciones
 */
export interface Store<T extends BaseEntity = BaseEntity> {
    state: BaseState<T>;
    actions: BaseActions<T>;
}

/**
 * Opciones de configuración para stores
 */
export interface StoreOptions<T extends BaseEntity = BaseEntity> {
    name: string;
    initialState?: Partial<BaseState<T>>;
    validators?: {
        create?: (data: unknown) => boolean;
        update?: (data: unknown) => boolean;
        filters?: (filters: unknown) => boolean;
    };
}

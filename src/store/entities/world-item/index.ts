/**
 * @file Store principal para la entidad WorldItem
 * @module store/entities/world-item
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { WorldItemCoreSlice, createWorldItemCoreSlice } from './slices/core';
import { WorldItemFiltersSlice, createWorldItemFiltersSlice } from './slices/filters';
import { WorldItemUISlice, createWorldItemUISlice } from './slices/ui';
import { WORLD_ITEM_STORAGE_KEY, WORLD_ITEM_STORE_NAME } from './constants';
import { WorldItemStore as WorldItemStoreType } from './types';

// Re-exportar desde otros archivos
export * from './constants';
export * from './hooks';
export * from './selectors';
export * from './services';
export * from './transformers';
export * from './types';
export * from './utils';

// Re-exportar tipos del store
export type WorldItemStore = WorldItemStoreType;

// Crear store con middleware
export const useWorldItemStore = create<WorldItemStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createWorldItemCoreSlice(...a),
        ...createWorldItemUISlice(...a),
        ...createWorldItemFiltersSlice(...a)
      }),
      {
        name: WORLD_ITEM_STORAGE_KEY,
        partialize: (state) => ({
          // Persistir solo configuración y UI, no los datos
          visualConfig: state.visualConfig,
          viewMode: state.viewMode,
          sortBy: state.sortBy,
          filters: state.filters,
          expandedIds: state.expandedIds,
          selectedIds: state.selectedIds,
          currentItemId: state.currentItemId
        })
      }
    ),
    { name: WORLD_ITEM_STORE_NAME }
  )
);

// Re-export API from store
export const worldItemApi = {
  // Core
  setWorldItems: (worldItems: any[]) => useWorldItemStore.getState().setWorldItems(worldItems),
  addWorldItem: (worldItem: any) => useWorldItemStore.getState().addWorldItem(worldItem),
  updateWorldItem: (id: string, data: any) => useWorldItemStore.getState().updateWorldItem(id, data),
  removeWorldItem: (id: string) => useWorldItemStore.getState().removeWorldItem(id),
  resetStore: () => useWorldItemStore.getState().resetStore(),

  // UI
  setViewMode: (mode: any) => useWorldItemStore.getState().setViewMode(mode),
  setFilters: (filters: any) => useWorldItemStore.getState().setFilters(filters),
  resetFilters: () => useWorldItemStore.getState().resetFilters(),
  setSearchQuery: (query: string) => useWorldItemStore.getState().setSearchQuery(query),

  // Selección
  toggleSelected: (id: string) => useWorldItemStore.getState().toggleSelected(id),
  clearSelection: () => useWorldItemStore.getState().clearSelection(),

  // Estado actual
  getWorldItemById: (id: string) => useWorldItemStore.getState().getWorldItemById(id),
  getFilteredWorldItems: () => useWorldItemStore.getState().getFilteredWorldItems(),
  getSortedWorldItems: () => useWorldItemStore.getState().getSortedWorldItems(),
  setError: (error: string | null) => useWorldItemStore.getState().setError(error)
};
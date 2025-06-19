/**
 * @file Store principal para la entidad WorldItem
 * @module store/entities/world-item
 * @description Define el store de zustand para WorldItem combinando slices.
 * @updated 2025-06-20
 */

import { VERSIONING } from '@/lib/constants';
import { clientLogger } from '@/lib/logger/client-logger';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createWorldItemCoreSlice } from './slices/core';
import { createWorldItemFiltersSlice } from './slices/filters';
import { createWorldItemUISlice } from './slices/ui';
import type { WorldItemStore } from './types';

// Logger específico para el store
const worldItemLogger = clientLogger.withContext('WorldItemStore');

// Re-exportar desde otros archivos
export * from './constants';
export * from './hooks';
export * from './selectors';
export * from './types';

// 🏗️ Crear el store con persistencia
export const useWorldItemStore = create<WorldItemStore>()(
	persist(
		(...a) => ({
			...createWorldItemCoreSlice(...a),
			...createWorldItemUISlice(...a),
			...createWorldItemFiltersSlice(...a),
		}),
		{
			name: 'world-item-store',
			storage: createJSONStorage(() => localStorage),
			version: Number.parseInt(VERSIONING.STORE),
			// Solo persistir el estado de UI y filtros
			partialize: (state) => ({
				ui: state.ui,
				filters: state.filters,
			}),
		},
	),
);

// Re-export API from store
export const worldItemApi = {
	// Core
	setWorldItems: (worldItems: any[]) => useWorldItemStore.getState().setWorldItems(worldItems),
	addWorldItem: (worldItem: any) => useWorldItemStore.getState().addWorldItem(worldItem),
	updateWorldItem: (id: string, data: any) => useWorldItemStore.getState().updateWorldItem(id, data),
	removeWorldItem: (id: string) => useWorldItemStore.getState().deleteWorldItem(id),
	resetStore: () => useWorldItemStore.getState().resetStore(),

	// UI
	setViewMode: (mode: any) => useWorldItemStore.getState().setViewMode(mode),
	setFilters: (filters: any) => useWorldItemStore.getState().updateFilters(filters),
	resetFilters: () => useWorldItemStore.getState().clearFilters(),
	setSearchQuery: (query: string) => useWorldItemStore.getState().setSearchQuery(query),

	// Selección
	toggleSelected: (id: string) => useWorldItemStore.getState().selectWorldItem(id),
	clearSelection: () => useWorldItemStore.getState().clearSelection(),

	// Estado actual
	getWorldItemById: (id: string) => useWorldItemStore.getState().getWorldItemById(id),
	getFilteredWorldItems: () => useWorldItemStore.getState().getFilteredWorldItems(),
	getSortedWorldItems: () => useWorldItemStore.getState().getSortedWorldItems(),
	setError: (error: string | null) => useWorldItemStore.getState().setError(error),
};

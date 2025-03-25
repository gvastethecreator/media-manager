/**
 * @file Store principal para la entidad WorldItem
 * @module store/entities/world-item
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { VERSIONING } from '@/lib/constants';
import { serverLogger } from '@/lib/logger/server-logger';
import { toastService } from '@/services/toast.service';

import type { WorldItemStore } from './types';
import { WorldItemSortCriteria, WorldItemViewMode } from './types';

const worldItemLogger = serverLogger.withContext('WorldItemStore');

// Re-exportar desde otros archivos
export * from './constants';
export * from './hooks';
export * from './selectors';
export * from './services';
export * from './transformers';
export * from './types';
export * from './utils';

// Re-exportar tipos del store
export type WorldItemStore = WorldItemStore;

// 🏗️ Crear el store con persistencia
export const useWorldItemStore = create<WorldItemStore>()(
	persist(
		(set, get) => ({
			// 📊 Estado inicial
			worldItems: [],
			ui: {
				selectedId: null,
				editingId: null,
				highlightedId: null,
				viewMode: WorldItemViewMode.LIST,
			},
			filters: {
				sortBy: WorldItemSortCriteria.NAME_ASC,
				searchTerm: '',
				category: null,
				rarity: null,
				type: null,
			},
			isLoading: false,
			error: null,

			// 🔄 Acciones de carga
			loadWorldItems: async () => {
				try {
					set({ isLoading: true, error: null });
					worldItemLogger.info('🔄 Cargando objetos del mundo...');

					const response = await fetch('/api/world-items');
					if (!response.ok) throw new Error('Error al cargar objetos del mundo');

					const worldItems = await response.json();
					set({ worldItems, isLoading: false });
					worldItemLogger.info('✅ Objetos del mundo cargados correctamente');
				} catch (error) {
					worldItemLogger.error('❌ Error al cargar objetos del mundo:', error);
					set({ error: 'Error al cargar objetos del mundo', isLoading: false });
					toastService.system.error('Error al cargar objetos del mundo');
				}
			},

			// 🎯 Gestión de items
			createWorldItem: async (item) => {
				try {
					worldItemLogger.info('➕ Creando objeto del mundo:', item);
					const response = await fetch('/api/world-items', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(item),
					});

					if (!response.ok) throw new Error('Error al crear objeto del mundo');

					const newItem = await response.json();
					set((state) => ({ worldItems: [...state.worldItems, newItem] }));
					worldItemLogger.info('✅ Objeto del mundo creado correctamente');
					toastService.system.success('Objeto del mundo creado correctamente');
				} catch (error) {
					worldItemLogger.error('❌ Error al crear objeto del mundo:', error);
					toastService.system.error('Error al crear objeto del mundo');
				}
			},

			updateWorldItem: async (id, item) => {
				try {
					worldItemLogger.info('🔄 Actualizando objeto del mundo:', { id, item });
					const response = await fetch(`/api/world-items/${id}`, {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(item),
					});

					if (!response.ok) throw new Error('Error al actualizar objeto del mundo');

					const updatedItem = await response.json();
					set((state) => ({
						worldItems: state.worldItems.map((i) => (i.id === id ? updatedItem : i)),
					}));
					worldItemLogger.info('✅ Objeto del mundo actualizado correctamente');
					toastService.system.success('Objeto del mundo actualizado correctamente');
				} catch (error) {
					worldItemLogger.error('❌ Error al actualizar objeto del mundo:', error);
					toastService.system.error('Error al actualizar objeto del mundo');
				}
			},

			deleteWorldItem: async (id) => {
				try {
					worldItemLogger.info('🗑️ Eliminando objeto del mundo:', id);
					const response = await fetch(`/api/world-items/${id}`, {
						method: 'DELETE',
					});

					if (!response.ok) throw new Error('Error al eliminar objeto del mundo');

					set((state) => ({
						worldItems: state.worldItems.filter((i) => i.id !== id),
					}));
					worldItemLogger.info('✅ Objeto del mundo eliminado correctamente');
					toastService.system.success('Objeto del mundo eliminado correctamente');
				} catch (error) {
					worldItemLogger.error('❌ Error al eliminar objeto del mundo:', error);
					toastService.system.error('Error al eliminar objeto del mundo');
				}
			},

			// 🎯 Acciones de UI
			selectWorldItem: (id) => set((state) => ({ ui: { ...state.ui, selectedId: id } })),
			startEditing: (id) => set((state) => ({ ui: { ...state.ui, editingId: id } })),
			highlightWorldItem: (id) => set((state) => ({ ui: { ...state.ui, highlightedId: id } })),
			setViewMode: (mode) => set((state) => ({ ui: { ...state.ui, viewMode: mode } })),

			// 🔍 Filtros
			updateFilters: (filters) =>
				set((state) => ({ filters: { ...state.filters, ...filters } })),
			clearFilters: () =>
				set((state) => ({
					filters: {
						sortBy: WorldItemSortCriteria.NAME_ASC,
						searchTerm: '',
						category: null,
						rarity: null,
						type: null,
					},
				})),

			// 🎯 Selectores
			getWorldItemById: (id) => get().worldItems.find((item) => item.id === id),
			getFilteredWorldItems: () => {
				const { worldItems, filters } = get();
				const { searchTerm, category, rarity, type } = filters;

				return worldItems.filter((item) => {
					const matchesSearch = searchTerm
						? item.name.toLowerCase().includes(searchTerm.toLowerCase())
						: true;
					const matchesCategory = category ? item.category === category : true;
					const matchesRarity = rarity ? item.rarity === rarity : true;
					const matchesType = type ? item.type === type : true;

					return matchesSearch && matchesCategory && matchesRarity && matchesType;
				});
			},
			getSortedWorldItems: () => {
				const { filters } = get();
				const filteredItems = get().getFilteredWorldItems();

				return [...filteredItems].sort((a, b) => {
					switch (filters.sortBy) {
						case WorldItemSortCriteria.NAME_ASC:
							return a.name.localeCompare(b.name);
						case WorldItemSortCriteria.NAME_DESC:
							return b.name.localeCompare(a.name);
						case WorldItemSortCriteria.CREATED_AT_ASC:
							return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
						case WorldItemSortCriteria.CREATED_AT_DESC:
							return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
						case WorldItemSortCriteria.UPDATED_AT_ASC:
							return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
						case WorldItemSortCriteria.UPDATED_AT_DESC:
							return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
						case WorldItemSortCriteria.RARITY_ASC:
							return (a.rarity || '').localeCompare(b.rarity || '');
						case WorldItemSortCriteria.RARITY_DESC:
							return (b.rarity || '').localeCompare(a.rarity || '');
						default:
							return 0;
					}
				});
			},
		}),
		{
			name: 'world-item-store',
			storage: createJSONStorage(() => localStorage),
			version: parseInt(VERSIONING.STORE),
		}
	)
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
	setError: (error: string | null) => useWorldItemStore.getState().setError(error)
};
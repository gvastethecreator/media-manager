/**
 * @file Store principal para la entidad WorldItem
 * @module store/entities/world-item
 * @description Define el store de zustand para WorldItem
 * @updated 2025-06-20
 */

import {
    createWorldItem as createServerWorldItem,
    deleteWorldItem as deleteServerWorldItem,
    getWorldItems,
    updateWorldItem as updateServerWorldItem,
} from '@/app/actions/world-items/world-item.actions';
import { VERSIONING } from '@/lib/constants';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast.service';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { WorldItemSortCriteria, WorldItemViewMode } from '@/types/entities/world-item';
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

					const items = await getWorldItems();
					set({ worldItems: items, isLoading: false });
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
					const newItem = await createServerWorldItem(item);
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
					const updatedItem = await updateServerWorldItem(id, item);
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
					await deleteServerWorldItem(id);

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
			updateFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
			clearFilters: () =>
				set((_state) => ({
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
					const matchesSearch = searchTerm ? item.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
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
						case WorldItemSortCriteria.CREATED_ASC:
							return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
						case WorldItemSortCriteria.CREATED_DESC:
							return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
						case WorldItemSortCriteria.UPDATED_ASC:
							return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
						case WorldItemSortCriteria.UPDATED_DESC:
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
			version: Number.parseInt(VERSIONING.STORE),
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
	setError: (error: string | null) => useWorldItemStore.getState().setError(error),
};

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

import {
    WorldItemViewMode
} from '@/types/entities/world-item/enums';
import type {
    WorldItemCreateInput,
    WorldItemDeserialized,
    WorldItemFilters,
    WorldItemUpdateInput
} from '@/types/entities/world-item/types';
import type { WorldItemStore } from './types';

// Logger específico para el store
const worldItemLogger = clientLogger.withContext('WorldItemStore');

// Re-exportar desde otros archivos
export * from './constants';
export * from './hooks';
export * from './selectors';
export * from './types';

// Transformer temporal para mapear datos a WorldItemDeserialized
function toWorldItemDeserialized(item: any): WorldItemDeserialized {
    return {
        ...item,
        attributesList: item.attributesList || [],
        effectsList: item.effectsList || [],
        requirementsList: item.requirementsList || [],
        statsList: item.statsList || [],
        propertiesList: item.propertiesList || [],
        filtersList: item.filtersList || [],
        tagsList: item.tagsList || [],
    };
}

// 🏗️ Crear el store con persistencia
export const useWorldItemStore = create<WorldItemStore>()(
    persist(
        (set, get) => ({
            worldItems: [],
            ui: {
                selectedId: null,
                editingId: null,
                highlightedId: null,
                viewMode: WorldItemViewMode.LIST,
            },
            filters: {
                query: '',
                types: [],
                categories: [],
                rarities: [],
            },
            isLoading: false,
            error: null,
            loadWorldItems: async (): Promise<void> => {
                try {
                    set({ isLoading: true, error: null });
                    worldItemLogger.info('🔄 Cargando objetos del mundo...');
                    const items = await getWorldItems();
                    set({ worldItems: (items as any[]).map(toWorldItemDeserialized), isLoading: false });
                    worldItemLogger.info('✅ Objetos del mundo cargados correctamente');
                } catch (error) {
                    worldItemLogger.error('❌ Error al cargar objetos del mundo:', error);
                    set({ error: 'Error al cargar objetos del mundo', isLoading: false });
                    toastService.system.error('Error al cargar objetos del mundo');
                }
            },
            createWorldItem: async (item: WorldItemCreateInput): Promise<void> => {
                try {
                    worldItemLogger.info('➕ Creando objeto del mundo:', item);
                    const newItem = await createServerWorldItem(item);
                    set((state: WorldItemStore) => ({ worldItems: [...state.worldItems, toWorldItemDeserialized(newItem)] }));
                    worldItemLogger.info('✅ Objeto del mundo creado correctamente');
                    toastService.system.success('Objeto del mundo creado correctamente');
                } catch (error) {
                    worldItemLogger.error('❌ Error al crear objeto del mundo:', error);
                    toastService.system.error('Error al crear objeto del mundo');
                }
            },
            updateWorldItem: async (id: string, item: WorldItemUpdateInput): Promise<void> => {
                try {
                    worldItemLogger.info('🔄 Actualizando objeto del mundo:', { id, item });
                    const updatedItem = await updateServerWorldItem(id, item);
                    set((state: WorldItemStore) => ({
                        worldItems: state.worldItems.map((i: WorldItemDeserialized) => (i.id === id ? toWorldItemDeserialized(updatedItem) : i)),
                    }));
                    worldItemLogger.info('✅ Objeto del mundo actualizado correctamente');
                    toastService.system.success('Objeto del mundo actualizado correctamente');
                } catch (error) {
                    worldItemLogger.error('❌ Error al actualizar objeto del mundo:', error);
                    toastService.system.error('Error al actualizar objeto del mundo');
                }
            },
            deleteWorldItem: async (id: string): Promise<void> => {
                try {
                    worldItemLogger.info('🗑️ Eliminando objeto del mundo:', id);
                    await deleteServerWorldItem(id);
                    set((state: WorldItemStore) => ({
                        worldItems: state.worldItems.filter((i: WorldItemDeserialized) => i.id !== id),
                    }));
                    worldItemLogger.info('✅ Objeto del mundo eliminado correctamente');
                    toastService.system.success('Objeto del mundo eliminado correctamente');
                } catch (error) {
                    worldItemLogger.error('❌ Error al eliminar objeto del mundo:', error);
                    toastService.system.error('Error al eliminar objeto del mundo');
                }
            },
            selectWorldItem: (id: string | null) => set((state: WorldItemStore) => ({ ui: { ...state.ui, selectedId: id } })),
            startEditing: (id: string | null) => set((state: WorldItemStore) => ({ ui: { ...state.ui, editingId: id } })),
            highlightWorldItem: (id: string | null) => set((state: WorldItemStore) => ({ ui: { ...state.ui, highlightedId: id } })),
            setViewMode: (mode: WorldItemViewMode) => set((state: WorldItemStore) => ({ ui: { ...state.ui, viewMode: mode } })),
            updateFilters: (filters: Partial<WorldItemFilters>) => set((state: WorldItemStore) => ({ filters: { ...state.filters, ...filters } })),
            clearFilters: () => set((_state: WorldItemStore) => ({
                filters: {
                    query: '',
                    types: [],
                    categories: [],
                    rarities: [],
                },
            })),
            getWorldItemById: (id: string) => get().worldItems.find((item) => item.id === id),
            getFilteredWorldItems: () => {
                const { worldItems, filters } = get();
                const { query, types, categories, rarities } = filters;
                return worldItems.filter((item) => {
                    const matchesQuery = query ? item.name.toLowerCase().includes(query.toLowerCase()) : true;
                    const matchesType = types && types.length > 0 ? types.includes(item.type as any) : true;
                    const matchesCategory = categories && categories.length > 0 ? categories.includes(item.category as any) : true;
                    const matchesRarity = rarities && rarities.length > 0 ? rarities.includes(item.rarity as any) : true;
                    return matchesQuery && matchesType && matchesCategory && matchesRarity;
                });
            },
            getSortedWorldItems: () => {
                const filteredItems = get().getFilteredWorldItems();
                // Por defecto, ordena por nombre ascendente
                return [...filteredItems].sort((a, b) => a.name.localeCompare(b.name));
            },
        }),
        {
            name: 'world-item-store',
            storage: createJSONStorage(() => localStorage),
            version: Number.parseInt(VERSIONING.STORE),
        }
    )
);

// Re-export API desde el store
export const worldItemApi = {
    // Core
    loadWorldItems: () => useWorldItemStore.getState().loadWorldItems(),
    createWorldItem: (data: WorldItemCreateInput) => useWorldItemStore.getState().createWorldItem(data),
    updateWorldItem: (id: string, data: WorldItemUpdateInput) => useWorldItemStore.getState().updateWorldItem(id, data),
    deleteWorldItem: (id: string) => useWorldItemStore.getState().deleteWorldItem(id),
    // UI
    setViewMode: (mode: WorldItemViewMode) => useWorldItemStore.getState().setViewMode(mode),
    updateFilters: (filters: Partial<WorldItemFilters>) => useWorldItemStore.getState().updateFilters(filters),
    clearFilters: () => useWorldItemStore.getState().clearFilters(),
    // Selectores
    getWorldItemById: (id: string) => useWorldItemStore.getState().getWorldItemById(id),
    getFilteredWorldItems: () => useWorldItemStore.getState().getFilteredWorldItems(),
    getSortedWorldItems: () => useWorldItemStore.getState().getSortedWorldItems(),
};

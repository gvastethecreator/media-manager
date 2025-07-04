/**
 * @file Slice para el estado principal del store de WorldItem
 * @module store/entities/world-item/slices/core
 */

import type { StateCreator } from 'zustand';
// Refactor 2025-07: uso de cliente API para world items
import {
	createWorldItemInApi,
	deleteWorldItemFromApi,
	getWorldItemsFromApi,
	updateWorldItemInApi,
} from '@/lib/api/client/world-item.client';
import { clientLogger, clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';
import { toastService } from '@/services/toast';
import type { CreateWorldItemData, UpdateWorldItemData, WorldItem } from '@/types/entities/world-item';
import type { WorldItemActions, WorldItemState } from '../types';

const worldItemLogger = clientLogger.withContext('WorldItemStoreCore');

export interface WorldItemCoreSlice {
	worldItems: WorldItem[];
	isLoading: boolean;
	error: string | null;
	loadWorldItems: () => Promise<void>;
	createWorldItem: (item: CreateWorldItemData) => Promise<void>;
	updateWorldItem: (id: string, item: UpdateWorldItemData) => Promise<void>;
	deleteWorldItem: (id: string) => Promise<void>;
	getWorldItemById: (id: string) => WorldItem | undefined;
	setWorldItems: (worldItems: WorldItem[]) => void;
	addWorldItem: (worldItem: WorldItem) => void;
	resetStore: () => void;
	setError: (error: string | null) => void;
}

export const createWorldItemCoreSlice: StateCreator<WorldItemState & WorldItemActions, [], [], WorldItemCoreSlice> = (
	set,
	get
) => ({
	worldItems: [],
	isLoading: false,
	error: null,
	loadWorldItems: async () => {
		try {
			set({ isLoading: true, error: null });
			worldItemLogger.info('🔄 Cargando objetos del mundo...');
			const items = await getWorldItemsFromApi();
			set({ worldItems: items as unknown as WorldItem[], isLoading: false });
			worldItemLogger.info('✅ Objetos del mundo cargados');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error al cargar objetos del mundo';
			worldItemLogger.error('❌ Error al cargar objetos del mundo:', error);
			set({ error: errorMessage, isLoading: false });
			toastService.system.error(errorMessage);
		}
	},
	createWorldItem: async (item) => {
		try {
			worldItemLogger.info('➕ Creando objeto del mundo:', item);
			const newItem = await createWorldItemInApi(item);
			set((state) => ({ worldItems: [...state.worldItems, newItem as unknown as WorldItem] }));
			toastService.system.success('Objeto del mundo creado');
		} catch (error) {
			worldItemLogger.error('❌ Error al crear objeto del mundo:', error);
			toastService.system.error('Error al crear objeto del mundo');
		}
	},
	updateWorldItem: async (id, item) => {
		try {
			worldItemLogger.info('🔄 Actualizando objeto del mundo:', { id, ...item });
			const updatedItem = await updateWorldItemInApi(id, item);
			set((state) => ({
				worldItems: state.worldItems.map((i) => (i.id === id ? (updatedItem as unknown as WorldItem) : i)),
			}));
			toastService.system.success('Objeto del mundo actualizado');
		} catch (error) {
			worldItemLogger.error('❌ Error al actualizar objeto del mundo:', error);
			toastService.system.error('Error al actualizar objeto del mundo');
		}
	},
	deleteWorldItem: async (id) => {
		try {
			worldItemLogger.info('🗑️ Eliminando objeto del mundo:', id);
			await deleteWorldItemFromApi(id);
			set((state) => ({
				worldItems: state.worldItems.filter((i) => i.id !== id),
			}));
			toastService.system.success('Objeto del mundo eliminado');
		} catch (error) {
			worldItemLogger.error('❌ Error al eliminar objeto del mundo:', error);
			toastService.system.error('Error al eliminar objeto del mundo');
		}
	},
	getWorldItemById: (id) => get().worldItems.find((item) => item.id === id),
	setWorldItems: (worldItems) => set({ worldItems }),
	addWorldItem: (worldItem) => set((state) => ({ worldItems: [...state.worldItems, worldItem] })),
	resetStore: () => set({ worldItems: [], isLoading: false, error: null }),
	setError: (error) => set({ error }),
});

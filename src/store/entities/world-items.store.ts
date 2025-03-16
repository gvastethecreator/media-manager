import {
	type WorldItemCreate,
	type WorldItemUpdate,
	type WorldItemWithStats,
	addImageToWorldItem as addImageToWorldItemAction,
	createWorldItem as createWorldItemAction,
	deleteWorldItem as deleteWorldItemAction,
	getWorldItems,
	updateWorldItem as updateWorldItemAction,
} from '@/app/actions/world-items/world-item.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import type { WorldItem } from '@prisma/client';
import { create } from 'zustand';

const worldItemsLogger = serverLogger.withContext('WorldItemsStore');

const mapToWorldItemWithStats = (worldItem: Awaited<ReturnType<typeof getWorldItems>>[0]): WorldItemWithStats => ({
	...worldItem,
	totalSize: 0,
	lastUpdated: new Date(),
	recentImages: [],
});

interface WorldItemsStore {
	worldItems: WorldItemWithStats[];
	isLoading: boolean;
	error: string | null;
	loadWorldItems: () => Promise<void>;
	createWorldItem: (worldItem: WorldItemCreate) => Promise<WorldItem | null>;
	updateWorldItem: (id: string, worldItem: WorldItemUpdate) => Promise<void>;
	deleteWorldItem: (id: string) => Promise<void>;
	addImageToWorldItem: (imageId: string, worldItemId: string) => Promise<void>;
}

export const useWorldItemsStore = create<WorldItemsStore>((set) => ({
	worldItems: [],
	isLoading: false,
	error: null,
	loadWorldItems: async () => {
		try {
			set({ isLoading: true, error: null });
			worldItemsLogger.info('🔄 Cargando objetos del mundo...');
			const rawWorldItems = await getWorldItems();
			const worldItems = rawWorldItems.map(mapToWorldItemWithStats);
			set({ worldItems, isLoading: false });
			worldItemsLogger.info(`✅ ${worldItems.length} objetos del mundo cargados`);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al cargar objetos del mundo';
			worldItemsLogger.error('❌ Error al cargar objetos del mundo:', error);
			set({ error: message, isLoading: false });
		}
	},
	createWorldItem: async (worldItem) => {
		try {
			set({ isLoading: true, error: null });
			worldItemsLogger.info('✨ Creando objeto del mundo:', worldItem);
			const createdWorldItem = await createWorldItemAction(worldItem);
			const rawWorldItems = await getWorldItems();
			const worldItems = rawWorldItems.map(mapToWorldItemWithStats);
			set({ worldItems, isLoading: false });
			worldItemsLogger.info('✅ Objeto del mundo creado', createdWorldItem);
			return createdWorldItem;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al crear objeto del mundo';
			worldItemsLogger.error('❌ Error al crear objeto del mundo:', error);
			set({ error: message, isLoading: false });
			return null;
		}
	},
	updateWorldItem: async (id, worldItem) => {
		try {
			set({ isLoading: true, error: null });
			worldItemsLogger.info('💾 Actualizando objeto del mundo:', worldItem);
			await updateWorldItemAction(id, { ...worldItem, id });
			const rawWorldItems = await getWorldItems();
			const worldItems = rawWorldItems.map(mapToWorldItemWithStats);
			set({ worldItems, isLoading: false });
			worldItemsLogger.info('✅ Objeto del mundo actualizado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al actualizar objeto del mundo';
			worldItemsLogger.error('❌ Error al actualizar objeto del mundo:', error);
			set({ error: message, isLoading: false });
		}
	},
	deleteWorldItem: async (id) => {
		try {
			set({ isLoading: true, error: null });
			worldItemsLogger.info('🗑️ Eliminando objeto del mundo:', id);
			await deleteWorldItemAction(id);
			const rawWorldItems = await getWorldItems();
			const worldItems = rawWorldItems.map(mapToWorldItemWithStats);
			set({ worldItems, isLoading: false });
			worldItemsLogger.info('✅ Objeto del mundo eliminado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al eliminar objeto del mundo';
			worldItemsLogger.error('❌ Error al eliminar objeto del mundo:', error);
			set({ error: message, isLoading: false });
		}
	},
	addImageToWorldItem: async (imageId, worldItemId) => {
		try {
			set({ isLoading: true, error: null });
			worldItemsLogger.info('➕ Agregando imagen a objeto del mundo:', { worldItemId, imageId });
			await addImageToWorldItemAction(worldItemId, imageId);
			const rawWorldItems = await getWorldItems();
			const worldItems = rawWorldItems.map(mapToWorldItemWithStats);
			set({ worldItems, isLoading: false });
			worldItemsLogger.info('✅ Imagen agregada al objeto del mundo');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al agregar imagen al objeto del mundo';
			worldItemsLogger.error('❌ Error al agregar imagen al objeto del mundo:', error);
			set({ error: message, isLoading: false });
		}
	},
}));

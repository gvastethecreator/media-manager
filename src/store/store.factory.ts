import { create } from 'zustand';
import { logger } from '../lib/logger';
import type { BaseEntity, BaseStore, ExtendedStore, StoreHook } from './types';

export interface StoreOptions<T extends BaseEntity> {
	name: string;
	logger?: typeof logger;
	initialState?: Partial<BaseStore<T>>;
	actions?: {
		beforeCreate?: <C = unknown>(data: C) => Promise<C>;
		afterCreate?: (item: T) => Promise<void>;
		beforeUpdate?: <U = unknown>(id: string, data: U) => Promise<U>;
		afterUpdate?: (item: T) => Promise<void>;
		beforeDelete?: (id: string) => Promise<void>;
		afterDelete?: (id: string) => Promise<void>;
	};
}

export function createStoreFactory<
	T extends BaseEntity,
	S = Record<string, unknown>,
	CreateType = Partial<T>,
	UpdateType = Partial<T>,
>(
	options: StoreOptions<T>,
	serverActions: {
		getItems: () => Promise<T[]>;
		createItem: (data: CreateType) => Promise<T>;
		updateItem: (id: string, data: UpdateType) => Promise<T>;
		deleteItem: (id: string) => Promise<void>;
	}
): StoreHook<T, S, CreateType, UpdateType> {
	const storeLogger = options.logger?.withContext(options.name) || logger.withContext(options.name);

	return create<ExtendedStore<T, S, CreateType, UpdateType>>((set, get) => {
		const baseStore: BaseStore<T, CreateType, UpdateType> = {
			// Estado inicial
			items: [],
			loading: false,
			error: null,
			currentPage: 1,
			totalPages: 1,
			itemsPerPage: 50,
			selectedItem: null,
			selectedItems: [],
			lastSelectedItem: null,
			...options.initialState,

			// Acciones base
			loadItems: async () => {
				try {
					set((state) => ({ ...state, loading: true, error: null }));
					const items = await serverActions.getItems();
					set((state) => ({ ...state, items, loading: false }));
					storeLogger.info(`📥 ${options.name} cargados:`, { count: items.length });
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
					set((state) => ({ ...state, error: new Error(errorMessage), loading: false }));
					storeLogger.error(`❌ Error al cargar ${options.name}:`, { error });
				}
			},

			createItem: async (data: CreateType) => {
				try {
					set((state) => ({ ...state, loading: true, error: null }));

					// Hook antes de crear
					const processedData = options.actions?.beforeCreate ? await options.actions.beforeCreate(data) : data;

					const item = await serverActions.createItem(processedData);

					set((state) => ({
						...state,
						items: [...state.items, item],
						loading: false,
					}));

					// Hook después de crear
					if (options.actions?.afterCreate) {
						await options.actions.afterCreate(item);
					}

					storeLogger.info(`✨ ${options.name} creado:`, { item });
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
					set((state) => ({ ...state, error: new Error(errorMessage), loading: false }));
					storeLogger.error(`❌ Error al crear ${options.name}:`, { error });
				}
			},

			updateItem: async (id: string, data: UpdateType) => {
				try {
					set((state) => ({ ...state, loading: true, error: null }));

					// Hook antes de actualizar
					const processedData = options.actions?.beforeUpdate ? await options.actions.beforeUpdate(id, data) : data;

					const updatedItem = await serverActions.updateItem(id, processedData);

					set((state) => ({
						...state,
						items: state.items.map((item) => (item.id === id ? updatedItem : item)),
						loading: false,
					}));

					// Hook después de actualizar
					if (options.actions?.afterUpdate) {
						await options.actions.afterUpdate(updatedItem);
					}

					storeLogger.info(`📝 ${options.name} actualizado:`, { id, data });
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
					set((state) => ({ ...state, error: new Error(errorMessage), loading: false }));
					storeLogger.error(`❌ Error al actualizar ${options.name}:`, { id, error });
				}
			},

			deleteItem: async (id: string) => {
				try {
					set((state) => ({ ...state, loading: true, error: null }));

					// Hook antes de eliminar
					if (options.actions?.beforeDelete) {
						await options.actions.beforeDelete(id);
					}

					await serverActions.deleteItem(id);

					set((state) => ({
						...state,
						items: state.items.filter((item) => item.id !== id),
						loading: false,
					}));

					// Hook después de eliminar
					if (options.actions?.afterDelete) {
						await options.actions.afterDelete(id);
					}

					storeLogger.info(`🗑️ ${options.name} eliminado:`, { id });
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
					set((state) => ({ ...state, error: new Error(errorMessage), loading: false }));
					storeLogger.error(`❌ Error al eliminar ${options.name}:`, { id, error });
				}
			},

			// Métodos de selección
			selectItem: (item: T) => {
				set((state) => ({
					...state,
					selectedItem: item,
					selectedItems: [...state.selectedItems, item],
					lastSelectedItem: item,
				}));
			},

			deselectItem: (id: string) => {
				set((state) => ({
					...state,
					selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
					selectedItems: state.selectedItems.filter((item) => item.id !== id),
					lastSelectedItem: state.lastSelectedItem?.id === id ? null : state.lastSelectedItem,
				}));
			},

			toggleItemSelection: (item: T, isMultiSelect: boolean) => {
				const state = get();
				const isSelected = state.selectedItems.some((i) => i.id === item.id);

				if (!isMultiSelect) {
					set((state) => ({
						...state,
						selectedItem: isSelected ? null : item,
						selectedItems: isSelected ? [] : [item],
						lastSelectedItem: isSelected ? null : item,
					}));
					return;
				}

				if (isSelected) {
					baseStore.deselectItem(item.id);
				} else {
					baseStore.selectItem(item);
				}
			},

			clearSelection: () => {
				set((state) => ({
					...state,
					selectedItem: null,
					selectedItems: [],
					lastSelectedItem: null,
				}));
			},

			// Paginación
			loadMoreItems: async () => {
				const state = get();
				if (state.loading || state.currentPage >= state.totalPages) {
					return;
				}

				try {
					set((state) => ({ ...state, loading: true }));
					const nextPage = state.currentPage + 1;
					const moreItems = await serverActions.getItems();

					set((state) => ({
						...state,
						items: [...state.items, ...moreItems],
						currentPage: nextPage,
						loading: false,
					}));

					storeLogger.info(`✅ ${moreItems.length} ${options.name} adicionales cargados`);
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
					set((state) => ({ ...state, error: new Error(errorMessage), loading: false }));
					storeLogger.error(`❌ Error al cargar más ${options.name}:`, { error });
				}
			},

			refreshItems: async () => {
				set((state) => ({
					...state,
					selectedItem: null,
					selectedItems: [],
					lastSelectedItem: null,
				}));
				await baseStore.loadItems();
			},
		};

		return { ...baseStore } as ExtendedStore<T, S, CreateType, UpdateType>;
	}) as StoreHook<T, S, CreateType, UpdateType>;
}

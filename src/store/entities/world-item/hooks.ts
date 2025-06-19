/**
 * @file Hooks personalizados para el store de WorldItem
 * @module store/entities/world-item/hooks
 */

import { useCallback, useMemo } from 'react';
import type { WorldItem } from '../../../types/entities/world-item';
import { WORLD_ITEM_SORT_OPTIONS } from './constants';
import { useWorldItemStore } from './index';

/**
 * Hook para acceder a todos los objetos del mundo, con filtrado y ordenamiento
 * @returns Lista filtrada y ordenada de objetos del mundo
 */
export const useWorldItems = () => {
	const store = useWorldItemStore();

	return {
		// Datos
		worldItems: store.worldItems,
		filteredItems: store.getFilteredWorldItems(),
		sortedItems: store.getSortedWorldItems(),

		// Estado
		isLoading: store.isLoading,
		error: store.error,

		// Acciones
		loadWorldItems: store.loadWorldItems,
	};
};

/**
 * Hook para gestionar los filtros de objetos del mundo
 * @returns Estado y acciones para filtrado
 */
export const useWorldItemFilters = () => {
	const store = useWorldItemStore();

	const filters = useMemo(() => store.filters, [store.filters]);

	return {
		// Estado
		filters,
		sortOptions: WORLD_ITEM_SORT_OPTIONS,

		// Acciones
		updateFilters: store.updateFilters,
		clearFilters: store.clearFilters,

		// Selectors
		getFilteredItems: store.getFilteredWorldItems,
	};
};

/**
 * Hook para gestionar el estado de visualización
 * @returns Estado y acciones para la visualización
 */
export const useWorldItemView = () => {
	const store = useWorldItemStore();

	const viewState = useMemo(
		() => ({
			viewMode: store.ui.viewMode,
			selectedId: store.ui.selectedId,
			editingId: store.ui.editingId,
			highlightedId: store.ui.highlightedId,
		}),
		[store.ui.viewMode, store.ui.selectedId, store.ui.editingId, store.ui.highlightedId]
	);

	return {
		// Estado
		...viewState,

		// Acciones
		setViewMode: store.setViewMode,
		selectWorldItem: store.selectWorldItem,
		startEditing: store.startEditing,
		highlightWorldItem: store.highlightWorldItem,
	};
};

/**
 * Hook para gestionar la selección de objetos del mundo
 * @returns Estado y acciones para la selección
 */
export const useWorldItemSelection = () => {
	const selectedId = useWorldItemStore((state) => state.ui.selectedId);
	const editingId = useWorldItemStore((state) => state.ui.editingId);
	const highlightedId = useWorldItemStore((state) => state.ui.highlightedId);
	const { selectWorldItem, startEditing, highlightWorldItem } = useWorldItemStore();

	const selectedItem = useMemo(() => {
		if (!selectedId) return null;
		const items = useWorldItemStore.getState().worldItems;
		return items.find((item) => item.id === selectedId) || null;
	}, [selectedId]);

	return {
		// Estado de selección
		selectedId,
		selectedItem,
		editingId,
		highlightedId,

		// Acciones
		selectWorldItem,
		startEditing,
		highlightWorldItem,

		// Métodos derivados
		isSelected: useCallback((id: string) => selectedId === id, [selectedId]),
		isEditing: useCallback((id: string) => editingId === id, [editingId]),
		isHighlighted: useCallback((id: string) => highlightedId === id, [highlightedId]),
	};
};

/**
 * Hook para acceder a un objeto del mundo específico
 * @param id ID del objeto del mundo
 * @returns Objeto y acciones específicas para ese objeto
 */
export const useWorldItem = (id: string | null) => {
	const item = useWorldItemStore((state) => (id ? state.getWorldItemById(id) : null));

	const { updateWorldItem, deleteWorldItem } = useWorldItemStore();

	return {
		item,
		update: useCallback(
			(data: Partial<WorldItem>) => {
				if (id && data.category !== null) {
					// Filtramos nulls para evitar conflictos con el tipo
					const updateData = Object.fromEntries(
						Object.entries(data).filter(([, value]) => value !== null)
					);
					updateWorldItem(id, updateData);
				}
			},
			[id, updateWorldItem]
		),
		remove: useCallback(() => {
			if (id) deleteWorldItem(id);
		}, [id, deleteWorldItem]),
	};
};

/**
 * Hook para acciones comunes sobre objetos del mundo
 * @returns Acciones para gestionar objetos del mundo
 */
export const useWorldItemActions = () => {
	const store = useWorldItemStore();

	return {
		// Acciones CRUD
		createWorldItem: store.createWorldItem,
		updateWorldItem: store.updateWorldItem,
		deleteWorldItem: store.deleteWorldItem,

		// Acciones por lotes
		updateMultiple: useCallback(
			(ids: string[], data: Partial<WorldItem>) => {
				for (const id of ids) {
					// Filtramos nulls para evitar conflictos con el tipo
					const updateData = Object.fromEntries(
						Object.entries(data).filter(([, value]) => value !== null)
					);
					store.updateWorldItem(id, updateData);
				}
			},
			[store]
		),

		deleteMultiple: useCallback(
			(ids: string[]) => {
				for (const id of ids) {
					store.deleteWorldItem(id);
				}
			},
			[store]
		),

		// Acciones comunes
		toggleFavorite: useCallback(
			(id: string) => {
				const item = store.getWorldItemById(id);
				if (item && 'isFavorite' in item) {
					const updateData = { isFavorite: !item.isFavorite };
					store.updateWorldItem(id, updateData);
				}
			},
			[store]
		),
	};
};

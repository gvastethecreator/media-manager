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
		setWorldItems: store.setWorldItems,
		resetStore: store.resetStore,
		sortItems: store.setSortBy,
	};
};

/**
 * Hook para gestionar los filtros de objetos del mundo
 * @returns Estado y acciones para filtrado
 */
export const useWorldItemFilters = () => {
	const store = useWorldItemStore();

	const filters = useMemo(() => store.filters, [store.filters]);
	const searchQuery = store.searchQuery;

	return {
		// Estado
		filters,
		searchQuery,
		sortBy: store.sortBy,
		sortOptions: WORLD_ITEM_SORT_OPTIONS,

		// Acciones
		setFilters: store.setFilters,
		resetFilters: store.resetFilters,
		setSortBy: store.setSortBy,
		setSearchQuery: store.setSearchQuery,

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
			viewMode: store.viewMode,
			isCreatingItem: store.isCreatingItem,
			isEditingItem: store.isEditingItem,
			isProcessingAction: store.isProcessingAction,
		}),
		[store.viewMode, store.isCreatingItem, store.isEditingItem, store.isProcessingAction]
	);

	return {
		// Estado
		...viewState,

		// Acciones
		setViewMode: store.setViewMode,
		setIsCreatingItem: store.setIsCreatingItem,
		setIsEditingItem: store.setIsEditingItem,
		setIsProcessingAction: store.setIsProcessingAction,
		toggleExpanded: store.toggleExpanded,
	};
};

/**
 * Hook para gestionar la selección de objetos del mundo
 * @returns Estado y acciones para la selección
 */
export const useWorldItemSelection = () => {
	const selectedIds = useWorldItemStore((state) => state.selectedIds);
	const currentItemId = useWorldItemStore((state) => state.currentItemId);
	const expandedIds = useWorldItemStore((state) => state.expandedIds);
	const { toggleSelected, clearSelection, selectItems, toggleExpanded, setCurrentItemId } = useWorldItemStore();

	const selectedItems = useMemo(() => {
		const items = useWorldItemStore.getState().worldItems;
		return items.filter((item) => selectedIds.includes(item.id));
	}, [selectedIds]);

	return {
		// Estado de selección
		selectedIds,
		selectedItems,
		currentItemId,
		expandedIds,

		// Acciones
		toggleSelected,
		clearSelection,
		selectItems,
		toggleExpanded,
		setCurrentItemId,

		// Métodos derivados
		isSelected: useCallback((id: string) => selectedIds.includes(id), [selectedIds]),
		isExpanded: useCallback((id: string) => expandedIds.includes(id), [expandedIds]),
	};
};

/**
 * Hook para acceder a un objeto del mundo específico
 * @param id ID del objeto del mundo
 * @returns Objeto y acciones específicas para ese objeto
 */
export const useWorldItem = (id: string | null) => {
	const item = useWorldItemStore((state) => (id ? state.getWorldItemById(id) : null));

	const { updateWorldItem, removeWorldItem } = useWorldItemStore();

	return {
		item,
		update: useCallback(
			(data: Partial<WorldItem>) => {
				if (id) updateWorldItem(id, data);
			},
			[id, updateWorldItem]
		),
		remove: useCallback(() => {
			if (id) removeWorldItem(id);
		}, [id, removeWorldItem]),
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
		addWorldItem: store.addWorldItem,
		updateWorldItem: store.updateWorldItem,
		removeWorldItem: store.removeWorldItem,

		// Acciones por lotes
		updateMultiple: useCallback(
			(ids: string[], data: Partial<WorldItem>) => {
				ids.forEach((id) => store.updateWorldItem(id, data));
			},
			[store]
		),

		removeMultiple: useCallback(
			(ids: string[]) => {
				ids.forEach((id) => store.removeWorldItem(id));
			},
			[store]
		),

		// Acciones comunes
		toggleFavorite: useCallback(
			(id: string) => {
				const item = store.getWorldItemById(id);
				if (item) {
					store.updateWorldItem(id, { isFavorite: !item.isFavorite });
				}
			},
			[store]
		),
	};
};

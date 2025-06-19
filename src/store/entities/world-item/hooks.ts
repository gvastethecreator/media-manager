/**
 * @file Hooks personalizados para el store de WorldItem
 * @module store/entities/world-item/hooks
 */

import { useCallback, useMemo } from 'react';
import { WORLD_ITEM_SORT_OPTIONS } from './constants';
import { useWorldItemStore } from './index';
import type { WorldItemUpdateData } from './types';

/**
 * Hook para acceder a todos los objetos del mundo, con filtrado y ordenamiento
 * @returns Lista filtrada y ordenada de objetos del mundo
 */
export const useWorldItems = () => {
	const {
		worldItems,
		isLoading,
		error,
		getFilteredWorldItems,
		getSortedWorldItems,
		loadWorldItems,
		clearFilters,
		updateFilters,
	} = useWorldItemStore();

	return {
		// Datos
		worldItems,
		filteredItems: getFilteredWorldItems(),
		sortedItems: getSortedWorldItems(),

		// Estado
		isLoading,
		error,

		// Acciones
		loadWorldItems,
		clearFilters,
		updateFilters,
	};
};

/**
 * Hook para gestionar los filtros de objetos del mundo
 * @returns Estado y acciones para filtrado
 */
export const useWorldItemFilters = () => {
	const { filters, updateFilters, clearFilters, getFilteredWorldItems } = useWorldItemStore();

	return {
		// Estado
		filters,
		sortOptions: WORLD_ITEM_SORT_OPTIONS,

		// Acciones
		updateFilters,
		clearFilters,

		// Selectors
		getFilteredItems: getFilteredWorldItems,
	};
};

/**
 * Hook para gestionar el estado de visualización
 * @returns Estado y acciones para la visualización
 */
export const useWorldItemView = () => {
	const { ui, setViewMode, startEditing, highlightWorldItem } = useWorldItemStore();

	const viewState = useMemo(
		() => ({
			viewMode: ui.viewMode,
			editingId: ui.editingId,
			selectedId: ui.selectedId,
			highlightedId: ui.highlightedId,
		}),
		[ui],
	);

	return {
		// Estado
		...viewState,

		// Acciones
		setViewMode,
		startEditing,
		highlightWorldItem,
	};
};

/**
 * Hook para gestionar la selección de objetos del mundo
 * @returns Estado y acciones para la selección
 */
export const useWorldItemSelection = () => {
	const {
		ui: { selectedId },
		worldItems,
		selectWorldItem,
	} = useWorldItemStore();

	const selectedItem = useMemo(() => {
		return worldItems.find((item) => item.id === selectedId);
	}, [selectedId, worldItems]);

	const clearSelection = useCallback(() => {
		selectWorldItem(null);
	}, [selectWorldItem]);

	return {
		// Estado de selección
		selectedId,
		selectedItem,

		// Acciones
		selectWorldItem,
		clearSelection,

		// Métodos derivados
		isSelected: useCallback((id: string) => selectedId === id, [selectedId]),
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
			(data: WorldItemUpdateData) => {
				if (id) updateWorldItem(id, data);
			},
			[id, updateWorldItem],
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
	const { createWorldItem, updateWorldItem, deleteWorldItem, getWorldItemById } = useWorldItemStore();

	return {
		// Acciones CRUD
		createWorldItem,
		updateWorldItem,
		deleteWorldItem,

		// Acciones por lotes
		updateMultiple: useCallback(
			(ids: string[], data: WorldItemUpdateData) => {
				for (const id of ids) {
					updateWorldItem(id, data);
				}
			},
			[updateWorldItem],
		),

		removeMultiple: useCallback(
			(ids: string[]) => {
				for (const id of ids) {
					deleteWorldItem(id);
				}
			},
			[deleteWorldItem],
		),

		// Acciones comunes
		toggleFavorite: useCallback(
			(id: string) => {
				const item = getWorldItemById(id);
				if (item) {
					updateWorldItem(id, { isFavorite: !item.isFavorite });
				}
			},
			[getWorldItemById, updateWorldItem],
		),
	};
};

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { createCoreSlice } from './slices/core';
import { createFiltersSlice } from './slices/filters';
import { createUISlice } from './slices/ui';
import type { VisualPresetStore } from './types';

export const useVisualPresetStore = create<VisualPresetStore>()(
	devtools(
		(...a) => ({
			...createCoreSlice(...a),
			...createUISlice(...a),
			...createFiltersSlice(...a),
		}),
		{ name: 'VisualPresetStore' }
	)
);

// Selectores para simplificar el acceso a estados específicos
// Se pueden exportar selectores individuales para evitar re-renders innecesarios

// Core selectores
export const useVisualPresets = () => useVisualPresetStore((state) => state.presets);
export const useCurrentPresetId = () => useVisualPresetStore((state) => state.currentPresetId);
export const useCurrentPreset = () => {
	const presets = useVisualPresetStore((state) => state.presets);
	const currentId = useVisualPresetStore((state) => state.currentPresetId);
	return currentId ? presets.find((preset) => preset.id === currentId) : null;
};
export const usePresetLoading = () => useVisualPresetStore((state) => state.loading);
export const usePresetError = () => useVisualPresetStore((state) => state.error);

// UI selectores
export const usePresetModalOpen = () => useVisualPresetStore((state) => state.isPresetModalOpen);
export const useDeleteModalOpen = () => useVisualPresetStore((state) => state.isDeleteModalOpen);
export const useSidebarOpen = () => useVisualPresetStore((state) => state.isSidebarOpen);
export const useViewMode = () => useVisualPresetStore((state) => state.viewMode);
export const useDarkMode = () => useVisualPresetStore((state) => state.isDarkMode);
export const useSelectedTab = () => useVisualPresetStore((state) => state.selectedTab);

// Filtros selectores
export const useSearchTerm = () => useVisualPresetStore((state) => state.searchTerm);
export const useFilterCategories = () => useVisualPresetStore((state) => state.filterCategory);
export const useFilterTags = () => useVisualPresetStore((state) => state.filterTag);
export const useSortSettings = () => ({
	sortBy: useVisualPresetStore((state) => state.sortBy),
	sortOrder: useVisualPresetStore((state) => state.sortOrder),
});

// Selector para filtrar presets basado en los filtros actuales
export const useFilteredPresets = () => {
	const presets = useVisualPresetStore((state) => state.presets);
	const searchTerm = useVisualPresetStore((state) => state.searchTerm);
	const filterCategories = useVisualPresetStore((state) => state.filterCategory);
	const filterTags = useVisualPresetStore((state) => state.filterTag);
	const sortBy = useVisualPresetStore((state) => state.sortBy);
	const sortOrder = useVisualPresetStore((state) => state.sortOrder);

	// Filtro por término de búsqueda, categorías y etiquetas
	return presets
		.filter((preset) => {
			// Filtro por término de búsqueda
			const matchesSearch =
				searchTerm === '' ||
				preset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(preset.description && preset.description.toLowerCase().includes(searchTerm.toLowerCase()));

			// Filtro por categorías (si hay alguna seleccionada)
			const matchesCategory =
				filterCategories.length === 0 || (preset.category && filterCategories.includes(preset.category));

			// Filtro por etiquetas (si hay alguna seleccionada)
			const matchesTags =
				filterTags.length === 0 || (preset.tags && preset.tags.some((tag) => filterTags.includes(tag)));

			return matchesSearch && matchesCategory && matchesTags;
		})
		.sort((a, b) => {
			// Ordenación basada en el campo seleccionado
			const aValue = a[sortBy as keyof typeof a];
			const bValue = b[sortBy as keyof typeof b];

			// Manejo de campos posiblemente nulos
			if (aValue === undefined || aValue === null) return sortOrder === 'asc' ? -1 : 1;
			if (bValue === undefined || bValue === null) return sortOrder === 'asc' ? 1 : -1;

			// Comparación basada en el tipo de valor
			if (typeof aValue === 'string' && typeof bValue === 'string') {
				return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
			}

			if (typeof aValue === 'number' && typeof bValue === 'number') {
				return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
			}

			if (aValue instanceof Date && bValue instanceof Date) {
				return sortOrder === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
			}

			// Fallback para otros tipos
			return 0;
		});
};

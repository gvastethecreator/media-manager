import { useMemo } from 'react';
import type { MediaItem } from '../components/media-thumbnail';
import type { SortOption } from '@/store/ui/view-options.slice';
import {
	addParentNavigation,
	applySearch,
	applySort,
	filterSyntheticItems,
	groupByEntityType,
} from '../utils/file-browser.utils';

export interface UseProcessedItemsOptions {
	items: MediaItem[];
	searchQuery: string;
	sortOptions: SortOption[];
	parentId?: string | null;
	groupByType: boolean;
}

export interface ProcessedItemsResult {
	baseItems: MediaItem[];
	processedItems: MediaItem[];
	nonSyntheticItems: MediaItem[];
	grouped: Array<{ key: string; items: MediaItem[]; displayName: string }> | null;
	linearItems: MediaItem[];
	toolbarItemIds: string[];
}

/**
 * Hook para procesar items del explorador de archivos.
 * Aplica búsqueda, ordenamiento, navegación de padre, agrupación y filtrado.
 */
export function useProcessedItems({
	items,
	searchQuery,
	sortOptions,
	parentId,
	groupByType,
}: UseProcessedItemsOptions): ProcessedItemsResult {
	// 1. Aplicar búsqueda y ordenamiento
	const baseItems = useMemo(() => {
		const searched = applySearch(items, searchQuery);
		const sorted = applySort(searched, sortOptions);
		return sorted;
	}, [items, searchQuery, sortOptions]);

	// 2. Agregar navegación de padre si hay parentId
	const processedItems = useMemo(() => {
		if (parentId) {
			return addParentNavigation(baseItems, parentId);
		}
		return baseItems;
	}, [baseItems, parentId]);

	// 3. Filtrar items sintéticos (como "..")
	const nonSyntheticItems = useMemo(() => {
		return filterSyntheticItems(processedItems);
	}, [processedItems]);

	// 4. Agrupar por tipo si está habilitado
	const grouped = useMemo(() => {
		if (!groupByType) return null;
		return groupByEntityType(processedItems);
	}, [groupByType, processedItems]);

	// 5. Items lineales (para paginación/iteración)
	const linearItems = useMemo(() => {
		if (grouped) {
			return grouped.flatMap((g) => g.items);
		}
		return processedItems;
	}, [grouped, processedItems]);

	// 6. IDs de items para toolbar (sin sintéticos)
	const toolbarItemIds = useMemo(() => {
		return nonSyntheticItems.map((it) => it.id);
	}, [nonSyntheticItems]);

	return {
		baseItems,
		processedItems,
		nonSyntheticItems,
		grouped,
		linearItems,
		toolbarItemIds,
	};
}

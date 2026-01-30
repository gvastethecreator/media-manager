/**
 * @file Provider del File Browser
 * @module file-browser-new/core/provider
 */

import { useMemo } from 'react';
import { useFileBrowser } from '../hooks/use-file-browser';
import type { FileBrowserProviderProps } from '../types/props.types';
import { FileBrowserContext, type FileBrowserContextValue } from './context';

/**
 * Provider que encapsula toda la lógica del File Browser
 */
export function FileBrowserProvider({
	children,
	folderId,
	items,
	onItemClick,
	onItemDoubleClick,
}: FileBrowserProviderProps) {
	// Hook principal
	const browser = useFileBrowser({
		folderId,
		items,
		onItemClick,
		onItemDoubleClick,
	});

	// Construir valor del contexto
	const contextValue: FileBrowserContextValue = useMemo(
		() => ({
			// Estado
			items: browser.items,
			groups: browser.groups,
			linearItems: browser.linearItems,
			realItemCount: browser.realItemCount,
			viewMode: browser.viewMode,
			viewConfig: browser.viewConfig,
			itemSize: browser.itemSize,
			searchQuery: browser.searchQuery,
			sortOptions: browser.sortOptions,
			groupByType: browser.groupByType,
			isLoading: browser.isLoading,
			isLoadingMore: browser.isLoadingMore,
			error: browser.error,
			pagination: browser.pagination,
			hasMore: browser.hasMore,
			selectedIds: browser.selectedSet,
			activeId: browser.activeId,
			scrollContainerRef: browser.scrollContainerRef,
			folderId: browser.folderId,
			parentFolderId: browser.parentFolderId,

			// Acciones
			navigateToFolder: browser.navigateToFolder,
			navigateToParent: browser.navigateToParent,
			selectItem: (id: string) => {
				// Usar el handler interno
				const item = browser.items.find((it) => it.id === id);
				if (item) browser.handleItemClick(item);
			},
			toggleSelection: (id: string) => {
				const item = browser.items.find((it) => it.id === id);
				if (item) browser.handleItemClick(item, { ctrlKey: true, metaKey: false, shiftKey: false });
			},
			selectRange: (fromId: string, toId: string) => {
				const item = browser.items.find((it) => it.id === toId);
				if (item) browser.handleItemClick(item, { ctrlKey: false, metaKey: false, shiftKey: true });
			},
			selectAll: browser.selectAll,
			clearSelection: browser.clearSelection,
			setActiveItem: browser.setActiveItem,
			setViewMode: browser.setViewMode,
			setItemSize: browser.setItemSize,
			setGroupByType: browser.setGroupByType,
			setSearchQuery: browser.setSearchQuery,
			setSortOptions: browser.setSortOptions,
			refresh: browser.refresh,
			loadMore: browser.loadMore,
			handleItemClick: browser.handleItemClick,
			handleItemDoubleClick: browser.handleItemDoubleClick,
			setScrollContainer: browser.setScrollContainer,
		}),
		[browser]
	);

	return <FileBrowserContext.Provider value={contextValue}>{children}</FileBrowserContext.Provider>;
}

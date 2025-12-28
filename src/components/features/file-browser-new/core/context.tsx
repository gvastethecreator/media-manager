/**
 * @file Contexto React del File Browser
 * @module file-browser-new/core/context
 */

import { createContext, useContext } from 'react';
import type {
    BrowserItem,
    BrowserItemGroup,
    ViewMode,
    ViewConfig,
    SortOption,
    PaginationState,
    ItemClickHandler,
    ItemDoubleClickHandler,
} from '../types';

/**
 * Estado del File Browser
 */
export interface FileBrowserState {
    // Datos
    items: BrowserItem[];
    groups: BrowserItemGroup[] | null;
    linearItems: BrowserItem[];
    realItemCount: number;

    // Vista
    viewMode: ViewMode;
    viewConfig: ViewConfig;
    itemSize: number;

    // Búsqueda y filtros
    searchQuery: string;
    sortOptions: SortOption[];
    groupByType: boolean;

    // Estado de carga
    isLoading: boolean;
    isLoadingMore: boolean;
    error: string | null;

    // Paginación
    pagination: PaginationState;
    hasMore: boolean;

    // Selección
    selectedIds: Set<string>;
    activeId: string | null;

    // Scroll
    scrollContainerRef: React.RefObject<HTMLDivElement | null>;

    // Carpeta actual
    folderId: string | null;
    parentFolderId: string | null;
}

/**
 * Acciones del File Browser
 */
export interface FileBrowserActions {
    // Navegación
    navigateToFolder: (folderId: string) => void;
    navigateToParent: () => void;

    // Selección
    selectItem: (id: string) => void;
    toggleSelection: (id: string) => void;
    selectRange: (fromId: string, toId: string) => void;
    selectAll: () => void;
    clearSelection: () => void;
    setActiveItem: (id: string | null) => void;

    // Vista
    setViewMode: (mode: ViewMode) => void;
    setItemSize: (size: number) => void;
    setGroupByType: (enabled: boolean) => void;

    // Búsqueda y filtros
    setSearchQuery: (query: string) => void;
    setSortOptions: (options: SortOption[]) => void;

    // Datos
    refresh: () => Promise<void>;
    loadMore: () => void;

    // Handlers
    handleItemClick: ItemClickHandler;
    handleItemDoubleClick: ItemDoubleClickHandler;

    // Scroll
    setScrollContainer: (el: HTMLDivElement | null) => void;
}

/**
 * Tipo completo del contexto
 */
export interface FileBrowserContextValue extends FileBrowserState, FileBrowserActions { }

/**
 * Valor por defecto del contexto (para SSR)
 */
const defaultValue: FileBrowserContextValue = {
    // Estado
    items: [],
    groups: null,
    linearItems: [],
    realItemCount: 0,
    viewMode: 'grid',
    viewConfig: { kind: 'grid', renderMode: 'canvas', gap: 8, itemSize: 150, columns: 0 },
    itemSize: 150,
    searchQuery: '',
    sortOptions: [],
    groupByType: false,
    isLoading: false,
    isLoadingMore: false,
    error: null,
    pagination: { page: 0, pageSize: 150, totalItems: 0, totalPages: 0, hasMore: false },
    hasMore: false,
    selectedIds: new Set(),
    activeId: null,
    scrollContainerRef: { current: null },
    folderId: null,
    parentFolderId: null,

    // Acciones (no-op)
    navigateToFolder: () => { },
    navigateToParent: () => { },
    selectItem: () => { },
    toggleSelection: () => { },
    selectRange: () => { },
    selectAll: () => { },
    clearSelection: () => { },
    setActiveItem: () => { },
    setViewMode: () => { },
    setItemSize: () => { },
    setGroupByType: () => { },
    setSearchQuery: () => { },
    setSortOptions: () => { },
    refresh: async () => { },
    loadMore: () => { },
    handleItemClick: () => { },
    handleItemDoubleClick: () => { },
    setScrollContainer: () => { },
};

/**
 * Contexto del File Browser
 */
export const FileBrowserContext = createContext<FileBrowserContextValue>(defaultValue);

/**
 * Hook para acceder al contexto
 */
export function useFileBrowserContext(): FileBrowserContextValue {
    const context = useContext(FileBrowserContext);
    if (!context) {
        throw new Error('useFileBrowserContext debe usarse dentro de FileBrowserProvider');
    }
    return context;
}

/**
 * Hook para acceder solo al estado
 */
export function useFileBrowserState(): FileBrowserState {
    const ctx = useFileBrowserContext();
    return {
        items: ctx.items,
        groups: ctx.groups,
        linearItems: ctx.linearItems,
        realItemCount: ctx.realItemCount,
        viewMode: ctx.viewMode,
        viewConfig: ctx.viewConfig,
        itemSize: ctx.itemSize,
        searchQuery: ctx.searchQuery,
        sortOptions: ctx.sortOptions,
        groupByType: ctx.groupByType,
        isLoading: ctx.isLoading,
        isLoadingMore: ctx.isLoadingMore,
        error: ctx.error,
        pagination: ctx.pagination,
        hasMore: ctx.hasMore,
        selectedIds: ctx.selectedIds,
        activeId: ctx.activeId,
        scrollContainerRef: ctx.scrollContainerRef,
        folderId: ctx.folderId,
        parentFolderId: ctx.parentFolderId,
    };
}

/**
 * Hook para acceder solo a las acciones
 */
export function useFileBrowserActions(): FileBrowserActions {
    const ctx = useFileBrowserContext();
    return {
        navigateToFolder: ctx.navigateToFolder,
        navigateToParent: ctx.navigateToParent,
        selectItem: ctx.selectItem,
        toggleSelection: ctx.toggleSelection,
        selectRange: ctx.selectRange,
        selectAll: ctx.selectAll,
        clearSelection: ctx.clearSelection,
        setActiveItem: ctx.setActiveItem,
        setViewMode: ctx.setViewMode,
        setItemSize: ctx.setItemSize,
        setGroupByType: ctx.setGroupByType,
        setSearchQuery: ctx.setSearchQuery,
        setSortOptions: ctx.setSortOptions,
        refresh: ctx.refresh,
        loadMore: ctx.loadMore,
        handleItemClick: ctx.handleItemClick,
        handleItemDoubleClick: ctx.handleItemDoubleClick,
        setScrollContainer: ctx.setScrollContainer,
    };
}

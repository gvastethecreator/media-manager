/**
 * @file Hook principal del File Browser
 * @module file-browser-new/hooks/use-file-browser
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigation } from '@/components/navigation/hooks/navigation.utils';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { DEFAULT_PAGE_SIZE, VIEW_CONFIGS } from '../core/constants';
import type { BrowserItem, BrowserItemGroup } from '../types/item.types';
import type { ItemClickHandler, ItemDoubleClickHandler } from '../types/props.types';
import type { PaginationState, SortOption, ViewConfig, ViewMode } from '../types/view.types';
import { filterBySearch, filterSynthetic } from '../utils/filtering';
import { applyGrouping, flattenGroups } from '../utils/grouping';
import { sortWithFoldersFirst } from '../utils/sorting';
import { useDataSource } from './use-data-source';
import { usePagination } from './use-pagination';
import { useSelection } from './use-selection';

export interface UseFileBrowserOptions {
	/** ID de carpeta */
	folderId?: string | null;
	/** Items directos */
	items?: BrowserItem[];
	/** Handler externo de click */
	onItemClick?: ItemClickHandler;
	/** Handler externo de doble click */
	onItemDoubleClick?: ItemDoubleClickHandler;
}

export interface UseFileBrowserResult {
	// Datos procesados
	items: BrowserItem[];
	groups: BrowserItemGroup[] | null;
	linearItems: BrowserItem[];
	realItemCount: number;

	// Vista
	viewMode: ViewMode;
	viewConfig: ViewConfig;
	itemSize: number;
	setViewMode: (mode: ViewMode) => void;
	setItemSize: (size: number) => void;

	// Búsqueda y ordenamiento
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	sortOptions: SortOption[];
	setSortOptions: (options: SortOption[]) => void;
	toggleSortField: (field: string) => void;
	groupByType: boolean;
	setGroupByType: (enabled: boolean) => void;

	// Estado de carga
	isLoading: boolean;
	isLoadingMore: boolean;
	error: string | null;

	// Paginación
	pagination: PaginationState;
	hasMore: boolean;
	loadMore: () => void;
	nextPage: () => void;
	prevPage: () => void;
	shownCount: number;

	// Selección
	selectedIds: string[];
	selectedSet: Set<string>;
	activeId: string | null;
	handleItemClick: ItemClickHandler;
	handleItemDoubleClick: ItemDoubleClickHandler;
	selectAll: () => void;
	clearSelection: () => void;
	isSelected: (id: string) => boolean;
	isActive: (id: string) => boolean;
	setActiveItem: (id: string | null) => void;

	// Navegación
	navigateToFolder: (folderId: string) => void;
	navigateToParent: () => void;
	folderId: string | null;
	parentFolderId: string | null;

	// Refs
	scrollContainerRef: React.RefObject<HTMLDivElement | null>;
	containerRef: React.RefObject<HTMLDivElement | null>;
	setScrollContainer: (el: HTMLDivElement | null) => void;

	// Acciones
	refresh: () => Promise<void>;

	// Estados UI
	showPreloader: boolean;
	showEmptyState: boolean;
	showErrorState: boolean;
	shouldRenderContent: boolean;
}

/**
 * Hook principal que compone toda la lógica del File Browser
 */
export function useFileBrowser({
	folderId,
	items: directItems,
	onItemClick: externalOnItemClick,
	onItemDoubleClick: externalOnItemDoubleClick,
}: UseFileBrowserOptions): UseFileBrowserResult {
	// Refs
	const containerRef = useRef<HTMLDivElement>(null);
	const [scrollContainerEl, setScrollContainerEl] = useState<HTMLDivElement | null>(null);

	// Store de vista
	const viewMode = useViewOptionsStore((s) => s.viewMode) as ViewMode;
	const itemSize = useViewOptionsStore((s) => s.itemSize);
	const sortOptions = useViewOptionsStore((s) => s.sortOptions);
	const searchQuery = useViewOptionsStore((s) => s.searchQuery);
	const groupByType = useViewOptionsStore((s) => s.groupByEntityType);
	const infiniteScroll = useViewOptionsStore((s) => s.infiniteScroll);
	const pageSize = useViewOptionsStore((s) => s.pagination.pageSize) ?? DEFAULT_PAGE_SIZE;

	const setViewMode = useViewOptionsStore((s) => s.setViewMode);
	const setItemSize = useViewOptionsStore((s) => s.setItemSize);
	const setSearchQuery = useViewOptionsStore((s) => s.setSearchQuery);
	const setSortOptions = useViewOptionsStore((s) => s.setSortOptions);
	const setGroupByType = useViewOptionsStore((s) => s.setGroupByEntityType);

	// Toggle de ordenamiento por campo
	const toggleSortField = useCallback(
		(field: string) => {
			const existing = sortOptions.find((s) => s.field === field);
			if (!existing) {
				// Agregar nuevo criterio de ordenamiento
				setSortOptions([{ field, direction: 'asc' }]);
			} else if (existing.direction === 'asc') {
				// Cambiar a descendente
				setSortOptions([{ field, direction: 'desc' }]);
			} else {
				// Quitar ordenamiento
				setSortOptions([]);
			}
		},
		[sortOptions, setSortOptions]
	);

	// Visor de archivos
	const { openViewer } = useFileViewerStore();

	// Navegación
	const { navigateToFolder: navToFolder } = useNavigation();

	// Fuente de datos
	const dataSource = useDataSource({
		folderId: folderId ?? null,
		directItems,
		pageSize,
	});

	// Procesar items: búsqueda -> sort -> group
	const processedData = useMemo(() => {
		let processed = dataSource.items;

		// Filtrar por búsqueda
		if (searchQuery) {
			processed = filterBySearch(processed, searchQuery);
		}

		// Ordenar (carpetas primero)
		if (sortOptions.length > 0) {
			processed = sortWithFoldersFirst(processed, sortOptions);
		}

		// Items reales (sin sintéticos)
		const realItems = filterSynthetic(processed);

		// Agrupar si está habilitado
		const groups = groupByType ? applyGrouping(processed, { type: 'entityType' }) : null;

		// Items lineales para navegación
		const linearItems = groups ? flattenGroups(groups) : processed;

		return {
			items: processed,
			realItems,
			groups,
			linearItems,
		};
	}, [dataSource.items, searchQuery, sortOptions, groupByType]);

	// Selección
	const selection = useSelection({
		items: processedData.linearItems,
	});

	// Paginación
	const pagination = usePagination({
		totalItems: processedData.realItems.length,
		pageSize,
		infiniteScroll,
		hasMoreItems: dataSource.hasMore,
		onLoadMore: dataSource.loadMore,
		isLoadingMore: dataSource.isLoadingMore,
	});

	// Config de vista actual
	const viewConfig = useMemo(() => {
		const base = VIEW_CONFIGS[viewMode] ?? VIEW_CONFIGS.grid;
		if (base.kind === 'grid' || base.kind === 'cards' || base.kind === 'masonry') {
			return { ...base, itemSize };
		}
		return base;
	}, [viewMode, itemSize]);

	// Handler de click
	const handleItemClick: ItemClickHandler = useCallback(
		(item, modifiers) => {
			// Si es carpeta, navegar
			if (item.entityType === 'folder' && !item.isSynthetic) {
				navToFolder(item.id);
				return;
			}

			// Si es item "..", navegar a padre
			if (item.isSynthetic && item.name === '..') {
				navToFolder(item.id);
				return;
			}

			// Procesar selección
			selection.handleClick(item, modifiers);

			// Callback externo
			externalOnItemClick?.(item, modifiers);
		},
		[navToFolder, selection, externalOnItemClick]
	);

	// Handler de doble click
	const handleItemDoubleClick: ItemDoubleClickHandler = useCallback(
		(item) => {
			// Si es carpeta, navegar
			if (item.entityType === 'folder') {
				navToFolder(item.id);
				return;
			}

			// Callback externo primero
			if (externalOnItemDoubleClick) {
				externalOnItemDoubleClick(item);
				return;
			}

			// Fallback: abrir visor para archivos soportados
			// Tipos soportados: image, video, audio, document, jsonFile, file3d
			const supportedTypes = ['image', 'video', 'audio', 'document', 'jsonFile', 'file3d'] as const;
			if (supportedTypes.includes(item.entityType as (typeof supportedTypes)[number])) {
				// Incluir TODOS los archivos soportados en el carousel, no solo del mismo tipo
				const allMediaItems = processedData.linearItems.filter((it) =>
					supportedTypes.includes(it.entityType as (typeof supportedTypes)[number])
				);
				const index = allMediaItems.findIndex((it) => it.id === item.id);

				if (index >= 0) {
					const viewerItems = allMediaItems.map((it) => ({
						id: it.id,
						name: it.name,
						type: it.entityType as 'image' | 'video' | 'audio' | 'document' | 'json' | 'file3d',
						path: it.path || '',
						size: it.size ?? 0,
						width: it.width ?? null,
						height: it.height ?? null,
						thumbnail: it.thumbnailUrl ?? null,
						thumbnailUrl: it.thumbnailUrl ?? undefined,
						mimeType: it.mimeType ?? undefined,
						metadata: null,
					}));
					openViewer(viewerItems, index);
				}
			}
		},
		[navToFolder, externalOnItemDoubleClick, processedData.linearItems, openViewer]
	);

	// Navegación a carpeta
	const navigateToFolder = useCallback(
		(targetFolderId: string) => {
			selection.clearSelection();
			navToFolder(targetFolderId);
		},
		[selection, navToFolder]
	);

	// Navegación a padre
	const navigateToParent = useCallback(() => {
		if (dataSource.parentFolderId) {
			navigateToFolder(dataSource.parentFolderId);
		}
	}, [dataSource.parentFolderId, navigateToFolder]);

	// Set scroll container
	const setScrollContainer = useCallback(
		(el: HTMLDivElement | null) => {
			setScrollContainerEl(el);
			if (dataSource.scrollContainerRef.current !== el) {
				(dataSource.scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
			}
		},
		[dataSource.scrollContainerRef]
	);

	// Efecto para manejar el scroll infinito
	useEffect(() => {
		const container = scrollContainerEl;
		if (!container) return;

		const handleScroll = () => {
			pagination.scrollHandler(container);
		};

		container.addEventListener('scroll', handleScroll);
		return () => container.removeEventListener('scroll', handleScroll);
	}, [scrollContainerEl, pagination.scrollHandler]);

	// Estados UI derivados
	const showPreloader = dataSource.isLoading && processedData.items.length === 0;
	const showErrorState = !showPreloader && !!dataSource.error && processedData.items.length === 0;
	const showEmptyState =
		!(showPreloader || showErrorState) && processedData.realItems.length === 0 && !dataSource.isLoading;
	const shouldRenderContent = !(showPreloader || showErrorState || showEmptyState) && processedData.items.length > 0;

	return {
		// Datos
		items: processedData.items,
		groups: processedData.groups,
		linearItems: processedData.linearItems,
		realItemCount: processedData.realItems.length,

		// Vista
		viewMode,
		viewConfig,
		itemSize,
		setViewMode,
		setItemSize,

		// Búsqueda
		searchQuery,
		setSearchQuery,
		sortOptions,
		setSortOptions,
		toggleSortField,
		groupByType,
		setGroupByType,

		// Estado de carga
		isLoading: dataSource.isLoading,
		isLoadingMore: dataSource.isLoadingMore,
		error: dataSource.error,

		// Paginación
		pagination: pagination.state,
		hasMore: dataSource.hasMore,
		loadMore: dataSource.loadMore,
		nextPage: pagination.nextPage,
		prevPage: pagination.prevPage,
		shownCount: pagination.shownCount,

		// Selección
		selectedIds: selection.selectedIds,
		selectedSet: selection.selectedSet,
		activeId: selection.activeId,
		handleItemClick,
		handleItemDoubleClick,
		selectAll: selection.selectAll,
		clearSelection: selection.clearSelection,
		isSelected: selection.isSelected,
		isActive: selection.isActive,
		setActiveItem: selection.setActiveItem,

		// Navegación
		navigateToFolder,
		navigateToParent,
		folderId: folderId ?? null,
		parentFolderId: dataSource.parentFolderId,

		// Refs
		scrollContainerRef: dataSource.scrollContainerRef,
		containerRef,
		setScrollContainer,

		// Acciones
		refresh: dataSource.refresh,

		// Estados UI
		showPreloader,
		showEmptyState,
		showErrorState,
		shouldRenderContent,
	};
}

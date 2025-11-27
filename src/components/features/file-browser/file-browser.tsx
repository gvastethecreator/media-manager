import { RefreshCw } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { EmptyState } from '@/components/core/data-display';
import { Cards } from '@/components/features/file-browser/views/cards';
import { Grid } from '@/components/features/file-browser/views/grid';
import { FileCanvasGridGrouped } from '@/components/features/file-browser/views/grid-grouped';
import { List } from '@/components/features/file-browser/views/list';
import { FileCanvasListGrouped } from '@/components/features/file-browser/views/list-grouped';
import { Masonry } from '@/components/features/file-browser/views/masonry';
import { FileCanvasMasonryGrouped } from '@/components/features/file-browser/views/masonry-grouped';
import { Table } from '@/components/features/file-browser/views/table';
import { FileCanvasTableGrouped } from '@/components/features/file-browser/views/table-grouped';
import type { ImageItem } from '@/components/features/file-viewer';
import { useNavigation } from '@/components/navigation/hooks/navigation.utils';
import { useFolder } from '@/lib/api/folders';
import { cn } from '@/lib/utils';
import { useAudioStore } from '@/store/entities/audio';
import { useDocumentStore } from '@/store/entities/document';
import { useFile3DStore } from '@/store/entities/file-3d';
import { useImageStore } from '@/store/entities/image';
import { useJsonFileStore } from '@/store/entities/json-file/json-file.store';
import { useVideoStore } from '@/store/entities/video';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import { useSelectionStore } from '@/store/selection.store';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import type { AnyEntityWithStats } from '@/types/entities';
import { FileBrowserPreloader } from './components/file-browser-preloader';
import { FileBrowserToolbar } from './components/file-browser-toolbar';
import { FileListHeader } from './components/file-list-header';
import { LoadMoreButton } from './components/load-more-button';
import type { MediaItem } from './components/media-thumbnail';
import { StatusBar } from './components/status-bar';
import { useBrowserPagination } from './hooks/use-browser-pagination';
import { useBrowserStates } from './hooks/use-browser-states';
import { useProcessedItems } from './hooks/use-processed-items';
import { useProgressiveFolderFiles } from './hooks/use-progressive-folder-files';
import { useKeyboardNavigation } from './navigation/keyboard-navigation';
import type { ClickModifiers, FileBrowserProps } from './types/file-browser.types';
import { renderFromItems } from './utils/file-browser.renderers';
// Estilos de animación específicos para vistas Canvas
import './views/canvas/canvas-animations.css';
// Componente principal con filtro de carpeta
export function FileBrowserByFolder({ filterId, onItemClick, onItemDoubleClick }: FileBrowserProps) {
	// Configuración de infinite scroll
	const infiniteScroll = useViewOptionsStore((state) => state.infiniteScroll);

	const {
		items,
		isLoading,
		error,
		shouldShowPreloader,
		loadedCount,
		totalCount,
		hasMore,
		loadMore,
		isLoadingMore,
		scrollContainerRef,
		chunkSize,
		refetch,
	} = useProgressiveFolderFiles(filterId ?? null);

	// Estado para controlar loading del refresh
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Hook de navegación para manejar carpetas
	const { navigateToFolder } = useNavigation();

	// Datos de la carpeta actual para conocer su carpeta padre
	const { data: currentFolder } = useFolder(filterId || '');

	// Función de refresh que recarga los datos de la carpeta actual
	const handleRefresh = async () => {
		if (!filterId || isRefreshing) return;

		setIsRefreshing(true);
		try {
			// Obtener los stores necesarios
			const { fetchImages } = useImageStore.getState();
			const { fetchVideos } = useVideoStore.getState();
			const { fetchAudios } = useAudioStore.getState();
			const { fetchDocuments } = useDocumentStore.getState();
			const { fetchJsonFiles } = useJsonFileStore.getState();
			const { fetchFile3Ds } = useFile3DStore.getState();

			const refreshTasks: Promise<unknown>[] = [refetch()];
			refreshTasks.push(
				fetchImages({ folderId: filterId }),
				fetchVideos([filterId]),
				fetchAudios(),
				fetchDocuments(),
				fetchJsonFiles(),
				fetchFile3Ds()
			);

			// Recargar todos los tipos de archivos de la carpeta
			await Promise.allSettled(refreshTasks);
		} catch (error) {
			console.error('Error al refrescar:', error);
		} finally {
			setIsRefreshing(false);
		}
	};

	// View options (modo, tamaño, sort, búsqueda)
	const viewMode = useViewOptionsStore((s) => s.viewMode);
	const itemSize = useViewOptionsStore((s) => s.itemSize);
	const sortOptions = useViewOptionsStore((s) => s.sortOptions);
	const sortVersion = useViewOptionsStore((s) => s.sortVersion);
	const searchQuery = useViewOptionsStore((s) => s.searchQuery);
	const groupByType = useViewOptionsStore((s) => s.groupByEntityType);

	// Selección
	const toggleSelectedId = useSelectionStore((s) => s.toggleSelectedId);
	const setActiveId = useSelectionStore((s) => s.setActiveId);
	const setSelectedIds = useSelectionStore((s) => s.setSelectedIds);

	// Hook de procesamiento de items (búsqueda, sort, agrupación, etc.)
	const { baseItems, processedItems, nonSyntheticItems, grouped, linearItems, toolbarItemIds } = useProcessedItems({
		items: items as MediaItem[],
		searchQuery,
		sortOptions,
		parentId: currentFolder?.parentId,
		groupByType,
	});

	const resolvedLoadedCount = Math.max(loadedCount, nonSyntheticItems.length);
	const resolvedTotalCount =
		totalCount != null ? Math.max(totalCount, nonSyntheticItems.length) : nonSyntheticItems.length;
	const effectiveTotalCount = resolvedTotalCount;
	const isPaginatedView = ['grid', 'canvas', 'cards', 'masonry'].includes(viewMode);

	// Scroll container centralizado para integrarse con infinite scroll real
	const [scrollContainerEl, setScrollContainerEl] = useState<HTMLDivElement | null>(null);
	const handleScrollContainerReady = useCallback(
		(el: HTMLDivElement | null) => {
			if (scrollContainerRef.current !== el) {
				scrollContainerRef.current = el;
			}
			setScrollContainerEl((prev) => (prev === el ? prev : el));
		},
		[scrollContainerRef]
	);

	// Paginación global simple para vistas de grid/canvas
	const PAGE_SIZE = useViewOptionsStore((s) => s.pagination.pageSize) ?? 300;
	const backgroundColor = useViewOptionsStore((s) => s.backgroundColor) ?? 'transparent';

	const { page, setPage, totalPages, maxPageIndex, shownCount } = useBrowserPagination({
		totalCount: effectiveTotalCount,
		pageSize: PAGE_SIZE,
		isPaginatedView,
		filterId,
		searchQuery,
		sortVersion,
	});

	const handleNextPage = isPaginatedView ? () => setPage((p) => Math.min(maxPageIndex, p + 1)) : undefined;
	const handlePrevPage = isPaginatedView ? () => setPage((p) => Math.max(0, p - 1)) : undefined;

	// Hook de estados de renderizado (preloader, error, empty, content)
	const {
		hasRenderableItems,
		isIdle,
		isActivelyLoading,
		showPreloader,
		showErrorState,
		showEmptyState,
		hasBlockingState,
		shouldRenderContent,
	} = useBrowserStates({
		isLoading,
		isRefreshing,
		error,
		items: nonSyntheticItems,
		shouldShowPreloader,
	});

	const errorDescription = error ?? 'No se pudieron cargar los archivos.';
	const statusItems = nonSyntheticItems;

	// Ref para navegación por teclado
	const containerRef = useRef<HTMLDivElement>(null);

	// Visor de imágenes (fallback por defecto en doble click)
	const { openViewer } = useFileViewerStore();

	// Helper para mapear MediaItem -> ImageItem esperado por el visor
	const toImageItem = (mi: MediaItem): ImageItem => ({
		id: mi.id,
		name: mi.name,
		type: 'image',
		path: (mi as any).path || '',
		size: (mi as any).size ?? 0,
		width: (mi as any).width ?? null,
		height: (mi as any).height ?? null,
		thumbnail: (mi as any).thumbnailUrl ?? null,
		metadata: null,
	});

	const handleItemClick = (item: MediaItem, modifiers?: ClickModifiers) => {
		// Si es una carpeta, navegar a ella directamente
		if (item.entityType === 'folder') {
			navigateToFolder(item.id);
			return;
		}

		const mods = modifiers ?? { ctrlKey: false, metaKey: false, shiftKey: false };
		const isToggle = mods.ctrlKey || mods.metaKey;
		const isRange = mods.shiftKey;
		const allIds = linearItems.map((it) => it.id);
		const { selectedIds: currentSelectedIds, activeId: storeActive } = useSelectionStore.getState();
		if (isRange && currentSelectedIds.length > 0 && storeActive) {
			const activeId = storeActive as string;
			const start = allIds.indexOf(activeId);
			const end = allIds.indexOf(item.id);
			if (start !== -1 && end !== -1) {
				const [from, to] = start <= end ? [start, end] : [end, start];
				const rangeIds = allIds.slice(from, to + 1);
				setSelectedIds(rangeIds);
				setActiveId(item.id);
			} else {
				setSelectedIds([item.id]);
				setActiveId(item.id);
			}
		} else if (isToggle) {
			toggleSelectedId(item.id);
			setActiveId(item.id);
		} else {
			// click simple: selección única
			setSelectedIds([item.id]);
			setActiveId(item.id);
		}
		onItemClick?.(item as AnyEntityWithStats);
	};

	const handleItemDoubleClick = (item: MediaItem) => {
		// Si es una carpeta, navegar a ella
		if (item.entityType === 'folder') {
			navigateToFolder(item.id);
			return;
		}

		// Si el padre provee manejador, delegar completamente
		if (onItemDoubleClick) {
			onItemDoubleClick(item as unknown as AnyEntityWithStats);
			return;
		}

		// Fallback por defecto: abrir visor sólo para imágenes
		if (item.entityType === 'image') {
			const imageItems = (linearItems as MediaItem[]).filter((it) => it.entityType === 'image');
			const initialIndex = imageItems.findIndex((it) => it.id === item.id);
			if (imageItems.length > 0 && initialIndex >= 0) {
				openViewer(imageItems.map(toImageItem), initialIndex);
			}
		}
	};

	// Hook de navegación por teclado
	useKeyboardNavigation({
		items: processedItems as MediaItem[],
		onItemClick: handleItemClick,
		onItemDoubleClick: handleItemDoubleClick,
		containerRef,
		viewMode,
		disabled: isLoading || !!error || processedItems.length === 0,
	});

	// Estilos base para ajustar tamaños de tarjeta
	const effectiveItemSize = viewMode === 'cards' ? Math.max(120, itemSize) : itemSize;

	const hasViewportMounted = true; // todas las vistas rinden un viewport con data-testid

	return (
		<section
			aria-label="Explorador de archivos - use las flechas para navegar, Enter para abrir, Escape para cerrar"
			className={cn('flex h-full min-h-[200px] flex-col overflow-hidden')}
			data-ready="true"
			data-testid="file-browser"
			data-view-mode={viewMode}
			data-viewport-ready={hasViewportMounted ? 'true' : 'false'}
			ref={containerRef} // Focusable programáticamente pero no por tab
			style={{ backgroundColor }}
			tabIndex={-1}
		>
			{/* Toolbar del File Browser */}
			<FileBrowserToolbar allItemIds={toolbarItemIds} isLoading={isActivelyLoading} onRefresh={handleRefresh} />
			<div className="relative flex h-full min-h-0 flex-col" data-testid="file-browser-container">
				{error && (
					<div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-2">
						<div className="rounded-md bg-destructive/80 px-2 py-1 text-destructive-foreground text-xs">
							Error cargando datos
						</div>
					</div>
				)}

				{showPreloader && (
					<div className="flex flex-1 flex-col">
						<FileBrowserPreloader
							className="flex-1"
							isLoading={true}
							itemCount={resolvedLoadedCount}
							itemSize={effectiveItemSize}
							viewMode={viewMode}
						/>
					</div>
				)}

				{showErrorState && (
					<div className="flex flex-1 flex-col items-center justify-center p-6">
						<EmptyState description={errorDescription} icon={RefreshCw} title="Error al cargar" />
					</div>
				)}

				{showEmptyState && (
					<div className="flex flex-1 flex-col items-center justify-center p-6">
						<EmptyState
							description="No se encontraron archivos en esta carpeta."
							icon={RefreshCw}
							title="Sin archivos"
						/>
					</div>
				)}

				{shouldRenderContent && (
					<div className="flex h-full min-h-0 flex-col">
						{viewMode === 'list' ? (
							<div className="flex h-full min-h-0 flex-col">
								<FileListHeader />
								<div className="min-h-0 flex-1 overflow-hidden">
									{grouped ? (
										<FileCanvasListGrouped
											groups={grouped as any}
											onContainerReady={handleScrollContainerReady}
											onItemClick={handleItemClick}
											onItemDoubleClick={handleItemDoubleClick}
											scrollContainer={scrollContainerEl}
										/>
									) : (
										<List
											items={processedItems as MediaItem[]}
											onContainerReady={handleScrollContainerReady}
											onItemClick={handleItemClick}
											onItemDoubleClick={handleItemDoubleClick}
											scrollContainer={scrollContainerEl}
										/>
									)}
								</div>
							</div>
						) : viewMode === 'masonry' ? (
							<div className="h-full min-h-0 overflow-hidden">
								{grouped ? (
									<FileCanvasMasonryGrouped
										groups={grouped as any}
										onContainerReady={handleScrollContainerReady}
										onItemClick={handleItemClick}
										onItemDoubleClick={handleItemDoubleClick}
										scrollContainer={scrollContainerEl}
									/>
								) : (
									<Masonry
										items={processedItems as MediaItem[]}
										onContainerReady={handleScrollContainerReady}
										onItemClick={handleItemClick}
										onItemDoubleClick={handleItemDoubleClick}
										page={page}
										pageSize={PAGE_SIZE}
										scrollContainer={scrollContainerEl}
									/>
								)}
							</div>
						) : viewMode === 'table' ? (
							<div className="h-full min-h-0 overflow-hidden">
								{grouped ? (
									<FileCanvasTableGrouped
										groups={grouped as any}
										onContainerReady={handleScrollContainerReady}
										onItemClick={handleItemClick}
										onItemDoubleClick={handleItemDoubleClick}
										scrollContainer={scrollContainerEl}
									/>
								) : (
									<Table
										items={processedItems as MediaItem[]}
										onContainerReady={handleScrollContainerReady}
										onItemClick={handleItemClick}
										onItemDoubleClick={handleItemDoubleClick}
										scrollContainer={scrollContainerEl}
									/>
								)}
							</div>
						) : viewMode === 'cards' ? (
							<div className="h-full min-h-0 overflow-hidden">
								{grouped ? (
									<FileCanvasGridGrouped
										groups={grouped as any}
										onContainerReady={handleScrollContainerReady}
										onItemClick={handleItemClick}
										onItemDoubleClick={handleItemDoubleClick}
										scrollContainer={scrollContainerEl}
									/>
								) : (
									<Cards
										items={processedItems as MediaItem[]}
										onContainerReady={handleScrollContainerReady}
										onItemClick={handleItemClick}
										onItemDoubleClick={handleItemDoubleClick}
										page={page}
										pageSize={PAGE_SIZE}
										scrollContainer={scrollContainerEl}
									/>
								)}
							</div>
						) : viewMode === 'canvas' ? (
							<div className="h-full min-h-0 overflow-hidden">
								<Grid
									itemSize={itemSize}
									items={processedItems as MediaItem[]}
									onContainerReady={handleScrollContainerReady}
									onItemClick={handleItemClick}
									onItemDoubleClick={handleItemDoubleClick}
									page={page}
									pageSize={PAGE_SIZE}
									scrollContainer={scrollContainerEl}
								/>
							</div>
						) : (
							<div className="h-full min-h-0 overflow-hidden">
								{grouped ? (
									<FileCanvasGridGrouped
										groups={grouped as any}
										onContainerReady={handleScrollContainerReady}
										onItemClick={handleItemClick}
										onItemDoubleClick={handleItemDoubleClick}
										scrollContainer={scrollContainerEl}
									/>
								) : (
									<Grid
										itemSize={effectiveItemSize}
										items={processedItems as MediaItem[]}
										onContainerReady={handleScrollContainerReady}
										onItemClick={handleItemClick}
										onItemDoubleClick={handleItemDoubleClick}
										page={page}
										pageSize={PAGE_SIZE}
										scrollContainer={scrollContainerEl}
									/>
								)}
							</div>
						)}
					</div>
				)}
			</div>

			{!(infiniteScroll.enabled && infiniteScroll.autoLoad) && shouldRenderContent && (
				<LoadMoreButton
					chunkSize={chunkSize}
					hasMore={hasMore}
					isLoadingMore={isLoadingMore}
					loadedCount={resolvedLoadedCount}
					loadMore={loadMore}
					totalCount={resolvedTotalCount}
				/>
			)}

			<StatusBar
				isLoading={isActivelyLoading}
				items={statusItems}
				onNextPage={handleNextPage}
				onPrevPage={handlePrevPage}
				onRefresh={handleRefresh}
				page={isPaginatedView ? page : undefined}
				pageCount={isPaginatedView ? totalPages : undefined}
				shownCount={shownCount}
			/>
		</section>
	);
}

// Props basadas en datos directos (compatibilidad vistas que proveen items)
export interface FileBrowserDataProps {
	className?: string;
	items: AnyEntityWithStats[];
	isLoading?: boolean;
	onItemClick?: (item: AnyEntityWithStats) => void;
	onItemDoubleClick?: (item: AnyEntityWithStats) => void;
}

// Componente unificado: acepta props de datos o de carpeta
export function FileBrowser(props: FileBrowserDataProps | FileBrowserProps) {
	if ('items' in props) {
		return renderFromItems(props);
	}
	return FileBrowserByFolder(props);
}

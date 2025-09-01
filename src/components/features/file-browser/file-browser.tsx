import { RefreshCw } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
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
import { cn } from '@/lib/utils';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import type { AnyEntityWithStats } from '@/types/entities';
import { FileListHeader } from './components/file-list-header';
import type { MediaItem } from './components/media-thumbnail';
import { StatusBar } from './components/status-bar';
// Estilos de animación específicos para vistas Canvas
import './views/canvas/canvas-animations.css';
import type { ImageItem } from '@/components/features/file-viewer/file-viewer';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import { useProgressiveFolderFiles } from './hooks/use-progressive-folder-files';
import { useKeyboardNavigation } from './navigation/keyboard-navigation';
import type { ClickModifiers, FileBrowserProps } from './types/file-browser.types';

function applySearch(items: MediaItem[], query: string) {
	if (!query) return items;
	const q = query.toLowerCase();
	return items.filter((it) => (it.name || '').toLowerCase().includes(q));
}

function applySort(items: MediaItem[], sortOptions: { field: string; direction: 'asc' | 'desc' }[]) {
	if (!sortOptions || sortOptions.length === 0) return items;
	const [{ field, direction }] = sortOptions; // exclusivo por toolbar
	const dir = direction === 'asc' ? 1 : -1;
	const copy = [...items];
	copy.sort((a: any, b: any) => {
		const av = a?.[field] ?? '';
		const bv = b?.[field] ?? '';
		if (av === bv) return 0;
		if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
		const as = String(av).toLowerCase();
		const bs = String(bv).toLowerCase();
		return as < bs ? -1 * dir : 1 * dir;
	});
	return copy;
}

function groupByEntityType(items: MediaItem[]): Array<{ key: string; items: MediaItem[]; displayName: string }> {
	const map = new Map<string, MediaItem[]>();
	const displayNames = {
		image: 'Imágenes',
		video: 'Videos',
		audio: 'Audio',
		document: 'Documentos',
		json: 'Archivos JSON',
		file3d: 'Archivos 3D',
	};

	for (const item of items) {
		const type = item.entityType;
		const arr = map.get(type) ?? [];
		arr.push(item);
		map.set(type, arr);
	}

	// Orden específico para los tipos
	const typeOrder = ['image', 'video', 'audio', 'document', 'json', 'file3d'];

	return typeOrder
		.filter((type) => map.has(type))
		.map((type) => ({
			key: type,
			items: map.get(type) ?? [],
			displayName: displayNames[type as keyof typeof displayNames] || type,
		}));
}
// Componente principal con filtro de carpeta
export function FileBrowserByFolder({ filterId, onItemClick, onItemDoubleClick }: FileBrowserProps) {
	const { items, isLoading, error, shouldShowPreloader, loadedCount } = useProgressiveFolderFiles(filterId ?? null);

	// View options (modo, tamaño, sort, búsqueda)
	const viewMode = useViewOptionsStore((s) => s.viewMode);
	const useCanvasRendering = useViewOptionsStore((s) => s.useCanvasRendering);
	const itemSize = useViewOptionsStore((s) => s.itemSize);
	const sortOptions = useViewOptionsStore((s) => s.sortOptions);
	const searchQuery = useViewOptionsStore((s) => s.searchQuery);
	const groupByType = useViewOptionsStore((s) => s.groupByEntityType);

	// Selección
	const toggleSelectedId = useSelectionStore((s) => s.toggleSelectedId);
	const setActiveId = useSelectionStore((s) => s.setActiveId);
	const setSelectedIds = useSelectionStore((s) => s.setSelectedIds);

	const processedItems = useMemo(() => {
		const searched = applySearch(items as MediaItem[], searchQuery);
		const sorted = applySort(searched, sortOptions);
		return sorted;
	}, [items, searchQuery, sortOptions]);

	const grouped = useMemo(
		() => (groupByType ? groupByEntityType(processedItems as MediaItem[]) : null),
		[groupByType, processedItems]
	);

	// Scroll parents como callback refs para asegurar elemento real
	const [listScrollEl, setListScrollEl] = useState<HTMLDivElement | null>(null);
	const [gridScrollEl, setGridScrollEl] = useState<HTMLDivElement | null>(null);
	const [tableScrollEl, setTableScrollEl] = useState<HTMLDivElement | null>(null);
	const [cardsScrollEl, setCardsScrollEl] = useState<HTMLDivElement | null>(null);

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
		const mods = modifiers ?? { ctrlKey: false, metaKey: false, shiftKey: false };
		const isToggle = mods.ctrlKey || mods.metaKey;
		const isRange = mods.shiftKey;
		const allIds = (grouped ? grouped.flatMap((g) => g.items) : processedItems).map((it) => it.id);
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
		// Si el padre provee manejador, delegar completamente
		if (onItemDoubleClick) {
			onItemDoubleClick(item as unknown as AnyEntityWithStats);
			return;
		}

		// Fallback por defecto: abrir visor sólo para imágenes
		if (item.entityType === 'image') {
			const allDisplayed = (grouped ? grouped.flatMap((g) => g.items) : processedItems) as MediaItem[];
			const imageItems = allDisplayed.filter((it) => it.entityType === 'image');
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

	// Estilos de grid dependientes del tamaño (cards usa tamaño un poco mayor por defecto)
	const effectiveItemSize = viewMode === 'cards' ? Math.max(120, itemSize) : itemSize;
	// Grid: mínimo 4 columnas; Cards se maneja con su propio componente - MEMOIZADO
	const gridStyle: React.CSSProperties = useMemo(
		() =>
			viewMode === 'grid'
				? { gridTemplateColumns: 'repeat(4, 1fr)' }
				: { gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(80, effectiveItemSize)}px, 1fr))` },
		[viewMode, effectiveItemSize]
	);

	return (
		<section
			aria-label="Explorador de archivos - use las flechas para navegar, Enter para abrir, Escape para cerrar"
			className={cn('flex h-full min-h-0 flex-col overflow-hidden')}
			data-testid="file-browser"
			data-view-mode={viewMode}
			ref={containerRef} // Focusable programáticamente pero no por tab
			tabIndex={-1}
		>
			<div className="flex h-full min-h-0 flex-col" data-testid="file-browser-container">
				{/* Overlays no bloqueantes para loading/error solo si hay error */}
				{error && (
					<div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-2">
						<div className="rounded-md bg-destructive/80 px-2 py-1 text-destructive-foreground text-xs">
							Error cargando datos
						</div>
					</div>
				)}
				{viewMode === 'list' ? (
					<div className="flex h-full min-h-0 flex-col">
						<FileListHeader />
						<div
							className="min-h-0 flex-1 overflow-auto"
							data-testid="file-browser-scroll-area-viewport"
							ref={setListScrollEl}
						>
							{grouped ? (
								<FileCanvasListGrouped
									groups={grouped as any}
									onItemClick={handleItemClick}
									onItemDoubleClick={handleItemDoubleClick}
									scrollContainer={listScrollEl}
								/>
							) : (
								<List
									items={processedItems as MediaItem[]}
									onItemClick={handleItemClick}
									onItemDoubleClick={handleItemDoubleClick}
									scrollContainer={listScrollEl}
								/>
							)}
						</div>
					</div>
				) : viewMode === 'masonry' ? (
					<div className="h-full min-h-0 overflow-hidden">
						{grouped ? (
							<FileCanvasMasonryGrouped
								groups={grouped as any}
								onItemClick={handleItemClick}
								onItemDoubleClick={handleItemDoubleClick}
							/>
						) : (
							<Masonry
								items={processedItems as MediaItem[]}
								onItemClick={handleItemClick}
								onItemDoubleClick={handleItemDoubleClick}
							/>
						)}
					</div>
				) : viewMode === 'table' ? (
					<div className="h-full min-h-0 overflow-hidden">
						{grouped ? (
							<FileCanvasTableGrouped
								groups={grouped as any}
								onItemClick={handleItemClick}
								onItemDoubleClick={handleItemDoubleClick}
							/>
						) : (
							<Table
								items={processedItems as MediaItem[]}
								onItemClick={handleItemClick}
								onItemDoubleClick={handleItemDoubleClick}
							/>
						)}
					</div>
				) : viewMode === 'cards' ? (
					<div className="h-full min-h-0 overflow-hidden">
						{grouped ? (
							<FileCanvasGridGrouped
								groups={grouped as any}
								onItemClick={handleItemClick}
								onItemDoubleClick={handleItemDoubleClick}
							/>
						) : (
							<Cards
								items={processedItems as MediaItem[]}
								onItemClick={handleItemClick}
								onItemDoubleClick={handleItemDoubleClick}
							/>
						)}
					</div>
				) : viewMode === 'canvas' ? (
					<div className="h-full min-h-0 overflow-hidden">
						<Grid
							itemSize={itemSize}
							items={processedItems as MediaItem[]}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
						/>
					</div>
				) : (
					<div className="h-full min-h-0 overflow-hidden">
						{grouped ? (
							<FileCanvasGridGrouped
								groups={grouped as any}
								onItemClick={handleItemClick}
								onItemDoubleClick={handleItemDoubleClick}
							/>
						) : (
							<Grid
								itemSize={effectiveItemSize}
								items={processedItems as MediaItem[]}
								onItemClick={handleItemClick}
								onItemDoubleClick={handleItemDoubleClick}
							/>
						)}
					</div>
				)}
			</div>
			<StatusBar items={processedItems as MediaItem[]} />
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

function renderFromItems({
	className,
	items,
	isLoading = false,
	onItemClick,
	onItemDoubleClick,
}: FileBrowserDataProps) {
	// Admitir mezcla de imágenes y videos
	const mediaItems = items as unknown as MediaItem[];

	const viewMode = useViewOptionsStore((s) => s.viewMode);
	const itemSize = useViewOptionsStore((s) => s.itemSize);
	const sortOptions = useViewOptionsStore((s) => s.sortOptions);
	const searchQuery = useViewOptionsStore((s) => s.searchQuery);

	const toggleSelectedId = useSelectionStore((s) => s.toggleSelectedId);
	const setActiveId = useSelectionStore((s) => s.setActiveId);
	const setSelectedIds = useSelectionStore((s) => s.setSelectedIds);

	const processedItems = useMemo(() => {
		const searched = applySearch(mediaItems, searchQuery);
		const sorted = applySort(searched, sortOptions);
		return sorted;
	}, [mediaItems, searchQuery, sortOptions]);

	if (isLoading) {
		return (
			<div
				className={cn('flex h-full flex-col items-center justify-center gap-4', className)}
				data-testid="file-browser"
			>
				<EmptyState description="Cargando archivos..." icon={RefreshCw} title="Cargando" />
			</div>
		);
	}

	const handleItemClick = (item: MediaItem, modifiers?: ClickModifiers) => {
		const mods = modifiers ?? { ctrlKey: false, metaKey: false, shiftKey: false };
		const isToggle = mods.ctrlKey || mods.metaKey;
		const isRange = mods.shiftKey;
		const allIds = processedItems.map((it) => it.id);
		const { selectedIds: currentSelectedIds, activeId } = useSelectionStore.getState();
		if (isRange && currentSelectedIds.length > 0 && activeId) {
			const start = allIds.indexOf(activeId as string);
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
			setSelectedIds([item.id]);
			setActiveId(item.id);
		}
		onItemClick?.(item as unknown as AnyEntityWithStats);
	};

	// Visor de imágenes (fallback por defecto en doble click)
	const { openViewer } = useFileViewerStore();
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

	const handleItemDoubleClick = (item: MediaItem) => {
		if (onItemDoubleClick) {
			onItemDoubleClick(item as AnyEntityWithStats);
			return;
		}
		if (item.entityType === 'image') {
			const imageItems = processedItems.filter((it) => it.entityType === 'image');
			const initialIndex = imageItems.findIndex((it) => it.id === item.id);
			if (imageItems.length > 0 && initialIndex >= 0) {
				openViewer(imageItems.map(toImageItem), initialIndex);
			}
		}
	};
	const effectiveItemSize = viewMode === 'cards' ? Math.max(120, itemSize) : itemSize;
	const gridStyle: React.CSSProperties = useMemo(
		() =>
			viewMode === 'grid'
				? { gridTemplateColumns: 'repeat(4, 1fr)' }
				: { gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(80, effectiveItemSize)}px, 1fr))` },
		[viewMode, effectiveItemSize]
	);

	return (
		<section
			aria-label="Explorador de archivos"
			className={cn('flex h-full min-h-0 flex-col overflow-hidden', className)}
			data-testid="file-browser"
			data-view-mode={viewMode}
			tabIndex={-1}
		>
			<div className="flex h-full min-h-0 flex-col" data-testid="file-browser-container">
				{viewMode === 'list' ? (
					<div className="flex h-full min-h-0 flex-col">
						<FileListHeader />
						<div className="min-h-0 flex-1">
							<List
								items={processedItems as MediaItem[]}
								onItemClick={handleItemClick}
								onItemDoubleClick={handleItemDoubleClick}
							/>
						</div>
					</div>
				) : viewMode === 'masonry' ? (
					<div className="h-full min-h-0 overflow-hidden">
						<Masonry
							items={processedItems as MediaItem[]}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
						/>
					</div>
				) : viewMode === 'table' ? (
					<div className="h-full min-h-0 overflow-hidden">
						<Table
							items={processedItems as MediaItem[]}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
						/>
					</div>
				) : viewMode === 'cards' ? (
					<div className="h-full min-h-0 overflow-hidden">
						<Cards
							items={processedItems as MediaItem[]}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
						/>
					</div>
				) : viewMode === 'canvas' ? (
					<div className="h-full min-h-0 overflow-hidden">
						<Grid
							itemSize={itemSize}
							items={processedItems as MediaItem[]}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
						/>
					</div>
				) : (
					<div className="h-full min-h-0 overflow-hidden">
						<Grid
							itemSize={effectiveItemSize}
							items={processedItems as MediaItem[]}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
						/>
					</div>
				)}
			</div>
			<StatusBar items={processedItems as MediaItem[]} />
		</section>
	);
}

// Componente unificado: acepta props de datos o de carpeta
export function FileBrowser(props: FileBrowserDataProps | FileBrowserProps) {
	if ('items' in props) {
		return renderFromItems(props);
	}
	return FileBrowserByFolder(props);
}

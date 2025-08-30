import { RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/core/data-display';
import { cn } from '@/lib/utils';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import type { AnyEntityWithStats } from '@/types/entities';
import { FileCanvas } from './components/canvas/file-canvas';
import { FileCards } from './components/file-cards';
import FileGrid from './components/file-grid';
import { FileList } from './components/file-list';
import { FileListHeader } from './components/file-list-header';
import { FileMasonry } from './components/file-masonry';
import { FileSingle } from './components/file-single';
import { FileTable } from './components/file-table';
import type { MediaItem } from './components/media-thumbnail';
import { useFolderFiles } from './hooks/use-folder-files';
import type { ClickModifiers, FileBrowser2Props } from './types/file-browser.types';

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
export function FileBrowser2({ filterId, onItemClick, onItemDoubleClick }: FileBrowser2Props) {
	const { items, isLoading, error } = useFolderFiles(filterId);

	// View options (modo, tamaño, sort, búsqueda)
	const viewMode = useViewOptionsStore((s) => s.viewMode);
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

	// Nota importante:
	// En lugar de devolver temprano en loading/error, renderizamos siempre la estructura de vistas
	// para garantizar la presencia de los contenedores con data-testid (grid-view/cards-view/etc.).
	// Esto hace que los tests E2E puedan esperar de forma determinista a que aparezcan los ítems,
	// mientras el store termina de poblarse. Mostramos un overlay discreto si hay loading/error.

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
		onItemClick?.(item as unknown as AnyEntityWithStats);
	};

	const handleItemDoubleClick = (item: MediaItem) => {
		onItemDoubleClick?.(item as unknown as AnyEntityWithStats);
	};

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
		<div
			className={cn('flex h-full min-h-0 flex-col overflow-hidden')}
			data-testid="file-browser"
			data-view-mode={viewMode}
		>
			<div className="flex h-full min-h-0 flex-col" data-testid="file-browser-container">
				{/* Overlays no bloqueantes para loading/error */}
				{(isLoading || error) && (
					<div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-2">
						<div className="rounded-md bg-secondary/80 px-2 py-1 text-muted-foreground text-xs">
							{error ? 'Error cargando datos' : 'Cargando…'}
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
								<div className="flex flex-col gap-2">
									{grouped.map((g: { key: string; items: MediaItem[]; displayName: string }) => (
										<div className="flex flex-col" key={g.key}>
											<div className="sticky top-0 z-10 bg-background/80 p-2 font-semibold text-muted-foreground text-xs uppercase backdrop-blur supports-[backdrop-filter]:bg-background/60">
												{g.displayName}
											</div>
											<FileList
												items={g.items as MediaItem[]}
												key={`list-grouped-${g.key}`}
												onItemClick={handleItemClick}
												onItemDoubleClick={handleItemDoubleClick}
												scrollParent={listScrollEl ?? undefined}
											/>
										</div>
									))}
								</div>
							) : (
								<FileList
									items={processedItems as MediaItem[]}
									key="list-normal"
									onItemClick={handleItemClick}
									onItemDoubleClick={handleItemDoubleClick}
									scrollParent={listScrollEl ?? undefined}
									virtuosoKey={`list-normal-${Boolean(listScrollEl)}`}
								/>
							)}
						</div>
					</div>
				) : viewMode === 'single' ? (
					<div className="h-full min-h-0">
						<FileSingle
							items={processedItems as MediaItem[]}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
						/>
					</div>
				) : viewMode === 'masonry' ? (
					<div className="h-full min-h-0">
						{grouped ? (
							<div className="h-full overflow-auto" data-testid="file-browser-scroll-area-viewport">
								<div className="flex flex-col gap-2">
									{grouped.map((g: { key: string; items: MediaItem[]; displayName: string }) => (
										<div className="flex flex-col" key={g.key}>
											<div className="sticky top-0 z-10 bg-background/80 p-2 font-semibold text-muted-foreground text-xs uppercase backdrop-blur supports-[backdrop-filter]:bg-background/60">
												{g.displayName}
											</div>
											<FileMasonry
												items={g.items as MediaItem[]}
												key={`masonry-grouped-${g.key}`}
												onItemClick={handleItemClick}
												onItemDoubleClick={handleItemDoubleClick}
											/>
										</div>
									))}
								</div>
							</div>
						) : (
							<div className="h-full overflow-auto" data-testid="file-browser-scroll-area-viewport">
								<FileMasonry
									items={processedItems as MediaItem[]}
									key="masonry-normal"
									onItemClick={handleItemClick}
									onItemDoubleClick={handleItemDoubleClick}
								/>
							</div>
						)}
					</div>
				) : viewMode === 'table' ? (
					<div className="h-full min-h-0">
						{grouped ? (
							<div
								className="h-full overflow-auto"
								data-testid="file-browser-scroll-area-viewport"
								ref={setTableScrollEl}
							>
								<div className="flex flex-col gap-2">
									{grouped.map((g: { key: string; items: MediaItem[]; displayName: string }) => (
										<div className="flex flex-col" key={g.key}>
											<div className="sticky top-0 z-10 bg-background/80 p-2 font-semibold text-muted-foreground text-xs uppercase backdrop-blur supports-[backdrop-filter]:bg-background/60">
												{g.displayName}
											</div>
											<FileTable
												items={g.items as MediaItem[]}
												key={`table-grouped-${g.key}`}
												onItemClick={handleItemClick}
												onItemDoubleClick={handleItemDoubleClick}
												scrollParent={tableScrollEl ?? undefined}
												virtuosoKey={`table-grouped-${g.key}-${Boolean(tableScrollEl)}`}
											/>
										</div>
									))}
								</div>
							</div>
						) : (
							<div
								className="h-full overflow-auto"
								data-testid="file-browser-scroll-area-viewport"
								ref={setTableScrollEl}
							>
								<FileTable
									items={processedItems as MediaItem[]}
									key="table-normal"
									onItemClick={handleItemClick}
									onItemDoubleClick={handleItemDoubleClick}
									scrollParent={tableScrollEl ?? undefined}
									virtuosoKey={`table-normal-${Boolean(tableScrollEl)}`}
								/>
							</div>
						)}
					</div>
				) : viewMode === 'cards' ? (
					<div className="h-full min-h-0">
						{grouped ? (
							<div
								className="h-full overflow-auto"
								data-testid="file-browser-scroll-area-viewport"
								ref={setCardsScrollEl}
							>
								<div className="flex flex-col gap-2">
									{grouped.map((g: { key: string; items: MediaItem[]; displayName: string }) => (
										<div className="flex flex-col" key={g.key}>
											<div className="sticky top-0 z-10 bg-background/80 p-2 font-semibold text-muted-foreground text-xs uppercase backdrop-blur supports-[backdrop-filter]:bg-background/60">
												{g.displayName}
											</div>
											<FileCards
												items={g.items as MediaItem[]}
												key={`cards-grouped-${g.key}`}
												onItemClick={handleItemClick}
												onItemDoubleClick={handleItemDoubleClick}
												scrollParent={cardsScrollEl ?? undefined}
												virtuosoKey={`cards-grouped-${g.key}-${Boolean(cardsScrollEl)}`}
											/>
										</div>
									))}
								</div>
							</div>
						) : (
							<div
								className="h-full overflow-auto"
								data-testid="file-browser-scroll-area-viewport"
								ref={setCardsScrollEl}
							>
								<FileCards
									items={processedItems as MediaItem[]}
									key="cards-normal"
									onItemClick={handleItemClick}
									onItemDoubleClick={handleItemDoubleClick}
									scrollParent={cardsScrollEl ?? undefined}
									virtuosoKey={`cards-normal-${Boolean(cardsScrollEl)}`}
								/>
							</div>
						)}
					</div>
				) : viewMode === 'canvas' ? (
					<div className="h-full min-h-0">
						<FileCanvas
							itemSize={itemSize}
							items={processedItems as MediaItem[]}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
						/>
					</div>
				) : (
					<div className="h-full min-h-0">
						{grouped ? (
							<div
								className="h-full overflow-auto"
								data-testid="file-browser-scroll-area-viewport"
								ref={setGridScrollEl}
							>
								<div className="flex flex-col gap-2">
									{grouped.map((g: { key: string; items: MediaItem[]; displayName: string }) => (
										<div className="flex flex-col" key={g.key}>
											<div className="sticky top-0 z-10 bg-background/80 p-2 font-semibold text-muted-foreground text-xs uppercase backdrop-blur supports-[backdrop-filter]:bg-background/60">
												{g.displayName}
											</div>
											<FileGrid
												itemSize={effectiveItemSize}
												items={g.items as MediaItem[]}
												key={`grid-grouped-${g.key}`}
												onItemClick={handleItemClick}
												onItemDoubleClick={handleItemDoubleClick}
												scrollParent={gridScrollEl ?? undefined}
												style={gridStyle}
												viewMode={viewMode}
												virtuosoKey={`grid-grouped-${g.key}`}
											/>
										</div>
									))}
								</div>
							</div>
						) : (
							<div
								className="h-full overflow-auto"
								data-testid="file-browser-scroll-area-viewport"
								ref={setGridScrollEl}
							>
								<FileGrid
									itemSize={effectiveItemSize}
									items={processedItems as MediaItem[]}
									key="grid-normal"
									onItemClick={handleItemClick}
									onItemDoubleClick={handleItemDoubleClick}
									scrollParent={gridScrollEl ?? undefined}
									style={gridStyle}
									viewMode={viewMode}
									virtuosoKey="grid-normal"
								/>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
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

	const handleItemDoubleClick = (item: MediaItem) => {
		onItemDoubleClick?.(item as unknown as AnyEntityWithStats);
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
		<div
			className={cn('flex h-full min-h-0 flex-col overflow-hidden', className)}
			data-testid="file-browser"
			data-view-mode={viewMode}
		>
			<div className="flex h-full min-h-0 flex-col" data-testid="file-browser-container">
				{viewMode === 'list' ? (
					<div className="flex h-full min-h-0 flex-col">
						<FileListHeader />
						<div className="min-h-0 flex-1">
							<FileList
								items={processedItems as MediaItem[]}
								onItemClick={handleItemClick}
								onItemDoubleClick={handleItemDoubleClick}
							/>
						</div>
					</div>
				) : viewMode === 'single' ? (
					<div className="h-full min-h-0">
						<FileSingle
							items={processedItems as MediaItem[]}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
						/>
					</div>
				) : viewMode === 'masonry' ? (
					<div className="h-full min-h-0">
						<FileMasonry
							items={processedItems as MediaItem[]}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
						/>
					</div>
				) : viewMode === 'table' ? (
					<div className="h-full min-h-0">
						<FileTable
							items={processedItems as MediaItem[]}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
						/>
					</div>
				) : viewMode === 'cards' ? (
					<div className="h-full min-h-0">
						<FileCards
							items={processedItems as MediaItem[]}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
						/>
					</div>
				) : viewMode === 'canvas' ? (
					<div className="h-full min-h-0">
						<FileCanvas
							itemSize={itemSize}
							items={processedItems as MediaItem[]}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
						/>
					</div>
				) : (
					<div className="h-full min-h-0">
						<FileGrid
							itemSize={effectiveItemSize}
							items={processedItems as MediaItem[]}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
							style={gridStyle}
							viewMode={viewMode}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

// Componente unificado: acepta props de datos o de carpeta
export function FileBrowser(props: FileBrowserDataProps | FileBrowser2Props) {
	if ('items' in props) {
		return renderFromItems(props);
	}
	return FileBrowser2(props);
}

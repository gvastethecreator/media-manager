import { RefreshCw } from 'lucide-react';
import { useMemo } from 'react';
import { EmptyState } from '@/components/core/data-display';
import { cn } from '@/lib/utils';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import type { AnyEntityWithStats } from '@/types/entities';
import { FileCards } from './components/file-cards';
import FileGrid from './components/file-grid';
import { FileList } from './components/file-list';
import { FileListHeader } from './components/file-list-header';
import { FileMasonry } from './components/file-masonry';
import { FileSingle } from './components/file-single';
import { FileTable } from './components/file-table';
import type { MediaItem } from './components/media-thumbnail';
import { useFolderFiles } from './hooks/use-folder-files';
import type { FileBrowser2Props } from './types/file-browser.types';

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
	const groups = new Map<string, MediaItem[]>();

	const typeDisplayNames: Record<string, string> = {
		IMAGE: 'Imágenes',
		VIDEO: 'Videos',
		AUDIO: 'Audio',
		DOCUMENT: 'Documentos',
		JSON: 'JSON',
		FILE3D: 'Modelos 3D',
		WORKFLOW: 'Workflows',
		UNKNOWN: 'Otros',
	};

	for (const item of items) {
		const type = item.entityType || 'UNKNOWN';
		if (!groups.has(type)) {
			groups.set(type, []);
		}
		const arr = groups.get(type);
		if (arr) {
			arr.push(item);
		}
	}

	return Array.from(groups.entries()).map(([key, items]) => ({
		key,
		items,
		displayName: typeDisplayNames[key] || key,
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
	const selectedIds = useSelectionStore((s) => s.selectedIds);
	const toggleSelectedId = useSelectionStore((s) => s.toggleSelectedId);
	const setActiveId = useSelectionStore((s) => s.setActiveId);

	const processedItems = useMemo(() => {
		const searched = applySearch(items as MediaItem[], searchQuery);
		const sorted = applySort(searched, sortOptions);
		return sorted;
	}, [items, searchQuery, sortOptions]);

	const grouped = useMemo(() => {
		if (!groupByType) return null;
		const result = groupByEntityType(processedItems as MediaItem[]);
		console.log('🔍 [DEBUG] Agrupado por tipos:', {
			groupByType,
			processedItemsCount: processedItems?.length || 0,
			groups: result.map((g) => ({ key: g.key, displayName: g.displayName, itemsCount: g.items.length })),
		});
		return result;
	}, [groupByType, processedItems]);

	if (isLoading) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4" data-testid="file-browser">
				<EmptyState description="Cargando archivos..." icon={RefreshCw} title="Cargando" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4" data-testid="file-browser">
				<EmptyState description="Ocurrió un error al cargar los archivos." icon={RefreshCw} title="Error" />
			</div>
		);
	}

	const handleItemClick = (item: MediaItem) => {
		toggleSelectedId(item.id);
		setActiveId(item.id);
		onItemClick?.(item as unknown as AnyEntityWithStats);
	};

	const handleItemDoubleClick = (item: MediaItem) => {
		onItemDoubleClick?.(item as unknown as AnyEntityWithStats);
	};

	// Estilos de grid dependientes del tamaño (cards usa tamaño un poco mayor por defecto)
	const effectiveItemSize = viewMode === 'cards' ? Math.max(120, itemSize) : itemSize;
	// Grid: mínimo 4 columnas; Cards se maneja con su propio componente
	const gridStyle: React.CSSProperties =
		viewMode === 'grid'
			? { gridTemplateColumns: 'repeat(4, 1fr)' }
			: { gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(80, effectiveItemSize)}px, 1fr))` };

	return (
		<div className={cn('flex h-full min-h-0 flex-col overflow-hidden')} data-testid="file-browser">
			<div className="flex h-full min-h-0 flex-col" data-testid="file-browser-container">
				{viewMode === 'list' ? (
					<div className="flex h-full min-h-0 flex-col">
						<FileListHeader />
						<div className="min-h-0 flex-1">
							{grouped ? (
								<div className="flex h-full min-h-0 flex-col gap-2 overflow-auto">
									{grouped.map((g: { key: string; items: MediaItem[]; displayName: string }) => (
										<div className="flex flex-col" key={g.key}>
											<div className="sticky top-0 z-10 bg-background/80 p-2 font-semibold text-muted-foreground text-xs uppercase backdrop-blur supports-[backdrop-filter]:bg-background/60">
												{g.displayName}
											</div>
											<div className="flex h-full min-h-0 flex-col gap-2 overflow-auto">
												<FileList
													items={g.items as MediaItem[]}
													onItemClick={handleItemClick}
													onItemDoubleClick={handleItemDoubleClick}
													selectedIds={selectedIds}
												/>
											</div>
										</div>
									))}
								</div>
							) : (
								<FileList
									items={processedItems as MediaItem[]}
									onItemClick={handleItemClick}
									onItemDoubleClick={handleItemDoubleClick}
									selectedIds={selectedIds}
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
							selectedIds={selectedIds}
						/>
					</div>
				) : viewMode === 'masonry' ? (
					<div className="h-full min-h-0">
						{grouped ? (
							<div className="flex h-full min-h-0 flex-col gap-2 overflow-auto">
								{grouped.map((g: { key: string; items: MediaItem[]; displayName: string }) => (
									<div className="flex flex-col" key={g.key}>
										<div className="sticky top-0 z-10 bg-background/80 p-2 font-semibold text-muted-foreground text-xs uppercase backdrop-blur supports-[backdrop-filter]:bg-background/60">
											{g.displayName}
										</div>
										<FileMasonry
											items={g.items as MediaItem[]}
											onItemClick={handleItemClick}
											onItemDoubleClick={handleItemDoubleClick}
											selectedIds={selectedIds}
										/>
									</div>
								))}
							</div>
						) : (
							<FileMasonry
								items={processedItems as MediaItem[]}
								onItemClick={handleItemClick}
								onItemDoubleClick={handleItemDoubleClick}
								selectedIds={selectedIds}
							/>
						)}
					</div>
				) : viewMode === 'table' ? (
					<div className="h-full min-h-0">
						{grouped ? (
							<div className="flex h-full min-h-0 flex-col gap-2 overflow-auto">
								{grouped.map((g: { key: string; items: MediaItem[]; displayName: string }) => (
									<div className="flex flex-col" key={g.key}>
										<div className="sticky top-0 z-10 bg-background/80 p-2 font-semibold text-muted-foreground text-xs uppercase backdrop-blur supports-[backdrop-filter]:bg-background/60">
											{g.displayName}
										</div>
										<div className="flex h-full min-h-0 flex-col gap-2 overflow-auto">
											<FileTable
												items={g.items as MediaItem[]}
												onItemClick={handleItemClick}
												onItemDoubleClick={handleItemDoubleClick}
												selectedIds={selectedIds}
											/>
										</div>
									</div>
								))}
							</div>
						) : (
							<FileTable
								items={processedItems as MediaItem[]}
								onItemClick={handleItemClick}
								onItemDoubleClick={handleItemDoubleClick}
								selectedIds={selectedIds}
							/>
						)}
					</div>
				) : viewMode === 'cards' ? (
					<div className="h-full min-h-0">
						{grouped ? (
							<div className="flex h-full min-h-0 flex-col gap-2 overflow-auto">
								{grouped.map((g: { key: string; items: MediaItem[]; displayName: string }) => (
									<div className="flex flex-col" key={g.key}>
										<div className="sticky top-0 z-10 bg-background/80 p-2 font-semibold text-muted-foreground text-xs uppercase backdrop-blur supports-[backdrop-filter]:bg-background/60">
											{g.displayName}
										</div>
										<div className="flex h-full min-h-0 flex-col gap-2 overflow-auto">
											<FileCards
												items={g.items as MediaItem[]}
												onItemClick={handleItemClick}
												onItemDoubleClick={handleItemDoubleClick}
												selectedIds={selectedIds}
											/>
										</div>
									</div>
								))}
							</div>
						) : (
							<FileCards
								items={processedItems as MediaItem[]}
								onItemClick={handleItemClick}
								onItemDoubleClick={handleItemDoubleClick}
								selectedIds={selectedIds}
							/>
						)}
					</div>
				) : (
					<div className="h-full min-h-0">
						{grouped ? (
							<div className="flex h-full min-h-0 w-full flex-col gap-2 overflow-auto">
								{grouped.map((g: { key: string; items: MediaItem[]; displayName: string }) => {
									console.log('[FileBrowser] Rendering group:', {
										key: g.key,
										displayName: g.displayName,
										itemsCount: g.items.length,
										items: g.items.slice(0, 3).map((i) => ({ id: i.id, name: i.name, entityType: i.entityType })),
									});
									return (
										<div className="flex w-full flex-col" key={g.key}>
											<div className="sticky top-0 z-10 bg-background/80 p-2 font-semibold text-muted-foreground text-xs uppercase backdrop-blur supports-[backdrop-filter]:bg-background/60">
												{g.displayName}
											</div>
											<div className="flex h-full min-h-0 flex-col gap-2 overflow-auto">
												<FileGrid
													itemSize={effectiveItemSize}
													items={g.items as MediaItem[]}
													onItemClick={handleItemClick}
													onItemDoubleClick={handleItemDoubleClick}
													selectedIds={selectedIds}
													style={gridStyle}
													viewMode={viewMode}
												/>
											</div>
										</div>
									);
								})}
							</div>
						) : (
							<FileGrid
								itemSize={effectiveItemSize}
								items={processedItems as MediaItem[]}
								onItemClick={handleItemClick}
								onItemDoubleClick={handleItemDoubleClick}
								selectedIds={selectedIds}
								style={gridStyle}
								viewMode={viewMode}
							/>
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

	const selectedIds = useSelectionStore((s) => s.selectedIds);
	const toggleSelectedId = useSelectionStore((s) => s.toggleSelectedId);
	const setActiveId = useSelectionStore((s) => s.setActiveId);

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

	const handleItemClick = (item: MediaItem) => {
		toggleSelectedId(item.id);
		setActiveId(item.id);
		onItemClick?.(item as unknown as AnyEntityWithStats);
	};

	const handleItemDoubleClick = (item: MediaItem) => {
		onItemDoubleClick?.(item as unknown as AnyEntityWithStats);
	};

	const effectiveItemSize = viewMode === 'cards' ? Math.max(120, itemSize) : itemSize;
	const gridStyle: React.CSSProperties =
		viewMode === 'grid'
			? { gridTemplateColumns: 'repeat(4, 1fr)' }
			: { gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(80, effectiveItemSize)}px, 1fr))` };

	return (
		<div className={cn('flex h-full min-h-0 flex-col overflow-hidden', className)} data-testid="file-browser">
			<div className="flex h-full min-h-0 flex-col" data-testid="file-browser-container">
				{viewMode === 'list' ? (
					<div className="flex h-full min-h-0 flex-col">
						<FileListHeader />
						<div className="min-h-0 flex-1">
							<FileList
								items={processedItems as MediaItem[]}
								onItemClick={handleItemClick}
								onItemDoubleClick={handleItemDoubleClick}
								selectedIds={selectedIds}
							/>
						</div>
					</div>
				) : viewMode === 'single' ? (
					<div className="h-full min-h-0">
						<FileSingle
							items={processedItems as MediaItem[]}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
							selectedIds={selectedIds}
						/>
					</div>
				) : viewMode === 'masonry' ? (
					<div className="h-full min-h-0">
						<FileMasonry
							items={processedItems as MediaItem[]}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
							selectedIds={selectedIds}
						/>
					</div>
				) : viewMode === 'table' ? (
					<div className="h-full min-h-0">
						<FileTable
							items={processedItems as MediaItem[]}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
							selectedIds={selectedIds}
						/>
					</div>
				) : viewMode === 'cards' ? (
					<div className="h-full min-h-0">
						<FileCards
							items={processedItems as MediaItem[]}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
							selectedIds={selectedIds}
						/>
					</div>
				) : (
					<div className="h-full min-h-0">
						<FileGrid
							itemSize={effectiveItemSize}
							items={processedItems as MediaItem[]}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
							selectedIds={selectedIds}
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

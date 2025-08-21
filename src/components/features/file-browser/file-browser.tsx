import { RefreshCw } from 'lucide-react';
import { useMemo } from 'react';
import { EmptyState } from '@/components/core/data-display';
import { cn } from '@/lib/utils';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import type { ImageWithStats } from '@/types/entities/image';
import type { AnyEntityWithStats } from '@/types/migration';
import { FileGrid } from './components/file-grid';
import { FileList } from './components/file-list';
import { FileListHeader } from './components/file-list-header';
import { FileMasonry } from './components/file-masonry';
import { FileTable } from './components/file-table';
import { FileSingle } from './components/file-single';
import { FileCards } from './components/file-cards';
import { useFolderFiles } from './hooks/use-folder-files';
import type { FileBrowser2Props } from './types/file-browser.types';

function applySearch(items: ImageWithStats[], query: string) {
	if (!query) return items;
	const q = query.toLowerCase();
	return items.filter((it) => it.name?.toLowerCase().includes(q));
}

function applySort(items: ImageWithStats[], sortOptions: { field: string; direction: 'asc' | 'desc' }[]) {
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

export function FileBrowser2({ filterId, onItemClick, onItemDoubleClick }: FileBrowser2Props) {
	const { images, isLoading, error } = useFolderFiles(filterId);

	// View options (modo, tamaño, sort, búsqueda)
	const viewMode = useViewOptionsStore((s) => s.viewMode);
	const itemSize = useViewOptionsStore((s) => s.itemSize);
	const sortOptions = useViewOptionsStore((s) => s.sortOptions);
	const searchQuery = useViewOptionsStore((s) => s.searchQuery);

	// Selección
	const selectedIds = useSelectionStore((s) => s.selectedIds);
	const toggleSelectedId = useSelectionStore((s) => s.toggleSelectedId);
	const setActiveId = useSelectionStore((s) => s.setActiveId);

	const processedItems = useMemo(() => {
		const searched = applySearch(images, searchQuery);
		const sorted = applySort(searched, sortOptions);
		return sorted;
	}, [images, searchQuery, sortOptions]);

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

	const handleItemClick = (item: ImageWithStats) => {
		toggleSelectedId(item.id);
		setActiveId(item.id);
		onItemClick?.(item as any);
	};

	const handleItemDoubleClick = (item: ImageWithStats) => {
		onItemDoubleClick?.(item as any);
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
							<FileList
								items={processedItems}
								selectedIds={selectedIds}
								onItemClick={handleItemClick}
								onItemDoubleClick={handleItemDoubleClick}
							/>
						</div>
					</div>
				) : viewMode === 'single' ? (
					<div className="h-full min-h-0">
						<FileSingle
							items={processedItems}
							selectedIds={selectedIds}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
						/>
					</div>
				) : viewMode === 'masonry' ? (
					<div className="h-full min-h-0">
						<FileMasonry
							items={processedItems}
							selectedIds={selectedIds}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
						/>
					</div>
				) : viewMode === 'table' ? (
					<div className="h-full min-h-0">
						<FileTable
							items={processedItems}
							selectedIds={selectedIds}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
						/>
					</div>
				) : viewMode === 'cards' ? (
					<div className="h-full min-h-0">
						<FileCards
							items={processedItems}
							selectedIds={selectedIds}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
						/>
					</div>
				) : (
					<div className="h-full min-h-0">
						<FileGrid
							itemSize={effectiveItemSize}
							items={processedItems}
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
	// Solo soportamos imágenes por ahora: filtrar
	const imageItems = items.filter((it) => (it as any).entityType === 'image') as unknown[] as ImageWithStats[];

	const viewMode = useViewOptionsStore((s) => s.viewMode);
	const itemSize = useViewOptionsStore((s) => s.itemSize);
	const sortOptions = useViewOptionsStore((s) => s.sortOptions);
	const searchQuery = useViewOptionsStore((s) => s.searchQuery);

	const selectedIds = useSelectionStore((s) => s.selectedIds);
	const toggleSelectedId = useSelectionStore((s) => s.toggleSelectedId);
	const setActiveId = useSelectionStore((s) => s.setActiveId);

	const processedItems = useMemo(() => {
		const searched = applySearch(imageItems, searchQuery);
		const sorted = applySort(searched, sortOptions);
		return sorted;
	}, [imageItems, searchQuery, sortOptions]);

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

	const handleItemClick = (item: ImageWithStats) => {
		toggleSelectedId(item.id);
		setActiveId(item.id);
		onItemClick?.(item as unknown as AnyEntityWithStats);
	};

	const handleItemDoubleClick = (item: ImageWithStats) => {
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
								items={processedItems}
								onItemClick={handleItemClick}
								onItemDoubleClick={handleItemDoubleClick}
								selectedIds={selectedIds}
							/>
						</div>
					</div>
				) : viewMode === 'single' ? (
					<div className="h-full min-h-0">
						<FileSingle
							items={processedItems}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
							selectedIds={selectedIds}
						/>
					</div>
				) : viewMode === 'masonry' ? (
					<div className="h-full min-h-0">
						<FileMasonry
							items={processedItems}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
							selectedIds={selectedIds}
						/>
					</div>
				) : viewMode === 'table' ? (
					<div className="h-full min-h-0">
						<FileTable
							items={processedItems}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
							selectedIds={selectedIds}
						/>
					</div>
				) : viewMode === 'cards' ? (
					<div className="h-full min-h-0">
						<FileCards
							items={processedItems}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
							selectedIds={selectedIds}
						/>
					</div>
				) : (
					<div className="h-full min-h-0">
						<FileGrid
							itemSize={effectiveItemSize}
							items={processedItems}
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

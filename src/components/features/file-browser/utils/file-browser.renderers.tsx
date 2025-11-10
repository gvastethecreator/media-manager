import { RefreshCw } from 'lucide-react';
import { useMemo } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { FileBrowserToolbar } from '@/components/features/file-browser/components/file-browser-toolbar';
import { FileListHeader } from '@/components/features/file-browser/components/file-list-header';
import { Cards } from '@/components/features/file-browser/views/cards';
import { Grid } from '@/components/features/file-browser/views/grid';
import { Masonry } from '@/components/features/file-browser/views/masonry';
import { List } from '@/components/features/file-browser/views/list';
import { StatusBar } from '@/components/features/file-browser/components/status-bar';
import { Table } from '@/components/features/file-browser/views/table';
import { cn } from '@/lib/utils';
import { useImageViewerStore } from '@/store/image-viewer.store';
import { useSelectionStore } from '@/store/selection.store';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import type { AnyEntityWithStats } from '@/types/entities';
import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { applySearch, applySort } from './file-browser.utils';

export interface RenderFromItemsProps {
    className?: string;
    items: AnyEntityWithStats[];
    isLoading?: boolean;
    onItemClick?: (item: AnyEntityWithStats) => void;
    onItemDoubleClick?: (item: AnyEntityWithStats) => void;
}

/**
 * Renderiza la interfaz del explorador de archivos a partir de una lista de items.
 * Usado para casos donde se pasan items directamente sin filterId.
 */
export function renderFromItems({
    className,
    items,
    isLoading = false,
    onItemClick,
    onItemDoubleClick,
}: RenderFromItemsProps) {
    // Admitir mezcla de imágenes y videos
    const mediaItems = items as unknown as MediaItem[];
    const backgroundColor = useViewOptionsStore((s) => s.backgroundColor) ?? 'transparent';

    // Función de refresh básica para items directos (opcional)
    const handleRefresh = () => {
        // En este contexto, no hay mucho que refrescar ya que los items vienen como props
        console.log('Refresh solicitado para items directos');
    };

    const viewMode = useViewOptionsStore((s) => s.viewMode);
    const itemSize = useViewOptionsStore((s) => s.itemSize);
    const sortOptions = useViewOptionsStore((s) => s.sortOptions);
    const searchQuery = useViewOptionsStore((s) => s.searchQuery);

    const toggleSelection = useSelectionStore((s) => s.toggleSelection);
    const setFocusedId = useSelectionStore((s) => s.setFocusedId);
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
        const { selectedIds: currentSelectedIds, focusedId } = useSelectionStore.getState();
        if (isRange && currentSelectedIds.length > 0 && focusedId) {
            const start = allIds.indexOf(focusedId as string);
            const end = allIds.indexOf(item.id);
            if (start !== -1 && end !== -1) {
                const [from, to] = start <= end ? [start, end] : [end, start];
                const rangeIds = allIds.slice(from, to + 1);
                setSelectedIds(rangeIds);
                setFocusedId(item.id);
            } else {
                setSelectedIds([item.id]);
                setFocusedId(item.id);
            }
        } else if (isToggle) {
            toggleSelection(item.id);
            setFocusedId(item.id);
        } else {
            setSelectedIds([item.id]);
            setFocusedId(item.id);
        }
        onItemClick?.(item as unknown as AnyEntityWithStats);
    };

    // Visor de imágenes (fallback por defecto en doble click)
    const { openViewer } = useImageViewerStore();

    const handleItemDoubleClick = (item: MediaItem) => {
        if (onItemDoubleClick) {
            onItemDoubleClick(item as AnyEntityWithStats);
            return;
        }
        if (item.entityType === 'image') {
            const imageItems = processedItems.filter((it) => it.entityType === 'image');
            const initialIndex = imageItems.findIndex((it) => it.id === item.id);
            if (imageItems.length > 0 && initialIndex >= 0) {
                openViewer(imageItems as any, initialIndex);
            }
        }
    };
    const effectiveItemSize = viewMode === 'cards' ? Math.max(120, itemSize) : itemSize;

    return (
        <section
            aria-label="Explorador de archivos"
            className={cn('flex h-full min-h-[200px] flex-col overflow-hidden', className)}
            data-ready="true"
            data-testid="file-browser"
            data-view-mode={viewMode}
            data-viewport-ready="true"
            style={{ backgroundColor }}
            tabIndex={-1}
        >
            {/* Toolbar del File Browser */}
            <FileBrowserToolbar
                allItemIds={processedItems.map((it) => it.id)}
                isLoading={isLoading}
                onRefresh={handleRefresh}
            />
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
            <StatusBar isLoading={isLoading} items={processedItems as MediaItem[]} onRefresh={handleRefresh} />
        </section>
    );
}

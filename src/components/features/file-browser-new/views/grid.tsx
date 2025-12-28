/**
 * @file Vista de Grid para File Browser
 * @module file-browser-new/views/grid
 */

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { BrowserViewProps, BrowserItem, ClickModifiers, GridViewConfig, ItemContextMenuHandler } from '../types';
import { MediaItemGrid } from '../components/media-item';

export interface GridViewProps extends Omit<BrowserViewProps, 'config'> {
    /** Configuración de grid */
    config: GridViewConfig;
    /** Tamaño de item (override) */
    itemSize?: number;
    /** Página actual (para paginación) */
    page?: number;
    /** Tamaño de página */
    pageSize?: number;
    /** IDs seleccionados */
    selectedIds?: Set<string>;
    /** ID activo */
    activeId?: string | null;
    /** Handler de context menu */
    onItemContextMenu?: ItemContextMenuHandler;
}

export function GridView({
    items,
    onItemClick,
    onItemDoubleClick,
    onItemContextMenu,
    config,
    itemSize: itemSizeOverride,
    page,
    pageSize = 300,
    scrollContainer,
    onContainerReady,
    selectedIds = new Set(),
    activeId,
}: GridViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);

    const effectiveScrollContainer = scrollContainer ?? internalScrollEl;
    const itemSize = itemSizeOverride ?? config.itemSize;
    const gap = config.gap;

    // Paginación controlada
    const displayItems = useMemo(() => {
        if (typeof page === 'number') {
            const start = page * pageSize;
            return items.slice(start, start + pageSize);
        }
        return items;
    }, [items, page, pageSize]);

    // Scroll al inicio cuando cambia la página
    useEffect(() => {
        if (typeof page !== 'number') return;
        containerRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }, [page]);

    // Scroll al item activo cuando cambia
    useEffect(() => {
        if (!activeId || !containerRef.current) return;
        const activeElement = containerRef.current.querySelector(`[data-item-id="${activeId}"]`);
        if (activeElement) {
            activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [activeId]);

    // Handlers
    const handleItemClick = useCallback(
        (item: BrowserItem, e: React.MouseEvent) => {
            const modifiers: ClickModifiers = {
                ctrlKey: e.ctrlKey,
                metaKey: e.metaKey,
                shiftKey: e.shiftKey,
            };
            onItemClick?.(item, modifiers);
        },
        [onItemClick]
    );

    const handleItemDoubleClick = useCallback(
        (item: BrowserItem) => {
            onItemDoubleClick?.(item);
        },
        [onItemDoubleClick]
    );

    const handleItemContextMenu = useCallback(
        (item: BrowserItem, e: React.MouseEvent) => {
            e.preventDefault();
            onItemContextMenu?.(e, item);
        },
        [onItemContextMenu]
    );

    return (
        <div
            className="h-full w-full overflow-auto"
            data-testid="grid-view"
            ref={(el) => {
                setInternalScrollEl(el);
                containerRef.current = el;
                onContainerReady?.(el);
            }}
        >
            <div
                className="grid p-2"
                data-testid="grid-view-container"
                style={{
                    gridTemplateColumns: `repeat(auto-fill, minmax(${itemSize}px, 1fr))`,
                    gap: `${gap}px`,
                }}
            >
                {displayItems.map((item) => (
                    <MediaItemGrid
                        isActive={activeId === item.id}
                        isSelected={selectedIds.has(item.id)}
                        item={item}
                        key={item.id}
                        onClick={(e) => handleItemClick(item, e)}
                        onContextMenu={(e) => handleItemContextMenu(item, e)}
                        onDoubleClick={() => handleItemDoubleClick(item)}
                        size={itemSize}
                    />
                ))}
            </div>
        </div>
    );
}

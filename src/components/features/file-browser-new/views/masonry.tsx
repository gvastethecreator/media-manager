/**
 * @file Vista de Masonry para File Browser
 * @module file-browser-new/views/masonry
 */

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import type { BrowserViewProps, BrowserItem, ClickModifiers, MasonryViewConfig, ItemContextMenuHandler } from '../types';
import { MediaItemGrid } from '../components/media-item';

export interface MasonryViewProps extends Omit<BrowserViewProps, 'config'> {
    /** Configuración de masonry */
    config: MasonryViewConfig;
    /** Página actual */
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

/**
 * Calcula layout de masonry (columnas con alturas balanceadas)
 */
function calculateMasonryLayout(
    items: BrowserItem[],
    containerWidth: number,
    columnWidth: number,
    gap: number
): { columns: BrowserItem[][]; columnWidth: number } {
    const numColumns = Math.max(1, Math.floor((containerWidth + gap) / (columnWidth + gap)));
    const actualColumnWidth = (containerWidth - gap * (numColumns - 1)) / numColumns;

    const columns: BrowserItem[][] = Array.from({ length: numColumns }, () => []);
    const columnHeights: number[] = new Array(numColumns).fill(0);

    for (const item of items) {
        // Encontrar columna más corta
        const shortestCol = columnHeights.indexOf(Math.min(...columnHeights));

        // Calcular altura del item (basado en aspect ratio o altura por defecto)
        const aspectRatio = item.width && item.height ? item.width / item.height : 1;
        const itemHeight = actualColumnWidth / aspectRatio;

        columns[shortestCol].push(item);
        columnHeights[shortestCol] += itemHeight + gap;
    }

    return { columns, columnWidth: actualColumnWidth };
}

export function MasonryView({
    items,
    onItemClick,
    onItemDoubleClick,
    onItemContextMenu,
    config,
    page,
    pageSize = 300,
    scrollContainer,
    onContainerReady,
    selectedIds = new Set(),
    activeId,
}: MasonryViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);
    const [containerWidth, setContainerWidth] = useState(800);

    const columnWidth = config.columnWidth;
    const gap = config.gap;

    // Paginación controlada
    const displayItems = useMemo(() => {
        if (typeof page === 'number') {
            const start = page * pageSize;
            return items.slice(start, start + pageSize);
        }
        return items;
    }, [items, page, pageSize]);

    // Observar cambios de tamaño del contenedor
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });

        observer.observe(container);
        setContainerWidth(container.clientWidth);

        return () => observer.disconnect();
    }, []);

    // Calcular layout
    const layout = useMemo(() => {
        return calculateMasonryLayout(displayItems, containerWidth, columnWidth, gap);
    }, [displayItems, containerWidth, columnWidth, gap]);

    // Scroll al item activo cuando cambia
    useEffect(() => {
        if (!activeId) return;
        const container = containerRef.current;
        if (!container) return;
        const activeElement = container.querySelector(`[data-item-id="${activeId}"]`);
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
            data-testid="file-browser-scroll-area-viewport"
            ref={(el) => {
                setInternalScrollEl(el);
                containerRef.current = el;
                onContainerReady?.(el);
            }}
        >
            <div className="h-full w-full" data-testid="masonry-view">
                <div
                    className="flex p-2"
                    data-testid="masonry-view-container"
                    style={{ gap: `${gap}px` }}
                >
                    {layout.columns.map((column, colIndex) => (
                        <div
                            className="flex flex-col"
                            key={colIndex}
                            style={{ width: layout.columnWidth, gap: `${gap}px` }}
                        >
                            {column.map((item) => (
                                <MediaItemGrid
                                    isActive={activeId === item.id}
                                    isSelected={selectedIds.has(item.id)}
                                    item={item}
                                    key={item.id}
                                    onClick={(e) => handleItemClick(item, e)}
                                    onContextMenu={(e) => handleItemContextMenu(item, e)}
                                    onDoubleClick={() => handleItemDoubleClick(item)}
                                    size={Math.round(layout.columnWidth)}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

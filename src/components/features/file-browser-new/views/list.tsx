/**
 * @file Vista de Lista para File Browser
 * @module file-browser-new/views/list
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { BrowserViewProps, BrowserItem, ClickModifiers, ListViewConfig, ItemContextMenuHandler } from '../types';
import { MediaItemList } from '../components/media-item';

export interface ListViewProps extends Omit<BrowserViewProps, 'config'> {
    /** Configuración de lista */
    config: ListViewConfig;
    /** IDs seleccionados */
    selectedIds?: Set<string>;
    /** ID activo */
    activeId?: string | null;
    /** Handler de context menu */
    onItemContextMenu?: ItemContextMenuHandler;
}

export function ListView({
    items,
    onItemClick,
    onItemDoubleClick,
    onItemContextMenu,
    config,
    scrollContainer,
    onContainerReady,
    selectedIds = new Set(),
    activeId,
}: ListViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);

    const rowHeight = config.rowHeight;

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
            data-testid="list-view"
            ref={(el) => {
                setInternalScrollEl(el);
                containerRef.current = el;
                onContainerReady?.(el);
            }}
        >
            <div className="flex flex-col" data-testid="list-view-container">
                {items.map((item) => (
                    <MediaItemList
                        isActive={activeId === item.id}
                        isSelected={selectedIds.has(item.id)}
                        item={item}
                        key={item.id}
                        onClick={(e) => handleItemClick(item, e)}
                        onContextMenu={(e) => handleItemContextMenu(item, e)}
                        onDoubleClick={() => handleItemDoubleClick(item)}
                        style={{ height: rowHeight }}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * @file Vista de Cards para File Browser
 * @module file-browser-new/views/cards
 */

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Folder, CornerUpLeft, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BrowserViewProps, BrowserItem, ClickModifiers, CardsViewConfig, BrowserEntityType, ItemContextMenuHandler } from '../types';
import { MediaThumbnail, type MediaItem } from '@/components/features/file-browser/components/media-thumbnail';

export interface CardsViewProps extends Omit<BrowserViewProps, 'config'> {
    /** Configuración de cards */
    config: CardsViewConfig;
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

const ENTITY_COLORS: Record<BrowserEntityType, string> = {
    folder: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    image: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    video: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    audio: 'bg-green-500/20 text-green-600 dark:text-green-400',
    document: 'bg-red-500/20 text-red-600 dark:text-red-400',
    json: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
    file3d: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
};

/**
 * Convierte BrowserItem a MediaItem compatible
 */
function toMediaItem(item: BrowserItem): MediaItem {
    return {
        id: item.id,
        name: item.name,
        entityType: item.entityType === 'json' ? 'jsonFile' : item.entityType as MediaItem['entityType'],
        thumbnailUrl: item.thumbnailUrl,
        mimeType: item.mimeType,
        createdAt: item.createdAt,
        size: item.size,
        path: item.path,
        width: item.width,
        height: item.height,
        parentId: item.parentId,
        totalItems: item.totalItems,
        emoji: item.emoji,
        color: item.color,
    };
}

interface CardItemProps {
    item: BrowserItem;
    size: number;
    showDetails: boolean;
    isSelected: boolean;
    isActive: boolean;
    onClick: (e: React.MouseEvent) => void;
    onDoubleClick: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
}

function CardItem({
    item,
    size,
    showDetails,
    isSelected,
    isActive,
    onClick,
    onDoubleClick,
    onContextMenu,
}: CardItemProps) {
    const colorClass = ENTITY_COLORS[item.entityType] ?? 'bg-muted text-muted-foreground';

    // Si es item sintético de navegación (..)
    if (item.isSynthetic && item.name === '..') {
        return (
            <div
                className={cn(
                    'group flex flex-col rounded-xl border bg-card p-3 transition-all',
                    'hover:border-primary/50 hover:shadow-md cursor-pointer',
                    isSelected && 'border-primary bg-accent shadow-md',
                    isActive && 'ring-2 ring-primary/50'
                )}
                data-item-id={item.id}
                onClick={onClick}
                onContextMenu={onContextMenu}
                onDoubleClick={onDoubleClick}
                style={{ width: size }}
            >
                <div
                    className="relative mb-2 overflow-hidden rounded-lg flex items-center justify-center bg-muted"
                    style={{ height: size * 0.65 }}
                >
                    <CornerUpLeft className="h-1/3 w-1/3 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="truncate text-sm font-medium text-muted-foreground">Subir nivel</h4>
                </div>
            </div>
        );
    }

    // Si es carpeta
    if (item.entityType === 'folder') {
        return (
            <div
                className={cn(
                    'group flex flex-col rounded-xl border bg-card p-3 transition-all',
                    'hover:border-primary/50 hover:shadow-md cursor-pointer',
                    isSelected && 'border-primary bg-accent shadow-md',
                    isActive && 'ring-2 ring-primary/50'
                )}
                data-item-id={item.id}
                onClick={onClick}
                onContextMenu={onContextMenu}
                onDoubleClick={onDoubleClick}
                style={{ width: size }}
            >
                <div
                    className="relative mb-2 overflow-hidden rounded-lg flex items-center justify-center"
                    style={{
                        height: size * 0.65,
                        backgroundColor: item.color ?? 'hsl(var(--muted))',
                    }}
                >
                    {item.emoji ? (
                        <span className="text-4xl">{item.emoji}</span>
                    ) : (
                        <Folder className="h-1/3 w-1/3 text-amber-600" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="truncate text-sm font-medium" title={item.name}>
                        {item.name}
                    </h4>
                    {showDetails && (
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span className={cn('rounded px-1.5 py-0.5', colorClass)}>
                                carpeta
                            </span>
                            {typeof item.totalItems === 'number' && (
                                <span>{item.totalItems} items</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Para archivos multimedia, usar MediaThumbnail
    const mediaItem = toMediaItem(item);

    return (
        <div
            className={cn(
                'group flex flex-col rounded-xl border bg-card p-3 transition-all',
                'hover:border-primary/50 hover:shadow-md cursor-pointer',
                isSelected && 'border-primary bg-accent shadow-md',
                isActive && 'ring-2 ring-primary/50'
            )}
            data-item-id={item.id}
            onClick={onClick}
            onContextMenu={onContextMenu}
            onDoubleClick={onDoubleClick}
            style={{ width: size }}
        >
            {/* Thumbnail */}
            <div
                className="relative mb-2 overflow-hidden rounded-lg"
                style={{ height: size * 0.65 }}
            >
                <MediaThumbnail
                    className="h-full w-full object-cover"
                    item={mediaItem}
                    lockAspectRatio
                />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h4 className="truncate text-sm font-medium" title={item.name}>
                    {item.name}
                </h4>

                {showDetails && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className={cn('rounded px-1.5 py-0.5', colorClass)}>
                            {item.entityType}
                        </span>
                        {item.size != null && (
                            <span>{formatFileSize(item.size)}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

export function CardsView({
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
}: CardsViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);

    const cardSize = config.cardSize;
    const gap = config.gap;
    const showDetails = config.showDetails;

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
            data-testid="cards-view"
            ref={(el) => {
                setInternalScrollEl(el);
                containerRef.current = el;
                onContainerReady?.(el);
            }}
        >
            <div
                className="flex flex-wrap p-3"
                data-testid="cards-view-container"
                style={{ gap: `${gap}px` }}
            >
                {displayItems.map((item) => (
                    <CardItem
                        isActive={activeId === item.id}
                        isSelected={selectedIds.has(item.id)}
                        item={item}
                        key={item.id}
                        onClick={(e) => handleItemClick(item, e)}
                        onContextMenu={(e) => handleItemContextMenu(item, e)}
                        onDoubleClick={() => handleItemDoubleClick(item)}
                        showDetails={showDetails}
                        size={cardSize}
                    />
                ))}
            </div>
        </div>
    );
}

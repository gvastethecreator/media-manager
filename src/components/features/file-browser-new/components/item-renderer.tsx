/**
 * @file Renderizador de items del File Browser
 * @module file-browser-new/components/item-renderer
 */

import { memo, useCallback } from 'react';
import { Folder, Image, Video, Music, FileText, FileJson, Box, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BrowserItem, BrowserEntityType, ItemRendererProps } from '../types';

/**
 * Iconos por tipo de entidad
 */
const ENTITY_ICONS: Record<BrowserEntityType, React.ComponentType<{ className?: string }>> = {
    folder: Folder,
    image: Image,
    video: Video,
    audio: Music,
    document: FileText,
    json: FileJson,
    file3d: Box,
};

/**
 * Colores de fondo por tipo de entidad
 */
const ENTITY_COLORS: Record<BrowserEntityType, string> = {
    folder: 'bg-amber-500/20 text-amber-600',
    image: 'bg-blue-500/20 text-blue-600',
    video: 'bg-purple-500/20 text-purple-600',
    audio: 'bg-green-500/20 text-green-600',
    document: 'bg-red-500/20 text-red-600',
    json: 'bg-orange-500/20 text-orange-600',
    file3d: 'bg-cyan-500/20 text-cyan-600',
};

/**
 * Thumbnail de item
 */
interface ItemThumbnailProps {
    item: BrowserItem;
    size: number;
    className?: string;
}

export function ItemThumbnail({ item, size, className }: ItemThumbnailProps) {
    const Icon = ENTITY_ICONS[item.entityType] ?? File;
    const colorClass = ENTITY_COLORS[item.entityType] ?? 'bg-muted text-muted-foreground';

    // Si tiene thumbnail URL, mostrar imagen
    if (item.thumbnailUrl) {
        return (
            <div
                className={cn('relative overflow-hidden rounded-lg bg-muted', className)}
                style={{ width: size, height: size }}
            >
                <img
                    alt={item.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    src={item.thumbnailUrl}
                />
            </div>
        );
    }

    // Fallback: icono
    return (
        <div
            className={cn(
                'flex items-center justify-center rounded-lg',
                colorClass,
                className
            )}
            style={{ width: size, height: size }}
        >
            <Icon className="h-1/3 w-1/3" />
        </div>
    );
}

/**
 * Renderizador de item para grid
 */
function ItemRendererGridInner({
    item,
    size,
    isSelected = false,
    isActive = false,
    onClick,
    onDoubleClick,
    onContextMenu,
    className,
    style,
}: ItemRendererProps) {
    return (
        <div
            className={cn(
                'group relative flex flex-col gap-1 rounded-lg p-1.5 transition-colors',
                'hover:bg-accent/50 cursor-pointer',
                isSelected && 'bg-accent ring-2 ring-primary',
                isActive && 'ring-2 ring-primary/50',
                className
            )}
            data-item-id={item.id}
            data-selected={isSelected}
            onClick={onClick}
            onContextMenu={onContextMenu}
            onDoubleClick={onDoubleClick}
            style={style}
        >
            <ItemThumbnail
                className="mx-auto"
                item={item}
                size={size - 12}
            />
            <span
                className="truncate text-center text-xs leading-tight px-1"
                title={item.name}
            >
                {item.name}
            </span>
        </div>
    );
}

/**
 * Renderizador de item para lista
 */
function ItemRendererListInner({
    item,
    isSelected = false,
    isActive = false,
    onClick,
    onDoubleClick,
    onContextMenu,
    className,
    style,
}: Omit<ItemRendererProps, 'size'>) {
    const Icon = ENTITY_ICONS[item.entityType] ?? File;
    const colorClass = ENTITY_COLORS[item.entityType] ?? 'text-muted-foreground';

    return (
        <div
            className={cn(
                'flex items-center gap-3 px-3 py-2 transition-colors',
                'hover:bg-accent/50 cursor-pointer',
                isSelected && 'bg-accent',
                isActive && 'ring-1 ring-inset ring-primary/50',
                className
            )}
            data-item-id={item.id}
            data-selected={isSelected}
            onClick={onClick}
            onContextMenu={onContextMenu}
            onDoubleClick={onDoubleClick}
            style={style}
        >
            {item.thumbnailUrl ? (
                <img
                    alt=""
                    className="h-8 w-8 rounded object-cover"
                    src={item.thumbnailUrl}
                />
            ) : (
                <div className={cn('flex h-8 w-8 items-center justify-center rounded', colorClass.replace('text-', 'bg-').replace('600', '500/20'))}>
                    <Icon className={cn('h-4 w-4', colorClass)} />
                </div>
            )}
            <span className="flex-1 truncate text-sm">{item.name}</span>
            {item.size != null && (
                <span className="text-xs text-muted-foreground">
                    {formatFileSize(item.size)}
                </span>
            )}
        </div>
    );
}

/**
 * Formatea tamaño de archivo
 */
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

/**
 * Componentes memorizados para rendimiento
 */
export const ItemRendererGrid = memo(ItemRendererGridInner);
export const ItemRendererList = memo(ItemRendererListInner);

/**
 * Renderizador genérico según modo de vista
 */
export interface GenericItemRendererProps extends ItemRendererProps {
    viewMode: 'grid' | 'list' | 'masonry' | 'table' | 'cards';
}

export const GenericItemRenderer = memo(function GenericItemRenderer({
    viewMode,
    ...props
}: GenericItemRendererProps) {
    if (viewMode === 'list' || viewMode === 'table') {
        return <ItemRendererList {...props} />;
    }
    return <ItemRendererGrid {...props} />;
});

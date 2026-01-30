/**
 * @file Renderizador de items del File Browser
 * @module file-browser-new/components/item-renderer
 */

import { Box, File, FileJson, FileText, Folder, Image, Music, Video } from 'lucide-react';
import { memo } from 'react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils/format.utils';
import type { BrowserEntityType, BrowserItem } from '../types/item.types';
import type { ItemRendererProps } from '../types/props.types';

/**
 * Iconos por tipo de entidad
 */
const ENTITY_ICONS: Record<BrowserEntityType, React.ComponentType<{ className?: string }>> = {
	folder: Folder,
	image: Image,
	video: Video,
	audio: Music,
	document: FileText,
	jsonFile: FileJson,
	file3d: Box,
};

/**
 * Colores de fondo por tipo de entidad
 */
const ENTITY_COLORS: Record<BrowserEntityType, string> = {
	folder: 'bg-[color:color-mix(in_oklch,var(--entity-folder)_20%,transparent)] text-[color:var(--entity-folder)]',
	image: 'bg-[color:color-mix(in_oklch,var(--entity-image)_20%,transparent)] text-[color:var(--entity-image)]',
	video: 'bg-[color:color-mix(in_oklch,var(--entity-video)_20%,transparent)] text-[color:var(--entity-video)]',
	audio: 'bg-[color:color-mix(in_oklch,var(--entity-audio)_20%,transparent)] text-[color:var(--entity-audio)]',
	document: 'bg-[color:color-mix(in_oklch,var(--entity-document)_20%,transparent)] text-[color:var(--entity-document)]',
	jsonFile: 'bg-[color:color-mix(in_oklch,var(--entity-json)_20%,transparent)] text-[color:var(--entity-json)]',
	file3d: 'bg-[color:color-mix(in_oklch,var(--entity-file-3d)_20%,transparent)] text-[color:var(--entity-file-3d)]',
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
					height={size}
					loading="lazy"
					src={item.thumbnailUrl}
					width={size}
				/>
			</div>
		);
	}

	// Fallback: icono
	return (
		<div
			className={cn('flex items-center justify-center rounded-lg', colorClass, className)}
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
		<button
			className={cn(
				'group relative flex flex-col gap-1 rounded-lg p-1.5 transition-colors',
				'cursor-pointer hover:bg-accent/50',
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
			type="button"
		>
			<ItemThumbnail className="mx-auto" item={item} size={size - 12} />
			<span className="truncate px-1 text-center text-xs leading-tight" title={item.name}>
				{item.name}
			</span>
		</button>
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
	const iconColor = colorClass.includes('text-') ? colorClass.split(' ').find((c) => c.startsWith('text-')) : undefined;

	return (
		<button
			className={cn(
				'flex items-center gap-3 px-3 py-2 transition-colors',
				'cursor-pointer hover:bg-accent/50',
				isSelected && 'bg-accent',
				isActive && 'ring-1 ring-primary/50 ring-inset',
				className
			)}
			data-item-id={item.id}
			data-selected={isSelected}
			onClick={onClick}
			onContextMenu={onContextMenu}
			onDoubleClick={onDoubleClick}
			style={style}
			type="button"
		>
			{item.thumbnailUrl ? (
				<img alt="" className="h-8 w-8 rounded object-cover" height={32} src={item.thumbnailUrl} width={32} />
			) : (
				<div className={cn('flex h-8 w-8 items-center justify-center rounded', colorClass)}>
					<Icon className={cn('h-4 w-4', iconColor || 'text-muted-foreground')} />
				</div>
			)}
			<span className="flex-1 truncate text-sm">{item.name}</span>
			{item.size != null && <span className="text-muted-foreground text-xs">{formatFileSize(item.size)}</span>}
		</button>
	);
}

// formatFileSize importada desde @/lib/utils/format.utils

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

export const GenericItemRenderer = memo(function GenericItemRenderer({ viewMode, ...props }: GenericItemRendererProps) {
	if (viewMode === 'list' || viewMode === 'table') {
		return <ItemRendererList {...props} />;
	}
	return <ItemRendererGrid {...props} />;
});

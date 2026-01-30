/**
 * @file Componente de item multimedia con thumbnail real
 * @module file-browser-new/components/media-item
 *
 * Reutiliza MediaThumbnail del file-browser original para
 * una experiencia de visualización consistente.
 */

import { CornerUpLeft, Folder } from 'lucide-react';
import { memo } from 'react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils/format.utils';
import type { BrowserItem } from '../types/item.types';
// MediaThumbnail del módulo migrado
import { MediaThumbnail } from './media-thumbnail/media-thumbnail';
import type { MediaItem } from './media-thumbnail/types';

/**
 * Convierte BrowserItem a MediaItem compatible
 */
function toMediaItem(item: BrowserItem): MediaItem {
	return {
		id: item.id,
		name: item.name,
		entityType: item.entityType as MediaItem['entityType'],
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

export interface MediaItemProps {
	item: BrowserItem;
	size: number;
	isSelected?: boolean;
	isActive?: boolean;
	layoutItem?: boolean;
	layoutOrder?: number;
	variant?: 'grid' | 'masonry';
	animateIn?: boolean;
	onClick?: (e: React.MouseEvent) => void;
	onDoubleClick?: () => void;
	onContextMenu?: (e: React.MouseEvent) => void;
	className?: string;
	style?: React.CSSProperties;
	/** Test id opcional (compatibilidad E2E) */
	testId?: string;
	/** Modo de vista para ajustar el render */
	viewMode?: 'grid' | 'list' | 'masonry' | 'table' | 'cards';
}

/**
 * Componente de item para vista de Grid/Cards/Masonry
 */
function MediaItemGridInner({
	item,
	size,
	isSelected = false,
	isActive = false,
	onClick,
	onDoubleClick,
	onContextMenu,
	className,
	style,
	testId,
	layoutItem = true,
	layoutOrder,
	variant = 'grid',
	animateIn = true,
}: MediaItemProps) {
	const isMasonry = variant === 'masonry';
	const fadeDelayMs = layoutOrder != null ? Math.min(layoutOrder * 6, 200) : 0;
	const fadeStyle =
		layoutItem && animateIn ? { animationDelay: `${fadeDelayMs}ms`, '--fb-item-delay': `${fadeDelayMs}ms` } : {};
	const layoutAttributes = layoutItem
		? {
				'data-layout-id': item.id,
				'data-layout-item': 'true',
				...(layoutOrder != null ? { 'data-layout-order': String(layoutOrder) } : {}),
			}
		: {};
	// Si es item sintético de navegación (..)
	if (item.isSynthetic && item.name === '..') {
		return (
			<button
				className={cn(
					animateIn && 'file-browser-item',
					'group relative flex flex-col items-center justify-center gap-2 rounded-lg p-2 transition-colors',
					'cursor-pointer hover:bg-accent/50',
					isSelected && 'bg-accent ring-2 ring-primary',
					isActive && 'ring-2 ring-primary/50',
					className
				)}
				{...layoutAttributes}
				data-entity-card
				data-entity-type={item.entityType}
				data-item-id={item.id}
				data-selected={isSelected}
				data-testid={testId}
				onClick={onClick}
				onContextMenu={onContextMenu}
				onDoubleClick={onDoubleClick}
				style={{ ...style, ...fadeStyle, width: size, height: size }}
				type="button"
			>
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
					<CornerUpLeft className="h-6 w-6 text-muted-foreground" />
				</div>
				<span className="font-medium text-muted-foreground text-sm">Subir nivel</span>
			</button>
		);
	}

	// Si es carpeta
	if (item.entityType === 'folder') {
		return (
			<button
				className={cn(
					animateIn && 'file-browser-item',
					'group relative flex flex-col gap-1 rounded-lg p-1.5 transition-colors',
					'cursor-pointer hover:bg-accent/50',
					isSelected && 'bg-accent ring-2 ring-primary',
					isActive && 'ring-2 ring-primary/50',
					className
				)}
				{...layoutAttributes}
				data-entity-card
				data-entity-type={item.entityType}
				data-item-id={item.id}
				data-selected={isSelected}
				data-testid={testId}
				onClick={onClick}
				onContextMenu={onContextMenu}
				onDoubleClick={onDoubleClick}
				style={{ ...style, ...fadeStyle, width: size }}
				type="button"
			>
				<div
					className="mx-auto flex items-center justify-center rounded-lg"
					style={{
						width: size - 12,
						height: size - 12,
						backgroundColor: item.color ?? 'hsl(var(--muted))',
					}}
				>
					{item.emoji ? (
						<span className="text-3xl">{item.emoji}</span>
					) : (
						<Folder className="h-1/3 w-1/3 text-warning" />
					)}
				</div>
				<div className="flex items-center justify-center gap-1 px-1">
					<span className="truncate text-center text-xs leading-tight" title={item.name}>
						{item.name}
					</span>
					{typeof item.totalItems === 'number' && (
						<span className="shrink-0 text-[10px] text-muted-foreground">({item.totalItems})</span>
					)}
				</div>
			</button>
		);
	}

	// Para archivos multimedia, usar MediaThumbnail
	const mediaItem = toMediaItem(item);

	return (
		<button
			className={cn(
				animateIn && 'file-browser-item',
				'group relative flex flex-col gap-1 rounded-lg p-1.5 transition-colors',
				'cursor-pointer hover:bg-accent/50',
				isSelected && 'bg-accent ring-2 ring-primary',
				isActive && 'ring-2 ring-primary/50',
				className
			)}
			{...layoutAttributes}
			data-entity-card
			data-entity-type={item.entityType}
			data-item-id={item.id}
			data-selected={isSelected}
			data-testid={testId}
			onClick={onClick}
			onContextMenu={onContextMenu}
			onDoubleClick={onDoubleClick}
			style={{ ...style, ...fadeStyle, width: size }}
			type="button"
		>
			<div
				className="mx-auto overflow-hidden rounded-lg"
				style={isMasonry ? { width: size } : { width: size - 12, height: size - 12 }}
			>
				<MediaThumbnail
					className="h-full w-full object-cover"
					item={mediaItem}
					lockAspectRatio={isMasonry}
					predictedAspectRatio={mediaItem.width && mediaItem.height ? mediaItem.width / mediaItem.height : undefined}
				/>
			</div>
			<span className="truncate px-1 text-center text-xs leading-tight" title={item.name}>
				{item.name}
			</span>
		</button>
	);
}

/**
 * Componente de item para vista de Lista
 */
function MediaItemListInner({
	item,
	isSelected = false,
	isActive = false,
	onClick,
	onDoubleClick,
	onContextMenu,
	className,
	style,
	testId,
	layoutItem = true,
	layoutOrder,
	animateIn = true,
}: Omit<MediaItemProps, 'size'>) {
	const layoutAttributes = layoutItem
		? {
				'data-layout-id': item.id,
				'data-layout-item': 'true',
				...(layoutOrder != null ? { 'data-layout-order': String(layoutOrder) } : {}),
			}
		: {};
	const fadeDelayMs = layoutOrder != null ? Math.min(layoutOrder * 6, 200) : 0;
	const fadeStyle =
		layoutItem && animateIn ? { animationDelay: `${fadeDelayMs}ms`, '--fb-item-delay': `${fadeDelayMs}ms` } : {};
	// Si es item sintético de navegación (..)
	if (item.isSynthetic && item.name === '..') {
		return (
			<button
				className={cn(
					animateIn && 'file-browser-item',
					'flex items-center gap-3 px-3 py-2 transition-colors',
					'cursor-pointer hover:bg-accent/50',
					isSelected && 'bg-accent',
					isActive && 'ring-1 ring-primary/50 ring-inset',
					className
				)}
				{...layoutAttributes}
				data-entity-card
				data-entity-type={item.entityType}
				data-item-id={item.id}
				data-selected={isSelected}
				data-testid={testId}
				onClick={onClick}
				onContextMenu={onContextMenu}
				onDoubleClick={onDoubleClick}
				style={{ ...style, ...fadeStyle }}
				type="button"
			>
				<div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
					<CornerUpLeft className="h-4 w-4 text-muted-foreground" />
				</div>
				<span className="flex-1 text-muted-foreground text-sm">Subir nivel</span>
			</button>
		);
	}

	// Si es carpeta
	if (item.entityType === 'folder') {
		return (
			<button
				className={cn(
					animateIn && 'file-browser-item',
					'flex items-center gap-3 px-3 py-2 transition-colors',
					'cursor-pointer hover:bg-accent/50',
					isSelected && 'bg-accent',
					isActive && 'ring-1 ring-primary/50 ring-inset',
					className
				)}
				{...layoutAttributes}
				data-entity-card
				data-entity-type={item.entityType}
				data-item-id={item.id}
				data-selected={isSelected}
				data-testid={testId}
				onClick={onClick}
				onContextMenu={onContextMenu}
				onDoubleClick={onDoubleClick}
				style={{ ...style, ...fadeStyle }}
				type="button"
			>
				<div
					className="flex h-8 w-8 items-center justify-center rounded"
					style={{ backgroundColor: item.color ?? 'hsl(var(--muted))' }}
				>
					{item.emoji ? <span className="text-sm">{item.emoji}</span> : <Folder className="h-4 w-4 text-warning" />}
				</div>
				<span className="flex-1 truncate text-sm">{item.name}</span>
				{typeof item.totalItems === 'number' && (
					<span className="text-muted-foreground text-xs">{item.totalItems} items</span>
				)}
			</button>
		);
	}

	// Para archivos multimedia
	const mediaItem = toMediaItem(item);

	return (
		<button
			className={cn(
				animateIn && 'file-browser-item',
				'flex items-center gap-3 px-3 py-2 transition-colors',
				'cursor-pointer hover:bg-accent/50',
				isSelected && 'bg-accent',
				isActive && 'ring-1 ring-primary/50 ring-inset',
				className
			)}
			{...layoutAttributes}
			data-entity-card
			data-entity-type={item.entityType}
			data-item-id={item.id}
			data-selected={isSelected}
			data-testid={testId}
			onClick={onClick}
			onContextMenu={onContextMenu}
			onDoubleClick={onDoubleClick}
			style={{ ...style, ...fadeStyle }}
			type="button"
		>
			<div className="h-8 w-8 overflow-hidden rounded">
				<MediaThumbnail className="h-full w-full object-cover" item={mediaItem} />
			</div>
			<span className="flex-1 truncate text-sm">{item.name}</span>
			{item.size != null && <span className="text-muted-foreground text-xs">{formatFileSize(item.size)}</span>}
		</button>
	);
}

// formatFileSize importada desde @/lib/utils/format.utils

/**
 * Componentes exportados memorizados
 */
export const MediaItemGrid = memo(MediaItemGridInner);
export const MediaItemList = memo(MediaItemListInner);

/**
 * Selector genérico según modo de vista
 */
export interface GenericMediaItemProps extends MediaItemProps {
	viewMode: 'grid' | 'list' | 'masonry' | 'table' | 'cards';
}

export const GenericMediaItem = memo(function GenericMediaItem({
	viewMode,
	size = 150,
	...props
}: GenericMediaItemProps) {
	if (viewMode === 'list' || viewMode === 'table') {
		return <MediaItemList {...props} />;
	}
	return <MediaItemGrid {...props} size={size} variant={viewMode === 'masonry' ? 'masonry' : 'grid'} />;
});

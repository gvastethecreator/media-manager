/**
 * @file Media Item v3 - Componente mejorado con animejs
 * @module file-browser-new/components/media-item-v3
 * @description Items multimedia con animaciones fluidas y estilos sutiles
 */

import { CornerUpLeft, Folder } from 'lucide-react';
import { memo, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils/format.utils';
import type { BrowserItem } from '../types/item.types';
import { MediaThumbnail } from './media-thumbnail/media-thumbnail';
import type { MediaItem } from './media-thumbnail/types';

/**
 * Colores de entidad consistentes
 */
const ENTITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
	folder: { bg: 'bg-amber-500/15', text: 'text-amber-600', border: 'border-amber-500/30' },
	image: { bg: 'bg-blue-500/15', text: 'text-blue-600', border: 'border-blue-500/30' },
	video: { bg: 'bg-purple-500/15', text: 'text-purple-600', border: 'border-purple-500/30' },
	audio: { bg: 'bg-green-500/15', text: 'text-green-600', border: 'border-green-500/30' },
	document: { bg: 'bg-red-500/15', text: 'text-red-600', border: 'border-red-500/30' },
	jsonFile: { bg: 'bg-orange-500/15', text: 'text-orange-600', border: 'border-orange-500/30' },
	file3d: { bg: 'bg-cyan-500/15', text: 'text-cyan-600', border: 'border-cyan-500/30' },
};

/**
 * Hook para animaciones con animejs
 */
function useAnimeAnimation() {
	const animateEntry = useCallback(async (element: HTMLElement, delay = 0) => {
		const { animate } = await import('animejs');

		animate(element, {
			opacity: [0, 1],
			translateY: [15, 0],
			ease: 'easeOutQuad',
			duration: 400,
			delay,
		});
	}, []);

	const animateHover = useCallback(async (element: HTMLElement, isEntering: boolean) => {
		const { animate } = await import('animejs');

		animate(element, {
			scale: isEntering ? 1.02 : 1,
			y: isEntering ? -2 : 0,
			ease: 'easeOutQuad',
			duration: 200,
		});
	}, []);

	const animateSelection = useCallback(async (element: HTMLElement) => {
		const { animate } = await import('animejs');

		animate(element, {
			scale: [1, 1.02, 1],
			ease: 'easeInOutQuad',
			duration: 300,
		});
	}, []);

	return { animateEntry, animateHover, animateSelection };
}

interface MediaItemV3Props {
	item: BrowserItem;
	size?: number;
	isSelected?: boolean;
	isActive?: boolean;
	layoutItem?: boolean;
	layoutOrder?: number;
	variant?: 'grid' | 'list' | 'masonry' | 'card';
	animateIn?: boolean;
	onClick?: (e: React.MouseEvent) => void;
	onDoubleClick?: () => void;
	onContextMenu?: (e: React.MouseEvent) => void;
	className?: string;
	style?: React.CSSProperties;
	testId?: string;
}

/**
 * Componente Media Item v3 - Grid/Cards Variant
 */
const MediaItemGridV3 = memo(function MediaItemGridV3({
	item,
	size = 180,
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
}: MediaItemV3Props) {
	const itemRef = useRef<HTMLButtonElement>(null);
	const { animateEntry, animateHover, animateSelection } = useAnimeAnimation();
	const colors = ENTITY_COLORS[item.entityType] || ENTITY_COLORS.document;

	useEffect(() => {
		if (!(animateIn && layoutItem && itemRef.current)) return;

		const delay = layoutOrder != null ? Math.min(layoutOrder * 30, 300) : 0;
		animateEntry(itemRef.current, delay);
	}, [animateIn, layoutItem, layoutOrder, animateEntry]);

	useEffect(() => {
		if (isSelected && itemRef.current) {
			animateSelection(itemRef.current);
		}
	}, [isSelected, animateSelection]);

	const handleMouseEnter = () => {
		if (itemRef.current) animateHover(itemRef.current, true);
	};

	const handleMouseLeave = () => {
		if (itemRef.current) animateHover(itemRef.current, false);
	};

	// Item sintético ".."
	if (item.isSynthetic && item.name === '..') {
		return (
			<button
				className={cn(
					'group relative flex flex-col items-center justify-center gap-2',
					'rounded-lg border-2 border-border/40 bg-card p-3',
					'transition-shadow duration-300',
					'hover:border-border/60 hover:shadow-dt-2',
					isSelected && 'border-l-[3px] border-l-primary shadow-dt-2',
					isActive && 'ring-1 ring-primary/30',
					className
				)}
				data-testid={testId}
				onClick={onClick}
				onContextMenu={onContextMenu}
				onDoubleClick={onDoubleClick}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				ref={itemRef}
				style={{ width: size, height: size, ...style }}
				type="button"
			>
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
					<CornerUpLeft className="h-8 w-8 text-muted-foreground" />
				</div>
				<span className="font-medium text-muted-foreground text-sm">Subir nivel</span>
			</button>
		);
	}

	// Carpetas
	if (item.entityType === 'folder') {
		return (
			<button
				className={cn(
					'group relative flex flex-col rounded-lg',
					'border-2 border-border/40 bg-card p-2',
					'transition-all duration-300',
					// Hover elegante
					'hover:border-border/60 hover:shadow-dt-2',
					// Selected con borde lateral
					isSelected && 'border-l-[3px] border-l-primary shadow-dt-2',
					// Active
					isActive && 'ring-1 ring-primary/30',
					className
				)}
				data-entity-type={item.entityType}
				data-item-id={item.id}
				data-testid={testId}
				onClick={onClick}
				onContextMenu={onContextMenu}
				onDoubleClick={onDoubleClick}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				ref={itemRef}
				style={{ width: size, ...style }}
				type="button"
			>
				{/* Thumbnail area */}
				<div
					className="relative mb-2 flex items-center justify-center overflow-hidden rounded-lg border border-border/20"
					style={{ height: size * 0.65, backgroundColor: item.color || 'hsl(var(--muted))' }}
				>
					{item.emoji ? (
						<span className="text-4xl drop-shadow-md">{item.emoji}</span>
					) : (
						<Folder className="h-1/3 w-1/3 text-amber-500" />
					)}
					{/* Overlay al hover */}
					<div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
				</div>

				{/* Info */}
				<div className="min-w-0 flex-1 px-1">
					<h4 className="truncate font-medium text-sm" title={item.name}>
						{item.name}
					</h4>
					<div className="mt-1 flex items-center gap-2">
						<span className={cn('rounded px-1.5 py-0.5 text-xs', colors.bg, colors.text)}>carpeta</span>
						{item.totalItems !== undefined && (
							<span className="text-muted-foreground text-xs">{item.totalItems} items</span>
						)}
					</div>
				</div>
			</button>
		);
	}

	// Archivos multimedia
	const mediaItem: MediaItem = {
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

	return (
		<button
			className={cn(
				'group relative flex flex-col rounded-lg',
				'border-2 border-border/40 bg-card p-2',
				'transition-all duration-300',
				// Hover elegante
				'hover:border-border/60 hover:shadow-dt-2',
				// Selected con borde lateral
				isSelected && 'border-l-[3px] border-l-primary shadow-dt-2',
				// Active
				isActive && 'ring-1 ring-primary/30',
				className
			)}
			data-entity-type={item.entityType}
			data-item-id={item.id}
			data-testid={testId}
			onClick={onClick}
			onContextMenu={onContextMenu}
			onDoubleClick={onDoubleClick}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			ref={itemRef}
			style={{ width: size, ...style }}
			type="button"
		>
			{/* Thumbnail */}
			<div className="relative mb-2 overflow-hidden rounded-lg border border-border/20" style={{ height: size * 0.65 }}>
				<MediaThumbnail className="h-full w-full object-cover" item={mediaItem} lockAspectRatio={true} />

				{/* Overlay con info al hover */}
				<div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
					<div className="p-2">
						<span
							className={cn(
								'rounded px-1.5 py-0.5 font-medium text-[10px] text-white',
								colors.bg.replace('/15', '/80')
							)}
						>
							{item.entityType}
						</span>
						{item.size != null && <span className="ml-2 text-[10px] text-white/90">{formatFileSize(item.size)}</span>}
					</div>
				</div>
			</div>

			{/* Info */}
			<div className="min-w-0 flex-1 px-1">
				<h4 className="truncate font-medium text-sm" title={item.name}>
					{item.name}
				</h4>
				<div className="mt-1 flex items-center gap-2">
					<span className={cn('rounded px-1.5 py-0.5 text-xs', colors.bg, colors.text)}>{item.entityType}</span>
				</div>
			</div>
		</button>
	);
});

/**
 * Componente Media Item v3 - List Variant
 */
const MediaItemListV3 = memo(function MediaItemListV3({
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
}: MediaItemV3Props) {
	const itemRef = useRef<HTMLButtonElement>(null);
	const { animateEntry, animateHover } = useAnimeAnimation();
	const colors = ENTITY_COLORS[item.entityType] || ENTITY_COLORS.document;

	useEffect(() => {
		if (!(animateIn && layoutItem && itemRef.current)) return;

		const delay = layoutOrder != null ? Math.min(layoutOrder * 20, 200) : 0;
		animateEntry(itemRef.current, delay);
	}, [animateIn, layoutItem, layoutOrder, animateEntry]);

	const handleMouseEnter = () => {
		if (itemRef.current) animateHover(itemRef.current, true);
	};

	const handleMouseLeave = () => {
		if (itemRef.current) animateHover(itemRef.current, false);
	};

	// Item sintético
	if (item.isSynthetic && item.name === '..') {
		return (
			<button
				className={cn(
					'flex w-full items-center gap-3 px-3 py-2',
					'border-border/30 border-b',
					'transition-colors duration-200',
					'hover:bg-muted/50',
					isSelected && 'border-l-[3px] border-l-primary bg-muted/80',
					isActive && 'ring-1 ring-primary/30 ring-inset',
					className
				)}
				data-testid={testId}
				onClick={onClick}
				onContextMenu={onContextMenu}
				onDoubleClick={onDoubleClick}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				ref={itemRef}
				style={style}
				type="button"
			>
				<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
					<CornerUpLeft className="h-4 w-4 text-muted-foreground" />
				</div>
				<span className="font-medium text-muted-foreground text-sm">Subir nivel</span>
			</button>
		);
	}

	// Carpeta
	if (item.entityType === 'folder') {
		return (
			<button
				className={cn(
					'flex w-full items-center gap-3 px-3 py-2',
					'border-border/30 border-b',
					'transition-all duration-200',
					'hover:bg-muted/50 hover:pl-4',
					isSelected && 'border-l-[3px] border-l-primary bg-muted/80',
					isActive && 'ring-1 ring-primary/30 ring-inset',
					className
				)}
				data-entity-type={item.entityType}
				data-item-id={item.id}
				data-testid={testId}
				onClick={onClick}
				onContextMenu={onContextMenu}
				onDoubleClick={onDoubleClick}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				ref={itemRef}
				style={style}
				type="button"
			>
				<div
					className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
					style={{ backgroundColor: item.color || 'hsl(var(--muted))' }}
				>
					{item.emoji ? <span className="text-sm">{item.emoji}</span> : <Folder className="h-4 w-4 text-amber-500" />}
				</div>
				<div className="min-w-0 flex-1 text-left">
					<div className="truncate font-medium text-sm">{item.name}</div>
					<div className="flex items-center gap-2 text-muted-foreground text-xs">
						<span className={cn('rounded px-1', colors.bg, colors.text)}>carpeta</span>
						{item.totalItems !== undefined && <span>{item.totalItems} items</span>}
					</div>
				</div>
			</button>
		);
	}

	// Archivo multimedia
	const mediaItem: MediaItem = {
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

	return (
		<button
			className={cn(
				'flex w-full items-center gap-3 px-3 py-2',
				'border-border/30 border-b',
				'transition-all duration-200',
				'hover:bg-muted/50 hover:pl-4',
				isSelected && 'border-l-[3px] border-l-primary bg-muted/80',
				isActive && 'ring-1 ring-primary/30 ring-inset',
				className
			)}
			data-entity-type={item.entityType}
			data-item-id={item.id}
			data-testid={testId}
			onClick={onClick}
			onContextMenu={onContextMenu}
			onDoubleClick={onDoubleClick}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			ref={itemRef}
			style={style}
			type="button"
		>
			<div className="h-8 w-8 shrink-0 overflow-hidden rounded border border-border/20">
				<MediaThumbnail className="h-full w-full object-cover" item={mediaItem} />
			</div>
			<div className="min-w-0 flex-1 text-left">
				<div className="truncate font-medium text-sm">{item.name}</div>
				<div className="flex items-center gap-3 text-muted-foreground text-xs">
					<span className={cn('rounded px-1', colors.bg, colors.text)}>{item.entityType}</span>
					{item.size != null && <span>{formatFileSize(item.size)}</span>}
					{item.createdAt && <span>{new Date(item.createdAt).toLocaleDateString('es-ES')}</span>}
				</div>
			</div>
		</button>
	);
});

export { MediaItemGridV3, MediaItemListV3 };
export type { MediaItemV3Props };

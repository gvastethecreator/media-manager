/**
 * @file Media Item v3 - Componente mejorado con animejs
 * @module file-browser-new/components/media-item-v3
 * @description Items multimedia con animaciones fluidas y estilos sutiles
 */

import { CornerUpLeft, Folder } from 'lucide-react';
import type { CSSProperties } from 'react';
import { memo, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils/format.utils';
import type { BrowserItem } from '../types/item.types';
import { MediaThumbnail } from './media-thumbnail/media-thumbnail';
import type { MediaItem } from './media-thumbnail/types';

/**
 * Colores de entidad consistentes
 */
const ENTITY_TOKENS: Record<string, string> = {
	folder: 'var(--entity-folder)',
	image: 'var(--entity-image)',
	video: 'var(--entity-video)',
	audio: 'var(--entity-audio)',
	document: 'var(--dt-danger-500)',
	jsonFile: 'var(--dt-warning-500)',
	file3d: 'var(--dt-success-500)',
};

const DEFAULT_ENTITY_TOKEN = 'var(--dt-primary-500)';

const ANIMATED_ITEM_IDS = new Set<string>();

function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

function getEntityToken(entityType?: string): string {
	if (!entityType) return DEFAULT_ENTITY_TOKEN;
	return ENTITY_TOKENS[entityType] ?? DEFAULT_ENTITY_TOKEN;
}

function getThumbHeight({
	variant,
	size,
	item,
}: {
	variant: MediaItemV3Props['variant'];
	size: number;
	item: BrowserItem;
}): number {
	if (variant === 'masonry') {
		const aspectRatio = item.width && item.height ? item.width / item.height : 1;
		const estimated = Math.round(size / aspectRatio);
		return Math.max(Math.round(size * 0.6), Math.min(Math.round(size * 1.8), estimated));
	}
	if (variant === 'card') return Math.round(size * 0.72);
	return Math.round(size * 0.75);
}

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
	variant = 'grid',
}: MediaItemV3Props) {
	const itemRef = useRef<HTMLButtonElement>(null);
	const { animateEntry, animateHover, animateSelection } = useAnimeAnimation();
	const entityToken = getEntityToken(item.entityType);
	const thumbHeight = getThumbHeight({ variant, size, item });
	const isCompact = variant === 'grid' || variant === 'masonry';

	useEffect(() => {
		if (!(animateIn && layoutItem && itemRef.current)) return;
		if (prefersReducedMotion()) return;
		if (ANIMATED_ITEM_IDS.has(item.id)) return;

		ANIMATED_ITEM_IDS.add(item.id);
		const delay = layoutOrder != null ? Math.min(layoutOrder * 24, 240) : 0;
		animateEntry(itemRef.current, delay);
	}, [animateIn, layoutItem, layoutOrder, animateEntry, item.id]);

	useEffect(() => {
		if (isSelected && itemRef.current) {
			animateSelection(itemRef.current);
		}
	}, [isSelected, animateSelection]);

	const handleMouseEnter = () => {
		if (itemRef.current && !prefersReducedMotion()) animateHover(itemRef.current, true);
	};

	const handleMouseLeave = () => {
		if (itemRef.current && !prefersReducedMotion()) animateHover(itemRef.current, false);
	};

	// Item sintético ".."
	if (item.isSynthetic && item.name === '..') {
		return (
			<button
				className={cn(
					'group relative flex flex-col items-center justify-center gap-2',
					'rounded-lg border border-border/30 bg-card/80 p-3',
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
				style={{ width: size, height: size, ...style, '--fb-entity-color': entityToken } as CSSProperties}
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
					isCompact ? 'border border-border/30 bg-card/70 p-1.5' : 'border-2 border-border/40 bg-card p-2',
					'transition-all duration-300',
					'hover:border-border/60 hover:shadow-dt-2',
					isSelected && 'border-l-[3px] border-l-primary shadow-dt-2',
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
				style={{ '--fb-entity-color': entityToken, ...style } as CSSProperties}
				type="button"
			>
				{/* Thumbnail area */}
				<div
					className="relative flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-lg border border-border/20"
					style={{ backgroundColor: item.color || 'hsl(var(--muted))' }}
				>
					{item.emoji ? (
						<span className="text-4xl drop-shadow-md">{item.emoji}</span>
					) : (
						<Folder className="h-1/3 w-1/3 text-(--fb-entity-color)" />
					)}
					{/* Overlay al hover */}
					<div className="fb-thumb-overlay absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
				</div>

				{/* Info - solo si no es masonry */}
				{variant !== 'masonry' && (
					<div className="mt-2 min-w-0 flex-1 px-1">
						<h4 className="truncate font-medium text-sm" title={item.name}>
							{item.name}
						</h4>
						<div className="mt-1 flex items-center gap-2">
							<span className="fb-entity-badge rounded px-1.5 py-0.5 text-xs">carpeta</span>
							{item.totalItems !== undefined && (
								<span className="text-muted-foreground text-xs">{item.totalItems} items</span>
							)}
						</div>
					</div>
				)}
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
				isCompact ? 'border border-border/30 bg-card/70 p-1.5' : 'border-2 border-border/40 bg-card p-2',
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
			style={{ '--fb-entity-color': entityToken, ...style } as CSSProperties}
			type="button"
		>
			{/* Thumbnail */}
			<div className="relative aspect-4/3 w-full overflow-hidden rounded-lg border border-border/20">
				<MediaThumbnail className="h-full w-full object-cover" item={mediaItem} lockAspectRatio={true} />

				{/* Overlay con info al hover */}
				<div className="fb-thumb-overlay absolute inset-0 flex flex-col justify-end opacity-0 transition-opacity duration-300 group-hover:opacity-100">
					<div className="p-2">
						<span className="fb-entity-badge fb-entity-badge--overlay rounded px-1.5 py-0.5 font-medium text-[10px]">
							{item.entityType}
						</span>
						{item.size != null && <span className="ml-2 text-[10px] text-white/90">{formatFileSize(item.size)}</span>}
					</div>
				</div>
			</div>

			{/* Info - solo si no es masonry */}
			{variant !== 'masonry' && (
				<div className="mt-2 min-w-0 flex-1 px-1">
					<h4 className="truncate font-medium text-sm" title={item.name}>
						{item.name}
					</h4>
					{variant === 'card' && (
						<div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-xs">
							{item.size != null && <span>{formatFileSize(item.size)}</span>}
							{item.width && item.height && (
								<span>
									{item.width}×{item.height}
								</span>
							)}
							{item.createdAt && <span>{new Date(item.createdAt).toLocaleDateString('es-ES')}</span>}
						</div>
					)}
					{variant === 'grid' && (
						<div className="mt-1 flex items-center gap-2">
							<span className="fb-entity-badge rounded px-1.5 py-0.5 text-xs">{item.entityType}</span>
						</div>
					)}
				</div>
			)}
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
	const entityToken = getEntityToken(item.entityType);

	useEffect(() => {
		if (!(animateIn && layoutItem && itemRef.current)) return;
		if (prefersReducedMotion()) return;
		if (ANIMATED_ITEM_IDS.has(item.id)) return;

		ANIMATED_ITEM_IDS.add(item.id);
		const delay = layoutOrder != null ? Math.min(layoutOrder * 16, 160) : 0;
		animateEntry(itemRef.current, delay);
	}, [animateIn, layoutItem, layoutOrder, animateEntry, item.id]);

	const handleMouseEnter = () => {
		if (itemRef.current && !prefersReducedMotion()) animateHover(itemRef.current, true);
	};

	const handleMouseLeave = () => {
		if (itemRef.current && !prefersReducedMotion()) animateHover(itemRef.current, false);
	};

	// Item sintético
	if (item.isSynthetic && item.name === '..') {
		return (
			<button
				className={cn(
					'flex w-full items-center gap-4 rounded-lg px-4 py-3',
					'border border-border/30 bg-card/50',
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
				style={{ ...style, '--fb-entity-color': entityToken } as CSSProperties}
				type="button"
			>
				<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
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
					'flex w-full items-center gap-4 rounded-lg px-4 py-3',
					'border border-border/30 bg-card/50',
					'transition-all duration-200',
					'hover:bg-muted/50 hover:shadow-sm',
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
				style={{ ...style, '--fb-entity-color': entityToken } as CSSProperties}
				type="button"
			>
				<div
					className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
					style={{ backgroundColor: item.color || 'hsl(var(--muted))' }}
				>
					{item.emoji ? <span className="text-sm">{item.emoji}</span> : <Folder className="h-4 w-4 text-amber-500" />}
				</div>
				<div className="min-w-0 flex-1 text-left">
					<div className="truncate font-medium text-sm">{item.name}</div>
					<div className="mt-1 flex items-center gap-3 text-muted-foreground text-xs">
						<span className="fb-entity-badge rounded px-1.5 py-0.5">carpeta</span>
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
				'flex w-full items-center gap-4 rounded-lg px-4 py-3',
				'border border-border/30 bg-card/50',
				'transition-all duration-200',
				'hover:bg-muted/50 hover:shadow-sm',
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
			style={{ ...style, '--fb-entity-color': entityToken } as CSSProperties}
			type="button"
		>
			<div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border/20">
				<MediaThumbnail className="h-full w-full object-cover" item={mediaItem} />
			</div>
			<div className="min-w-0 flex-1 text-left">
				<div className="truncate font-medium text-sm">{item.name}</div>
				<div className="mt-1 flex items-center gap-3 text-muted-foreground text-xs">
					<span className="fb-entity-badge rounded px-1.5 py-0.5">{item.entityType}</span>
					{item.size != null && <span>{formatFileSize(item.size)}</span>}
					{item.width && item.height && (
						<span>
							{item.width}×{item.height}
						</span>
					)}
					{item.createdAt && <span>{new Date(item.createdAt).toLocaleDateString('es-ES')}</span>}
				</div>
			</div>
		</button>
	);
});

export { MediaItemGridV3, MediaItemListV3 };
export type { MediaItemV3Props };

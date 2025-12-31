/**
 * @file Vista de Cards para File Browser
 * @module file-browser-new/views/cards
 */

import { CornerUpLeft, Folder } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { type MediaItem, MediaThumbnail } from '../components/media-thumbnail';
import type {
	BrowserEntityType,
	BrowserItem,
	BrowserViewProps,
	CardsViewConfig,
	ClickModifiers,
	ItemContextMenuHandler,
} from '../types';

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
		entityType: item.entityType === 'json' ? 'jsonFile' : (item.entityType as MediaItem['entityType']),
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
			<button
				className={cn(
					'group flex flex-col rounded-xl border bg-card p-3 transition-all',
					'cursor-pointer hover:border-primary/50 hover:shadow-md',
					isSelected && 'border-primary bg-accent shadow-md',
					isActive && 'ring-2 ring-primary/50'
				)}
				data-entity-card
				data-entity-type={item.entityType}
				data-item-id={item.id}
				onClick={onClick}
				onContextMenu={onContextMenu}
				onDoubleClick={onDoubleClick}
				style={{ width: size }}
				type="button"
			>
				<div
					className="relative mb-2 flex items-center justify-center overflow-hidden rounded-lg bg-muted"
					style={{ height: size * 0.65 }}
				>
					<CornerUpLeft className="h-1/3 w-1/3 text-muted-foreground" />
				</div>
				<div className="min-w-0 flex-1">
					<h4 className="truncate font-medium text-muted-foreground text-sm">Subir nivel</h4>
				</div>
			</button>
		);
	}

	// Si es carpeta
	if (item.entityType === 'folder') {
		return (
			<button
				className={cn(
					'group flex flex-col rounded-xl border bg-card p-3 transition-all',
					'cursor-pointer hover:border-primary/50 hover:shadow-md',
					isSelected && 'border-primary bg-accent shadow-md',
					isActive && 'ring-2 ring-primary/50'
				)}
				data-entity-card
				data-entity-type={item.entityType}
				data-item-id={item.id}
				onClick={onClick}
				onContextMenu={onContextMenu}
				onDoubleClick={onDoubleClick}
				style={{ width: size }}
				type="button"
			>
				<div
					className="relative mb-2 flex items-center justify-center overflow-hidden rounded-lg"
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
				<div className="min-w-0 flex-1">
					<h4 className="truncate font-medium text-sm" title={item.name}>
						{item.name}
					</h4>
					{showDetails && (
						<div className="mt-1 flex items-center gap-2 text-muted-foreground text-xs">
							<span className={cn('rounded px-1.5 py-0.5', colorClass)}>carpeta</span>
							{typeof item.totalItems === 'number' && <span>{item.totalItems} items</span>}
						</div>
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
				'group flex flex-col rounded-xl border bg-card p-3 transition-all',
				'cursor-pointer hover:border-primary/50 hover:shadow-md',
				isSelected && 'border-primary bg-accent shadow-md',
				isActive && 'ring-2 ring-primary/50'
			)}
			data-entity-card
			data-entity-type={item.entityType}
			data-item-id={item.id}
			onClick={onClick}
			onContextMenu={onContextMenu}
			onDoubleClick={onDoubleClick}
			style={{ width: size }}
			type="button"
		>
			{/* Thumbnail */}
			<div className="relative mb-2 overflow-hidden rounded-lg" style={{ height: size * 0.65 }}>
				<MediaThumbnail className="h-full w-full object-cover" item={mediaItem} lockAspectRatio />
			</div>

			{/* Info */}
			<div className="min-w-0 flex-1">
				<h4 className="truncate font-medium text-sm" title={item.name}>
					{item.name}
				</h4>

				{showDetails && (
					<div className="mt-1 flex items-center gap-2 text-muted-foreground text-xs">
						<span className={cn('rounded px-1.5 py-0.5', colorClass)}>{item.entityType}</span>
						{item.size != null && <span>{formatFileSize(item.size)}</span>}
					</div>
				)}
			</div>
		</button>
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
			<div className="h-full w-full" data-testid="cards-view">
				<div className="flex flex-wrap p-3" data-testid="cards-view-container" style={{ gap: `${gap}px` }}>
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
		</div>
	);
}

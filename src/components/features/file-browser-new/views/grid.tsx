/**
 * @file Vista de Grid para File Browser
 * @module file-browser-new/views/grid
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { MediaThumbnail } from '../components/media-thumbnail/media-thumbnail';
import type { BrowserItem } from '../types/item.types';
import type { BrowserViewProps, ClickModifiers, ItemContextMenuHandler } from '../types/props.types';
import type { GridViewConfig } from '../types/view.types';

export interface GridViewProps extends Omit<BrowserViewProps, 'config'> {
	/** ID activo */
	activeId?: string | null;
	/** Configuración de grid */
	config: GridViewConfig;
	/** Tamaño de item (override) */
	itemSize?: number;
	/** Handler de context menu */
	onItemContextMenu?: ItemContextMenuHandler;
	/** Página actual (para paginación) */
	page?: number;
	/** Tamaño de página */
	pageSize?: number;
	/** IDs seleccionados */
	selectedIds?: Set<string>;
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
	onLayoutRootReady,
	layoutItemLimit = 120,
	suppressAppearAnimation,
	virtualization,
	selectedIds = new Set(),
	activeId,
}: GridViewProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);
	const [containerWidth, setContainerWidth] = useState(0);
	const [containerHeight, setContainerHeight] = useState(0);

	const itemSize = itemSizeOverride ?? config.itemSize;
	const gap = config.gap;
	const virtualizationConfig = virtualization ?? {
		enabled: false,
		threshold: Number.POSITIVE_INFINITY,
		overscan: 0,
		estimatedItemHeight: itemSize,
		maxItems: Number.POSITIVE_INFINITY,
	};

	// Paginación controlada
	const displayItems = useMemo(() => {
		if (typeof page === 'number') {
			const start = page * pageSize;
			return items.slice(start, start + pageSize);
		}
		return items;
	}, [items, page, pageSize]);
	const shouldVirtualize = virtualizationConfig.enabled && displayItems.length >= virtualizationConfig.threshold;
	const allowAppearAnimation = !(suppressAppearAnimation || shouldVirtualize);
	const safeWidth = Math.max(containerWidth, itemSize);
	const columns = Math.max(1, Math.floor((safeWidth + gap) / (itemSize + gap)));
	const actualItemWidth = Math.max(1, Math.round((safeWidth - gap * (columns - 1)) / columns));
	const itemHeight = actualItemWidth;
	const rowHeight = itemHeight + gap;
	const rowCount = Math.ceil(displayItems.length / columns);
	const overscanRows = Math.max(
		virtualizationConfig.overscan,
		containerHeight > 0 ? Math.ceil(containerHeight / rowHeight) : 0
	);
	const rowVirtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => containerRef.current,
		estimateSize: () => rowHeight,
		overscan: overscanRows,
	});

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setContainerWidth(entry.contentRect.width);
				setContainerHeight(entry.contentRect.height);
			}
		});

		observer.observe(container);
		setContainerWidth(container.clientWidth);
		setContainerHeight(container.clientHeight);

		return () => observer.disconnect();
	}, []);

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

	const renderGridItem = useCallback(
		(item: BrowserItem, index: number) => {
			const isSelected = selectedIds.has(item.id);
			const isActive = activeId === item.id;
			return (
				<button
					className={cn(
						'group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-muted/50',
						'transition-all duration-200',
						isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:ring-1 hover:ring-border',
						isActive && 'ring-2 ring-primary/70'
					)}
					data-item-id={item.id}
					key={item.id}
					onClick={(e) => handleItemClick(item, e)}
					onContextMenu={(e) => handleItemContextMenu(item, e)}
					onDoubleClick={() => handleItemDoubleClick(item)}
					type="button"
				>
					{/* Thumbnail puro - object-cover para llenar el cuadrado */}
					<MediaThumbnail className="h-full w-full" item={item} style={{ objectFit: 'cover' }} />
					{/* Nombre solo en hover */}
					<div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
						<span className="block truncate font-medium text-white text-xs" title={item.name}>
							{item.name}
						</span>
					</div>
				</button>
			);
		},
		[activeId, handleItemClick, handleItemContextMenu, handleItemDoubleClick, selectedIds]
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
			<div className="h-full w-full" data-testid="grid-view">
				{!shouldVirtualize && (
					<div
						className="grid p-4"
						data-testid="grid-view-container"
						ref={(el) => onLayoutRootReady?.(el)}
						style={{
							gridTemplateColumns: `repeat(auto-fill, minmax(${itemSize}px, 1fr))`,
							gap: `${gap}px`,
						}}
					>
						{displayItems.map((item, index) => renderGridItem(item, index))}
					</div>
				)}
				{shouldVirtualize && (
					<div
						className="relative p-3"
						data-testid="grid-view-container"
						ref={(el) => onLayoutRootReady?.(el)}
						style={{ height: rowVirtualizer.getTotalSize() }}
					>
						{rowVirtualizer.getVirtualItems().map((virtualRow) => {
							const from = virtualRow.index * columns;
							const to = Math.min(from + columns, displayItems.length);
							const rowItems = displayItems.slice(from, to);

							return (
								<div
									className="grid"
									key={virtualRow.key}
									style={{
										position: 'absolute',
										top: 0,
										left: 0,
										width: '100%',
										transform: `translateY(${virtualRow.start}px)`,
										gridTemplateColumns: `repeat(${columns}, 1fr)`,
										gap: `${gap}px`,
										paddingBottom: `${gap}px`,
									}}
								>
									{rowItems.map((item, index) => {
										return renderGridItem(item, from + index);
									})}
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}

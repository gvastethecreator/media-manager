/**
 * @file Vista de Grid para File Browser
 * @module file-browser-new/views/grid
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MediaItemGrid } from '../components/media-item';
import type { BrowserItem, BrowserViewProps, ClickModifiers, GridViewConfig, ItemContextMenuHandler } from '../types';

export interface GridViewProps extends Omit<BrowserViewProps, 'config'> {
	/** Configuración de grid */
	config: GridViewConfig;
	/** Tamaño de item (override) */
	itemSize?: number;
	/** Página actual (para paginación) */
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
	const safeWidth = Math.max(containerWidth, itemSize);
	const columns = Math.max(1, Math.floor((safeWidth + gap) / (itemSize + gap)));
	const columnWidth = Math.max(itemSize, Math.floor((safeWidth - gap * (columns - 1)) / columns));
	const rowCount = Math.ceil(displayItems.length / columns);
	const rowVirtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => containerRef.current,
		estimateSize: () => itemSize + gap,
		overscan: virtualizationConfig.overscan,
	});

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
			<div className="h-full w-full" data-testid="grid-view">
				{!shouldVirtualize && (
					<div
						className="grid p-2"
						data-testid="grid-view-container"
						ref={(el) => onLayoutRootReady?.(el)}
						style={{
							gridTemplateColumns: `repeat(auto-fill, minmax(${itemSize}px, 1fr))`,
							gap: `${gap}px`,
						}}
					>
						{displayItems.map((item, index) => (
							<MediaItemGrid
								animateIn={!suppressAppearAnimation}
								isActive={activeId === item.id}
								isSelected={selectedIds.has(item.id)}
								item={item}
								key={item.id}
								layoutItem={index < layoutItemLimit}
								layoutOrder={index}
								onClick={(e) => handleItemClick(item, e)}
								onContextMenu={(e) => handleItemContextMenu(item, e)}
								onDoubleClick={() => handleItemDoubleClick(item)}
								size={itemSize}
							/>
						))}
					</div>
				)}
				{shouldVirtualize && (
					<div
						className="relative p-2"
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
									className="flex"
									key={virtualRow.key}
									style={{
										position: 'absolute',
										top: 0,
										left: 0,
										width: '100%',
										transform: `translateY(${virtualRow.start}px)`,
										gap: `${gap}px`,
									}}
								>
									{rowItems.map((item, index) => (
										<MediaItemGrid
											animateIn={!suppressAppearAnimation}
											isActive={activeId === item.id}
											isSelected={selectedIds.has(item.id)}
											item={item}
											key={item.id}
											layoutItem={from + index < layoutItemLimit}
											layoutOrder={from + index}
											onClick={(e) => handleItemClick(item, e)}
											onContextMenu={(e) => handleItemContextMenu(item, e)}
											onDoubleClick={() => handleItemDoubleClick(item)}
											size={columnWidth}
										/>
									))}
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}

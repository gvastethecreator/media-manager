/**
 * @file Vista de Masonry para File Browser
 * @module file-browser-new/views/masonry
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MediaItemGrid } from '../components/media-item';
import type { BrowserItem } from '../types/item.types';
import type { BrowserViewProps, ClickModifiers, ItemContextMenuHandler } from '../types/props.types';
import type { MasonryViewConfig } from '../types/view.types';

export interface MasonryViewProps extends Omit<BrowserViewProps, 'config'> {
	/** Configuración de masonry */
	config: MasonryViewConfig;
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

/**
 * Calcula layout de masonry (columnas con alturas balanceadas)
 */
function calculateMasonryLayout(
	items: BrowserItem[],
	containerWidth: number,
	columnWidth: number,
	gap: number
): { columns: BrowserItem[][]; columnWidth: number } {
	const numColumns = Math.max(1, Math.floor((containerWidth + gap) / (columnWidth + gap)));
	const actualColumnWidth = (containerWidth - gap * (numColumns - 1)) / numColumns;

	const columns: BrowserItem[][] = Array.from({ length: numColumns }, () => []);
	const columnHeights: number[] = new Array(numColumns).fill(0);

	for (const item of items) {
		// Encontrar columna más corta
		const shortestCol = columnHeights.indexOf(Math.min(...columnHeights));

		// Calcular altura del item (basado en aspect ratio o altura por defecto)
		const aspectRatio = item.width && item.height ? item.width / item.height : 1;
		const itemHeight = actualColumnWidth / aspectRatio;

		columns[shortestCol].push(item);
		columnHeights[shortestCol] += itemHeight + gap;
	}

	return { columns, columnWidth: actualColumnWidth };
}

export function MasonryView({
	items,
	onItemClick,
	onItemDoubleClick,
	onItemContextMenu,
	config,
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
}: MasonryViewProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);
	const [containerWidth, setContainerWidth] = useState(800);

	const columnWidth = config.columnWidth;
	const gap = config.gap;
	const virtualizationConfig = virtualization ?? {
		enabled: false,
		threshold: Number.POSITIVE_INFINITY,
		overscan: 0,
		estimatedItemHeight: columnWidth,
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

	// Observar cambios de tamaño del contenedor
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

	const safeWidth = Math.max(containerWidth, columnWidth);
	const columnCount = Math.max(1, Math.floor((safeWidth + gap) / (columnWidth + gap)));
	const actualColumnWidth = (safeWidth - gap * (columnCount - 1)) / columnCount;
	const estimateHeight = useCallback(
		(index: number) => {
			const item = displayItems[index];
			if (!item) return columnWidth;
			const aspectRatio = item.width && item.height ? item.width / item.height : 1;
			return actualColumnWidth / aspectRatio + gap;
		},
		[displayItems, actualColumnWidth, columnWidth, gap]
	);
	const virtualizer = useVirtualizer({
		count: displayItems.length,
		getScrollElement: () => containerRef.current,
		estimateSize: estimateHeight,
		overscan: virtualizationConfig.overscan,
		lanes: columnCount,
	});

	// Calcular layout no virtualizado
	const layout = useMemo(() => {
		return calculateMasonryLayout(displayItems, containerWidth, columnWidth, gap);
	}, [displayItems, containerWidth, columnWidth, gap]);

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
			<div className="h-full w-full" data-testid="masonry-view">
				{!shouldVirtualize && (
					<div
						className="flex p-2"
						data-testid="masonry-view-container"
						ref={(el) => onLayoutRootReady?.(el)}
						style={{ gap: `${gap}px` }}
					>
						{layout.columns.map((column, colIndex) => {
							let columnIndexOffset = 0;
							for (let i = 0; i < colIndex; i++) {
								columnIndexOffset += layout.columns[i].length;
							}
							return (
								<div className="flex flex-col" key={colIndex} style={{ width: layout.columnWidth, gap: `${gap}px` }}>
									{column.map((item, itemIndex) => {
										const layoutIndex = columnIndexOffset + itemIndex;
										return (
											<MediaItemGrid
												animateIn={!suppressAppearAnimation}
												isActive={activeId === item.id}
												isSelected={selectedIds.has(item.id)}
												item={item}
												key={item.id}
												layoutItem={layoutIndex < layoutItemLimit}
												layoutOrder={layoutIndex}
												onClick={(e) => handleItemClick(item, e)}
												onContextMenu={(e) => handleItemContextMenu(item, e)}
												onDoubleClick={() => handleItemDoubleClick(item)}
												size={Math.round(layout.columnWidth)}
												variant="masonry"
											/>
										);
									})}
								</div>
							);
						})}
					</div>
				)}
				{shouldVirtualize && (
					<div
						className="relative p-2"
						data-testid="masonry-view-container"
						ref={(el) => onLayoutRootReady?.(el)}
						style={{
							height: virtualizer.getTotalSize(),
							width: actualColumnWidth * columnCount + gap * (columnCount - 1),
						}}
					>
						{virtualizer.getVirtualItems().map((virtualItem) => {
							const item = displayItems[virtualItem.index];
							if (!item) return null;
							const x = virtualItem.lane * (actualColumnWidth + gap);
							const shouldLayout = virtualItem.index < layoutItemLimit;
							return (
								<div
									data-index={virtualItem.index}
									key={item.id}
									ref={virtualizer.measureElement}
									style={{
										position: 'absolute',
										top: 0,
										left: 0,
										width: actualColumnWidth,
										transform: `translate(${x}px, ${virtualItem.start}px)`,
									}}
								>
									<MediaItemGrid
										animateIn={!suppressAppearAnimation}
										isActive={activeId === item.id}
										isSelected={selectedIds.has(item.id)}
										item={item}
										layoutItem={shouldLayout}
										layoutOrder={virtualItem.index}
										onClick={(e) => handleItemClick(item, e)}
										onContextMenu={(e) => handleItemContextMenu(item, e)}
										onDoubleClick={() => handleItemDoubleClick(item)}
										size={Math.round(actualColumnWidth)}
										variant="masonry"
									/>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}

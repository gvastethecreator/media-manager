/**
 * @file Vista de Cards para File Browser
 * @module file-browser-new/views/cards
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MediaItemGridV3 } from '@/components/features/file-browser-new/components/media-item-v3';
import type { BrowserItem } from '../types/item.types';
import type { BrowserViewProps, ClickModifiers, ItemContextMenuHandler } from '../types/props.types';
import type { CardsViewConfig } from '../types/view.types';

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
	onLayoutRootReady,
	layoutItemLimit = 120,
	suppressAppearAnimation,
	virtualization,
	selectedIds = new Set(),
	activeId,
}: CardsViewProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);
	const [containerWidth, setContainerWidth] = useState(0);

	const cardSize = config.cardSize;
	const gap = config.gap;
	const virtualizationConfig = virtualization ?? {
		enabled: false,
		threshold: Number.POSITIVE_INFINITY,
		overscan: 0,
		estimatedItemHeight: cardSize,
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
	const safeWidth = Math.max(containerWidth, cardSize);
	const columns = Math.max(1, Math.floor((safeWidth + gap) / (cardSize + gap)));
	const columnWidth = Math.max(cardSize, Math.floor((safeWidth - gap * (columns - 1)) / columns));
	const rowCount = Math.ceil(displayItems.length / columns);
	const rowVirtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => containerRef.current,
		estimateSize: () => cardSize + gap,
		overscan: virtualizationConfig.overscan,
	});

	// Scroll al inicio cuando cambia la página
	useEffect(() => {
		if (typeof page !== 'number') return;
		containerRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
	}, [page]);

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
				{!shouldVirtualize && (
					<div
						className="flex flex-wrap p-3"
						data-testid="cards-view-container"
						ref={(el) => onLayoutRootReady?.(el)}
						style={{ gap: `${gap}px` }}
					>
						{displayItems.map((item, index) => (
							<MediaItemGridV3
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
								size={cardSize}
							/>
						))}
					</div>
				)}
				{shouldVirtualize && (
					<div
						className="relative p-3"
						data-testid="cards-view-container"
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
										<MediaItemGridV3
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

/**
 * @file Vista de Lista para File Browser
 * @module file-browser-new/views/list
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MediaItemList } from '../components/media-item';
import type { BrowserItem } from '../types/item.types';
import type { BrowserViewProps, ClickModifiers, ItemContextMenuHandler } from '../types/props.types';
import type { ListViewConfig } from '../types/view.types';

export interface ListViewProps extends Omit<BrowserViewProps, 'config'> {
	/** Configuración de lista */
	config: ListViewConfig;
	/** IDs seleccionados */
	selectedIds?: Set<string>;
	/** ID activo */
	activeId?: string | null;
	/** Handler de context menu */
	onItemContextMenu?: ItemContextMenuHandler;
}

export function ListView({
	items,
	onItemClick,
	onItemDoubleClick,
	onItemContextMenu,
	config,
	scrollContainer,
	onContainerReady,
	onLayoutRootReady,
	layoutItemLimit = 120,
	suppressAppearAnimation,
	virtualization,
	selectedIds = new Set(),
	activeId,
}: ListViewProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);

	const rowHeight = config.rowHeight;
	const virtualizationConfig = virtualization ?? {
		enabled: false,
		threshold: Number.POSITIVE_INFINITY,
		overscan: 0,
		estimatedItemHeight: rowHeight,
		maxItems: Number.POSITIVE_INFINITY,
	};
	const shouldVirtualize = virtualizationConfig.enabled && items.length >= virtualizationConfig.threshold;
	const rowVirtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => containerRef.current,
		estimateSize: () => rowHeight,
		overscan: virtualizationConfig.overscan,
	});

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
			<div className="h-full w-full" data-testid="list-view">
				<div
					className="relative"
					data-testid="listview-container"
					ref={(el) => onLayoutRootReady?.(el)}
					style={{ height: shouldVirtualize ? rowVirtualizer.getTotalSize() : 'auto' }}
				>
					{shouldVirtualize
						? rowVirtualizer.getVirtualItems().map((virtualRow) => {
								const item = items[virtualRow.index];
								if (!item) return null;
								return (
									<div
										key={item.id}
										style={{
											position: 'absolute',
											top: 0,
											left: 0,
											width: '100%',
											transform: `translateY(${virtualRow.start}px)`,
										}}
									>
										<MediaItemList
											animateIn={!suppressAppearAnimation}
											isActive={activeId === item.id}
											isSelected={selectedIds.has(item.id)}
											item={item}
											layoutItem={virtualRow.index < layoutItemLimit}
											layoutOrder={virtualRow.index}
											onClick={(e) => handleItemClick(item, e)}
											onContextMenu={(e) => handleItemContextMenu(item, e)}
											onDoubleClick={() => handleItemDoubleClick(item)}
											style={{ height: rowHeight }}
											testId={`list-row-${item.id}`}
										/>
									</div>
								);
							})
						: items.map((item, index) => (
								<MediaItemList
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
									style={{ height: rowHeight }}
									testId={`list-row-${item.id}`}
								/>
							))}
				</div>
			</div>
		</div>
	);
}

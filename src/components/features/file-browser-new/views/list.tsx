/**
 * @file Vista de Lista para File Browser
 * @module file-browser-new/views/list
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { Calendar, HardDrive, Tag } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatDate, formatFileSize } from '@/lib/utils/format.utils';
import { MediaThumbnail } from '../components/media-thumbnail/media-thumbnail';
import type { BrowserItem } from '../types/item.types';
import type { BrowserViewProps, ClickModifiers, ItemContextMenuHandler } from '../types/props.types';
import type { ListViewConfig } from '../types/view.types';

export interface ListViewProps extends Omit<BrowserViewProps, 'config'> {
	/** Configuración de lista */
	config: ListViewConfig;
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

export function ListView({
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
}: ListViewProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);
	const [containerHeight, setContainerHeight] = useState(0);

	const rowHeight = config.rowHeight;
	const displayItems = useMemo(() => {
		if (typeof page === 'number') {
			const start = page * pageSize;
			return items.slice(start, start + pageSize);
		}
		return items;
	}, [items, page, pageSize]);
	const virtualizationConfig = virtualization ?? {
		enabled: false,
		threshold: Number.POSITIVE_INFINITY,
		overscan: 0,
		estimatedItemHeight: rowHeight,
		maxItems: Number.POSITIVE_INFINITY,
	};
	const shouldVirtualize = virtualizationConfig.enabled && displayItems.length >= virtualizationConfig.threshold;
	const allowAppearAnimation = !(suppressAppearAnimation || shouldVirtualize);
	const overscanRows = Math.max(
		virtualizationConfig.overscan,
		containerHeight > 0 ? Math.ceil(containerHeight / rowHeight) : 0
	);
	const rowVirtualizer = useVirtualizer({
		count: displayItems.length,
		getScrollElement: () => containerRef.current,
		estimateSize: () => rowHeight,
		overscan: overscanRows,
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

	useEffect(() => {
		if (typeof page !== 'number') return;
		containerRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
	}, [page]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setContainerHeight(entry.contentRect.height);
			}
		});

		observer.observe(container);
		setContainerHeight(container.clientHeight);

		return () => observer.disconnect();
	}, []);

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

	const renderListItem = useCallback(
		(item: BrowserItem, index: number) => {
			const isSelected = selectedIds.has(item.id);
			const isActive = activeId === item.id;
			const raw = item.raw as Record<string, unknown> | undefined;
			const extension = typeof raw?.extension === 'string' ? raw?.extension : undefined;
			const createdAt = item.createdAt ? formatDate(item.createdAt) : undefined;
			const tagCount =
				typeof raw?._count === 'object' && raw._count !== null ? ((raw._count as Record<string, number>).tags ?? 0) : 0;

			return (
				<button
					className={cn(
						'group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left',
						'transition-colors duration-150',
						'hover:bg-muted/50',
						isSelected && 'bg-primary/10 ring-1 ring-primary/40',
						isActive && 'ring-1 ring-primary/70'
					)}
					data-item-id={item.id}
					key={item.id}
					onClick={(e) => handleItemClick(item, e)}
					onContextMenu={(e) => handleItemContextMenu(item, e)}
					onDoubleClick={() => handleItemDoubleClick(item)}
					style={{ height: rowHeight }}
					type="button"
				>
					{/* Thumbnail cuadrado */}
					<div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
						<MediaThumbnail className="h-full w-full" item={item} style={{ objectFit: 'cover' }} />
					</div>

					{/* Nombre - flex-1 para ocupar espacio disponible */}
					<div className="min-w-0 flex-1">
						<span className="block truncate font-medium text-foreground text-sm" title={item.name}>
							{item.name}
						</span>
					</div>

					{/* Metadatos en fila */}
					<div className="flex shrink-0 items-center gap-4 text-muted-foreground text-xs">
						{/* Extensión/Tipo */}
						<span className="w-12 uppercase opacity-60">{extension ?? item.entityType.slice(0, 4)}</span>

						{/* Tamaño */}
						{item.size != null && (
							<span className="flex w-16 items-center gap-1">
								<HardDrive className="h-3 w-3 opacity-50" />
								{formatFileSize(item.size)}
							</span>
						)}

						{/* Fecha */}
						{createdAt && (
							<span className="flex w-20 items-center gap-1">
								<Calendar className="h-3 w-3 opacity-50" />
								{createdAt}
							</span>
						)}

						{/* Tags count */}
						{tagCount > 0 && (
							<span className="flex items-center gap-1">
								<Tag className="h-3 w-3 opacity-50" />
								{tagCount}
							</span>
						)}
					</div>
				</button>
			);
		},
		[activeId, handleItemClick, handleItemContextMenu, handleItemDoubleClick, rowHeight, selectedIds]
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
			<div className="h-full w-full py-4" data-testid="list-view">
				<div
					className="relative flex flex-col gap-3 px-4"
					data-testid="listview-container"
					ref={(el) => onLayoutRootReady?.(el)}
					style={{ height: shouldVirtualize ? rowVirtualizer.getTotalSize() : 'auto' }}
				>
					{shouldVirtualize
						? rowVirtualizer.getVirtualItems().map((virtualRow) => {
								const item = displayItems[virtualRow.index];
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
										{renderListItem(item, virtualRow.index)}
									</div>
								);
							})
						: displayItems.map((item, index) => {
								return renderListItem(item, index);
							})}
				</div>
			</div>
		</div>
	);
}

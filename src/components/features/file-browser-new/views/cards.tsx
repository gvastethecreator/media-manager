/**
 * @file Vista de Cards para File Browser
 * @module file-browser-new/views/cards
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TCG3DCard } from '../components/tcg-cards/tcg-3d-card';
import { TCGAudioCard } from '../components/tcg-cards/tcg-audio-card';
import { TCGCardBase } from '../components/tcg-cards/tcg-card-base';
import { TCGDocumentCard } from '../components/tcg-cards/tcg-document-card';
import { TCGFolderCard } from '../components/tcg-cards/tcg-folder-card';
import { TCGImageCard } from '../components/tcg-cards/tcg-image-card';
import { TCGJsonCard } from '../components/tcg-cards/tcg-json-card';
import { TCGVideoCard } from '../components/tcg-cards/tcg-video-card';
import type { BrowserEntityType, BrowserItem } from '../types/item.types';
import { toTypedBrowserItem } from '../types/item.types';
import type { BrowserViewProps, ClickModifiers, ItemContextMenuHandler } from '../types/props.types';
import type { CardsViewConfig } from '../types/view.types';

export interface CardsViewProps extends Omit<BrowserViewProps, 'config'> {
	/** ID activo */
	activeId?: string | null;
	/** Configuración de cards */
	config: CardsViewConfig;
	/** Handler de context menu */
	onItemContextMenu?: ItemContextMenuHandler;
	/** Página actual */
	page?: number;
	/** Tamaño de página */
	pageSize?: number;
	/** IDs seleccionados */
	selectedIds?: Set<string>;
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
	const [containerWidth, setContainerWidth] = useState(0);
	const [containerHeight, setContainerHeight] = useState(0);

	const cardSize = config.cardSize;
	// Asegurar un gap mínimo de 32px para evitar cartas pegadas
	// Las tarjetas TCG tienen sombras grandes que necesitan más espacio
	const gap = Math.max(config.gap ?? 32, 32);
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
	const allowAppearAnimation = !(suppressAppearAnimation || shouldVirtualize);
	const safeWidth = Math.max(containerWidth, cardSize);
	const columns = Math.max(1, Math.floor((safeWidth + gap) / (cardSize + gap)));
	const actualCardWidth = Math.max(1, Math.round((safeWidth - gap * (columns - 1)) / columns));
	const cardHeight = Math.round(actualCardWidth * 1.32);
	const rowHeight = cardHeight + gap;
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

	// Scroll al inicio cuando cambia la página
	useEffect(() => {
		if (typeof page !== 'number') return;
		containerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
	}, [page]);

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

	const renderCardItem = useCallback(
		(item: BrowserItem, index: number) => {
			const isSelected = selectedIds.has(item.id);
			const isActive = activeId === item.id;

			const baseProps = {
				className: 'tcg-card--hover-reveal',
				height: cardHeight,
				isActive,
				isSelected,
				onClick: (e: React.MouseEvent) => handleItemClick(item, e),
				onContextMenu: (e: React.MouseEvent) => handleItemContextMenu(item, e),
				onDoubleClick: () => handleItemDoubleClick(item),
				variant: 'card' as const,
				width: actualCardWidth,
			};

			switch (item.entityType) {
				case 'image':
					return <TCGImageCard {...baseProps} item={toTypedBrowserItem(item, 'image')} key={item.id} showExif />;
				case 'video':
					return <TCGVideoCard {...baseProps} item={toTypedBrowserItem(item, 'video')} key={item.id} />;
				case 'audio':
					return <TCGAudioCard {...baseProps} item={toTypedBrowserItem(item, 'audio')} key={item.id} />;
				case 'document':
					return <TCGDocumentCard {...baseProps} item={toTypedBrowserItem(item, 'document')} key={item.id} />;
				case 'jsonFile':
					return <TCGJsonCard {...baseProps} item={toTypedBrowserItem(item, 'jsonFile')} key={item.id} />;
				case 'file3d':
					return <TCG3DCard {...baseProps} item={toTypedBrowserItem(item, 'file3d')} key={item.id} />;
				case 'folder':
					return <TCGFolderCard {...baseProps} item={toTypedBrowserItem(item, 'folder')} key={item.id} />;
				default: {
					const fallbackType = item.entityType as BrowserEntityType;
					return (
						<TCGCardBase
							{...baseProps}
							accentColor="var(--dt-primary-500)"
							item={item}
							key={item.id}
							thumbnailContent={
								<div className="flex h-full w-full items-center justify-center text-muted-foreground">
									{fallbackType}
								</div>
							}
							variant="card"
							width={actualCardWidth}
						/>
					);
				}
			}
		},
		[activeId, actualCardWidth, cardHeight, handleItemClick, handleItemContextMenu, handleItemDoubleClick, selectedIds]
	);

	return (
		<div
			className="h-full w-full overflow-auto"
			data-testid="file-browser-scroll-area-viewport"
			ref={(el) => {
				containerRef.current = el;
				onContainerReady?.(el);
			}}
		>
			<div className="h-full w-full" data-testid="cards-view">
				{!shouldVirtualize && (
					<div
						className="grid"
						data-testid="cards-view-container"
						ref={(el) => onLayoutRootReady?.(el)}
						style={{
							gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
							columnGap: `${gap}px`,
							rowGap: `${gap}px`,
							padding: `${Math.max(gap * 2, 40)}px`,
						}}
					>
						{displayItems.map((item, index) => renderCardItem(item, index))}
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
										return renderCardItem(item, from + index);
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

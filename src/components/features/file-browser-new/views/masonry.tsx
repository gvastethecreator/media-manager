/**
 * @file Vista de Masonry para File Browser
 * @module file-browser-new/views/masonry
 * @description Solo para imágenes - sin texto, solo thumbnails
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { MediaThumbnail } from '../components/media-thumbnail/media-thumbnail';
import { TCGCardBase } from '../components/tcg-cards/tcg-card-base';
import type { BrowserItem } from '../types/item.types';
import type { BrowserViewProps, ClickModifiers, ItemContextMenuHandler } from '../types/props.types';
import type { MasonryViewConfig } from '../types/view.types';

// Componente memoizado para thumbnail content
const MasonryThumbnail = memo(function MasonryThumbnail({
	item,
	aspectRatio,
}: {
	item: BrowserItem;
	aspectRatio?: number;
}) {
	return (
		<div className="relative h-full w-full">
			<MediaThumbnail
				className="h-full w-full"
				item={item}
				lockAspectRatio
				predictedAspectRatio={aspectRatio}
				style={{ objectFit: 'cover' }}
			/>
			<div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-linear-to-t from-black/70 via-black/30 to-transparent p-2 opacity-0 transition-all duration-dt-normal ease-dt-out group-hover:translate-y-0 group-hover:opacity-100">
				<span className="block truncate font-medium text-white text-xs drop-shadow-md" title={item.name}>
					{item.name}
				</span>
			</div>
		</div>
	);
});

export interface MasonryViewProps extends Omit<BrowserViewProps, 'config'> {
	/** ID activo */
	activeId?: string | null;
	/** Configuración de masonry */
	config: MasonryViewConfig;
	/** Handler de context menu */
	onItemContextMenu?: ItemContextMenuHandler;
	/** Página actual */
	page?: number;
	/** Tamaño de página */
	pageSize?: number;
	/** IDs seleccionados */
	selectedIds?: Set<string>;
}

// ============================================================================
// CONFIGURACIÓN POR DEFECTO (ajustable vía settings)
// ============================================================================

const MASONRY_LAYOUT_DEFAULTS = {
	columnWidth: 220,
	gap: 12,
	padding: 16,
} as const;

const MASONRY_TCG_DEFAULTS = {
	hoverReveal: true,
	holo: true,
	shadows: true,
	rounded: true,
	tilt: true,
} as const;

const MASONRY_RESPONSIVE_PRESETS = [
	{ max: 480, columnWidth: 180, gap: 8, padding: 12 },
	{ max: 640, columnWidth: 200, gap: 10, padding: 12 },
	{ max: 768, columnWidth: 220, gap: 12, padding: 14 },
	{ max: 1024, columnWidth: 240, gap: 12, padding: 16 },
	{ max: 1280, columnWidth: 260, gap: 14, padding: 20 },
	{ max: 1536, columnWidth: 280, gap: 16, padding: 24 },
] as const;

function getResponsiveLayout(containerWidth: number, base: { columnWidth: number; gap: number; padding: number }) {
	if (containerWidth <= 0) return base;
	const preset = MASONRY_RESPONSIVE_PRESETS.find((p) => containerWidth <= p.max);
	if (!preset) return base;
	return {
		columnWidth: Math.round((preset.columnWidth + base.columnWidth) / 2),
		gap: Math.round((preset.gap + base.gap) / 2),
		padding: Math.round((preset.padding + base.padding) / 2),
	};
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

	const baseColumnWidth = config.columnWidth ?? MASONRY_LAYOUT_DEFAULTS.columnWidth;
	const baseGap = config.gap ?? MASONRY_LAYOUT_DEFAULTS.gap;
	const basePadding = config.padding ?? MASONRY_LAYOUT_DEFAULTS.padding;
	const tcgHoverReveal = config.tcgHoverReveal ?? MASONRY_TCG_DEFAULTS.hoverReveal;
	const tcgHolo = config.tcgHolo ?? MASONRY_TCG_DEFAULTS.holo;
	const tcgShadows = config.tcgShadows ?? MASONRY_TCG_DEFAULTS.shadows;
	const tcgRounded = config.tcgRounded ?? MASONRY_TCG_DEFAULTS.rounded;
	const tcgTilt = config.tcgTilt ?? MASONRY_TCG_DEFAULTS.tilt;
	const responsive = useMemo(
		() => getResponsiveLayout(containerWidth, { columnWidth: baseColumnWidth, gap: baseGap, padding: basePadding }),
		[baseColumnWidth, baseGap, basePadding, containerWidth]
	);
	const columnWidth = responsive.columnWidth;
	const gap = responsive.gap;
	const padding = responsive.padding;
	const virtualizationConfig = virtualization ?? {
		enabled: false,
		threshold: Number.POSITIVE_INFINITY,
		overscan: 0,
		estimatedItemHeight: columnWidth,
		maxItems: Number.POSITIVE_INFINITY,
	};

	// Paginación controlada - solo imágenes para masonry
	const displayItems = useMemo(() => {
		// Filtrar solo imágenes para masonry
		const imageItems = items.filter((item) => item.entityType === 'image');
		if (typeof page === 'number') {
			const start = page * pageSize;
			return imageItems.slice(start, start + pageSize);
		}
		return imageItems;
	}, [items, page, pageSize]);
	const shouldVirtualize = virtualizationConfig.enabled && displayItems.length >= virtualizationConfig.threshold;
	const allowAppearAnimation = !(suppressAppearAnimation || shouldVirtualize);

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

	// Scroll al inicio cuando cambia la página
	useEffect(() => {
		if (typeof page !== 'number') return;
		containerRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
	}, [page]);

	const safeWidth = Math.max(containerWidth, columnWidth);
	const columnCount = Math.max(1, Math.floor((safeWidth + gap) / (columnWidth + gap)));
	const actualColumnWidth = useMemo(
		() => Math.floor((safeWidth - gap * (columnCount - 1)) / columnCount),
		[safeWidth, gap, columnCount]
	);
	const getAspectRatio = useCallback((item: BrowserItem) => {
		const toNumber = (value: unknown) => {
			if (typeof value === 'number') return value;
			if (typeof value === 'string') {
				const parsed = Number(value);
				return Number.isFinite(parsed) ? parsed : undefined;
			}
			return undefined;
		};
		const toRatio = (w: unknown, h: unknown) => {
			const width = toNumber(w);
			const height = toNumber(h);
			if (width == null || height == null || width <= 0 || height <= 0) return undefined;
			const ratio = width / height;
			return Number.isFinite(ratio) && ratio > 0 ? ratio : undefined;
		};

		const baseRatio = toRatio(item.width, item.height);
		if (baseRatio) {
			return baseRatio;
		}

		const statsRatio = toNumber((item.raw as { stats?: { aspectRatio?: number } } | undefined)?.stats?.aspectRatio);
		if (statsRatio && statsRatio > 0) return statsRatio;

		const raw = item.raw as
			| {
					width?: number;
					height?: number;
					thumbnailWidth?: number;
					thumbnailHeight?: number;
					metadata?: string;
			  }
			| undefined;

		const thumbRatio = toRatio(raw?.thumbnailWidth, raw?.thumbnailHeight);
		if (thumbRatio) return thumbRatio;
		const rawRatio = toRatio(raw?.width, raw?.height);
		if (rawRatio) return rawRatio;

		if (raw?.metadata) {
			try {
				const parsed = JSON.parse(raw.metadata) as Record<string, unknown>;
				const parsedRatio = toRatio(parsed.width, parsed.height);
				if (parsedRatio) return parsedRatio;

				const base = parsed.base as { dimensions?: { width?: number; height?: number } } | undefined;
				const baseRatio = toRatio(base?.dimensions?.width, base?.dimensions?.height);
				if (baseRatio) return baseRatio;

				const dimensions = parsed.dimensions as { width?: number; height?: number } | undefined;
				const dimRatio = toRatio(dimensions?.width, dimensions?.height);
				if (dimRatio) return dimRatio;

				const exif = parsed.exif as
					| {
							ExifImageWidth?: number;
							ExifImageHeight?: number;
							ImageWidth?: number;
							ImageHeight?: number;
							imageWidth?: number;
							imageHeight?: number;
					  }
					| undefined;
				const exifWidth = exif?.ExifImageWidth ?? exif?.ImageWidth ?? exif?.imageWidth ?? undefined;
				const exifHeight = exif?.ExifImageHeight ?? exif?.ImageHeight ?? exif?.imageHeight ?? undefined;
				const exifRatio = toRatio(exifWidth, exifHeight);
				if (exifRatio) return exifRatio;
			} catch {
				// Ignorar errores de parsing
			}
		}

		// Fallback: usar aspect ratio típico de fotos de celular (3:4 portrait)
		// Las fotos modernas son más altas que anchas, no cuadradas ni 4:3
		return 3 / 4;
	}, []);

	// Calcular distribución masonry real - items van a la columna más corta
	const masonryLayout = useMemo(() => {
		const columns: Array<Array<{ item: BrowserItem; height: number; aspectRatio: number }>> = new Array(columnCount)
			.fill(null)
			.map(() => []);
		const columnHeights: number[] = new Array(columnCount).fill(0);

		for (const item of displayItems) {
			const aspectRatio = getAspectRatio(item);
			const height = Math.round(actualColumnWidth / aspectRatio);

			// Encontrar columna más corta
			const shortestCol = columnHeights.indexOf(Math.min(...columnHeights));

			columns[shortestCol].push({ item, height, aspectRatio });
			columnHeights[shortestCol] += height + gap;
		}

		return columns;
	}, [displayItems, columnCount, actualColumnWidth, gap, getAspectRatio]);
	const estimateHeight = useCallback(
		(index: number) => {
			const item = displayItems[index];
			if (!item) return columnWidth;
			const aspectRatio = getAspectRatio(item);
			return actualColumnWidth / aspectRatio + gap;
		},
		[displayItems, actualColumnWidth, columnWidth, gap, getAspectRatio]
	);
	const virtualizer = useVirtualizer({
		count: displayItems.length,
		getScrollElement: () => containerRef.current,
		estimateSize: estimateHeight,
		overscan: virtualizationConfig.overscan,
		lanes: columnCount,
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

	// Memoizar item handlers por ID para evitar re-renders
	const itemClickHandlers = useMemo(() => {
		const handlers = new Map<string, (e: React.MouseEvent) => void>();
		for (const item of displayItems) {
			handlers.set(item.id, (e: React.MouseEvent) => {
				const modifiers: ClickModifiers = {
					ctrlKey: e.ctrlKey,
					metaKey: e.metaKey,
					shiftKey: e.shiftKey,
				};
				onItemClick?.(item, modifiers);
			});
		}
		return handlers;
	}, [displayItems, onItemClick]);

	const itemContextMenuHandlers = useMemo(() => {
		const handlers = new Map<string, (e: React.MouseEvent) => void>();
		for (const item of displayItems) {
			handlers.set(item.id, (e: React.MouseEvent) => {
				e.preventDefault();
				onItemContextMenu?.(e, item);
			});
		}
		return handlers;
	}, [displayItems, onItemContextMenu]);

	const itemDoubleClickHandlers = useMemo(() => {
		const handlers = new Map<string, () => void>();
		for (const item of displayItems) {
			handlers.set(item.id, () => {
				onItemDoubleClick?.(item);
			});
		}
		return handlers;
	}, [displayItems, onItemDoubleClick]);

	const renderMasonryItem = useCallback(
		(item: BrowserItem, options: { height?: number; width?: number; aspectRatio?: number }) => {
			const isSelected = selectedIds.has(item.id);
			const isActive = activeId === item.id;
			const width = options.width ?? actualColumnWidth;
			const height = options.height ?? (options.aspectRatio ? width / options.aspectRatio : undefined);
			const tcgClassName = cn(
				tcgHoverReveal && 'tcg-card--hover-reveal',
				!tcgHolo && 'tcg-card--no-holo',
				!tcgShadows && 'tcg-card--no-shadows',
				!tcgRounded && 'tcg-card--no-rounded',
				!tcgTilt && 'tcg-card--no-tilt'
			);

			// Obtener handlers memoizados
			const onClick = itemClickHandlers.get(item.id);
			const onContextMenu = itemContextMenuHandlers.get(item.id);
			const onDoubleClick = itemDoubleClickHandlers.get(item.id);

			return (
				<TCGCardBase
					accentColor="var(--entity-image, oklch(0.7 0.15 280))"
					className={tcgClassName}
					height={height}
					isActive={isActive}
					isSelected={isSelected}
					item={item}
					onClick={onClick}
					onContextMenu={onContextMenu}
					onDoubleClick={onDoubleClick}
					thumbnailContent={<MasonryThumbnail aspectRatio={options.aspectRatio} item={item} />}
					variant="masonry"
					width={width}
				/>
			);
		},
		[
			activeId,
			actualColumnWidth,
			itemClickHandlers,
			itemContextMenuHandlers,
			itemDoubleClickHandlers,
			selectedIds,
			tcgHolo,
			tcgHoverReveal,
			tcgRounded,
			tcgShadows,
			tcgTilt,
		]
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
						className="flex"
						data-testid="masonry-view-container"
						ref={(el) => onLayoutRootReady?.(el)}
						style={{
							padding: `${padding}px`,
							gap: `${gap}px`,
						}}
					>
						{masonryLayout.map((column, colIndex) => (
							<div className="flex flex-col" key={colIndex} style={{ width: actualColumnWidth, gap: `${gap}px` }}>
								{column.map(({ item, height, aspectRatio }) => (
									<div key={item.id} style={{ width: '100%', height }}>
										{renderMasonryItem(item, {
											aspectRatio,
											width: actualColumnWidth,
											height,
										})}
									</div>
								))}
							</div>
						))}
					</div>
				)}
				{shouldVirtualize && (
					<div
						className="relative p-3"
						data-testid="masonry-view-container"
						ref={(el) => onLayoutRootReady?.(el)}
						style={{
							gap: `${gap}px`,
							height: virtualizer.getTotalSize(),
							width: actualColumnWidth * columnCount + gap * (columnCount - 1),
						}}
					>
						{virtualizer.getVirtualItems().map((virtualItem) => {
							const item = displayItems[virtualItem.index];
							if (!item) return null;
							const x = virtualItem.lane * (actualColumnWidth + gap);
							// Calcular altura basada en aspect ratio
							const aspectRatio = getAspectRatio(item);
							const itemHeight = Math.round(actualColumnWidth / aspectRatio);
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
									{renderMasonryItem(item, { height: itemHeight, width: Math.round(actualColumnWidth) })}
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}

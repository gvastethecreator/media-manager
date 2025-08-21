/**
 * GridView mínima reconstruida.
 * Requisitos actuales:
 * - Renderizar items en grid responsive.
 * - Resaltar selección.
 * - Delegar eventos click / double click al FileBrowser.
 * - Sin virtualización avanzada (se puede reintroducir luego si >200 items).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OptimizedEntityCard } from '@/components/cards/entity-card';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/migration';

export interface GridViewProps {
	items: AnyEntityWithStats[];
	selectedIds: string[];
	containerWidth: number;
	itemSize?: number;
	interfaceConfig?: any; // objeto derivado de FileBrowser
	onItemClick?: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick?: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
}

export const GridView: React.FC<GridViewProps> = React.memo(
	({ items, selectedIds, containerWidth, itemSize = 160, interfaceConfig, onItemClick, onItemDoubleClick }) => {
		const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

		// Mejora: cálculo robusto de columnas minimizando rounding drift
		const minWidth = 120;
		const maxWidth = 320;
		const baseWidth = Math.max(minWidth, Math.min(itemSize, maxWidth));
		const gap = interfaceConfig?.views?.grid?.gap ?? 8; // permitir personalización (px)
		const innerWidth = Math.max(0, containerWidth - gap);
		let columns = Math.max(1, Math.floor((innerWidth + gap) / (baseWidth + gap)));
		if (columns * baseWidth + (columns - 1) * gap > containerWidth && columns > 1) {
			columns -= 1; // ajuste fino si nos pasamos por rounding
		}
		// Evitar cambios agresivos de columnas si containerWidth varía poco: (omitido por simplicidad ahora)

		// Virtualización opcional simple por filas
		const virtualizationEnabled: boolean = Boolean(interfaceConfig?.performance?.virtualization);
		const threshold = Number(interfaceConfig?.views?.grid?.virtualizeAt ?? 200);
		const shouldVirtualize = virtualizationEnabled && items.length > threshold;
		const viewportRef = useRef<HTMLDivElement | null>(null);
		const [scrollTop, setScrollTop] = useState(0);
		const [viewportHeight, setViewportHeight] = useState(0);

		useEffect(() => {
			if (!shouldVirtualize) {
				return;
			}
			const el = viewportRef.current?.closest('[data-radix-scroll-area-viewport]') as HTMLElement | null;
			if (!el) {
				return;
			}
			const onScroll = () => setScrollTop(el.scrollTop);
			const ro = new ResizeObserver(() => setViewportHeight(el.clientHeight));
			setViewportHeight(el.clientHeight);
			el.addEventListener('scroll', onScroll, { passive: true });
			ro.observe(el);
			return () => {
				el.removeEventListener('scroll', onScroll);
				ro.disconnect();
			};
		}, [shouldVirtualize]);

		const rowHeight = (interfaceConfig?.views?.grid?.rowHeight as number) ?? Math.max(baseWidth, 160);
		const overscan = Number(interfaceConfig?.performance?.overscan ?? 4);
		const totalRows = Math.max(1, Math.ceil(items.length / columns));
		const firstVisibleRow = shouldVirtualize ? Math.max(0, Math.floor(scrollTop / rowHeight) - overscan) : 0;
		const visibleRowCount = shouldVirtualize ? Math.ceil(viewportHeight / rowHeight) + overscan * 2 : totalRows;
		const lastVisibleRow = shouldVirtualize
			? Math.min(totalRows - 1, firstVisibleRow + visibleRowCount)
			: totalRows - 1;
		const startIndex = firstVisibleRow * columns;
		const endIndex = Math.min(items.length, (lastVisibleRow + 1) * columns);
		const visibleItems = shouldVirtualize ? items.slice(startIndex, endIndex) : items;

		const spacerStyle = (h: number) => ({ gridColumn: '1 / -1', height: `${h}px` });

		// Handlers estables (un solo closure) reducen creación masiva por item
		const handleClick = useCallback(
			(e: React.MouseEvent) => {
				const id = (e.currentTarget as HTMLElement).dataset.itemId;
				if (!id) {
					return;
				}
				const entity = items.find((it) => it.id === id);
				if (entity) {
					onItemClick?.(entity, e);
				}
			},
			[items, onItemClick]
		);

		const handleDoubleClick = useCallback(
			(e: React.MouseEvent) => {
				const id = (e.currentTarget as HTMLElement).dataset.itemId;
				if (!id) {
					return;
				}
				const entity = items.find((it) => it.id === id);
				if (entity) {
					onItemDoubleClick?.(entity, e);
				}
			},
			[items, onItemDoubleClick]
		);

		return (
			<div
				className="grid w-full p-1" // padding ligero para evitar que el primer item pegue al borde
				data-testid="grid-view"
				ref={viewportRef}
				style={{
					gridTemplateColumns: `repeat(${columns}, minmax(${baseWidth}px, 1fr))`,
					gap: `${gap}px`,
					alignItems: 'stretch',
					justifyItems: 'stretch',
					// Fuerza layout estable incluso con alturas distintas
					fontFamily: 'var(--app-font-family)',
					fontSize: 'var(--app-font-size)',
					position: 'relative',
					minHeight: shouldVirtualize ? `${totalRows * rowHeight}px` : undefined,
				}}
			>
				{/* Spacer superior */}
				{shouldVirtualize && firstVisibleRow > 0 ? <div style={spacerStyle(firstVisibleRow * rowHeight)} /> : null}

				{visibleItems.map((item) => {
					const isSelected = selectedSet.has(item.id);
					return (
						<button
							aria-pressed={isSelected}
							className={cn(
								'group relative cursor-pointer overflow-hidden border bg-background/40 p-0 text-left outline-none',
								interfaceConfig?.global?.animations && !interfaceConfig?.global?.ultra
									? 'transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary'
									: 'focus-visible:ring-2 focus-visible:ring-primary',
								isSelected && 'ring-2 ring-primary',
								interfaceConfig?.global?.ultra && 'hover:bg-accent/40'
							)}
							data-item-id={item.id}
							data-selected={isSelected ? 'true' : 'false'}
							key={item.id}
							onClick={handleClick}
							onDoubleClick={handleDoubleClick}
							style={{
								borderRadius: interfaceConfig?.global?.borderRadius?.grid
									? `${interfaceConfig.global.borderRadius.grid}px`
									: undefined,
								height: `${rowHeight}px`,
							}}
							type="button"
						>
							<div
								className={cn('w-full', interfaceConfig?.global?.respectAspect ? 'aspect-auto' : 'aspect-square')}
								style={{
									objectFit: interfaceConfig?.global?.respectAspect ? 'contain' : 'cover',
								}}
							>
								<OptimizedEntityCard
									className="h-full w-full"
									compact
									entity={item as any}
									isSelected={isSelected}
									thumbnailQuality={interfaceConfig?.performance?.thumbnailQuality}
								/>
							</div>
						</button>
					);
				})}
				{/* Spacer inferior */}
				{shouldVirtualize && lastVisibleRow < totalRows - 1 ? (
					<div style={spacerStyle((totalRows - 1 - lastVisibleRow) * rowHeight)} />
				) : null}
			</div>
		);
	}
);

export default GridView;

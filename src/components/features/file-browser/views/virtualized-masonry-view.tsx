/**
 * @file Vista masonry virtualizada usando TanStack Virtual
 * @module components/features/file-browser/views/virtualized-masonry-view
 */
'use client';

import { cn } from '@/lib/utils';
import type { EntityWithStats } from '@/types/migration';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'motion/react';
import React, { memo, useMemo, useRef } from 'react';

interface VirtualizedMasonryViewProps {
	items: EntityWithStats[];
	itemSize: number;
	selectedIds: string[];
	containerWidth: number;
	onItemClick: (item: EntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: EntityWithStats) => void;
}

export const VirtualizedMasonryView = memo<VirtualizedMasonryViewProps>(function VirtualizedMasonryView({
	items,
	itemSize,
	selectedIds,
	containerWidth,
	onItemClick,
	onItemDoubleClick,
}) {
	const parentRef = useRef<any>(null);

	// Para masonry, usamos una aproximación simplificada con alturas variables
	const { columns, columnWidth } = useMemo(() => {
		const minWidth = itemSize || 200;
		const gap = 16;
		const padding = 24;
		const availableWidth = containerWidth - padding * 2;
		const cols = Math.max(1, Math.floor((availableWidth + gap) / (minWidth + gap)));
		const width = (availableWidth - gap * (cols - 1)) / cols;

		return {
			columns: cols,
			columnWidth: width,
		};
	}, [containerWidth, itemSize]);

	// Función para estimar altura del item (simulando masonry)
	const getItemHeight = (index: number): number => {
		// Simular alturas variables para efecto masonry
		const heights = [200, 250, 180, 300, 220, 160, 280, 190];
		return heights[index % heights.length];
	};

	// Configurar virtualizador
	const rowVirtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => parentRef.current,
		estimateSize: getItemHeight,
		overscan: 5,
	});

	return (
		<div
			ref={parentRef}
			className="h-full w-full overflow-auto"
			style={{
				contain: 'strict',
			}}
		>
			<div className="p-6">
				<div
					style={{
						height: `${rowVirtualizer.getTotalSize()}px`,
						width: '100%',
						position: 'relative',
					}}
				>
					{rowVirtualizer.getVirtualItems().map((virtualItem) => {
						const item = items[virtualItem.index];
						const isSelected = selectedIds.includes(item.id);
						const columnIndex = virtualItem.index % columns;
						const itemHeight = getItemHeight(virtualItem.index);

						return (
							<motion.div
								key={item.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									delay: Math.min(virtualItem.index * 0.02, 0.3),
									duration: 0.3,
								}}
								style={{
									position: 'absolute',
									top: 0,
									left: `${columnIndex * (columnWidth + 16)}px`,
									width: `${columnWidth}px`,
									height: `${itemHeight}px`,
									transform: `translateY(${virtualItem.start}px)`,
								}}
								className={cn(
									'relative cursor-pointer transition-all duration-200',
									'bg-card border rounded-lg p-4 hover:shadow-lg',
									isSelected && 'ring-2 ring-primary bg-primary/5'
								)}
								onClick={(e) => {
									e.stopPropagation();
									onItemClick(item, e);
								}}
								onDoubleClick={(e) => {
									e.stopPropagation();
									onItemDoubleClick(item);
								}}
							>
								<div className="h-full flex flex-col">
									<div className="flex-1 flex items-center justify-center bg-muted rounded mb-3">
										<div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
											<span className="text-lg font-semibold text-primary">
												{item.name.charAt(0).toUpperCase()}
											</span>
										</div>
									</div>
									<div className="text-sm font-medium text-center mb-1">
										{item.name}
									</div>
									<div className="text-xs text-muted-foreground text-center">
										{item.entityType} • {item.stats?.imageCount || 0} imágenes
									</div>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</div>
	);
});

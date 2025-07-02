/**
 * @file Vista de grid simple virtualizada usando TanStack Virtual
 * @module components/features/file-browser/views/virtualized-simple-grid-view
 */

import { cn } from '@/lib/utils';
import type { EntityWithStats } from '@/types/migration';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'motion/react';
import React, { memo, useMemo, useRef } from 'react';

interface VirtualizedSimpleGridViewProps {
	items: EntityWithStats[];
	itemSize: number;
	selectedIds: string[];
	containerWidth: number;
	onItemClick: (item: EntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: EntityWithStats) => void;
}

export const VirtualizedSimpleGridView = memo<VirtualizedSimpleGridViewProps>(function VirtualizedSimpleGridView({
	items,
	itemSize,
	selectedIds,
	containerWidth,
	onItemClick,
	onItemDoubleClick,
}) {
	const parentRef = useRef<any>(null);

	// Calcular configuración de la grid
	const { columns, cellSize } = useMemo(() => {
		const minCellSize = itemSize || 120;
		const gap = 8;
		const padding = 16;
		const availableWidth = containerWidth - padding * 2;
		const cols = Math.max(1, Math.floor((availableWidth + gap) / (minCellSize + gap)));
		const size = Math.floor((availableWidth - gap * (cols - 1)) / cols);

		return {
			columns: cols,
			cellSize: size,
		};
	}, [containerWidth, itemSize]);

	// Calcular filas necesarias
	const rowCount = Math.ceil(items.length / columns);
	const rowHeight = cellSize + 8; // Tamaño de celda + gap

	// Configurar virtualizador para filas
	const rowVirtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => parentRef.current,
		estimateSize: () => rowHeight,
		overscan: 3,
	});

	// Función para obtener items de una fila específica
	const getRowItems = (rowIndex: number): EntityWithStats[] => {
		const startIndex = rowIndex * columns;
		const endIndex = Math.min(startIndex + columns, items.length);
		return items.slice(startIndex, endIndex);
	};

	return (
		<div
			ref={parentRef}
			className="h-full w-full overflow-auto"
			style={{
				contain: 'strict',
			}}
		>
			<div
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
					width: '100%',
					position: 'relative',
				}}
			>
				{rowVirtualizer.getVirtualItems().map((virtualRow) => {
					const rowItems = getRowItems(virtualRow.index);

					return (
						<div
							key={virtualRow.key}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: `${rowHeight}px`,
								transform: `translateY(${virtualRow.start}px)`,
								padding: '4px 16px',
							}}
						>
							<div
								className="grid gap-2"
								style={{
									gridTemplateColumns: `repeat(${columns}, 1fr)`,
									height: '100%',
								}}
							>
								{rowItems.map((item, columnIndex) => {
									const isSelected = selectedIds.includes(item.id);
									const itemIndex = virtualRow.index * columns + columnIndex;

									return (
										<motion.div
											key={item.id}
											initial={{ opacity: 0, scale: 0.8 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{
												delay: Math.min(itemIndex * 0.01, 0.2),
												duration: 0.2,
											}}
											className={cn(
												'relative cursor-pointer transition-all duration-200',
												'bg-card border rounded-lg p-2 hover:shadow-md',
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
											style={{
												width: `${cellSize}px`,
												height: `${cellSize}px`,
											}}
										>
											<div className="h-full flex flex-col items-center justify-center text-center">
												<div className="w-8 h-8 bg-primary/10 rounded mb-1 flex items-center justify-center">
													<span className="text-xs font-semibold text-primary">
														{item.name.charAt(0).toUpperCase()}
													</span>
												</div>
												<div className="text-xs font-medium truncate w-full px-1">{item.name}</div>
												<div className="text-xs text-muted-foreground">{item.stats?.imageCount || 0}</div>
											</div>
										</motion.div>
									);
								})}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
});

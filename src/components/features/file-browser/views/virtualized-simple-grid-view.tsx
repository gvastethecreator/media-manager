/**
 * @file Vista de grid simple virtualizada usando TanStack Virtual
 * @module components/features/file-browser/views/virtualized-simple-grid-view
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'motion/react';
import React, { memo, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/migration';

interface VirtualizedSimpleGridViewProps {
	items: AnyEntityWithStats[];
	itemSize: number;
	selectedIds: string[];
	containerWidth: number;
	onItemClick: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: AnyEntityWithStats) => void;
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

	// Calcular configuración de la grid con mejor espaciado
	const { columns, cellSize, gap, padding } = useMemo(() => {
		const minCellSize = Math.max(itemSize || 120, 100); // Mínimo absoluto de 100px
		const gapSize = 12;
		const paddingSize = 20;
		const availableWidth = Math.max(containerWidth - paddingSize * 2, minCellSize);
		
		// Calcular columnas de forma más precisa
		const cols = Math.max(1, Math.floor((availableWidth + gapSize) / (minCellSize + gapSize)));
		const actualCellSize = Math.floor((availableWidth - gapSize * (cols - 1)) / cols);

		return {
			columns: cols,
			cellSize: actualCellSize,
			gap: gapSize,
			padding: paddingSize,
		};
	}, [containerWidth, itemSize]);

	// Calcular filas necesarias
	const rowCount = Math.ceil(items.length / columns);
	const rowHeight = cellSize + gap; // Tamaño de celda + gap

	// Configurar virtualizador para filas
	const rowVirtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => parentRef.current,
		estimateSize: () => rowHeight,
		overscan: 3,
	});

	// Función para obtener items de una fila específica
	const getRowItems = (rowIndex: number): AnyEntityWithStats[] => {
		const startIndex = rowIndex * columns;
		const endIndex = Math.min(startIndex + columns, items.length);
		return items.slice(startIndex, endIndex);
	};

	return (
		<div
			ref={parentRef}
			className="h-full w-full"
			style={{
				contain: 'strict',
				padding: `${padding}px`,
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
							}}
						>
							<div
								className="grid"
								style={{
									gridTemplateColumns: `repeat(${columns}, 1fr)`,
									gap: `${gap}px`,
									height: `${cellSize}px`,
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
														{(item.name || item.id || 'U').charAt(0).toUpperCase()}
													</span>
												</div>
												<div className="text-xs font-medium truncate w-full px-1">
													{item.name || item.id || 'Unknown'}
												</div>
												<div className="text-xs text-muted-foreground">
													{'stats' in item && item.stats && typeof item.stats === 'object' && 'imageCount' in item.stats ? item.stats.imageCount : 0}
												</div>
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

/**
 * @file Vista de tarjetas virtualizada usando TanStack Virtual
 * @module components/features/file-browser/views/virtualized-cards-view
 */
'use client';

import { EntityCard } from '@/components/cards/entity-card';
import { cn } from '@/lib/utils';
import type { EntityWithStats } from '@/types/migration';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'motion/react';
import React, { memo, useMemo, useRef } from 'react';

interface VirtualizedCardsViewProps {
	items: EntityWithStats[];
	itemSize: number;
	selectedIds: string[];
	containerWidth: number;
	onItemClick: (item: EntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: EntityWithStats) => void;
}

export const VirtualizedCardsView = memo<VirtualizedCardsViewProps>(function VirtualizedCardsView({
	items,
	itemSize,
	selectedIds,
	containerWidth,
	onItemClick,
	onItemDoubleClick,
}) {
	const parentRef = useRef<any>(null);

	// Calcular configuración de la grid
	const { columns, cardWidth, rowHeight } = useMemo(() => {
		const minCardWidth = itemSize || 200;
		const gap = 16;
		const padding = 24;
		const availableWidth = containerWidth - padding * 2;
		const cols = Math.max(1, Math.floor((availableWidth + gap) / (minCardWidth + gap)));
		const width = (availableWidth - gap * (cols - 1)) / cols;
		const height = width * 1.2; // Ratio de aspecto para las tarjetas

		return {
			columns: cols,
			cardWidth: width,
			rowHeight: height + gap, // Altura + gap
		};
	}, [containerWidth, itemSize]);

	// Calcular filas necesarias
	const rowCount = Math.ceil(items.length / columns);

	// Configurar virtualizador para filas
	const rowVirtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => parentRef.current,
		estimateSize: () => rowHeight,
		overscan: 5,
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
								padding: '12px 24px',
							}}
						>
							<div
								className="grid gap-4"
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
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{
												delay: Math.min(itemIndex * 0.02, 0.3),
												duration: 0.3,
											}}
											className={cn(
												'relative cursor-pointer transition-all duration-200',
												'hover:z-10',
												isSelected && 'ring-2 ring-primary ring-offset-2'
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
												width: `${cardWidth}px`,
											}}
										>
											<EntityCard
												entity={item}
												isSelected={isSelected}
												compact={itemSize < 150}
												className="h-full"
											/>
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

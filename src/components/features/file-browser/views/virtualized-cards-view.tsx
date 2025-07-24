/**
 * @file Vista de tarjetas virtualizada usando TanStack Virtual
 * @module components/features/file-browser/views/virtualized-cards-view
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'motion/react';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import { EntityCard } from '@/components/cards/entity-card';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/migration';

interface VirtualizedCardsViewProps {
	items: AnyEntityWithStats[];
	itemSize: number;
	selectedIds: string[];
	containerWidth: number;
	onItemClick: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: AnyEntityWithStats) => void;
}

// Componente interno memoizado para cada carta
const CardItem = memo<{
	item: AnyEntityWithStats;
	isSelected: boolean;
	compact: boolean;
	itemIndex: number;
	cardWidth: number;
	onItemClick: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: AnyEntityWithStats) => void;
	animationProps: {
		initial: { opacity: number; y: number };
		animate: { opacity: number; y: number };
		baseTransition: { duration: number };
	};
}>(function CardItem({
	item,
	isSelected,
	compact,
	itemIndex,
	cardWidth,
	onItemClick,
	onItemDoubleClick,
	animationProps,
}) {
	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			console.log('🖱️ VirtualizedCardsView - onClick disparado:', { itemId: item.id });
			e.stopPropagation();
			onItemClick(item, e);
		},
		[item, onItemClick]
	);

	const handleDoubleClick = useCallback(() => {
		console.log('🖱️ VirtualizedCardsView - onDoubleClick disparado:', { itemId: item.id });
		onItemDoubleClick(item);
	}, [item, onItemDoubleClick]);

	const transition = useMemo(
		() => ({
			...animationProps.baseTransition,
			delay: Math.min(itemIndex * 0.02, 0.3),
		}),
		[animationProps.baseTransition, itemIndex]
	);

	return (
		<motion.div
			key={item.id}
			initial={animationProps.initial}
			animate={animationProps.animate}
			transition={transition}
			className={cn(
				'relative cursor-pointer transition-all duration-200',
				'hover:z-10',
				isSelected && 'ring-2 ring-primary ring-offset-2'
			)}
			style={{
				width: `${cardWidth}px`,
			}}
		>
			<EntityCard
				entity={item}
				isSelected={isSelected}
				compact={compact}
				className="h-full"
				onClick={handleClick}
				onDoubleClick={handleDoubleClick}
			/>
		</motion.div>
	);
});

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
	const getRowItems = (rowIndex: number): AnyEntityWithStats[] => {
		const startIndex = rowIndex * columns;
		const endIndex = Math.min(startIndex + columns, items.length);
		return items.slice(startIndex, endIndex);
	};

	// Memoizar handlers para evitar re-renders masivos
	const handleItemClick = useCallback(
		(item: AnyEntityWithStats, e: React.MouseEvent) => {
			onItemClick(item, e);
		},
		[onItemClick]
	);

	const handleItemDoubleClick = useCallback(
		(item: AnyEntityWithStats) => {
			onItemDoubleClick(item);
		},
		[onItemDoubleClick]
	);

	// Memoizar objetos de animación para evitar re-renders
	const animationProps = useMemo(
		() => ({
			initial: { opacity: 0, y: 20 },
			animate: { opacity: 1, y: 0 },
			baseTransition: { duration: 0.3 },
		}),
		[]
	);

	// Función para crear transition con delay estable
	// const createTransition = useCallback((itemIndex: number) => {
	// 	return {
	// 		...animationProps.baseTransition,
	// 		delay: Math.min(itemIndex * 0.02, 0.3),
	// 	};
	// }, [animationProps.baseTransition]);

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
										<CardItem
											key={item.id}
											item={item}
											isSelected={isSelected}
											compact={itemSize < 150}
											itemIndex={itemIndex}
											cardWidth={cardWidth}
											onItemClick={handleItemClick}
											onItemDoubleClick={handleItemDoubleClick}
											animationProps={animationProps}
										/>
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

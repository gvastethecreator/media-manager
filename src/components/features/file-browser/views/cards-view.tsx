/**
 * @file Vista de tarjetas usando TanStack Virtual
 * @module components/features/file-browser/views/cards-view
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'motion/react';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EntityCard } from '@/components/cards/entity-card';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/migration';

interface CardsViewProps {
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
			console.log('🖱️ CardsView - onClick disparado:', { itemId: item.id });
			e.stopPropagation();
			onItemClick(item, e);
		},
		[item, onItemClick]
	);

	const handleDoubleClick = useCallback(() => {
		console.log('🖱️ CardsView - onDoubleClick disparado:', { itemId: item.id });
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

export const CardsView = memo<CardsViewProps>(function CardsView({
	items,
	itemSize,
	selectedIds,
	containerWidth,
	onItemClick,
	onItemDoubleClick,
}) {
	const parentRef = useRef<any>(null);

	// Handler para clicks en espacio vacío
	const handleEmptySpaceClick = useCallback((e: React.MouseEvent) => {
		// Solo actuar si el click es directamente en el contenedor de la vista
		const target = e.target as HTMLElement;
		const currentTarget = e.currentTarget as HTMLElement;

		// Verificar si es un click en espacio vacío (no en elementos de las cards)
		const isEmptySpaceClick = target === currentTarget ||
			(!target.closest('.entity-card') &&
				!target.closest('[data-entity-card]') &&
				!target.closest('button') &&
				!target.closest('[role="button"]') &&
				!target.closest('.grid > div') && // Evitar clicks en elementos de la grid
				!target.closest('[style*="position: absolute"]')); // Evitar clicks en elementos virtualizados

		if (isEmptySpaceClick) {
			// Propagar el evento hacia arriba para que FileBrowser lo maneje
			// No hacer e.stopPropagation() aquí para permitir que el evento burbujee
		}
	}, []);

	// Calcular configuración de la grid con mejor espaciado
	const { columns, cardWidth, rowHeight, gap, padding } = useMemo(() => {
		const minCardWidth = Math.max(itemSize || 200, 150); // Mínimo absoluto de 150px
		const gapSize = 16;
		const paddingSize = 24;
		const availableWidth = Math.max(containerWidth - paddingSize * 2, minCardWidth);

		// Calcular columnas de forma más precisa
		const cols = Math.max(1, Math.floor((availableWidth + gapSize) / (minCardWidth + gapSize)));
		const actualCardWidth = Math.floor((availableWidth - gapSize * (cols - 1)) / cols);

		// Altura basada en ratio de aspecto más apropiado
		const cardHeight = Math.floor(actualCardWidth * 1.25); // Ratio 4:5 para mejor proporción
		const totalRowHeight = cardHeight + gapSize;

		return {
			columns: cols,
			cardWidth: actualCardWidth,
			rowHeight: totalRowHeight,
			gap: gapSize,
			padding: paddingSize,
		};
	}, [containerWidth, itemSize]);

	// Calcular filas necesarias
	const rowCount = Math.ceil(items.length / columns);

	// Estado para altura del contenedor
	const [containerHeight, setContainerHeight] = useState<number>(0);

	// Efecto para medir y establecer altura del contenedor basada en ScrollArea viewport
	useEffect(() => {
		if (parentRef.current) {
			const scrollAreaViewport = parentRef.current.closest('[data-radix-scroll-area-viewport]');
			if (scrollAreaViewport) {
				// Solo aplicar padding, el StatusBar ya no necesita reserva de espacio
				const height = scrollAreaViewport.clientHeight - padding * 2;
				setContainerHeight(height);
			}
		}
	}, [padding]);

	// Configurar virtualizador para filas
	const rowVirtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => {
			// Buscar el elemento de scroll más apropiado (ScrollArea viewport)
			const scrollAreaViewport = parentRef.current?.closest('[data-radix-scroll-area-viewport]');
			if (scrollAreaViewport) {
				console.log('🔧 CardsView - Using ScrollArea viewport as scroll element');
				return scrollAreaViewport as HTMLElement;
			}
			// Fallback al elemento padre o actual
			return parentRef.current?.parentElement || parentRef.current;
		},
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

	return (
		<div
			ref={parentRef}
			data-testid="cards-view"
			data-view-type="cards"
			className="w-full"
			onClick={handleEmptySpaceClick}
			style={{
				contain: 'layout style',
				padding: `${padding}px`,
				height: containerHeight > 0 ? `${containerHeight}px` : '100%',
				overflow: 'auto',
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
									height: `${rowHeight - gap}px`,
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

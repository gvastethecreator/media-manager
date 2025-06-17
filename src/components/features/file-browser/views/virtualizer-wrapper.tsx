'use client';

import { cn } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useEffect, useRef, useState } from 'react';

interface VirtualizerWrapperProps<T> {
	type: 'list' | 'grid' | 'masonry';
	data: T[];
	itemContent: (index: number, item: T) => React.ReactNode;
	itemSize?: number;
	gridClassName?: string;
	listClassName?: string;
	layoutId?: string; // Mantenerla para compatibilidad con la API
	onScrollStart?: () => void;
	onScrollEnd?: () => void;
}

/**
 * 🖼️ Componente de visualización de datos con virtualización usando TanStack Virtual
 *
 * Esta implementación utiliza @tanstack/react-virtual para renderizar
 * solo los elementos visibles en el viewport, mejorando significativamente
 * el rendimiento con conjuntos de datos grandes.
 */
export function VirtualizerWrapper<T>({
	type,
	data,
	itemContent,
	itemSize = 200,
	gridClassName,
	listClassName,
	onScrollStart,
	onScrollEnd,
}: VirtualizerWrapperProps<T>) {
	// Referencia al contenedor de desplazamiento
	const scrollRef = useRef<HTMLDivElement>(null);
	const [columnCount, setColumnCount] = useState(4); // Default a 4 columnas
	const [isScrolling, setIsScrolling] = useState(false);

	// Calcular el número de columnas para la cuadrícula
	useEffect(() => {
		if (!scrollRef.current) return;

		const updateColumnCount = () => {
			const containerWidth = scrollRef.current?.clientWidth || 0;
			const gap = 16; // 1rem gap
			const effectiveItemSize = itemSize + gap;
			const columns = Math.max(1, Math.floor((containerWidth - gap) / effectiveItemSize));
			setColumnCount(columns);
		};

		// Actualizar inmediatamente
		updateColumnCount();

		// Actualizar cuando cambie el tamaño de la ventana
		const resizeObserver = new ResizeObserver(updateColumnCount);
		resizeObserver.observe(scrollRef.current);

		return () => {
			if (scrollRef.current) {
				resizeObserver.unobserve(scrollRef.current);
			}
			resizeObserver.disconnect();
		};
	}, [itemSize, scrollRef]);

	// Configuración de la virtualización para lista
	const listVirtualizer = useVirtualizer({
		count: data.length,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => itemSize,
		overscan: 5, // Número de elementos a renderizar fuera del viewport
		scrollMargin: scrollRef.current?.offsetTop || 0,
	});

	// Configuración de la virtualización para cuadrícula
	const gridVirtualizer = useVirtualizer({
		count: Math.ceil(data.length / columnCount),
		getScrollElement: () => scrollRef.current,
		estimateSize: () => itemSize + 16, // Altura de fila + gap
		overscan: 3, // Mayor overscan para cuadrículas
		getItemKey: (index) => `grid-row-${index}`,
		scrollMargin: scrollRef.current?.offsetTop || 0,
	});

	// Manejador de eventos de scroll con debounce
	const handleScroll = React.useCallback(
		(e: React.UIEvent<HTMLDivElement>) => {
			// Activar el estado de scroll
			if (!isScrolling) {
				setIsScrolling(true);
				onScrollStart?.();
			}

			// Debounce para detectar cuando se detiene el scroll
			clearTimeout((window as any).scrollTimeout);
			(window as any).scrollTimeout = setTimeout(() => {
				setIsScrolling(false);
				onScrollEnd?.();
			}, 200);

			// Detectar inicio y fin de scroll
			const target = e.currentTarget;
			const isAtTop = target.scrollTop === 0;
			const isAtBottom =
				Math.abs(
					target.scrollHeight - target.scrollTop - target.clientHeight
				) < 20;

			if (isAtBottom) {
				onScrollEnd?.();
			}
		},
		[isScrolling, onScrollStart, onScrollEnd]
	);

	// Renderizado para modo masonry
	if (type === 'masonry') {
		// Para masonry, usamos una implementación más simple sin virtualización completa
		// ya que la altura de los elementos es variable
		return (
			<div
				ref={scrollRef}
				className={cn('h-full w-full overflow-auto p-4', gridClassName)}
				onScroll={handleScroll}
				style={{ scrollBehavior: 'smooth' }}
			>
				<div className="flex gap-4">
					{/* Crear columnas */}
					{Array.from({ length: columnCount }).map((_, colIndex) => (
						<div key={`masonry-col-${colIndex}`} className="flex-1 flex flex-col gap-4">
							{/* Filtrar elementos que van en esta columna */}
							{data
								.filter((_, index) => index % columnCount === colIndex)
								.map((item, idx) => {
									const originalIndex = colIndex + idx * columnCount;
									return (
										<div key={`masonry-item-${originalIndex}`} className="w-full">
											{itemContent(originalIndex, item)}
										</div>
									);
								})}
						</div>
					))}
				</div>
			</div>
		);
	}

	// Renderizado para modo cuadrícula
	if (type === 'grid') {
		// Calcular el número total de filas
		const rowVirtualItems = gridVirtualizer.getVirtualItems();
		const gap = 16; // 1rem gap

		return (
			<div
				ref={scrollRef}
				className={cn('h-full w-full overflow-auto', gridClassName)}
				onScroll={handleScroll}
				style={{ scrollBehavior: 'smooth' }}
			>
				<div
					style={{
						height: `${gridVirtualizer.getTotalSize()}px`,
						width: '100%',
						position: 'relative',
						padding: `${gap}px`,
					}}
				>
					{rowVirtualItems.map((virtualRow) => {
						const rowIndex = virtualRow.index;

						return (
							<div
								key={virtualRow.key}
								data-index={rowIndex}
								className="flex gap-4"
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									width: '100%',
									height: `${itemSize}px`,
									transform: `translateY(${virtualRow.start}px)`,
								}}
							>
								{Array.from({ length: columnCount }).map((_, colIndex) => {
									const itemIndex = rowIndex * columnCount + colIndex;
									if (itemIndex >= data.length) return null;

									const item = data[itemIndex];

									return (
										<div
											key={`grid-item-${itemIndex}`}
											style={{
												width: `calc((100% - ${(columnCount - 1) * gap}px) / ${columnCount})`,
												height: `${itemSize}px`,
											}}
										>
											{itemContent(itemIndex, item)}
										</div>
									);
								})}
							</div>
						);
					})}
				</div>
			</div>
		);
	}

	// Renderizado para modo lista
	return (
		<div
			ref={scrollRef}
			className={cn('h-full w-full overflow-auto', listClassName)}
			onScroll={handleScroll}
			style={{ scrollBehavior: 'smooth' }}
		>
			<div
				style={{
					height: `${listVirtualizer.getTotalSize()}px`,
					width: '100%',
					position: 'relative',
					padding: '16px',
				}}
			>
				{data.length > 0 && listVirtualizer.getVirtualItems().map((virtualItem) => {
					const itemIndex = virtualItem.index;
					if (itemIndex >= data.length) return null;

					const item = data[itemIndex];

					return (
						<div
							key={virtualItem.key}
							data-index={itemIndex}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: `${virtualItem.size}px`,
								transform: `translateY(${virtualItem.start}px)`,
								padding: '0 16px',
							}}
						>
							{itemContent(itemIndex, item)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
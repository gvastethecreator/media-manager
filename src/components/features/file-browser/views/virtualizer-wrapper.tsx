'use client';

import { cn } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useEffect, useRef, useState } from 'react';

interface VirtualizerWrapperProps<T> {
	type: 'list' | 'grid';
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
		count: data.length,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => Math.ceil(data.length / columnCount) * (itemSize + 16),
		overscan: 10, // Mayor overscan para cuadrículas
		getItemKey: (index) => (data[index] as any)?.id || `grid-${index}`,
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

	// Renderizado para modo cuadrícula
	if (type === 'grid') {
		// Calcular el número total de filas
		const totalRows = Math.ceil(data.length / columnCount);
		const rowHeight = itemSize + 16; // altura + gap

		return (
			<div
				ref={scrollRef}
				className={cn('h-full w-full overflow-auto p-4', gridClassName)}
				onScroll={handleScroll}
				style={{ scrollBehavior: 'smooth' }}
			>
				<div
					style={{
						height: `${totalRows * rowHeight}px`,
						width: '100%',
						position: 'relative',
					}}
				>
					{data.length > 0 && gridVirtualizer.getVirtualItems().map((virtualItem) => {
						const itemIndex = virtualItem.index;
						if (itemIndex >= data.length) return null;

						const item = data[itemIndex];

						// Calcular posición en la cuadrícula
						const row = Math.floor(itemIndex / columnCount);
						const col = itemIndex % columnCount;

						// Calcular posición absoluta
						const left = `${(col * (itemSize + 16))}px`;
						const top = `${(row * rowHeight)}px`;

						return (
							<div
								key={virtualItem.key}
								data-index={itemIndex}
								style={{
									position: 'absolute',
									top,
									left,
									width: `${itemSize}px`,
									height: `${itemSize}px`,
									padding: '0',
									transform: 'translate3d(0, 0, 0)',
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

	// Renderizado para modo lista
	return (
		<div
			ref={scrollRef}
			className={cn('h-full w-full overflow-auto p-4', listClassName)}
			onScroll={handleScroll}
			style={{ scrollBehavior: 'smooth' }}
		>
			<div
				style={{
					height: `${listVirtualizer.getTotalSize()}px`,
					width: '100%',
					position: 'relative',
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
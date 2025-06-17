'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';

interface VirtualizerWrapperProps<T> {
	type: 'list' | 'grid';
	data: T[];
	itemContent: (index: number, item: T) => React.ReactNode;
	itemSize?: number;
	gridClassName?: string;
	listClassName?: string;
	layoutId?: string;
	onScrollStart?: () => void;
	onScrollEnd?: () => void;
}

/**
 * Componente wrapper para virtualización de listas y grids
 * Soporta diferentes tipos de visualización y eventos de scroll
 */
export function VirtualizerWrapper<T>({
	type,
	data,
	itemContent,
	itemSize = 200,
	gridClassName,
	listClassName,
	layoutId,
	onScrollStart,
	onScrollEnd,
}: VirtualizerWrapperProps<T>) {
	// Referencias
	const virtuosoRef = useRef<any>(null);
	const isScrollingRef = useRef(false);
	const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Estados
	const [isInitialized, setIsInitialized] = useState(false);
	const [columnsCount, setColumnsCount] = useState(4);

	// Calcular el número de columnas basado en el tamaño del contenedor
	const calculateColumns = useCallback((element: HTMLElement) => {
		if (!element) return;

		const containerWidth = element.offsetWidth;
		const gap = 16; // Gap entre elementos
		const availableWidth = containerWidth - gap;
		const columns = Math.max(1, Math.floor(availableWidth / (itemSize + gap)));

		setColumnsCount(columns);
	}, [itemSize]);

	// Manejador de eventos de scroll
	const handleScroll = useCallback(() => {
		if (!isScrollingRef.current) {
			isScrollingRef.current = true;
			onScrollStart?.();
		}

		// Reiniciar el timeout en cada evento de scroll
		if (scrollTimeoutRef.current) {
			clearTimeout(scrollTimeoutRef.current);
		}

		// Establecer un nuevo timeout para detectar cuando el scroll termina
		scrollTimeoutRef.current = setTimeout(() => {
			isScrollingRef.current = false;
			onScrollEnd?.();
			scrollTimeoutRef.current = null;
		}, 150);
	}, [onScrollStart, onScrollEnd]);

	// Efecto para limpiar timeouts al desmontar
	useEffect(() => {
		return () => {
			if (scrollTimeoutRef.current) {
				clearTimeout(scrollTimeoutRef.current);
			}
		};
	}, []);

	// Efecto para inicializar después del primer render
	useEffect(() => {
		setIsInitialized(true);
	}, []);

	// Renderizar el virtualizador según el tipo
	if (type === 'grid') {
		return (
			<motion.div
				className="h-full w-full"
				layoutId={layoutId}
				initial={!isInitialized ? { opacity: 0 } : false}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.2 }}
			>
				<VirtuosoGrid
					ref={virtuosoRef}
					totalCount={data.length}
					overscan={500}
					className={cn('h-full', gridClassName)}
					listClassName="grid gap-4 p-4"
					itemClassName="overflow-hidden"
					computeItemKey={(index) => data[index]?.id || index.toString()}
					itemContent={(index) => itemContent(index, data[index])}
					style={{ height: '100%', width: '100%' }}
					onScroll={handleScroll}
					listStyle={{
						display: 'grid',
						gridTemplateColumns: `repeat(auto-fill, minmax(${itemSize}px, 1fr))`,
						gap: '1rem',
					}}
					components={{
						ScrollSeekPlaceholder: ({ height, width, index }) => (
							<div
								className="bg-muted/30 rounded-md animate-pulse"
								style={{ height: `${itemSize}px`, width: '100%' }}
							/>
						),
					}}
				/>
			</motion.div>
		);
	}

	// Renderizar lista virtualizada
	return (
		<motion.div
			className="h-full w-full"
			layoutId={layoutId}
			initial={!isInitialized ? { opacity: 0 } : false}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.2 }}
		>
			<Virtuoso
				ref={virtuosoRef}
				totalCount={data.length}
				overscan={200}
				className={cn('h-full', listClassName)}
				itemContent={(index) => itemContent(index, data[index])}
				style={{ height: '100%', width: '100%' }}
				onScroll={handleScroll}
				components={{
					ScrollSeekPlaceholder: ({ height, index }) => (
						<div
							className="bg-muted/30 rounded-md animate-pulse m-2 p-2"
							style={{ height: `${height}px` }}
						/>
					),
				}}
			/>
		</motion.div>
	);
}
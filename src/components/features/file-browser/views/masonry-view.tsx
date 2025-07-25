/**
 * @file Vista masonry usando TanStack Virtual con algoritmo Pinterest
 * @module components/features/file-browser/views/masonry-view
 */

import { motion } from 'motion/react';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EntityCard } from '@/components/cards/entity-card';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/migration';

interface MasonryViewProps {
	items: AnyEntityWithStats[];
	itemSize: number;
	selectedIds: string[];
	containerWidth: number;
	onItemClick: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: AnyEntityWithStats) => void;
}

interface MasonryItem {
	item: AnyEntityWithStats;
	height: number;
	x: number;
	y: number;
	width: number;
}

/**
 * Hook para calcular posiciones en layout masonry tipo Pinterest
 */
const useMasonryLayout = (items: AnyEntityWithStats[], containerWidth: number, itemSize: number) => {
	return useMemo(() => {
		if (!items.length || containerWidth <= 0) return { layoutItems: [], totalHeight: 0 };

		const minColumnWidth = Math.max(itemSize || 200, 160);
		const gap = 16;
		const padding = 24;
		const availableWidth = containerWidth - padding * 2;

		// Calcular número de columnas
		const columns = Math.max(1, Math.floor((availableWidth + gap) / (minColumnWidth + gap)));
		const columnWidth = Math.floor((availableWidth - gap * (columns - 1)) / columns);

		// Array para trackear la altura actual de cada columna
		const columnHeights: number[] = new Array(columns).fill(0);
		const layoutItems: MasonryItem[] = [];

		items.forEach((item) => {
			// Encontrar la columna más corta
			const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));

			// Calcular dimensiones del item
			let itemHeight: number;

			// Si es una imagen, intentar usar sus dimensiones reales o estimar basado en aspect ratio
			if ('entityType' in item && item.entityType === 'image') {
				// Intentar obtener aspect ratio de metadatos
				const aspectRatio = getImageAspectRatio(item);
				itemHeight = Math.round(columnWidth / aspectRatio);

				// Aplicar límites razonables
				itemHeight = Math.max(120, Math.min(itemHeight, 400));
			} else {
				// Para otros tipos, usar altura variable basada en contenido
				itemHeight = getEstimatedHeightForEntity(item, columnWidth);
			}

			// Calcular posición
			const x = shortestColumnIndex * (columnWidth + gap);
			const y = columnHeights[shortestColumnIndex];

			layoutItems.push({
				item,
				height: itemHeight,
				x,
				y,
				width: columnWidth,
			});

			// Actualizar altura de la columna
			columnHeights[shortestColumnIndex] += itemHeight + gap;
		});

		const totalHeight = Math.max(...columnHeights);

		return { layoutItems, totalHeight, columns, columnWidth };
	}, [items, containerWidth, itemSize]);
};

/**
 * Obtiene el aspect ratio de una imagen desde sus metadatos
 */
const getImageAspectRatio = (item: AnyEntityWithStats): number => {
	// Intentar obtener dimensiones reales de la imagen
	if ('metadata' in item && item.metadata) {
		const metadata = item.metadata as any;
		if (metadata.width && metadata.height) {
			return metadata.width / metadata.height;
		}
	}

	// Valores por defecto variados para simular diferentes aspect ratios
	const aspectRatios = [1.5, 0.75, 1.33, 0.8, 1.2, 1.0, 1.6, 0.9];
	const index = item.id ? item.id.length % aspectRatios.length : 0;
	return aspectRatios[index];
};

/**
 * Estima la altura para entidades que no son imágenes
 */
const getEstimatedHeightForEntity = (item: AnyEntityWithStats, width: number): number => {
	const baseHeight = 160;

	// Variar altura basada en tipo de entidad
	if ('entityType' in item) {
		switch (item.entityType) {
			case 'folder':
				return baseHeight + 40;
			case 'video':
				return Math.round(width * 0.5625); // 16:9 aspect ratio
			case 'audio':
				return baseHeight - 20;
			case 'document':
				return baseHeight + 60;
			default:
				return baseHeight;
		}
	}

	return baseHeight;
};

export const MasonryView = memo<MasonryViewProps>(function MasonryView({
	items,
	itemSize,
	selectedIds,
	containerWidth,
	onItemClick,
	onItemDoubleClick,
}) {
	const parentRef = useRef<any>(null);
	const [containerHeight, setContainerHeight] = useState<number>(600);

	// Layout calculations - verdadero masonry Pinterest-style
	const { layoutItems, totalHeight } = useMasonryLayout(items, containerWidth, itemSize);

	// Efecto para medir y establecer altura del contenedor
	useEffect(() => {
		if (parentRef.current) {
			const scrollAreaViewport = parentRef.current.closest('[data-radix-scroll-area-viewport]');
			if (scrollAreaViewport) {
				const observer = new ResizeObserver((entries) => {
					for (const entry of entries) {
						const height = entry.contentRect.height;
						if (height > 0) {
							setContainerHeight(height - 48); // Restar padding
						}
					}
				});
				observer.observe(scrollAreaViewport);
				return () => observer.disconnect();
			}
			// Fallback: usar el viewport más cercano
			const viewport = parentRef.current.closest('.flex-1, .h-full');
			if (viewport) {
				setContainerHeight(viewport.clientHeight - 48);
			}
		}
	}, []);

	// Event handlers
	const createHandleClick = useCallback(
		(item: AnyEntityWithStats) => (e: React.MouseEvent) => {
			e.stopPropagation();
			onItemClick(item, e);
		},
		[onItemClick]
	);

	const createHandleDoubleClick = useCallback(
		(item: AnyEntityWithStats) => () => {
			onItemDoubleClick(item);
		},
		[onItemDoubleClick]
	);

	if (!containerWidth || containerWidth <= 0) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-muted-foreground">Calculando layout masonry...</div>
			</div>
		);
	}

	return (
		<div
			ref={parentRef}
			className="w-full overflow-auto"
			style={{
				height: `${containerHeight}px`,
				contain: 'strict',
				padding: '24px',
			}}
		>
			{/* Renderizado absoluto basado en posiciones calculadas para verdadero masonry */}
			<div
				style={{
					position: 'relative',
					width: '100%',
					height: `${totalHeight}px`,
				}}
			>
				{layoutItems.map((layoutItem, index) => {
					const isSelected = selectedIds.includes(layoutItem.item.id);

					return (
						<motion.div
							key={layoutItem.item.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								delay: Math.min(index * 0.02, 0.3),
								duration: 0.3,
							}}
							style={{
								position: 'absolute',
								left: `${layoutItem.x}px`,
								top: `${layoutItem.y}px`,
								width: `${layoutItem.width}px`,
								height: `${layoutItem.height}px`,
							}}
							className={cn(
								'cursor-pointer transition-all duration-200',
								'hover:z-10 hover:scale-105',
								isSelected && 'ring-2 ring-primary ring-offset-2'
							)}
						>
							<EntityCard
								entity={layoutItem.item}
								layout="vertical"
								size="md"
								isSelected={isSelected}
								compact={false}
								className="w-full h-full"
								onClick={createHandleClick(layoutItem.item)}
								onDoubleClick={createHandleDoubleClick(layoutItem.item)}
							/>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
});
